# BodyCompleteMultipartUploadV0FilesFileIdCompletePost


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**client_file** | [**ClientFile**](ClientFile.md) |  | 
**uploaded_parts** | [**FileUploadCompletionBody**](FileUploadCompletionBody.md) |  | 

## Example

```python
from osparc_client.models.body_complete_multipart_upload_v0_files_file_id_complete_post import BodyCompleteMultipartUploadV0FilesFileIdCompletePost

# TODO update the JSON string below
json = "{}"
# create an instance of BodyCompleteMultipartUploadV0FilesFileIdCompletePost from a JSON string
body_complete_multipart_upload_v0_files_file_id_complete_post_instance = BodyCompleteMultipartUploadV0FilesFileIdCompletePost.from_json(json)
# print the JSON string representation of the object
print(BodyCompleteMultipartUploadV0FilesFileIdCompletePost.to_json())

# convert the object into a dict
body_complete_multipart_upload_v0_files_file_id_complete_post_dict = body_complete_multipart_upload_v0_files_file_id_complete_post_instance.to_dict()
# create an instance of BodyCompleteMultipartUploadV0FilesFileIdCompletePost from a dict
body_complete_multipart_upload_v0_files_file_id_complete_post_from_dict = BodyCompleteMultipartUploadV0FilesFileIdCompletePost.from_dict(body_complete_multipart_upload_v0_files_file_id_complete_post_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


