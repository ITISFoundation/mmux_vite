"""
Pydantic models for Dakota API endpoints validation.
"""

import logging
from typing import Literal

import numpy as np
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from mmux_flaskapi.utils.case_preserving import FunctionVariable, FunctionVariablesMapping

_logger = logging.getLogger(__name__)


class FunctionJob(BaseModel):
    """Model for a single function job with inputs, outputs, and status."""

    model_config = ConfigDict(
        extra="allow"
    )  # Allow additional fields like job_id, timestamps, etc.
    __preserve_extra_case__ = True

    status: str = Field(
        ..., description="Status of the job (e.g., 'completed', 'success', 'failed')"
    )
    inputs: FunctionVariablesMapping[float | int] = Field(
        ..., description="Input parameters (key-number pairs)"
    )
    outputs: FunctionVariablesMapping[float | int] = Field(
        ..., description="Output results (key-number pairs)"
    )

    @field_validator("status")
    @classmethod
    def status_must_not_be_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Status cannot be empty")
        return v.strip().lower()

    @field_validator("inputs")
    @classmethod
    def inputs_must_have_values(
        cls, v: dict[str, float | int | str]
    ) -> dict[str, float | int | str]:
        if not v:
            raise ValueError("Inputs dictionary cannot be empty")
        return v

    @field_validator("outputs")
    @classmethod
    def outputs_must_have_values(
        cls, v: dict[str, float | int | str]
    ) -> dict[str, float | int | str]:
        if not v:
            raise ValueError("Outputs dictionary cannot be empty")
        return v


class JobVariableSelection(BaseModel):
    """Validated selection of jobs and variables for workflow helpers."""

    jobs: list[FunctionJob] = Field(..., min_length=1)
    input_vars: list[FunctionVariable] = Field(..., min_length=1)
    output_vars: list[FunctionVariable] = Field(..., min_length=1)
    minimum_completed_jobs: int = Field(5, ge=1)

    @field_validator("input_vars", "output_vars")
    @classmethod
    def variable_names_must_not_be_empty_strings(cls, v: list[str]) -> list[str]:
        cleaned = []
        for var in v:
            if not var or not var.strip():
                raise ValueError("Variable names cannot be empty")
            cleaned.append(var.strip())
        return cleaned

    @property
    def completed_jobs(self) -> list[FunctionJob]:
        return [job for job in self.jobs if job.status in ["completed", "success"]]

    @model_validator(mode="after")
    def validate_completed_jobs_have_requested_variables(self) -> "JobVariableSelection":
        completed_jobs = self.completed_jobs

        if len(completed_jobs) < self.minimum_completed_jobs:
            raise ValueError(
                "At least "
                f"{self.minimum_completed_jobs} samples are necessary to build a surrogate model in Dakota. "
                f"Found {len(completed_jobs)} completed jobs."
            )

        missing_input_vars = set()
        missing_output_vars = set()
        available_input_keys = set()
        available_output_keys = set()

        for job in completed_jobs:
            available_input_keys.update(job.inputs.keys())
            available_output_keys.update(job.outputs.keys())

            for input_var in self.input_vars:
                if input_var not in job.inputs:
                    missing_input_vars.add(input_var)

            for output_var in self.output_vars:
                if output_var not in job.outputs:
                    missing_output_vars.add(output_var)

        if missing_input_vars:
            raise ValueError(
                f"Input variables {sorted(missing_input_vars)} not found in completed job inputs. "
                f"Available input keys: {sorted(available_input_keys)}"
            )

        if missing_output_vars:
            raise ValueError(
                f"Output variables {sorted(missing_output_vars)} not found in completed job outputs. "
                f"Available output keys: {sorted(available_output_keys)}"
            )

        return self

    def to_records(self) -> list[dict[str, float | int]]:
        records = []
        for job in self.completed_jobs:
            record: dict[str, float | int] = {}
            for input_var in self.input_vars:
                record[input_var] = job.inputs[input_var]
            for output_var in self.output_vars:
                record[output_var] = job.outputs[output_var]
            records.append(record)
        return records


