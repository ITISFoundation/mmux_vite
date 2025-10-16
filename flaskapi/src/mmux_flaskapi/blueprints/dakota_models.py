"""
Pydantic models for Dakota API endpoints validation.
"""
from typing import Dict, List, Optional, Union, Literal, Any, Type
from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict
import logging

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
    
    mean: Optional[float] = None
    std: Optional[float] = None
    min: Optional[float] = None
    max: Optional[float] = None


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
        
        missing_distributions = [var for var in input_vars if var not in distributions]
        if missing_distributions:
            raise ValueError(f"Distributions missing for input variables: {missing_distributions}")
        
        return self


class ManualUQWithUncertaintyRequest(ManualUQPropagationRequest):
    """Request model for manual UQ propagation with uncertainty endpoint."""
    nHistograms: int = Field(..., gt=0, description="Number of histograms for uncertainty estimation")
    seed: int = Field(..., description="Random seed for reproducibility")


class SumoAlongAxesRequest(BaseModel):
    """Request model for SUMO along axes evaluation."""
    output: str = Field(..., min_length=1)
    inputs: List[str] = Field(..., min_length=1)
    FunctionJobs: List[FunctionJob] = Field(..., min_length=5)
    sliderValues: Optional[Dict[str, float]] = None


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

