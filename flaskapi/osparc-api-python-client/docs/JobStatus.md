# JobStatus


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**job_id** | **str** |  | 
**state** | [**RunningState**](RunningState.md) |  | 
**progress** | **int** |  | [optional] [default to 0]
**submitted_at** | **datetime** | Last modification timestamp of the solver job | 
**started_at** | **datetime** |  | [optional] 
**stopped_at** | **datetime** |  | [optional] 

## Example

```python
from osparc_client.models.job_status import JobStatus

# TODO update the JSON string below
json = "{}"
# create an instance of JobStatus from a JSON string
job_status_instance = JobStatus.from_json(json)
# print the JSON string representation of the object
print(JobStatus.to_json())

# convert the object into a dict
job_status_dict = job_status_instance.to_dict()
# create an instance of JobStatus from a dict
job_status_from_dict = JobStatus.from_dict(job_status_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