class SumoCrossValidationRequest(BaseModel):
    """Request model for SuMo cross-validation endpoint."""

    model_config = ConfigDict(populate_by_name=True)

    output: FunctionVariable = Field(
        ..., min_length=1, description="Name of the output variable to validate"
    )
    input_vars: list[FunctionVariable] = Field(
        ...,
        min_length=1,
        description="List of input variable names",
    )
    function_jobs: list[FunctionJob] = Field(
        ...,
        min_length=5,
        description="List of function jobs (minimum 5 required)",
    )

    @field_validator("input_vars")
    @classmethod
    def input_vars_must_not_be_empty_strings(cls, v: list[str]) -> list[str]:
        """Ensure all input variable names are non-empty strings."""
        for var in v:
            if not var or not var.strip():
                raise ValueError("Input variable names cannot be empty")
        return [var.strip() for var in v]

    @model_validator(mode="after")
    def validate_job_data_consistency(self) -> "SumoCrossValidationRequest":
        """Validate that all jobs have the required input and output variables."""
        output = self.output
        input_vars = self.input_vars
        jobs = self.function_jobs

        if not output or not input_vars or not jobs:
            return self  # Let individual field validators handle these

        # Filter to completed jobs only
        completed_jobs = [job for job in jobs if job.status in ["completed", "success"]]

        if len(completed_jobs) < 5:
            raise ValueError(
                f"At least 5 completed jobs are required for cross-validation. Found {len(completed_jobs)} completed jobs."
            )

        # Validate that all completed jobs have required input/output variables
        missing_input_vars = set()
        missing_output_jobs = []

        for i, job in enumerate(completed_jobs):
            # Check input variables
            job_input_keys = set(job.inputs.keys())
            for input_var in input_vars:
                if input_var not in job_input_keys:
                    missing_input_vars.add(input_var)

            # Check output variable
            if output not in job.outputs:
                missing_output_jobs.append(i)

        if missing_input_vars:
            # Get available input keys for better error message
            available_keys = set()
            for job in completed_jobs[:3]:  # Sample a few jobs
                available_keys.update(job.inputs.keys())
            raise ValueError(
                f"Input variables {list(missing_input_vars)} not found in job inputs. "
                f"Available input keys: {list(available_keys)}"
            )

        if missing_output_jobs:
            # Get available output keys for better error message
            available_keys = set()
            for job in completed_jobs[:3]:  # Sample a few jobs
                available_keys.update(job.outputs.keys())
            raise ValueError(
                f"Output variable '{output}' not found in {len(missing_output_jobs)} job(s). "
                f"Available output keys: {list(available_keys)}"
            )

        return self


class DistributionParams(BaseModel):
    """Model for distribution parameters."""

    model_config = ConfigDict(extra="allow")  # Allow additional distribution parameters

    distribution: Literal["normal", "uniform"] = Field(
        ..., description="Type of distribution (normal or uniform)"
    )
    mean: float | None = None
    std: float | None = None
    min: float | None = None
    max: float | None = None

    @model_validator(mode="after")
    def validate_distribution_params(self) -> "DistributionParams":
        """Validate that required parameters are provided for each distribution type."""
        if self.distribution == "normal":
            if self.mean is None or self.std is None:
                raise ValueError("Normal distribution requires 'mean' and 'std' parameters")
            if self.std <= 0:
                raise ValueError("Standard deviation must be positive for normal distribution")
        elif self.distribution == "uniform":
            if self.min is None or self.max is None:
                raise ValueError("Uniform distribution requires 'min' and 'max' parameters")
            if self.min >= self.max:
                raise ValueError("Min must be less than max for uniform distribution")

        return self


class ManualUQPropagationRequest(BaseModel):
    """Request model for manual UQ propagation endpoint."""

    output: FunctionVariable = Field(..., min_length=1)
    input_vars: list[FunctionVariable] = Field(..., min_length=1)
    distributions: FunctionVariablesMapping[DistributionParams]
    num_samples: int = Field(..., gt=0, description="Number of samples to generate")
    function_jobs: list[FunctionJob] = Field(..., min_length=5)

    @field_validator("input_vars")
    @classmethod
    def input_vars_must_not_be_empty_strings(cls, v: list[str]) -> list[str]:
        for var in v:
            if not var or not var.strip():
                raise ValueError("Input variable names cannot be empty")
        return [var.strip() for var in v]

    @model_validator(mode="after")
    def validate_distributions_match_inputs(self) -> "ManualUQPropagationRequest":
        """Validate that distributions are provided for all input variables."""
        input_vars = self.input_vars
        distributions = self.distributions
        jobs = self.function_jobs

        missing_distributions = [var for var in input_vars if var not in distributions]
        if missing_distributions:
            raise ValueError(f"Distributions missing for input variables: {missing_distributions}")

        # Validate minimum completed jobs for UQ operations
        completed_jobs = [job for job in jobs if job.status in ["completed", "success"]]
        if len(completed_jobs) < 5:
            raise ValueError(
                f"At least 5 completed jobs are required for UQ operations. Found {len(completed_jobs)} completed jobs."
            )

        return self


