# coding: utf-8

"""
    osparc.io public API

    osparc-simcore public API specifications

    The version of the OpenAPI document: 0.8.0.post0.dev0
    Generated by OpenAPI Generator (https://openapi-generator.tech)

    Do not edit the class manually.
"""  # noqa: E501


from __future__ import annotations
import pprint
import re  # noqa: F401
import json

from pydantic import BaseModel, ConfigDict, Field, StrictStr
from typing import Any, ClassVar, Dict, List, Optional
from typing_extensions import Annotated
from osparc_client.models.groups import Groups
from osparc_client.models.user_role_enum import UserRoleEnum
from typing import Optional, Set
from typing_extensions import Self

class Profile(BaseModel):
    """
    Profile
    """ # noqa: E501
    first_name: Optional[Annotated[str, Field(strict=True, max_length=255)]] = None
    last_name: Optional[Annotated[str, Field(strict=True, max_length=255)]] = None
    id: Annotated[int, Field(strict=True, ge=0)]
    login: StrictStr
    role: UserRoleEnum
    groups: Optional[Groups] = None
    gravatar_id: Optional[Annotated[str, Field(strict=True, max_length=40)]] = None
    __properties: ClassVar[List[str]] = ["first_name", "last_name", "id", "login", "role", "groups", "gravatar_id"]

    model_config = ConfigDict(
        populate_by_name=True,
        validate_assignment=True,
        protected_namespaces=(),
    )


    def to_str(self) -> str:
        """Returns the string representation of the model using alias"""
        return pprint.pformat(self.model_dump(by_alias=True))

    def to_json(self) -> str:
        """Returns the JSON representation of the model using alias"""
        # TODO: pydantic v2: use .model_dump_json(by_alias=True, exclude_unset=True) instead
        return json.dumps(self.to_dict())

    @classmethod
    def from_json(cls, json_str: str) -> Optional[Self]:
        """Create an instance of Profile from a JSON string"""
        return cls.from_dict(json.loads(json_str))

    def to_dict(self) -> Dict[str, Any]:
        """Return the dictionary representation of the model using alias.

        This has the following differences from calling pydantic's
        `self.model_dump(by_alias=True)`:

        * `None` is only added to the output dict for nullable fields that
          were set at model initialization. Other fields with value `None`
          are ignored.
        """
        excluded_fields: Set[str] = set([
        ])

        _dict = self.model_dump(
            by_alias=True,
            exclude=excluded_fields,
            exclude_none=True,
        )
        # override the default output from pydantic by calling `to_dict()` of groups
        if self.groups:
            _dict['groups'] = self.groups.to_dict()
        # set to None if first_name (nullable) is None
        # and model_fields_set contains the field
        if self.first_name is None and "first_name" in self.model_fields_set:
            _dict['first_name'] = None

        # set to None if last_name (nullable) is None
        # and model_fields_set contains the field
        if self.last_name is None and "last_name" in self.model_fields_set:
            _dict['last_name'] = None

        # set to None if groups (nullable) is None
        # and model_fields_set contains the field
        if self.groups is None and "groups" in self.model_fields_set:
            _dict['groups'] = None

        # set to None if gravatar_id (nullable) is None
        # and model_fields_set contains the field
        if self.gravatar_id is None and "gravatar_id" in self.model_fields_set:
            _dict['gravatar_id'] = None

        return _dict

    @classmethod
    def from_dict(cls, obj: Optional[Dict[str, Any]]) -> Optional[Self]:
        """Create an instance of Profile from a dict"""
        if obj is None:
            return None

        if not isinstance(obj, dict):
            return cls.model_validate(obj)

        _obj = cls.model_validate({
            "first_name": obj.get("first_name"),
            "last_name": obj.get("last_name"),
            "id": obj.get("id"),
            "login": obj.get("login"),
            "role": obj.get("role"),
            "groups": Groups.from_dict(obj["groups"]) if obj.get("groups") is not None else None,
            "gravatar_id": obj.get("gravatar_id")
        })
        return _obj


