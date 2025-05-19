# Solver

A released solver with a specific version

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** | Resource identifier | 
**version** | **str** | Semantic version number of the resource | 
**title** | **str** | Human readable name | 
**description** | **str** |  | [optional] 
**url** | **str** |  | 
**maintainer** | **str** | Maintainer of the solver | 
**version_display** | **str** |  | [optional] 

## Example

```python
from osparc_client.models.solver import Solver

# TODO update the JSON string below
json = "{}"
# create an instance of Solver from a JSON string
solver_instance = Solver.from_json(json)
# print the JSON string representation of the object
print(Solver.to_json())

# convert the object into a dict
solver_dict = solver_instance.to_dict()
# create an instance of Solver from a dict
solver_from_dict = Solver.from_dict(solver_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


