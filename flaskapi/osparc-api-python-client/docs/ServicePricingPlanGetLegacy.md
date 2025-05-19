# ServicePricingPlanGetLegacy


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**pricing_plan_id** | **int** |  | 
**display_name** | **str** |  | 
**description** | **str** |  | 
**classification** | [**PricingPlanClassification**](PricingPlanClassification.md) |  | 
**created_at** | **datetime** |  | 
**pricing_plan_key** | **str** |  | 
**pricing_units** | [**List[PricingUnitGetLegacy]**](PricingUnitGetLegacy.md) |  | 

## Example

```python
from osparc_client.models.service_pricing_plan_get_legacy import ServicePricingPlanGetLegacy

# TODO update the JSON string below
json = "{}"
# create an instance of ServicePricingPlanGetLegacy from a JSON string
service_pricing_plan_get_legacy_instance = ServicePricingPlanGetLegacy.from_json(json)
# print the JSON string representation of the object
print(ServicePricingPlanGetLegacy.to_json())

# convert the object into a dict
service_pricing_plan_get_legacy_dict = service_pricing_plan_get_legacy_instance.to_dict()
# create an instance of ServicePricingPlanGetLegacy from a dict
service_pricing_plan_get_legacy_from_dict = ServicePricingPlanGetLegacy.from_dict(service_pricing_plan_get_legacy_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


