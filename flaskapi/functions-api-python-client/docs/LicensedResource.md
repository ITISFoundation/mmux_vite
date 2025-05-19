# LicensedResource


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**source** | [**LicensedResourceSource**](LicensedResourceSource.md) |  | 
**category_id** | **str** |  | 
**category_display** | **str** |  | 
**terms_of_use_url** | **str** |  | 

## Example

```python
from osparc_client.models.licensed_resource import LicensedResource

# TODO update the JSON string below
json = "{}"
# create an instance of LicensedResource from a JSON string
licensed_resource_instance = LicensedResource.from_json(json)
# print the JSON string representation of the object
print(LicensedResource.to_json())

# convert the object into a dict
licensed_resource_dict = licensed_resource_instance.to_dict()
# create an instance of LicensedResource from a dict
licensed_resource_from_dict = LicensedResource.from_dict(licensed_resource_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


