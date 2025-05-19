# ProjectFunction


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**function_class** | **str** |  | [optional] [default to 'PROJECT']
**title** | **str** |  | [optional] [default to '']
**description** | **str** |  | [optional] [default to '']
**input_schema** | [**InputSchema**](InputSchema.md) |  | 
**output_schema** | [**OutputSchema**](OutputSchema.md) |  | 
**default_inputs** | **object** |  | 
**project_id** | **str** |  | 

## Example

```python
from osparc_client.models.project_function import ProjectFunction

# TODO update the JSON string below
json = "{}"
# create an instance of ProjectFunction from a JSON string
project_function_instance = ProjectFunction.from_json(json)
# print the JSON string representation of the object
print(ProjectFunction.to_json())

# convert the object into a dict
project_function_dict = project_function_instance.to_dict()
# create an instance of ProjectFunction from a dict
project_function_from_dict = ProjectFunction.from_dict(project_function_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


