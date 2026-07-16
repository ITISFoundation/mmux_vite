"""
Pydantic models for sampling endpoints.

This module defines the request and response models for all sampling-related endpoints,
providing proper validation and type safety.
"""

import logging
from typing import Any, Literal

from pydantic import BaseModel, Field, ValidationInfo, field_validator

_logger = logging.getLogger(__name__)


class VariableConfig(BaseModel):
    """Configuration for a single variable in sampling."""

    variable: str = Field(..., description="Name of the variable")
    start: float = Field(..., description="Start value of the variable range")
    end: float = Field(..., description="End value of the variable range")

    @field_validator("end")
    @classmethod
    def end_must_be_greater_than_start(cls, v: float, info: ValidationInfo) -> float:
        start = info.data.get("start")
        if start is not None and v <= start:
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
    n: int = Field(..., gt=0, description="Number of samples to generate")
    fun_uid: str = Field(..., min_length=1, description="Function UID for OSPARC")

    @field_validator("config")
    @classmethod
    def config_must_not_be_empty(cls, v):
        if not v:
            raise ValueError("config must not be empty")
        return v


class GridSamplingVariableConfig(BaseModel):
    """Configuration for a single variable in grid sampling."""

    variable: str = Field(..., description="Name of the variable")
    start: float = Field(..., description="Start value of the variable range")
    end: float = Field(..., description="End value of the variable range")
    steps: int = Field(..., gt=0, description="Number of steps for grid sampling")

    @field_validator("end")
    @classmethod
    def end_must_be_greater_than_start(cls, v: float, info: ValidationInfo) -> float:
        start = info.data.get("start")
        if start is not None and v <= start:
            raise ValueError("end must be greater than start")
        return v


class GridSamplingRequest(BaseModel):
    """Request model for Grid Sampling."""

    config: list[GridSamplingVariableConfig] = Field(
        ..., description="List of variable configurations"
    )
    fun_uid: str = Field(..., min_length=1, description="Function UID for OSPARC")

    @field_validator("config")
    @classmethod
    def config_must_not_be_empty(cls, v):
        if not v:
            raise ValueError("config must not be empty")
        return v


class TestJobRequest(BaseModel):
    """Request model for testing a job."""

    config: list[TestJobVariableConfig] = Field(
        ..., description="List of variable configurations with values"
    )
    fun_uid: str = Field(..., min_length=1, description="Function UID for OSPARC")

    @field_validator("config")
    @classmethod
    def config_must_not_be_empty(cls, v):
        if not v:
            raise ValueError("config must not be empty")
        return v


class CloneJobRequest(BaseModel):
    """Request model for cloning a job."""

    project_job_id: str = Field(..., min_length=1, description="ID of the project job to clone")
    function_name: str = Field(..., min_length=1, description="Name of the function")
    project_inputs: dict[str, Any] = Field(..., description="Inputs for the project")


class JobCollectionCsvUploadRequest(BaseModel):
    """Request model for uploading a job-collection CSV (flaskapi/SPEC.md §T6)."""

    csv_content: str = Field(..., min_length=1, description="Raw CSV file content")
    target_mode: Literal["existing", "new"] = Field(
        ..., description="Whether to attach imported samples to an existing function or a new one"
    )
    target_function_uid: str | None = Field(
        None,
        description="Function UID to attach to when target_mode='existing'",
        validate_default=True,
    )
    new_function_title: str | None = Field(
        None, description="Title for the newly-created function when target_mode='new'"
    )
    source_function_uid: str | None = Field(
        None, description="Function UID the CSV was originally exported from, if known"
    )

    @field_validator("target_function_uid")
    @classmethod
    def target_function_uid_required_for_existing(cls, v, info: ValidationInfo):
        if info.data.get("target_mode") == "existing" and not v:
            raise ValueError("target_function_uid is required when target_mode is 'existing'")
        return v


class SamplingResponse(BaseModel):
    """Response model for sampling operations."""

    samples: list[dict[str, float]] | None = Field(None, description="Generated samples")
    job_id: str | None = Field(None, description="Job ID from OSPARC")
    result: dict[str, Any] | None = Field(None, description="Job execution result")


class ErrorResponse(BaseModel):
    """Standard error response model."""

    error: str = Field(..., description="Error message")
