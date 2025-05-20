# UnitExtraInfoTier

Custom information that is propagated to the frontend. Defined fields are mandatory.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**cpu** | **int** |  | 
**ram** | **int** |  | 
**vram** | **int** |  | 

## Example

```python
from osparc_client.models.unit_extra_info_tier import UnitExtraInfoTier

# TODO update the JSON string below
json = "{}"
# create an instance of UnitExtraInfoTier from a JSON string
unit_extra_info_tier_instance = UnitExtraInfoTier.from_json(json)
# print the JSON string representation of the object
print(UnitExtraInfoTier.to_json())

# convert the object into a dict
unit_extra_info_tier_dict = unit_extra_info_tier_instance.to_dict()
# create an instance of UnitExtraInfoTier from a dict
unit_extra_info_tier_from_dict = UnitExtraInfoTier.from_dict(unit_extra_info_tier_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


