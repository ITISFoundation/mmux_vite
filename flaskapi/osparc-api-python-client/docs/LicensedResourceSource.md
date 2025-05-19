# LicensedResourceSource


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **int** |  | 
**description** | **str** |  | 
**thumbnail** | **str** |  | 
**features** | [**LicensedResourceSourceFeaturesDict**](LicensedResourceSourceFeaturesDict.md) |  | 
**doi** | **str** |  | 
**license_key** | **str** |  | 
**license_version** | **str** |  | 
**protection** | **str** |  | 
**available_from_url** | **str** |  | 

## Example

```python
from osparc_client.models.licensed_resource_source import LicensedResourceSource

# TODO update the JSON string below
json = "{}"
# create an instance of LicensedResourceSource from a JSON string
licensed_resource_source_instance = LicensedResourceSource.from_json(json)
# print the JSON string representation of the object
print(LicensedResourceSource.to_json())

# convert the object into a dict
licensed_resource_source_dict = licensed_resource_source_instance.to_dict()
# create an instance of LicensedResourceSource from a dict
licensed_resource_source_from_dict = LicensedResourceSource.from_dict(licensed_resource_source_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


