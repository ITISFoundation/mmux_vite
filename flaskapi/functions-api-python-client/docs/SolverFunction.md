# SolverFunction


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**function_class** | **str** |  | [optional] [default to 'SOLVER']
**title** | **str** |  | [optional] [default to '']
**description** | **str** |  | [optional] [default to '']
**input_schema** | [**InputSchema**](InputSchema.md) |  | 
**output_schema** | [**OutputSchema**](OutputSchema.md) |  | 
**default_inputs** | **object** |  | 
**solver_key** | **str** |  | 
**solver_version** | **str** |  | 

## Example

```python
from osparc_client.models.solver_function import SolverFunction

# TODO update the JSON string below
json = "{}"
# create an instance of SolverFunction from a JSON string
solver_function_instance = SolverFunction.from_json(json)
# print the JSON string representation of the object
print(SolverFunction.to_json())

# convert the object into a dict
solver_function_dict = solver_function_instance.to_dict()
# create an instance of SolverFunction from a dict
solver_function_from_dict = SolverFunction.from_dict(solver_function_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