class ManualUQWithUncertaintyRequest(ManualUQPropagationRequest):
    """Request model for manual UQ propagation with uncertainty endpoint."""

    n_histograms: int = Field(
        ...,
        gt=0,
        le=1000,
        description="Number of histograms for uncertainty estimation (1-1000)",
    )
    seed: int = Field(..., description="Random seed for reproducibility")

    @field_validator("n_histograms")
    @classmethod
    def validate_n_histograms(cls, v: int) -> int:
        """Validate number of histograms is reasonable."""
        if v < 1:
            raise ValueError("Number of histograms must be positive")
        if v > 1000:
            raise ValueError("Number of histograms cannot exceed 1000 (performance constraint)")
        return v

    @model_validator(mode="after")
    def validate_uncertainty_requirements(self) -> "ManualUQWithUncertaintyRequest":
        """Additional validation specific to uncertainty quantification."""
        # Additional validation: ensure we have enough samples relative to histograms
        if self.num_samples < self.n_histograms:
            raise ValueError(
                f"Number of samples ({self.num_samples}) should be >= number of histograms ({self.n_histograms})"
            )

        # Warn if numSamples/nHistograms ratio is too low for statistical reliability
        if self.num_samples // self.n_histograms < 10:
            _logger.warning(
                f"Low samples per histogram ({self.num_samples // self.n_histograms}). Consider increasing numSamples for better statistics."
            )

        # Check that at least some jobs have the required uncertainty output
        output = self.output
        jobs = self.function_jobs
        completed_jobs = [job for job in jobs if job.status in ["completed", "success"]]

        if completed_jobs:  # Only check if we have completed jobs
            uncertainty_output_key = f"{output}_std_hat"
            jobs_with_uncertainty = [
                job for job in completed_jobs if uncertainty_output_key in job.outputs
            ]

            if not jobs_with_uncertainty:
                # Get available output keys for better error message
                available_keys = set()
                for job in completed_jobs[:3]:  # Sample a few jobs
                    available_keys.update(job.outputs.keys())
                raise ValueError(
                    f"UQ with uncertainty requires '{uncertainty_output_key}' in job outputs for uncertainty estimation. "
                    f"Available output keys: {list(available_keys)}"
                )

        return self


class SumoAlongAxesRequest(BaseModel):
    """Request model for SUMO along axes evaluation."""

    output: FunctionVariable = Field(
        ..., min_length=1, description="Name of the output variable to evaluate"
    )
    inputs: list[FunctionVariable] = Field(
        ..., min_length=1, description="List of input variable names"
    )
    function_jobs: list[FunctionJob] = Field(
        ...,
        min_length=5,
        description="List of function jobs (minimum 5 required)",
    )
    slider_values: FunctionVariablesMapping[float] | None = Field(
        default=None, description="Cut values for input variables"
    )

    @field_validator("inputs")
    @classmethod
    def input_vars_must_not_be_empty_strings(cls, v: list[str]) -> list[str]:
        """Ensure all input variable names are non-empty strings."""
        for var in v:
            if not var or not var.strip():
                raise ValueError("Input variable names cannot be empty")
        return [var.strip() for var in v]

    @model_validator(mode="after")
    def validate_job_data_consistency(self) -> "SumoAlongAxesRequest":
        """Validate that all jobs have the required input and output variables."""
        output = self.output
        input_vars = self.inputs
        jobs = self.function_jobs
        slider_values = self.slider_values

        if not output or not input_vars or not jobs:
            return self  # Let individual field validators handle these

        # Filter to completed jobs only
        completed_jobs = [job for job in jobs if job.status in ["completed", "success"]]

        if len(completed_jobs) < 5:
            raise ValueError(
                f"At least 5 completed jobs are required for SUMO along axes evaluation. Found {len(completed_jobs)} completed jobs."
            )

        # Validate that all completed jobs have required input/output variables
        missing_input_vars = set()
        missing_output_jobs = []

        for i, job in enumerate(completed_jobs):
            # Check input variables
            job_input_keys = set(job.inputs.keys())
            for input_var in input_vars:
                if input_var not in job_input_keys:
                    missing_input_vars.add(input_var)

            # Check output variable
            if output not in job.outputs:
                missing_output_jobs.append(i)

        if missing_input_vars:
            # Get available input keys for better error message
            available_keys = set()
            for job in completed_jobs[:3]:  # Sample a few jobs
                available_keys.update(job.inputs.keys())
            raise ValueError(
                f"Input variables {list(missing_input_vars)} not found in job inputs. "
                f"Available input keys: {list(available_keys)}"
            )

        if missing_output_jobs:
            # Get available output keys for better error message
            available_keys = set()
            for job in completed_jobs[:3]:  # Sample a few jobs
                available_keys.update(job.outputs.keys())
            raise ValueError(
                f"Output variable '{output}' not found in {len(missing_output_jobs)} job(s). "
                f"Available output keys: {list(available_keys)}"
            )

        # Validate slider values if provided
        if slider_values:
            invalid_slider_vars = [var for var in slider_values.keys() if var not in input_vars]
            if invalid_slider_vars:
                raise ValueError(
                    f"Slider variables {invalid_slider_vars} must be present in inputs. "
                    f"Available input variables: {input_vars}"
                )

        return self


