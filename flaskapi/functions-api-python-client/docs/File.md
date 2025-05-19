# File

Represents a file stored on the server side i.e. a unique reference to a file in the cloud.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** | Resource identifier | 
**filename** | **str** | Name of the file with extension | 
**content_type** | **str** |  | [optional] 
**checksum** | **str** |  | [optional] 
**e_tag** | **str** |  | [optional] 

## Example

```python
from osparc_client.models.file import File

# TODO update the JSON string below
json = "{}"
# create an instance of File from a JSON string
file_instance = File.from_json(json)
# print the JSON string representation of the object
print(File.to_json())

# convert the object into a dict
file_dict = file_instance.to_dict()
# create an instance of File from a dict
file_from_dict = File.from_dict(file_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


