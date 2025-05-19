# LicensedResourceSourceFeaturesDict


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**age** | **str** |  | [optional] 
**var_date** | **date** |  | 
**ethnicity** | **str** |  | [optional] 
**functionality** | **str** |  | [optional] 
**height** | **str** |  | [optional] 
**name** | **str** |  | [optional] 
**sex** | **str** |  | [optional] 
**species** | **str** |  | [optional] 
**version** | **str** |  | [optional] 
**weight** | **str** |  | [optional] 

## Example

```python
from osparc_client.models.licensed_resource_source_features_dict import LicensedResourceSourceFeaturesDict

# TODO update the JSON string below
json = "{}"
# create an instance of LicensedResourceSourceFeaturesDict from a JSON string
licensed_resource_source_features_dict_instance = LicensedResourceSourceFeaturesDict.from_json(json)
# print the JSON string representation of the object
print(LicensedResourceSourceFeaturesDict.to_json())

# convert the object into a dict
licensed_resource_source_features_dict_dict = licensed_resource_source_features_dict_instance.to_dict()
# create an instance of LicensedResourceSourceFeaturesDict from a dict
licensed_resource_source_features_dict_from_dict = LicensedResourceSourceFeaturesDict.from_dict(licensed_resource_source_features_dict_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