class AxisPrediction(BaseModel):
    """Model for predictions along a single axis."""

    x: list[float] = Field(..., description="Input values along the axis")
    y_hat: list[float] = Field(..., description="Predicted output values")
    std_hat: list[float] | None = Field(
        default=None, description="Prediction uncertainties (if available)"
    )

    @field_validator("x", "y_hat")
    @classmethod
    def validate_non_empty_lists(cls, v: list[float]) -> list[float]:
        """Ensure prediction arrays are not empty."""
        if not v:
            raise ValueError("Prediction arrays cannot be empty")
        return v

    @field_validator("std_hat")
    @classmethod
    def validate_std_hat_optional(cls, v: list[float] | None) -> list[float] | None:
        """Validate std_hat if provided."""
        if v is not None and not v:
            raise ValueError("std_hat array cannot be empty if provided")
        return v

    @model_validator(mode="after")
    def validate_array_lengths_match(self) -> "AxisPrediction":
        """Validate that all arrays have the same length."""
        x_len = len(self.x)
        y_hat_len = len(self.y_hat)

        if x_len != y_hat_len:
            raise ValueError(
                f"x and y_hat arrays must have same length. Got x: {x_len}, y_hat: {y_hat_len}"
            )

        if self.std_hat is not None:
            std_hat_len = len(self.std_hat)
            if x_len != std_hat_len:
                raise ValueError(
                    f"std_hat array must have same length as x and y_hat. Got std_hat: {std_hat_len}, expected: {x_len}"
                )

        return self


class SumoAlongAxesResponse(BaseModel):
    """Response model for SUMO along axes evaluation."""

    model_config = ConfigDict(frozen=True)  # Make response immutable

    # Dictionary mapping input variable names to their axis predictions
    predictions: FunctionVariablesMapping[AxisPrediction] = Field(
        ..., description="Predictions for each input variable axis"
    )

    @field_validator("predictions")
    @classmethod
    def validate_predictions_not_empty(
        cls, v: dict[str, AxisPrediction]
    ) -> dict[str, AxisPrediction]:
        """Ensure predictions dictionary is not empty."""
        if not v:
            raise ValueError("Predictions dictionary cannot be empty")
        return v

    @model_validator(mode="after")
    def validate_consistent_prediction_lengths(self) -> "SumoAlongAxesResponse":
        """Validate that all axis predictions have consistent array lengths."""
        if not self.predictions:
            return self

        # Check that all axes have the same number of samples
        first_axis = next(iter(self.predictions.values()))
        expected_length = len(first_axis.x)

        for axis_name, axis_prediction in self.predictions.items():
            if len(axis_prediction.x) != expected_length:
                raise ValueError(
                    f"All axes must have the same number of samples. "
                    f"Axis '{axis_name}' has {len(axis_prediction.x)} samples, "
                    f"expected {expected_length}"
                )

        return self


