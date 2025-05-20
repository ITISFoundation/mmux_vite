# JobOutputs


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**job_id** | **str** | Job that produced this output | 
**results** | [**Dict[str, ValuesValue]**](ValuesValue.md) |  | 

## Example

```python
from osparc_client.models.job_outputs import JobOutputs

# TODO update the JSON string below
json = "{}"
# create an instance of JobOutputs from a JSON string
job_outputs_instance = JobOutputs.from_json(json)
# print the JSON string representation of the object
print(JobOutputs.to_json())

# convert the object into a dict
job_outputs_dict = job_outputs_instance.to_dict()
# create an instance of JobOutputs from a dict
job_outputs_from_dict = JobOutputs.from_dict(job_outputs_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


