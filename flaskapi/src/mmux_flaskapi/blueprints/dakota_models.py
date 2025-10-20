"""
Pydantic models for Dakota API endpoints validation.
"""
from typing import Dict, List, Optional, Union, Literal, Any, Type
from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict
import logging
import numpy as np

_logger = logging.getLogger(__name__)


class FunctionJob(BaseModel):
    """Model for a single function job with inputs, outputs, and status."""
    model_config = ConfigDict(extra="allow")  # Allow additional fields like job_id, timestamps, etc.
    
    status: str = Field(..., description="Status of the job (e.g., 'completed', 'success', 'failed')")
    inputs: Dict[str, Union[float, int]] = Field(..., description="Input parameters (key-number pairs)")
    outputs: Dict[str, Union[float, int]] = Field(..., description="Output results (key-number pairs)")

    @field_validator('status')
    @classmethod
    def status_must_not_be_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('Status cannot be empty')
        return v.strip().lower()

    @field_validator('inputs')
    @classmethod
    def inputs_must_have_values(cls, v: Dict[str, Union[float, int, str]]) -> Dict[str, Union[float, int, str]]:
        if not v:
            raise ValueError('Inputs dictionary cannot be empty')
        return v

    @field_validator('outputs')
    @classmethod
    def outputs_must_have_values(cls, v: Dict[str, Union[float, int, str]]) -> Dict[str, Union[float, int, str]]:
        if not v:
            raise ValueError('Outputs dictionary cannot be empty')
        return v


class SumoCrossValidationRequest(BaseModel):
    """Request model for SuMo cross-validation endpoint."""
    output: str = Field(..., min_length=1, description="Name of the output variable to validate")
    inputVars: List[str] = Field(..., min_length=1, description="List of input variable names")
    FunctionJobs: List[FunctionJob] = Field(..., min_length=5, description="List of function jobs (minimum 5 required)")

    @field_validator('inputVars')
    @classmethod
    def input_vars_must_not_be_empty_strings(cls, v: List[str]) -> List[str]:
        """Ensure all input variable names are non-empty strings."""
        for var in v:
            if not var or not var.strip():
                raise ValueError('Input variable names cannot be empty')
        return [var.strip() for var in v]

    @model_validator(mode='after')
    def validate_job_data_consistency(self) -> 'SumoCrossValidationRequest':
        """Validate that all jobs have the required input and output variables."""
        output = self.output
        input_vars = self.inputVars
        jobs = self.FunctionJobs

        if not output or not input_vars or not jobs:
            return self  # Let individual field validators handle these

        # Filter to completed jobs only
        completed_jobs = [job for job in jobs if job.status in ['completed', 'success']]
        
        if len(completed_jobs) < 5:
            raise ValueError(f"At least 5 completed jobs are required for cross-validation. Found {len(completed_jobs)} completed jobs.")

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
    
    distribution: Literal["normal", "uniform"] = Field(..., description="Type of distribution (normal or uniform)")
    mean: Optional[float] = None
    std: Optional[float] = None
    min: Optional[float] = None
    max: Optional[float] = None

    @model_validator(mode='after')
    def validate_distribution_params(self) -> 'DistributionParams':
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
    output: str = Field(..., min_length=1)
    inputVars: List[str] = Field(..., min_length=1)
    distributions: Dict[str, DistributionParams]
    numSamples: int = Field(..., gt=0, description="Number of samples to generate")
    FunctionJobs: List[FunctionJob] = Field(..., min_length=5)

    @field_validator('inputVars')
    @classmethod
    def input_vars_must_not_be_empty_strings(cls, v: List[str]) -> List[str]:
        for var in v:
            if not var or not var.strip():
                raise ValueError('Input variable names cannot be empty')
        return [var.strip() for var in v]

    @model_validator(mode='after')
    def validate_distributions_match_inputs(self) -> 'ManualUQPropagationRequest':
        """Validate that distributions are provided for all input variables."""
        input_vars = self.inputVars
        distributions = self.distributions
        jobs = self.FunctionJobs
        
        missing_distributions = [var for var in input_vars if var not in distributions]
        if missing_distributions:
            raise ValueError(f"Distributions missing for input variables: {missing_distributions}")
        
        # Validate minimum completed jobs for UQ operations
        completed_jobs = [job for job in jobs if job.status in ['completed', 'success']]
        if len(completed_jobs) < 5:
            raise ValueError(f"At least 5 completed jobs are required for UQ operations. Found {len(completed_jobs)} completed jobs.")
        
        return self


