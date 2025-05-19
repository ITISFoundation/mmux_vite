# SolverFunctionJob


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**title** | **str** |  | [optional] [default to '']
**description** | **str** |  | [optional] [default to '']
**function_uid** | **str** |  | 
**inputs** | **object** |  | 
**outputs** | **object** |  | 
**function_class** | **str** |  | [optional] [default to 'SOLVER']
**solver_job_id** | **str** |  | 

## Example

```python
from osparc_client.models.solver_function_job import SolverFunctionJob

# TODO update the JSON string below
json = "{}"
# create an instance of SolverFunctionJob from a JSON string
solver_function_job_instance = SolverFunctionJob.from_json(json)
# print the JSON string representation of the object
print(SolverFunctionJob.to_json())

# convert the object into a dict
solver_function_job_dict = solver_function_job_instance.to_dict()
# create an instance of SolverFunctionJob from a dict
solver_function_job_from_dict = SolverFunctionJob.from_dict(solver_function_job_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


