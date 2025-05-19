# FunctionJobCollectionStatus


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**status** | **List[str]** |  | 

## Example

```python
from osparc_client.models.function_job_collection_status import FunctionJobCollectionStatus

# TODO update the JSON string below
json = "{}"
# create an instance of FunctionJobCollectionStatus from a JSON string
function_job_collection_status_instance = FunctionJobCollectionStatus.from_json(json)
# print the JSON string representation of the object
print(FunctionJobCollectionStatus.to_json())

# convert the object into a dict
function_job_collection_status_dict = function_job_collection_status_instance.to_dict()
# create an instance of FunctionJobCollectionStatus from a dict
function_job_collection_status_from_dict = FunctionJobCollectionStatus.from_dict(function_job_collection_status_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


