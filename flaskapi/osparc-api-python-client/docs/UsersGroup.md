# UsersGroup


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**gid** | **str** |  | 
**label** | **str** |  | 
**description** | **str** |  | [optional] 

## Example

```python
from osparc_client.models.users_group import UsersGroup

# TODO update the JSON string below
json = "{}"
# create an instance of UsersGroup from a JSON string
users_group_instance = UsersGroup.from_json(json)
# print the JSON string representation of the object
print(UsersGroup.to_json())

# convert the object into a dict
users_group_dict = users_group_instance.to_dict()
# create an instance of UsersGroup from a dict
users_group_from_dict = UsersGroup.from_dict(users_group_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


