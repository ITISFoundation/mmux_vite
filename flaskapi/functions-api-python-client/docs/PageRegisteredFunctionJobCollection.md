# PageRegisteredFunctionJobCollection


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**items** | [**List[RegisteredFunctionJobCollection]**](RegisteredFunctionJobCollection.md) |  | 
**total** | **int** |  | 
**limit** | **int** |  | 
**offset** | **int** |  | 
**links** | [**Links**](Links.md) |  | 

## Example

```python
from osparc_client.models.page_registered_function_job_collection import PageRegisteredFunctionJobCollection

# TODO update the JSON string below
json = "{}"
# create an instance of PageRegisteredFunctionJobCollection from a JSON string
page_registered_function_job_collection_instance = PageRegisteredFunctionJobCollection.from_json(json)
# print the JSON string representation of the object
print(PageRegisteredFunctionJobCollection.to_json())

# convert the object into a dict
page_registered_function_job_collection_dict = page_registered_function_job_collection_instance.to_dict()
# create an instance of PageRegisteredFunctionJobCollection from a dict
page_registered_function_job_collection_from_dict = PageRegisteredFunctionJobCollection.from_dict(page_registered_function_job_collection_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


