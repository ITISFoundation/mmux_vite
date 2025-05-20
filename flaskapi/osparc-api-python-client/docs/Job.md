# Job


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** |  | 
**name** | **str** |  | 
**inputs_checksum** | **str** | Input&#39;s checksum | 
**created_at** | **datetime** | Job creation timestamp | 
**runner_name** | **str** | Runner that executes job | 
**url** | **str** |  | 
**runner_url** | **str** |  | 
**outputs_url** | **str** |  | 

## Example

```python
from osparc_client.models.job import Job

# TODO update the JSON string below
json = "{}"
# create an instance of Job from a JSON string
job_instance = Job.from_json(json)
# print the JSON string representation of the object
print(Job.to_json())

# convert the object into a dict
job_dict = job_instance.to_dict()
# create an instance of Job from a dict
job_from_dict = Job.from_dict(job_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


