# RegisteredFunctionJobCollection


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**title** | **str** |  | [optional] [default to '']
**description** | **str** |  | [optional] [default to '']
**job_ids** | **List[str]** |  | [optional] [default to []]
**uid** | **str** |  | 

## Example

```python
from osparc_client.models.registered_function_job_collection import RegisteredFunctionJobCollection

# TODO update the JSON string below
json = "{}"
# create an instance of RegisteredFunctionJobCollection from a JSON string
registered_function_job_collection_instance = RegisteredFunctionJobCollection.from_json(json)
# print the JSON string representation of the object
print(RegisteredFunctionJobCollection.to_json())

# convert the object into a dict
registered_function_job_collection_dict = registered_function_job_collection_instance.to_dict()
# create an instance of RegisteredFunctionJobCollection from a dict
registered_function_job_collection_from_dict = RegisteredFunctionJobCollection.from_dict(registered_function_job_collection_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


