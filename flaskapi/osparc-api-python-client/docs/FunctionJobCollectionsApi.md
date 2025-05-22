# osparc_client.FunctionJobCollectionsApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**delete_function_job_collection**](FunctionJobCollectionsApi.md#delete_function_job_collection) | **DELETE** /v0/function_job_collections/{function_job_collection_id} | Delete Function Job Collection
[**function_job_collection_list_function_jobs**](FunctionJobCollectionsApi.md#function_job_collection_list_function_jobs) | **GET** /v0/function_job_collections/{function_job_collection_id}/function_jobs | Function Job Collection List Function Jobs
[**function_job_collection_status**](FunctionJobCollectionsApi.md#function_job_collection_status) | **GET** /v0/function_job_collections/{function_job_collection_id}/status | Function Job Collection Status
[**get_function_job_collection**](FunctionJobCollectionsApi.md#get_function_job_collection) | **GET** /v0/function_job_collections/{function_job_collection_id} | Get Function Job Collection
[**list_function_job_collections**](FunctionJobCollectionsApi.md#list_function_job_collections) | **GET** /v0/function_job_collections | List Function Job Collections
[**register_function_job_collection**](FunctionJobCollectionsApi.md#register_function_job_collection) | **POST** /v0/function_job_collections | Register Function Job Collection


# **delete_function_job_collection**
> object delete_function_job_collection(function_job_collection_id)

Delete Function Job Collection

Delete function job collection

New in *version 0.8.0*

### Example


```python
import osparc_client
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
    api_instance = osparc_client.FunctionJobCollectionsApi(api_client)
    function_job_collection_id = 'function_job_collection_id_example' # str | 

    try:
        # Delete Function Job Collection
        api_response = api_instance.delete_function_job_collection(function_job_collection_id)
        print("The response of FunctionJobCollectionsApi->delete_function_job_collection:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FunctionJobCollectionsApi->delete_function_job_collection: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **function_job_collection_id** | **str**|  | 

### Return type

**object**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Function job collection not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **function_job_collection_list_function_jobs**
> List[FunctionJobCollectionListFunctionJobs200ResponseInner] function_job_collection_list_function_jobs(function_job_collection_id)

Function Job Collection List Function Jobs

Get the function jobs in function job collection

New in *version 0.8.0*

### Example


```python
import osparc_client
from osparc_client.models.function_job_collection_list_function_jobs200_response_inner import FunctionJobCollectionListFunctionJobs200ResponseInner
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
    api_instance = osparc_client.FunctionJobCollectionsApi(api_client)
    function_job_collection_id = 'function_job_collection_id_example' # str | 

    try:
        # Function Job Collection List Function Jobs
        api_response = api_instance.function_job_collection_list_function_jobs(function_job_collection_id)
        print("The response of FunctionJobCollectionsApi->function_job_collection_list_function_jobs:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FunctionJobCollectionsApi->function_job_collection_list_function_jobs: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **function_job_collection_id** | **str**|  | 

### Return type

[**List[FunctionJobCollectionListFunctionJobs200ResponseInner]**](FunctionJobCollectionListFunctionJobs200ResponseInner.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Function job collection not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **function_job_collection_status**
> FunctionJobCollectionStatus function_job_collection_status(function_job_collection_id)

Function Job Collection Status

Get function job collection status

New in *version 0.8.0*

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.function_job_collection_status import FunctionJobCollectionStatus
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
    api_instance = osparc_client.FunctionJobCollectionsApi(api_client)
    function_job_collection_id = 'function_job_collection_id_example' # str | 

    try:
        # Function Job Collection Status
        api_response = api_instance.function_job_collection_status(function_job_collection_id)
        print("The response of FunctionJobCollectionsApi->function_job_collection_status:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FunctionJobCollectionsApi->function_job_collection_status: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **function_job_collection_id** | **str**|  | 

### Return type

[**FunctionJobCollectionStatus**](FunctionJobCollectionStatus.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Function job collection not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_function_job_collection**
> RegisteredFunctionJobCollection get_function_job_collection(function_job_collection_id)

Get Function Job Collection

Get function job collection

New in *version 0.8.0*

### Example


```python
import osparc_client
from osparc_client.models.registered_function_job_collection import RegisteredFunctionJobCollection
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
    api_instance = osparc_client.FunctionJobCollectionsApi(api_client)
    function_job_collection_id = 'function_job_collection_id_example' # str | 

    try:
        # Get Function Job Collection
        api_response = api_instance.get_function_job_collection(function_job_collection_id)
        print("The response of FunctionJobCollectionsApi->get_function_job_collection:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FunctionJobCollectionsApi->get_function_job_collection: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **function_job_collection_id** | **str**|  | 

### Return type

[**RegisteredFunctionJobCollection**](RegisteredFunctionJobCollection.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Function job collection not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **list_function_job_collections**
> PageRegisteredFunctionJobCollection list_function_job_collections(limit=limit, offset=offset)

List Function Job Collections

List function job collections

New in *version 0.8.0*

### Example


```python
import osparc_client
from osparc_client.models.page_registered_function_job_collection import PageRegisteredFunctionJobCollection
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
    api_instance = osparc_client.FunctionJobCollectionsApi(api_client)
    limit = 20 # int | Page size limit (optional) (default to 20)
    offset = 0 # int | Page offset (optional) (default to 0)

    try:
        # List Function Job Collections
        api_response = api_instance.list_function_job_collections(limit=limit, offset=offset)
        print("The response of FunctionJobCollectionsApi->list_function_job_collections:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FunctionJobCollectionsApi->list_function_job_collections: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **int**| Page size limit | [optional] [default to 20]
 **offset** | **int**| Page offset | [optional] [default to 0]

### Return type

[**PageRegisteredFunctionJobCollection**](PageRegisteredFunctionJobCollection.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **register_function_job_collection**
> RegisteredFunctionJobCollection register_function_job_collection(function_job_collection)

Register Function Job Collection

Register function job collection

New in *version 0.8.0*

### Example


```python
import osparc_client
from osparc_client.models.function_job_collection import FunctionJobCollection
from osparc_client.models.registered_function_job_collection import RegisteredFunctionJobCollection
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
    api_instance = osparc_client.FunctionJobCollectionsApi(api_client)
    function_job_collection = osparc_client.FunctionJobCollection() # FunctionJobCollection | 

    try:
        # Register Function Job Collection
        api_response = api_instance.register_function_job_collection(function_job_collection)
        print("The response of FunctionJobCollectionsApi->register_function_job_collection:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FunctionJobCollectionsApi->register_function_job_collection: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **function_job_collection** | [**FunctionJobCollection**](FunctionJobCollection.md)|  | 

### Return type

[**RegisteredFunctionJobCollection**](RegisteredFunctionJobCollection.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

