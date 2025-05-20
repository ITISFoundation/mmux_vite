# UserFile

Represents a file stored on the client side

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**filename** | **str** | File name | 
**filesize** | **int** | File size in bytes | 
**sha256_checksum** | **str** | SHA256 checksum | 

## Example

```python
from osparc_client.models.user_file import UserFile

# TODO update the JSON string below
json = "{}"
# create an instance of UserFile from a JSON string
user_file_instance = UserFile.from_json(json)
# print the JSON string representation of the object
print(UserFile.to_json())

# convert the object into a dict
user_file_dict = user_file_instance.to_dict()
# create an instance of UserFile from a dict
user_file_from_dict = UserFile.from_dict(user_file_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


