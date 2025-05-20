# OnePageStudyPort


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**items** | [**List[StudyPort]**](StudyPort.md) |  | 
**total** | **int** |  | [optional] 

## Example

```python
from osparc_client.models.one_page_study_port import OnePageStudyPort

# TODO update the JSON string below
json = "{}"
# create an instance of OnePageStudyPort from a JSON string
one_page_study_port_instance = OnePageStudyPort.from_json(json)
# print the JSON string representation of the object
print(OnePageStudyPort.to_json())

# convert the object into a dict
one_page_study_port_dict = one_page_study_port_instance.to_dict()
# create an instance of OnePageStudyPort from a dict
one_page_study_port_from_dict = OnePageStudyPort.from_dict(one_page_study_port_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


