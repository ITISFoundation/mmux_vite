# osparc_client.MetaApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**get_service_metadata**](MetaApi.md#get_service_metadata) | **GET** /v0/meta | Get Service Metadata


# **get_service_metadata**
> Meta get_service_metadata()

Get Service Metadata

### Example


```python
import osparc_client
from osparc_client.models.meta import Meta
from osparc_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = osparc_client.Configuration(
    host = "http://localhost"
)


# Enter a context with an instance of the API client
with osparc_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = osparc_client.MetaApi(api_client)

    try:
        # Get Service Metadata
        api_response = api_instance.get_service_metadata()
        print("The response of MetaApi->get_service_metadata:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling MetaApi->get_service_metadata: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**Meta**](Meta.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

