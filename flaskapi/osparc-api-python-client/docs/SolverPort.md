# SolverPort


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**key** | **str** | port identifier name | 
**kind** | **str** |  | 
**content_schema** | **object** |  | [optional] 

## Example

```python
from osparc_client.models.solver_port import SolverPort

# TODO update the JSON string below
json = "{}"
# create an instance of SolverPort from a JSON string
solver_port_instance = SolverPort.from_json(json)
# print the JSON string representation of the object
print(SolverPort.to_json())

# convert the object into a dict
solver_port_dict = solver_port_instance.to_dict()
# create an instance of SolverPort from a dict
solver_port_from_dict = SolverPort.from_dict(solver_port_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