class SumoGridEvaluationRequest(BaseModel):
    """Request model for SUMO grid evaluation."""

    output: FunctionVariable = Field(
        ..., min_length=1, description="Name of the output variable to evaluate"
    )
    grid_vars: list[FunctionVariable] = Field(
        ..., min_length=1, max_length=3, description="Variables for grid (1-3 dimensions)"
    )
    input_vars: list[FunctionVariable] = Field(
        ..., min_length=1, description="List of all input variable names"
    )
    function_jobs: list[FunctionJob] = Field(
        ...,
        min_length=5,
        description="List of function jobs (minimum 5 required)",
    )
    slider_values: FunctionVariablesMapping[float] | None = Field(
        default=None, description="Fixed values for non-grid input variables"
    )

    @field_validator("grid_vars")
    @classmethod
    def grid_vars_must_not_be_empty_strings(cls, v: list[str]) -> list[str]:
        """Ensure all grid variable names are non-empty strings."""
        for var in v:
            if not var or not var.strip():
                raise ValueError("Grid variable names cannot be empty")
        return [var.strip() for var in v]

    @field_validator("input_vars")
    @classmethod
    def input_vars_must_not_be_empty_strings(cls, v: list[str]) -> list[str]:
        """Ensure all input variable names are non-empty strings."""
        for var in v:
            if not var or not var.strip():
                raise ValueError("Input variable names cannot be empty")
        return [var.strip() for var in v]

    @model_validator(mode="after")
    def validate_grid_vars_subset_of_inputs(self) -> "SumoGridEvaluationRequest":
        """Validate that grid variables are a subset of input variables."""
        grid_vars = self.grid_vars
        input_vars = self.input_vars

        invalid_grid_vars = [var for var in grid_vars if var not in input_vars]
        if invalid_grid_vars:
            raise ValueError(f"Grid variables {invalid_grid_vars} must be present in inputVars")

        return self

    @model_validator(mode="after")
    def validate_job_data_consistency(self) -> "SumoGridEvaluationRequest":
        """Validate that all jobs have the required input and output variables."""
        output = self.output
        input_vars = self.input_vars
        jobs = self.function_jobs
        slider_values = self.slider_values

        if not output or not input_vars or not jobs:
            return self  # Let individual field validators handle these

        # Filter to completed jobs only
        completed_jobs = [job for job in jobs if job.status in ["completed", "success"]]

        if len(completed_jobs) < 5:
            raise ValueError(
                f"At least 5 completed jobs are required for SUMO grid evaluation. Found {len(completed_jobs)} completed jobs."
            )

        # Validate that all completed jobs have required input/output variables
        missing_input_vars = set()
        missing_output_jobs = []

        for i, job in enumerate(completed_jobs):
            # Check input variables
            job_input_keys = set(job.inputs.keys())
            for input_var in input_vars:
                if input_var not in job_input_keys:
                    missing_input_vars.add(input_var)

            # Check output variable
            if output not in job.outputs:
                missing_output_jobs.append(i)

        if missing_input_vars:
            # Get available input keys for better error message
            available_keys = set()
            for job in completed_jobs[:3]:  # Sample a few jobs
                available_keys.update(job.inputs.keys())
            raise ValueError(
                f"Input variables {list(missing_input_vars)} not found in job inputs. "
                f"Available input keys: {list(available_keys)}"
            )

        if missing_output_jobs:
            # Get available output keys for better error message
            available_keys = set()
            for job in completed_jobs[:3]:  # Sample a few jobs
                available_keys.update(job.outputs.keys())
            raise ValueError(
                f"Output variable '{output}' not found in {len(missing_output_jobs)} job(s). "
                f"Available output keys: {list(available_keys)}"
            )

        # Validate slider values if provided
        if slider_values:
            invalid_slider_vars = [var for var in slider_values.keys() if var not in input_vars]
            if invalid_slider_vars:
                raise ValueError(
                    f"Slider variables {invalid_slider_vars} must be present in inputVars. "
                    f"Available input variables: {input_vars}"
                )

        return self


