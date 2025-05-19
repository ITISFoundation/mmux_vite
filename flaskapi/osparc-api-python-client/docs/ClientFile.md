# ClientFile


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
from osparc_client.models.client_file import ClientFile

# TODO update the JSON string below
json = "{}"
# create an instance of ClientFile from a JSON string
client_file_instance = ClientFile.from_json(json)
# print the JSON string representation of the object
print(ClientFile.to_json())

# convert the object into a dict
client_file_dict = client_file_instance.to_dict()
# create an instance of ClientFile from a dict
client_file_from_dict = ClientFile.from_dict(client_file_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


