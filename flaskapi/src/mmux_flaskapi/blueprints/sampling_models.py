"""
Pydantic models for sampling endpoints.

This module defines the request and response models for all sampling-related endpoints,
providing proper validation and type safety.
"""

import logging
from typing import Any, Literal, TypeVar

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    ValidationError,
    field_validator,
    model_validator,
)

_logger = logging.getLogger(__name__)
ModelT = TypeVar("ModelT", bound=BaseModel)


class VariableRangeConfig(BaseModel):
    """Shared range configuration for sampling variables."""

    model_config = ConfigDict(populate_by_name=True)
    variable: str = Field(..., description="Name of the variable")
    start: float = Field(..., description="Start value of the variable range")
    end: float = Field(..., description="End value of the variable range")

    @model_validator(mode="after")
    def validate_range(self) -> "VariableRangeConfig":
        if self.end <= self.start:
            raise ValueError("end must be greater than start")
        return self


class VariableConfig(VariableRangeConfig):
    """Configuration for a single variable in sampling."""


class TestJobVariableConfig(BaseModel):
    """Configuration for a single variable in test job."""

    model_config = ConfigDict(populate_by_name=True)
    variable: str = Field(..., description="Name of the variable")
    value: Any = Field(..., description="Value for the variable")


class LHSSamplingRequest(BaseModel):
    """Request model for Latin Hypercube Sampling."""

    model_config = ConfigDict(populate_by_name=True)
    config: list[VariableConfig] = Field(
        ..., description="List of variable configurations"
    )
    seed: int = Field(..., ge=0, description="Random seed for sampling")
    N: int = Field(..., gt=0, description="Number of samples to generate", alias="N")
    funUid: str = Field(..., min_length=1, description="Function UID for OSPARC")

    @field_validator("config")
    @classmethod
    def config_must_not_be_empty(
        cls, value: list[VariableConfig]
    ) -> list[VariableConfig]:
        if not value:
            raise ValueError("config must not be empty")
        return value


class GridSamplingVariableConfig(VariableRangeConfig):
    """Configuration for a single variable in grid sampling."""

    steps: int = Field(..., gt=0, description="Number of steps for grid sampling")


class GridSamplingRequest(BaseModel):
    """Request model for Grid Sampling."""

    model_config = ConfigDict(populate_by_name=True)
    config: list[GridSamplingVariableConfig] = Field(
        ..., description="List of variable configurations"
    )
    funUid: str = Field(..., min_length=1, description="Function UID for OSPARC")

    @field_validator("config")
    @classmethod
    def config_must_not_be_empty(
        cls, value: list[GridSamplingVariableConfig]
    ) -> list[GridSamplingVariableConfig]:
        if not value:
            raise ValueError("config must not be empty")
        return value


class TestJobRequest(BaseModel):
    """Request model for testing a job."""

    model_config = ConfigDict(populate_by_name=True)
    config: list[TestJobVariableConfig] = Field(
        ..., description="List of variable configurations with values"
    )
    funUid: str = Field(..., min_length=1, description="Function UID for OSPARC")

    @field_validator("config")
    @classmethod
    def config_must_not_be_empty(
        cls, value: list[TestJobVariableConfig]
    ) -> list[TestJobVariableConfig]:
        if not value:
            raise ValueError("config must not be empty")
        return value


class CloneJobRequest(BaseModel):
    """Request model for cloning a job."""

    model_config = ConfigDict(populate_by_name=True)
    projectJobId: str = Field(
        ..., min_length=1, description="ID of the project job to clone"
    )
    functionName: str = Field(..., min_length=1, description="Name of the function")
    projectInputs: dict[str, Any] = Field(..., description="Inputs for the project")


class JobCollectionCsvUploadRequest(BaseModel):
    """Request model for JobCollection CSV upload and registration."""

    model_config = ConfigDict(populate_by_name=True)
    csvContent: str = Field(..., min_length=1, description="CSV payload content")
    targetMode: Literal["existing", "new"] = Field(
        ...,
        description=(
            "Upload target mode: existing compatible function or new function"
        ),
    )
    targetFunctionUid: str | None = Field(
        default=None,
        description="Target function UID when targetMode is 'existing'",
    )
    newFunctionTitle: str | None = Field(
        default=None,
        description="Title of the newly registered function when targetMode is 'new'",
    )
    sourceFunctionUid: str | None = Field(
        default=None,
        description="Optional source function UID override for 'new' mode",
    )

    @model_validator(mode="after")
    def validate_mode_requirements(self) -> "JobCollectionCsvUploadRequest":
        if self.targetMode == "existing" and not self.targetFunctionUid:
            raise ValueError(
                "targetFunctionUid is required when targetMode is 'existing'"
            )
        return self


class SamplingResponse(BaseModel):
    """Response model for sampling operations."""

    samples: list[dict[str, float]] | None = Field(
        None, description="Generated samples"
    )
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
        return model_class.model_validate(request_data)
    except ValidationError as e:
        _logger.error(f"Request validation failed: {e}")
        raise ValueError(f"Invalid request data: {e}")
