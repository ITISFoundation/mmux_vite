"""
Pydantic models for sampling endpoints.

This module defines the request and response models for all sampling-related endpoints,
providing proper validation and type safety.
"""

from typing import Dict, List, Any, Optional
from pydantic import AliasChoices, BaseModel, ConfigDict, Field, validator
import logging

_logger = logging.getLogger(__name__)


class CompatibilityRequestModel(BaseModel):
    """Base model that accepts both legacy camelCase and snake_case request keys."""

    model_config = ConfigDict(populate_by_name=True)


class VariableConfig(BaseModel):
    """Configuration for a single variable in sampling."""
    variable: str = Field(..., description="Name of the variable")
    start: float = Field(..., description="Start value of the variable range")
    end: float = Field(..., description="End value of the variable range")
    
    @validator('end')
    def end_must_be_greater_than_start(cls, v, values):
        if 'start' in values and v <= values['start']:
            raise ValueError('end must be greater than start')
        return v


class TestJobVariableConfig(BaseModel):
    """Configuration for a single variable in test job."""
    variable: str = Field(..., description="Name of the variable")
    value: Any = Field(..., description="Value for the variable")


class LHSSamplingRequest(CompatibilityRequestModel):
    """Request model for Latin Hypercube Sampling."""
    config: List[VariableConfig] = Field(..., description="List of variable configurations")
    seed: int = Field(..., ge=0, description="Random seed for sampling")
    N: int = Field(..., gt=0, description="Number of samples to generate", alias="N")
    funUid: str = Field(
        ...,
        min_length=1,
        description="Function UID for OSPARC",
        validation_alias=AliasChoices("funUid", "fun_uid"),
    )
    
    @validator('config')
    def config_must_not_be_empty(cls, v):
        if not v:
            raise ValueError('config must not be empty')
        return v
    

class GridSamplingVariableConfig(BaseModel):
    """Configuration for a single variable in grid sampling."""
    variable: str = Field(..., description="Name of the variable")
    start: float = Field(..., description="Start value of the variable range")
    end: float = Field(..., description="End value of the variable range")
    steps: int = Field(..., gt=0, description="Number of steps for grid sampling")
    
    @validator('end')
    def end_must_be_greater_than_start(cls, v, values):
        if 'start' in values and v <= values['start']:
            raise ValueError('end must be greater than start')
        return v


class GridSamplingRequest(CompatibilityRequestModel):
    """Request model for Grid Sampling."""
    config: List[GridSamplingVariableConfig] = Field(..., description="List of variable configurations")
    funUid: str = Field(
        ...,
        min_length=1,
        description="Function UID for OSPARC",
        validation_alias=AliasChoices("funUid", "fun_uid"),
    )
    
    @validator('config')
    def config_must_not_be_empty(cls, v):
        if not v:
            raise ValueError('config must not be empty')
        return v


class TestJobRequest(CompatibilityRequestModel):
    """Request model for testing a job."""
    config: List[TestJobVariableConfig] = Field(..., description="List of variable configurations with values")
    funUid: str = Field(
        ...,
        min_length=1,
        description="Function UID for OSPARC",
        validation_alias=AliasChoices("funUid", "fun_uid"),
    )
    
    @validator('config')
    def config_must_not_be_empty(cls, v):
        if not v:
            raise ValueError('config must not be empty')
        return v


class CloneJobRequest(CompatibilityRequestModel):
    """Request model for cloning a job."""
    projectJobId: str = Field(
        ...,
        min_length=1,
        description="ID of the project job to clone",
        validation_alias=AliasChoices("projectJobId", "project_job_id"),
    )
    functionName: str = Field(
        ...,
        min_length=1,
        description="Name of the function",
        validation_alias=AliasChoices("functionName", "function_name"),
    )
    projectInputs: Dict[str, Any] = Field(
        ...,
        description="Inputs for the project",
        validation_alias=AliasChoices("projectInputs", "project_inputs"),
    )


class SamplingResponse(BaseModel):
    """Response model for sampling operations."""
    samples: Optional[List[Dict[str, float]]] = Field(None, description="Generated samples")
    job_id: Optional[str] = Field(None, description="Job ID from OSPARC")
    result: Optional[Dict[str, Any]] = Field(None, description="Job execution result")
    
    
class ErrorResponse(BaseModel):
    """Standard error response model."""
    error: str = Field(..., description="Error message")


def validate_request_json(request_data: dict, model_class):
    """
    Validate request data against a Pydantic model.
    
    Args:
        request_data: The request data dictionary
        model_class: The Pydantic model class to validate against
        
    Returns:
        The validated model instance
        
    Raises:
        ValueError: If validation fails
    """
    try:
        return model_class.parse_obj(request_data)
    except Exception as e:
        _logger.error(f"Request validation failed: {e}")
        raise ValueError(f"Invalid request data: {e}")