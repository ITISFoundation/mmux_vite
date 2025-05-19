# JobMetadataUpdate


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**metadata** | [**Dict[str, MetadataValue]**](MetadataValue.md) | Custom key-value map | [optional] 

## Example

```python
from osparc_client.models.job_metadata_update import JobMetadataUpdate

# TODO update the JSON string below
json = "{}"
# create an instance of JobMetadataUpdate from a JSON string
job_metadata_update_instance = JobMetadataUpdate.from_json(json)
# print the JSON string representation of the object
print(JobMetadataUpdate.to_json())

# convert the object into a dict
job_metadata_update_dict = job_metadata_update_instance.to_dict()
# create an instance of JobMetadataUpdate from a dict
job_metadata_update_from_dict = JobMetadataUpdate.from_dict(job_metadata_update_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


