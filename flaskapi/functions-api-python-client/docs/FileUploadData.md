# FileUploadData


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**chunk_size** | **int** |  | 
**urls** | **List[str]** |  | 
**links** | [**UploadLinks**](UploadLinks.md) |  | 

## Example

```python
from osparc_client.models.file_upload_data import FileUploadData

# TODO update the JSON string below
json = "{}"
# create an instance of FileUploadData from a JSON string
file_upload_data_instance = FileUploadData.from_json(json)
# print the JSON string representation of the object
print(FileUploadData.to_json())

# convert the object into a dict
file_upload_data_dict = file_upload_data_instance.to_dict()
# create an instance of FileUploadData from a dict
file_upload_data_from_dict = FileUploadData.from_dict(file_upload_data_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


