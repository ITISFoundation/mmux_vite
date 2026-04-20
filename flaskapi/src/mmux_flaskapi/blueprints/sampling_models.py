"""
Pydantic models for sampling endpoints.

This module defines the request and response models for all sampling-related endpoints,
providing proper validation and type safety.
"""

import logging
from typing import Any

from pydantic import BaseModel, Field, validator

_logger = logging.getLogger(__name__)


class VariableConfig(BaseModel):
    """Configuration for a single variable in sampling."""

    variable: str = Field(..., description="Name of the variable")
    start: float = Field(..., description="Start value of the variable range")
    end: float = Field(..., description="End value of the variable range")

    @validator("end")
    def end_must_be_greater_than_start(cls, v, values):
        if "start" in values and v <= values["start"]:
            raise ValueError("end must be greater than start")
        return v


class TestJobVariableConfig(BaseModel):
    """Configuration for a single variable in test job."""

    variable: str = Field(..., description="Name of the variable")
    value: Any = Field(..., description="Value for the variable")


class LHSSamplingRequest(BaseModel):
    """Request model for Latin Hypercube Sampling."""

    config: list[VariableConfig] = Field(..., description="List of variable configurations")
    seed: int = Field(..., ge=0, description="Random seed for sampling")
    N: int = Field(..., gt=0, description="Number of samples to generate", alias="N")
    funUid: str = Field(..., min_length=1, description="Function UID for OSPARC")

    @validator("config")
    def config_must_not_be_empty(cls, v):
        if not v:
            raise ValueError("config must not be empty")
        return v

    class Config:
        allow_population_by_field_name = True


class GridSamplingVariableConfig(BaseModel):
    """Configuration for a single variable in grid sampling."""

    variable: str = Field(..., description="Name of the variable")
    start: float = Field(..., description="Start value of the variable range")
    end: float = Field(..., description="End value of the variable range")
    steps: int = Field(..., gt=0, description="Number of steps for grid sampling")

    @validator("end")
    def end_must_be_greater_than_start(cls, v, values):
        if "start" in values and v <= values["start"]:
            raise ValueError("end must be greater than start")
        return v


class GridSamplingRequest(BaseModel):
    """Request model for Grid Sampling."""

    config: list[GridSamplingVariableConfig] = Field(
        ..., description="List of variable configurations"
    )
    funUid: str = Field(..., min_length=1, description="Function UID for OSPARC")

    @validator("config")
    def config_must_not_be_empty(cls, v):
        if not v:
            raise ValueError("config must not be empty")
        return v


class TestJobRequest(BaseModel):
    """Request model for testing a job."""

    config: list[TestJobVariableConfig] = Field(
        ..., description="List of variable configurations with values"
    )
    funUid: str = Field(..., min_length=1, description="Function UID for OSPARC")

    @validator("config")
    def config_must_not_be_empty(cls, v):
        if not v:
            raise ValueError("config must not be empty")
        return v


class CloneJobRequest(BaseModel):
    """Request model for cloning a job."""

    projectJobId: str = Field(..., min_length=1, description="ID of the project job to clone")
    functionName: str = Field(..., min_length=1, description="Name of the function")
    projectInputs: dict[str, Any] = Field(..., description="Inputs for the project")


class SamplingResponse(BaseModel):
    """Response model for sampling operations."""

    samples: list[dict[str, float]] | None = Field(None, description="Generated samples")
    job_id: str | None = Field(None, description="Job ID from OSPARC")
    result: dict[str, Any] | None = Field(None, description="Job execution result")


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