class SumoGridEvaluationResponse(BaseModel):
    """Response model for SUMO grid evaluation."""

    model_config = ConfigDict(frozen=True)  # Make response immutable

    # Dictionary mapping variable names to their grid values
    # For 1D grids: Lists of floats
    # For 2D/3D grids: Lists of lists (arrays)
    # Keys include grid variables (input coordinates) and prediction variables
    grid_data: FunctionVariablesMapping[list[float] | list[list[float]]] = Field(
        ..., description="Grid evaluation results with input coordinates and predictions"
    )

    @field_validator("grid_data")
    @classmethod
    def validate_grid_data_not_empty(
        cls, v: dict[str, list[float] | list[list[float]]]
    ) -> dict[str, list[float] | list[list[float]]]:
        """Ensure grid data dictionary is not empty."""
        if not v:
            raise ValueError("Grid data dictionary cannot be empty")
        return v

    @model_validator(mode="after")
    def validate_grid_structure(self) -> "SumoGridEvaluationResponse":
        """Validate grid data structure and consistency."""
        if not self.grid_data:
            return self

        # Basic validation that all values are non-empty
        for var_name, values in self.grid_data.items():
            if not values:
                raise ValueError(f"Variable '{var_name}' has empty values")

        # For grid data, we allow mixed dimensionality between input coordinates and output predictions
        # Input coordinates (grid variables) should have consistent dimensionality
        # Output predictions can have different dimensionality

        # Validate that all arrays have at least some data
        for var_name, values in self.grid_data.items():
            if isinstance(values[0], list):
                # Multidimensional data - check that all inner arrays have the same length
                expected_inner_length = len(values[0])
                for i, inner_array in enumerate(values):
                    if (
                        not isinstance(inner_array, list)
                        or len(inner_array) != expected_inner_length
                    ):
                        raise ValueError(
                            f"All inner arrays for variable '{var_name}' must have the same length. "
                            f"Array {i} has length {len(inner_array) if isinstance(inner_array, list) else 'non-list'}, expected {expected_inner_length}"
                        )

        return self


class MOGAOptimizationRequest(BaseModel):
    """Request model for MOGA optimization."""

    input_vars: list[FunctionVariable] = Field(
        ..., min_length=1, description="List of input variable names"
    )
    distributions: FunctionVariablesMapping[DistributionParams] = Field(
        ..., description="Distribution parameters for each input variable"
    )
    output_var_selection: FunctionVariablesMapping[Literal["minimize", "maximize"]] = Field(
        ...,
        min_length=1,
        description="Objective selection for output variables",
    )
    function_jobs: list[FunctionJob] = Field(
        ...,
        min_length=5,
        description="List of function jobs (minimum 5 required)",
    )

    @field_validator("input_vars")
    @classmethod
    def input_vars_must_not_be_empty_strings(cls, v: list[str]) -> list[str]:
        """Validate that input variable names are not empty."""
        for var in v:
            if not var or not var.strip():
                raise ValueError("Input variable names cannot be empty")
        return [var.strip() for var in v]

    @model_validator(mode="after")
    def validate_comprehensive_moga_requirements(self) -> "MOGAOptimizationRequest":
        """Validate comprehensive MOGA optimization requirements."""

        # Check that all input variables have distributions
        input_vars_set = set(self.input_vars)
        distribution_vars_set = set(self.distributions.keys())
        missing_distributions = input_vars_set - distribution_vars_set
        if missing_distributions:
            raise ValueError(
                f"Missing distributions for input variables: {sorted(missing_distributions)}"
            )

        # Check for sufficient completed jobs
        completed_jobs = [
            job for job in self.function_jobs if job.status in ["completed", "success"]
        ]
        if len(completed_jobs) < 5:
            raise ValueError(
                f"At least 5 completed jobs required for MOGA optimization, got {len(completed_jobs)}"
            )

        # Check that all completed jobs have the required variables
        output_vars = list(self.output_var_selection.keys())
        for i, job in enumerate(completed_jobs):
            # Check input variables
            missing_inputs = [var for var in self.input_vars if var not in job.inputs]
            if missing_inputs:
                raise ValueError(f"Job {i} missing required input variables: {missing_inputs}")

            # Check output variables
            missing_outputs = [var for var in output_vars if var not in job.outputs]
            if missing_outputs:
                raise ValueError(f"Job {i} missing required output variables: {missing_outputs}")

        return self


