# RegisteredSolverFunction


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**function_class** | **str** |  | [optional] [default to 'SOLVER']
**title** | **str** |  | [optional] [default to '']
**description** | **str** |  | [optional] [default to '']
**input_schema** | [**InputSchema**](InputSchema.md) |  | 
**output_schema** | [**OutputSchema**](OutputSchema.md) |  | 
**default_inputs** | **object** |  | 
**uid** | **str** |  | 
**solver_key** | **str** |  | 
**solver_version** | **str** |  | 

## Example

```python
from osparc_client.models.registered_solver_function import RegisteredSolverFunction

# TODO update the JSON string below
json = "{}"
# create an instance of RegisteredSolverFunction from a JSON string
registered_solver_function_instance = RegisteredSolverFunction.from_json(json)
# print the JSON string representation of the object
print(RegisteredSolverFunction.to_json())

# convert the object into a dict
registered_solver_function_dict = registered_solver_function_instance.to_dict()
# create an instance of RegisteredSolverFunction from a dict
registered_solver_function_from_dict = RegisteredSolverFunction.from_dict(registered_solver_function_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


