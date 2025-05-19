# Profile


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**first_name** | **str** |  | [optional] 
**last_name** | **str** |  | [optional] 
**id** | **int** |  | 
**login** | **str** |  | 
**role** | [**UserRoleEnum**](UserRoleEnum.md) |  | 
**groups** | [**Groups**](Groups.md) |  | [optional] 
**gravatar_id** | **str** |  | [optional] 

## Example

```python
from osparc_client.models.profile import Profile

# TODO update the JSON string below
json = "{}"
# create an instance of Profile from a JSON string
profile_instance = Profile.from_json(json)
# print the JSON string representation of the object
print(Profile.to_json())

# convert the object into a dict
profile_dict = profile_instance.to_dict()
# create an instance of Profile from a dict
profile_from_dict = Profile.from_dict(profile_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