class MOGAOptimizationResponse(BaseModel):
    """Response model for MOGA optimization."""

    model_config = ConfigDict(frozen=True)  # Make response immutable

    optimization_results: FunctionVariablesMapping[list[float]] = Field(
        ...,
        description="Dictionary mapping variable names to their optimized values across the Pareto front",
    )

    @field_validator("optimization_results")
    @classmethod
    def validate_optimization_results(cls, v: dict[str, list[float]]) -> dict[str, list[float]]:
        """Validate optimization results structure."""
        if not v:
            raise ValueError("Optimization results cannot be empty")

        # Check that all values are valid numbers
        for var_name, values in v.items():
            if not isinstance(var_name, str) or not var_name.strip():
                raise ValueError("Variable names must be non-empty strings")
            if not isinstance(values, list):
                raise ValueError(f"Values for {var_name} must be a list")
            for i, val in enumerate(values):
                if not isinstance(val, (int, float)) or not np.isfinite(val):
                    raise ValueError(
                        f"All optimization values must be finite numbers. Invalid value at {var_name}[{i}]: {val}"
                    )

        return v

    @model_validator(mode="after")
    def validate_pareto_front_structure(self) -> "MOGAOptimizationResponse":
        """Validate that the Pareto front results have a reasonable structure."""
        results = self.optimization_results

        if not results:
            raise ValueError("Optimization results cannot be empty")

        # Filter out metadata fields (like non_dominated_indices) from length validation
        variable_fields = {k: v for k, v in results.items() if not k.startswith("non_dominated")}

        if not variable_fields:
            raise ValueError("Must have at least one optimization variable result")

        # Check that all main variable arrays have the same length
        lengths = [len(values) for values in variable_fields.values()]
        if len(set(lengths)) > 1:
            raise ValueError(
                f"All optimization variable arrays must have the same length. Found lengths: {dict(zip(variable_fields.keys(), lengths))}"
            )

        # Get the number of points
        first_key = next(iter(variable_fields.keys()))
        num_points = len(variable_fields[first_key])

        if num_points == 0:
            raise ValueError("Optimization must produce at least one result point")

        return self


class UQWithUncertaintyResponse(BaseModel):
    """Response model for UQ with uncertainty endpoint."""

    model_config = ConfigDict(frozen=True)  # Make response immutable

    # Histogram statistics
    bins_start: float = Field(..., description="Start of histogram bin range")
    bins_end: float = Field(..., description="End of histogram bin range")
    bin_means: list[float] = Field(..., description="Mean of bin heights across histograms")
    bin_stds: list[float] = Field(
        ..., description="Standard deviation of bin heights across histograms"
    )

    # Box plot statistics
    q1: float = Field(..., description="First quartile (25th percentile)")
    median: float = Field(..., description="Median (50th percentile)")
    q3: float = Field(..., description="Third quartile (75th percentile)")
    whisker_min: float = Field(..., description="Lower whisker boundary")
    whisker_max: float = Field(..., description="Upper whisker boundary")
    outliers: list[float] = Field(..., description="Outlier values beyond whiskers")

    # Overall distribution statistics
    mean: float = Field(..., description="Overall mean of all samples")
    std: float = Field(..., description="Overall standard deviation of all samples")
    min: float = Field(..., description="Minimum value across all samples")
    max: float = Field(..., description="Maximum value across all samples")

    @field_validator("bin_means", "bin_stds")
    @classmethod
    def validate_bin_arrays_same_length(cls, v: list[float]) -> list[float]:
        """Ensure bin arrays are not empty and contain valid numbers."""
        if not v:
            raise ValueError("Bin arrays cannot be empty")
        if any(not isinstance(x, (int, float)) or not np.isfinite(x) for x in v):
            raise ValueError("All bin values must be finite numbers")
        return v

    @field_validator("outliers")
    @classmethod
    def validate_outliers(cls, v: list[float]) -> list[float]:
        """Validate outliers list (can be empty)."""
        if any(not isinstance(x, (int, float)) or not np.isfinite(x) for x in v):
            raise ValueError("All outlier values must be finite numbers")
        return v

    @model_validator(mode="after")
    def validate_statistical_consistency(self) -> "UQWithUncertaintyResponse":
        """Validate statistical consistency of the response."""
        # Check bin arrays have same length
        if len(self.bin_means) != len(self.bin_stds):
            raise ValueError("bin_means and bin_stds must have the same length")

        # Check quartile ordering
        if not (self.q1 <= self.median <= self.q3):
            raise ValueError("Quartiles must satisfy q1 <= median <= q3")

        # Check whisker boundaries are reasonable
        if self.whisker_min > self.whisker_max:
            raise ValueError("whisker_min must be <= whisker_max")

        # Check overall min/max are consistent
        if self.min > self.max:
            raise ValueError("min must be <= max")

        # Check that std is non-negative
        if self.std < 0:
            raise ValueError("Standard deviation must be non-negative")

        return self


