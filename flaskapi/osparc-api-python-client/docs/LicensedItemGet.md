# LicensedItemGet


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**licensed_item_id** | **str** |  | 
**key** | **str** |  | 
**version** | **str** |  | 
**display_name** | **str** |  | 
**licensed_resource_type** | [**LicensedResourceType**](LicensedResourceType.md) |  | 
**licensed_resources** | [**List[LicensedResource]**](LicensedResource.md) |  | 
**pricing_plan_id** | **int** |  | 
**is_hidden_on_market** | **bool** |  | 
**created_at** | **datetime** |  | 
**modified_at** | **datetime** |  | 

## Example

```python
from osparc_client.models.licensed_item_get import LicensedItemGet

# TODO update the JSON string below
json = "{}"
# create an instance of LicensedItemGet from a JSON string
licensed_item_get_instance = LicensedItemGet.from_json(json)
# print the JSON string representation of the object
print(LicensedItemGet.to_json())

# convert the object into a dict
licensed_item_get_dict = licensed_item_get_instance.to_dict()
# create an instance of LicensedItemGet from a dict
licensed_item_get_from_dict = LicensedItemGet.from_dict(licensed_item_get_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