class ManualUQWithUncertaintyRequest(ManualUQPropagationRequest):
    """Request model for manual UQ propagation with uncertainty endpoint."""
    nHistograms: int = Field(..., gt=0, le=1000, description="Number of histograms for uncertainty estimation (1-1000)")
    seed: int = Field(..., description="Random seed for reproducibility")

    @field_validator('nHistograms')
    @classmethod
    def validate_n_histograms(cls, v: int) -> int:
        """Validate number of histograms is reasonable."""
        if v < 1:
            raise ValueError("Number of histograms must be positive")
        if v > 1000:
            raise ValueError("Number of histograms cannot exceed 1000 (performance constraint)")
        return v

    @model_validator(mode='after')
    def validate_uncertainty_requirements(self) -> 'ManualUQWithUncertaintyRequest':
        """Additional validation specific to uncertainty quantification."""
        # Additional validation: ensure we have enough samples relative to histograms
        if self.numSamples < self.nHistograms:
            raise ValueError(f"Number of samples ({self.numSamples}) should be >= number of histograms ({self.nHistograms})")
        
        # Warn if numSamples/nHistograms ratio is too low for statistical reliability
        if self.numSamples // self.nHistograms < 10:
            _logger.warning(f"Low samples per histogram ({self.numSamples // self.nHistograms}). Consider increasing numSamples for better statistics.")
        
        # Check that at least some jobs have the required uncertainty output
        output = self.output
        jobs = self.FunctionJobs
        completed_jobs = [job for job in jobs if job.status in ['completed', 'success']]
        
        if completed_jobs:  # Only check if we have completed jobs
            uncertainty_output_key = f"{output}_std_hat"
            jobs_with_uncertainty = [
                job for job in completed_jobs 
                if uncertainty_output_key in job.outputs
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
    output: str = Field(..., min_length=1, description="Name of the output variable to evaluate")
    inputs: List[str] = Field(..., min_length=1, description="List of input variable names")
    FunctionJobs: List[FunctionJob] = Field(..., min_length=5, description="List of function jobs (minimum 5 required)")
    sliderValues: Optional[Dict[str, float]] = Field(default=None, description="Cut values for input variables")

    @field_validator('inputs')
    @classmethod
    def input_vars_must_not_be_empty_strings(cls, v: List[str]) -> List[str]:
        """Ensure all input variable names are non-empty strings."""
        for var in v:
            if not var or not var.strip():
                raise ValueError('Input variable names cannot be empty')
        return [var.strip() for var in v]

    @model_validator(mode='after')
    def validate_job_data_consistency(self) -> 'SumoAlongAxesRequest':
        """Validate that all jobs have the required input and output variables."""
        output = self.output
        input_vars = self.inputs
        jobs = self.FunctionJobs
        slider_values = self.sliderValues

        if not output or not input_vars or not jobs:
            return self  # Let individual field validators handle these

        # Filter to completed jobs only
        completed_jobs = [job for job in jobs if job.status in ['completed', 'success']]
        
        if len(completed_jobs) < 5:
            raise ValueError(f"At least 5 completed jobs are required for SUMO along axes evaluation. Found {len(completed_jobs)} completed jobs.")

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
    x: List[float] = Field(..., description="Input values along the axis")
    y_hat: List[float] = Field(..., description="Predicted output values")
    std_hat: Optional[List[float]] = Field(default=None, description="Prediction uncertainties (if available)")

    @field_validator('x', 'y_hat')
    @classmethod
    def validate_non_empty_lists(cls, v: List[float]) -> List[float]:
        """Ensure prediction arrays are not empty."""
        if not v:
            raise ValueError("Prediction arrays cannot be empty")
        return v

    @field_validator('std_hat')
    @classmethod
    def validate_std_hat_optional(cls, v: Optional[List[float]]) -> Optional[List[float]]:
        """Validate std_hat if provided."""
        if v is not None and not v:
            raise ValueError("std_hat array cannot be empty if provided")
        return v

    @model_validator(mode='after')
    def validate_array_lengths_match(self) -> 'AxisPrediction':
        """Validate that all arrays have the same length."""
        x_len = len(self.x)
        y_hat_len = len(self.y_hat)
        
        if x_len != y_hat_len:
            raise ValueError(f"x and y_hat arrays must have same length. Got x: {x_len}, y_hat: {y_hat_len}")
        
        if self.std_hat is not None:
            std_hat_len = len(self.std_hat)
            if x_len != std_hat_len:
                raise ValueError(f"std_hat array must have same length as x and y_hat. Got std_hat: {std_hat_len}, expected: {x_len}")
        
        return self


class SumoAlongAxesResponse(BaseModel):
    """Response model for SUMO along axes evaluation."""
    model_config = ConfigDict(frozen=True)  # Make response immutable
    
    # Dictionary mapping input variable names to their axis predictions
    predictions: Dict[str, AxisPrediction] = Field(..., description="Predictions for each input variable axis")

    @field_validator('predictions')
    @classmethod
    def validate_predictions_not_empty(cls, v: Dict[str, AxisPrediction]) -> Dict[str, AxisPrediction]:
        """Ensure predictions dictionary is not empty."""
        if not v:
            raise ValueError("Predictions dictionary cannot be empty")
        return v

    @model_validator(mode='after')
    def validate_consistent_prediction_lengths(self) -> 'SumoAlongAxesResponse':
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
    output: str = Field(..., min_length=1)
    gridVars: List[str] = Field(..., min_length=1, max_length=3, description="Variables for grid (1-3 dimensions)")
    inputVars: List[str] = Field(..., min_length=1)
    FunctionJobs: List[FunctionJob] = Field(..., min_length=5)
    sliderValues: Optional[Dict[str, float]] = None

    @model_validator(mode='after')
    def validate_grid_vars_subset_of_inputs(self) -> 'SumoGridEvaluationRequest':
        """Validate that grid variables are a subset of input variables."""
        grid_vars = self.gridVars
        input_vars = self.inputVars
        
        invalid_grid_vars = [var for var in grid_vars if var not in input_vars]
        if invalid_grid_vars:
            raise ValueError(f"Grid variables {invalid_grid_vars} must be present in inputVars")
        
        return self


class MOGAOptimizationRequest(BaseModel):
    """Request model for MOGA optimization."""
    inputVars: List[str] = Field(..., min_length=1)
    distributions: Dict[str, DistributionParams]
    outputVarSelection: Dict[str, Literal["minimize", "maximize"]] = Field(..., min_length=2)
    FunctionJobs: List[FunctionJob] = Field(..., min_length=5)

    @model_validator(mode='after')
    def validate_at_least_two_objectives(self) -> 'MOGAOptimizationRequest':
        """Validate that at least two objective functions are selected."""
        output_var_selection = self.outputVarSelection
        if len(output_var_selection) < 2:
            raise ValueError("At least two output variables must be selected for MOGA optimization")
        return self


class UQWithUncertaintyResponse(BaseModel):
    """Response model for UQ with uncertainty endpoint."""
    model_config = ConfigDict(frozen=True)  # Make response immutable
    
    # Histogram statistics
    bins_start: float = Field(..., description="Start of histogram bin range")
    bins_end: float = Field(..., description="End of histogram bin range")
    bin_means: List[float] = Field(..., description="Mean of bin heights across histograms")
    bin_stds: List[float] = Field(..., description="Standard deviation of bin heights across histograms")
    
    # Box plot statistics
    q1: float = Field(..., description="First quartile (25th percentile)")
    median: float = Field(..., description="Median (50th percentile)")
    q3: float = Field(..., description="Third quartile (75th percentile)")
    whisker_min: float = Field(..., description="Lower whisker boundary")
    whisker_max: float = Field(..., description="Upper whisker boundary")
    outliers: List[float] = Field(..., description="Outlier values beyond whiskers")
    
    # Overall distribution statistics
    mean: float = Field(..., description="Overall mean of all samples")
    std: float = Field(..., description="Overall standard deviation of all samples")
    min: float = Field(..., description="Minimum value across all samples")
    max: float = Field(..., description="Maximum value across all samples")

    @field_validator('bin_means', 'bin_stds')
    @classmethod
    def validate_bin_arrays_same_length(cls, v: List[float]) -> List[float]:
        """Ensure bin arrays are not empty and contain valid numbers."""
        if not v:
            raise ValueError("Bin arrays cannot be empty")
        if any(not isinstance(x, (int, float)) or not np.isfinite(x) for x in v):
            raise ValueError("All bin values must be finite numbers")
        return v

    @field_validator('outliers')
    @classmethod
    def validate_outliers(cls, v: List[float]) -> List[float]:
        """Validate outliers list (can be empty)."""
        if any(not isinstance(x, (int, float)) or not np.isfinite(x) for x in v):
            raise ValueError("All outlier values must be finite numbers")
        return v

    @model_validator(mode='after')
    def validate_statistical_consistency(self) -> 'UQWithUncertaintyResponse':
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