class SumoCVAccuracyMetricsRequest(BaseModel):
    """Request model for SUMO cross-validation accuracy metrics endpoint."""

    output: FunctionVariable = Field(
        ..., min_length=1, description="Name of the output variable to validate"
    )
    inputs: list[FunctionVariable] = Field(
        ..., min_length=1, description="List of input variable names"
    )
    log: bool | None = Field(False, description="Whether to apply log transformation to data")
    function_jobs: list[FunctionJob] = Field(
        ...,
        min_length=5,
        description="List of function jobs (minimum 5 required)",
    )

    @field_validator("inputs")
    @classmethod
    def input_vars_must_not_be_empty_strings(cls, v: list[str]) -> list[str]:
        """Validate that input variable names are not empty."""
        for var in v:
            if not var or not var.strip():
                raise ValueError("Input variable names cannot be empty")
        return [var.strip() for var in v]

    @field_validator("output")
    @classmethod
    def output_must_not_be_empty(cls, v: str) -> str:
        """Validate that output variable name is not empty."""
        if not v or not v.strip():
            raise ValueError("Output variable name cannot be empty")
        return v.strip()

    @model_validator(mode="after")
    def validate_job_data_consistency(self) -> "SumoCVAccuracyMetricsRequest":
        """Validate that all jobs have required input/output variables and sufficient completed jobs."""
        completed_jobs = [
            job for job in self.function_jobs if job.status in ["completed", "success"]
        ]

        if len(completed_jobs) < 5:
            raise ValueError(
                f"At least 5 completed jobs required for cross-validation, got {len(completed_jobs)}"
            )

        # Check that all completed jobs have the required input variables
        for i, job in enumerate(completed_jobs):
            missing_inputs = [var for var in self.inputs if var not in job.inputs]
            if missing_inputs:
                raise ValueError(f"Job {i} missing required input variables: {missing_inputs}")

            # Check that the job has the required output variable
            if self.output not in job.outputs:
                raise ValueError(f"Job {i} missing required output variable: {self.output}")

        return self


class CVAccuracyMetrics(BaseModel):
    """Model for cross-validation accuracy metrics for a single output variable."""

    root_mean_squared: float | str | None = Field(None, description="Root mean squared error")
    sum_abs: float | str | None = Field(None, description="Sum of absolute errors")
    mean_abs: float | str | None = Field(None, description="Mean absolute error")
    max_abs: float | str | None = Field(None, description="Maximum absolute error")

    @field_validator("root_mean_squared", "sum_abs", "mean_abs", "max_abs", mode="before")
    @classmethod
    def validate_metric_value(cls, v: float | str | None) -> float | str | None:
        """Validate metric values (can be float, 'nan', or None)."""
        if v is None:
            return v
        if isinstance(v, str):
            if v.lower() in ["nan", "none"]:
                return v
            try:
                return float(v)
            except ValueError:
                raise ValueError(f"Invalid metric value: {v}")
        if isinstance(v, (int, float)):
            return float(v)
        raise ValueError(f"Metric value must be a number, 'nan', or None, got {type(v)}")


class SumoCVAccuracyMetricsResponse(BaseModel):
    """Response model for SUMO cross-validation accuracy metrics."""

    metrics: FunctionVariablesMapping[CVAccuracyMetrics | str] = Field(
        ..., description="Dictionary mapping output variable names to their accuracy metrics"
    )

    @field_validator("metrics")
    @classmethod
    def validate_metrics_not_empty(
        cls, v: dict[str, CVAccuracyMetrics | str]
    ) -> dict[str, CVAccuracyMetrics | str]:
        """Validate that metrics dictionary is not empty."""
        if not v:
            raise ValueError("Metrics dictionary cannot be empty")
        return v

    @model_validator(mode="after")
    def validate_metrics_structure(self) -> "SumoCVAccuracyMetricsResponse":
        """Validate the overall structure of metrics."""
        for var_name, metrics in self.metrics.items():
            if not isinstance(var_name, str) or not var_name.strip():
                raise ValueError("Variable names in metrics must be non-empty strings")
            if isinstance(metrics, str):
                # Allow string values for error messages like "No surrogate quality metrics found."
                continue
            elif not isinstance(metrics, CVAccuracyMetrics):
                raise ValueError(f"Metrics for {var_name} must be CVAccuracyMetrics or string")
        return self
