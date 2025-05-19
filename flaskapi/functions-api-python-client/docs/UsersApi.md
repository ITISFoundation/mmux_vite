# osparc_client.UsersApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**get_my_profile**](UsersApi.md#get_my_profile) | **GET** /v0/me | Get My Profile
[**update_my_profile**](UsersApi.md#update_my_profile) | **PUT** /v0/me | Update My Profile


# **get_my_profile**
> Profile get_my_profile()

Get My Profile

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.profile import Profile
from osparc_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = osparc_client.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

# Configure HTTP basic authorization: HTTPBasic
configuration = osparc_client.Configuration(
    username = os.environ["USERNAME"],
    password = os.environ["PASSWORD"]
)

# Enter a context with an instance of the API client
with osparc_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = osparc_client.UsersApi(api_client)

    try:
        # Get My Profile
        api_response = api_instance.get_my_profile()
        print("The response of UsersApi->get_my_profile:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling UsersApi->get_my_profile: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**Profile**](Profile.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | User not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **update_my_profile**
> Profile update_my_profile(profile_update)

Update My Profile

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.profile import Profile
from osparc_client.models.profile_update import ProfileUpdate
from osparc_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = osparc_client.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

# Configure HTTP basic authorization: HTTPBasic
configuration = osparc_client.Configuration(
    username = os.environ["USERNAME"],
    password = os.environ["PASSWORD"]
)

# Enter a context with an instance of the API client
with osparc_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = osparc_client.UsersApi(api_client)
    profile_update = osparc_client.ProfileUpdate() # ProfileUpdate | 

    try:
        # Update My Profile
        api_response = api_instance.update_my_profile(profile_update)
        print("The response of UsersApi->update_my_profile:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling UsersApi->update_my_profile: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **profile_update** | [**ProfileUpdate**](ProfileUpdate.md)|  | 

### Return type

[**Profile**](Profile.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | User not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

