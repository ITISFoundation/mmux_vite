# JobLogsMap


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**log_links** | [**List[LogLink]**](LogLink.md) | Array of download links | 

## Example

```python
from osparc_client.models.job_logs_map import JobLogsMap

# TODO update the JSON string below
json = "{}"
# create an instance of JobLogsMap from a JSON string
job_logs_map_instance = JobLogsMap.from_json(json)
# print the JSON string representation of the object
print(JobLogsMap.to_json())

# convert the object into a dict
job_logs_map_dict = job_logs_map_instance.to_dict()
# create an instance of JobLogsMap from a dict
job_logs_map_from_dict = JobLogsMap.from_dict(job_logs_map_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


