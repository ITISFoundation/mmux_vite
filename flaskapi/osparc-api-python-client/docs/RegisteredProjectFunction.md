# RegisteredProjectFunction


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**function_class** | **str** |  | [optional] [default to 'PROJECT']
**title** | **str** |  | [optional] [default to '']
**description** | **str** |  | [optional] [default to '']
**input_schema** | [**JSONFunctionInputSchema**](JSONFunctionInputSchema.md) |  | 
**output_schema** | [**JSONFunctionOutputSchema**](JSONFunctionOutputSchema.md) |  | 
**default_inputs** | **object** |  | 
**uid** | **str** |  | 
**project_id** | **str** |  | 

## Example

```python
from osparc_client.models.registered_project_function import RegisteredProjectFunction

# TODO update the JSON string below
json = "{}"
# create an instance of RegisteredProjectFunction from a JSON string
registered_project_function_instance = RegisteredProjectFunction.from_json(json)
# print the JSON string representation of the object
print(RegisteredProjectFunction.to_json())

# convert the object into a dict
registered_project_function_dict = registered_project_function_instance.to_dict()
# create an instance of RegisteredProjectFunction from a dict
registered_project_function_from_dict = RegisteredProjectFunction.from_dict(registered_project_function_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


