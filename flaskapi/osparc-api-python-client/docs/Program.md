# Program

A released program with a specific version

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** | Resource identifier | 
**version** | **str** | Semantic version number of the resource | 
**title** | **str** | Human readable name | 
**description** | **str** |  | [optional] 
**url** | **str** |  | 
**version_display** | **str** |  | 

## Example

```python
from osparc_client.models.program import Program

# TODO update the JSON string below
json = "{}"
# create an instance of Program from a JSON string
program_instance = Program.from_json(json)
# print the JSON string representation of the object
print(Program.to_json())

# convert the object into a dict
program_dict = program_instance.to_dict()
# create an instance of Program from a dict
program_from_dict = Program.from_dict(program_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


