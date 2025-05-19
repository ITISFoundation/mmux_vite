# ProfileUpdate


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**first_name** | **str** |  | [optional] 
**last_name** | **str** |  | [optional] 

## Example

```python
from osparc_client.models.profile_update import ProfileUpdate

# TODO update the JSON string below
json = "{}"
# create an instance of ProfileUpdate from a JSON string
profile_update_instance = ProfileUpdate.from_json(json)
# print the JSON string representation of the object
print(ProfileUpdate.to_json())

# convert the object into a dict
profile_update_dict = profile_update_instance.to_dict()
# create an instance of ProfileUpdate from a dict
profile_update_from_dict = ProfileUpdate.from_dict(profile_update_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


