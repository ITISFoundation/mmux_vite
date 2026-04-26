"""
Pydantic models for sampling endpoints.

This module defines the request and response models for all sampling-related endpoints,
providing proper validation and type safety.
"""

import logging
from typing import Any, Literal

from pydantic import BaseModel, Field, validator

from mmux_flaskapi.utils.case_preserving import FunctionVariable, FunctionVariablesMapping

_logger = logging.getLogger(__name__)


class VariableConfig(BaseModel):
    """Configuration for a single variable in sampling."""

    variable: FunctionVariable = Field(..., description="Name of the variable")
    start: float = Field(..., description="Start value of the variable range")
    end: float = Field(..., description="End value of the variable range")

    @validator("end")
    def end_must_be_greater_than_start(cls, v, values):
        if "start" in values and v <= values["start"]:
            raise ValueError("end must be greater than start")
        return v


class TestJobVariableConfig(BaseModel):
    """Configuration for a single variable in test job."""

    variable: FunctionVariable = Field(..., description="Name of the variable")
    value: Any = Field(..., description="Value for the variable")


class LHSSamplingRequest(BaseModel):
    """Request model for Latin Hypercube Sampling."""

    config: list[VariableConfig] = Field(..., description="List of variable configurations")
    seed: int = Field(..., ge=0, description="Random seed for sampling")
    n: int = Field(..., gt=0, description="Number of samples to generate")
    fun_uid: str = Field(..., min_length=1, description="Function UID for OSPARC")

    @validator("config")
    def config_must_not_be_empty(cls, v):
        if not v:
            raise ValueError("config must not be empty")
        return v


class GridSamplingVariableConfig(VariableConfig):
    """Configuration for a single variable in grid sampling."""

    steps: int = Field(..., gt=0, description="Number of steps for grid sampling")


class GridSamplingRequest(BaseModel):
    """Request model for Grid Sampling."""

    config: list[GridSamplingVariableConfig] = Field(
        ..., description="List of variable configurations"
    )
    fun_uid: str = Field(..., min_length=1, description="Function UID for OSPARC")

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
    fun_uid: str = Field(..., min_length=1, description="Function UID for OSPARC")

    @validator("config")
    def config_must_not_be_empty(cls, v):
        if not v:
            raise ValueError("config must not be empty")
        return v


class CloneJobRequest(BaseModel):
    """Request model for cloning a job."""

    project_job_id: str = Field(..., min_length=1, description="ID of the project job to clone")
    function_name: str = Field(..., min_length=1, description="Name of the function")
    project_inputs: FunctionVariablesMapping[Any] = Field(..., description="Inputs for the project")


class JobCollectionCsvUploadRequest(BaseModel):
    """Request model for uploading JobCollection CSV data."""

    csv_content: str = Field(..., min_length=1, description="CSV payload to import")
    target_mode: Literal["existing", "new"] = Field(
        ..., description="Whether to import into an existing or a new local function"
    )
    target_function_uid: str | None = Field(
        default=None,
        description="Existing local function UID to import into when target_mode='existing'",
    )
    new_function_title: str | None = Field(
        default=None,
        description="Title for a newly created local function when target_mode='new'",
    )
    source_function_uid: str | None = Field(
        default=None,
        description="Optional source function UID when not embedded in the CSV",
    )


class SamplingResponse(BaseModel):
    """Response model for sampling operations."""

    samples: list[dict[str, float]] | None = Field(None, description="Generated samples")
    job_id: str | None = Field(None, description="Job ID from OSPARC")
    result: dict[str, Any] | None = Field(None, description="Job execution result")


class ErrorResponse(BaseModel):
    """Standard error response model."""

    error: str = Field(..., description="Error message")
