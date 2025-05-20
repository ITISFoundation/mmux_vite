# JobMetadata


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**job_id** | **str** | Parent Job | 
**metadata** | [**Dict[str, MetadataValue]**](MetadataValue.md) | Custom key-value map | 
**url** | **str** |  | 

## Example

```python
from osparc_client.models.job_metadata import JobMetadata

# TODO update the JSON string below
json = "{}"
# create an instance of JobMetadata from a JSON string
job_metadata_instance = JobMetadata.from_json(json)
# print the JSON string representation of the object
print(JobMetadata.to_json())

# convert the object into a dict
job_metadata_dict = job_metadata_instance.to_dict()
# create an instance of JobMetadata from a dict
job_metadata_from_dict = JobMetadata.from_dict(job_metadata_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


