# UserFileToProgramJob


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**filename** | **str** | File name | 
**filesize** | **int** | File size in bytes | 
**sha256_checksum** | **str** | SHA256 checksum | 
**program_key** | **str** | Program identifier | 
**program_version** | **str** | Program version | 
**job_id** | **str** | Job identifier | 
**workspace_path** | **str** | The file&#39;s relative path within the job&#39;s workspace directory. E.g. &#39;workspace/myfile.txt&#39; | 

## Example

```python
from osparc_client.models.user_file_to_program_job import UserFileToProgramJob

# TODO update the JSON string below
json = "{}"
# create an instance of UserFileToProgramJob from a JSON string
user_file_to_program_job_instance = UserFileToProgramJob.from_json(json)
# print the JSON string representation of the object
print(UserFileToProgramJob.to_json())

# convert the object into a dict
user_file_to_program_job_dict = user_file_to_program_job_instance.to_dict()
# create an instance of UserFileToProgramJob from a dict
user_file_to_program_job_from_dict = UserFileToProgramJob.from_dict(user_file_to_program_job_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


