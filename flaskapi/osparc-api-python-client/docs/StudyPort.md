# StudyPort


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**key** | **str** | port identifier name.Correponds to the UUID of the parameter/probe node in the study | 
**kind** | **str** |  | 
**content_schema** | **object** |  | [optional] 

## Example

```python
from osparc_client.models.study_port import StudyPort

# TODO update the JSON string below
json = "{}"
# create an instance of StudyPort from a JSON string
study_port_instance = StudyPort.from_json(json)
# print the JSON string representation of the object
print(StudyPort.to_json())

# convert the object into a dict
study_port_dict = study_port_instance.to_dict()
# create an instance of StudyPort from a dict
study_port_from_dict = StudyPort.from_dict(study_port_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


