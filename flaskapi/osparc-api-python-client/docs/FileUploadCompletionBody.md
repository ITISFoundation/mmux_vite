# FileUploadCompletionBody


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**parts** | [**List[UploadedPart]**](UploadedPart.md) |  | 

## Example

```python
from osparc_client.models.file_upload_completion_body import FileUploadCompletionBody

# TODO update the JSON string below
json = "{}"
# create an instance of FileUploadCompletionBody from a JSON string
file_upload_completion_body_instance = FileUploadCompletionBody.from_json(json)
# print the JSON string representation of the object
print(FileUploadCompletionBody.to_json())

# convert the object into a dict
file_upload_completion_body_dict = file_upload_completion_body_instance.to_dict()
# create an instance of FileUploadCompletionBody from a dict
file_upload_completion_body_from_dict = FileUploadCompletionBody.from_dict(file_upload_completion_body_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


