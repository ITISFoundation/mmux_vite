# PageStudy


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**items** | [**List[Study]**](Study.md) |  | 
**total** | **int** |  | 
**limit** | **int** |  | 
**offset** | **int** |  | 
**links** | [**Links**](Links.md) |  | 

## Example

```python
from osparc_client.models.page_study import PageStudy

# TODO update the JSON string below
json = "{}"
# create an instance of PageStudy from a JSON string
page_study_instance = PageStudy.from_json(json)
# print the JSON string representation of the object
print(PageStudy.to_json())

# convert the object into a dict
page_study_dict = page_study_instance.to_dict()
# create an instance of PageStudy from a dict
page_study_from_dict = PageStudy.from_dict(page_study_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


