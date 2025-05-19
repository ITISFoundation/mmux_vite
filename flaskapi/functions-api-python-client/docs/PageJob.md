# PageJob


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**items** | [**List[Job]**](Job.md) |  | 
**total** | **int** |  | 
**limit** | **int** |  | 
**offset** | **int** |  | 
**links** | [**Links**](Links.md) |  | 

## Example

```python
from osparc_client.models.page_job import PageJob

# TODO update the JSON string below
json = "{}"
# create an instance of PageJob from a JSON string
page_job_instance = PageJob.from_json(json)
# print the JSON string representation of the object
print(PageJob.to_json())

# convert the object into a dict
page_job_dict = page_job_instance.to_dict()
# create an instance of PageJob from a dict
page_job_from_dict = PageJob.from_dict(page_job_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


