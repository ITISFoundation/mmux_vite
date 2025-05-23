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

from pydantic import BaseModel, ConfigDict
from typing import Any, ClassVar, Dict, List, Optional
from osparc_client.models.users_group import UsersGroup
from typing import Optional, Set
from typing_extensions import Self

class Groups(BaseModel):
    """
    Groups
    """ # noqa: E501
    me: UsersGroup
    organizations: Optional[List[UsersGroup]] = None
    all: UsersGroup
    __properties: ClassVar[List[str]] = ["me", "organizations", "all"]

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
        """Create an instance of Groups from a JSON string"""
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
        # override the default output from pydantic by calling `to_dict()` of me
        if self.me:
            _dict['me'] = self.me.to_dict()
        # override the default output from pydantic by calling `to_dict()` of each item in organizations (list)
        _items = []
        if self.organizations:
            for _item_organizations in self.organizations:
                if _item_organizations:
                    _items.append(_item_organizations.to_dict())
            _dict['organizations'] = _items
        # override the default output from pydantic by calling `to_dict()` of all
        if self.all:
            _dict['all'] = self.all.to_dict()
        # set to None if organizations (nullable) is None
        # and model_fields_set contains the field
        if self.organizations is None and "organizations" in self.model_fields_set:
            _dict['organizations'] = None

        return _dict

    @classmethod
    def from_dict(cls, obj: Optional[Dict[str, Any]]) -> Optional[Self]:
        """Create an instance of Groups from a dict"""
        if obj is None:
            return None

        if not isinstance(obj, dict):
            return cls.model_validate(obj)

        _obj = cls.model_validate({
            "me": UsersGroup.from_dict(obj["me"]) if obj.get("me") is not None else None,
            "organizations": [UsersGroup.from_dict(_item) for _item in obj["organizations"]] if obj.get("organizations") is not None else None,
            "all": UsersGroup.from_dict(obj["all"]) if obj.get("all") is not None else None
        })
        return _obj


