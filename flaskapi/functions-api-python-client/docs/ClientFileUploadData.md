# ClientFileUploadData


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**file_id** | **str** | The file resource id | 
**upload_schema** | [**FileUploadData**](FileUploadData.md) | Schema for uploading file | 

## Example

```python
from osparc_client.models.client_file_upload_data import ClientFileUploadData

# TODO update the JSON string below
json = "{}"
# create an instance of ClientFileUploadData from a JSON string
client_file_upload_data_instance = ClientFileUploadData.from_json(json)
# print the JSON string representation of the object
print(ClientFileUploadData.to_json())

# convert the object into a dict
client_file_upload_data_dict = client_file_upload_data_instance.to_dict()
# create an instance of ClientFileUploadData from a dict
client_file_upload_data_from_dict = ClientFileUploadData.from_dict(client_file_upload_data_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


