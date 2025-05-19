# PricingUnitGetLegacy


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**pricing_unit_id** | **int** |  | 
**unit_name** | **str** |  | 
**unit_extra_info** | [**UnitExtraInfoTier**](UnitExtraInfoTier.md) |  | 
**current_cost_per_unit** | **float** |  | 
**default** | **bool** |  | 

## Example

```python
from osparc_client.models.pricing_unit_get_legacy import PricingUnitGetLegacy

# TODO update the JSON string below
json = "{}"
# create an instance of PricingUnitGetLegacy from a JSON string
pricing_unit_get_legacy_instance = PricingUnitGetLegacy.from_json(json)
# print the JSON string representation of the object
print(PricingUnitGetLegacy.to_json())

# convert the object into a dict
pricing_unit_get_legacy_dict = pricing_unit_get_legacy_instance.to_dict()
# create an instance of PricingUnitGetLegacy from a dict
pricing_unit_get_legacy_from_dict = PricingUnitGetLegacy.from_dict(pricing_unit_get_legacy_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


