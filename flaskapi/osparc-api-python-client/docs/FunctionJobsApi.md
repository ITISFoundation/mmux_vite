# osparc_client.FunctionJobsApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**delete_function_job**](FunctionJobsApi.md#delete_function_job) | **DELETE** /v0/function_jobs/{function_job_id} | Delete Function Job
[**function_job_outputs**](FunctionJobsApi.md#function_job_outputs) | **GET** /v0/function_jobs/{function_job_id}/outputs | Function Job Outputs
[**function_job_status**](FunctionJobsApi.md#function_job_status) | **GET** /v0/function_jobs/{function_job_id}/status | Function Job Status
[**get_function_job**](FunctionJobsApi.md#get_function_job) | **GET** /v0/function_jobs/{function_job_id} | Get Function Job
[**list_function_jobs**](FunctionJobsApi.md#list_function_jobs) | **GET** /v0/function_jobs | List Function Jobs
[**register_function_job**](FunctionJobsApi.md#register_function_job) | **POST** /v0/function_jobs | Register Function Job


# **delete_function_job**
> object delete_function_job(function_job_id)

Delete Function Job

Delete function job

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
    api_instance = osparc_client.FunctionJobsApi(api_client)
    function_job_id = 'function_job_id_example' # str | 

    try:
        # Delete Function Job
        api_response = api_instance.delete_function_job(function_job_id)
        print("The response of FunctionJobsApi->delete_function_job:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FunctionJobsApi->delete_function_job: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **function_job_id** | **str**|  | 

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
**404** | Function job not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **function_job_outputs**
> object function_job_outputs(function_job_id)

Function Job Outputs

Get function job outputs

New in *version 0.8.0*

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
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
    api_instance = osparc_client.FunctionJobsApi(api_client)
    function_job_id = 'function_job_id_example' # str | 

    try:
        # Function Job Outputs
        api_response = api_instance.function_job_outputs(function_job_id)
        print("The response of FunctionJobsApi->function_job_outputs:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FunctionJobsApi->function_job_outputs: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **function_job_id** | **str**|  | 

### Return type

**object**

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Function job not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **function_job_status**
> FunctionJobStatus function_job_status(function_job_id)

Function Job Status

Get function job status

New in *version 0.8.0*

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.function_job_status import FunctionJobStatus
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
    api_instance = osparc_client.FunctionJobsApi(api_client)
    function_job_id = 'function_job_id_example' # str | 

    try:
        # Function Job Status
        api_response = api_instance.function_job_status(function_job_id)
        print("The response of FunctionJobsApi->function_job_status:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FunctionJobsApi->function_job_status: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **function_job_id** | **str**|  | 

### Return type

[**FunctionJobStatus**](FunctionJobStatus.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Function job not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_function_job**
> ResponseGetFunctionJobV0FunctionJobsFunctionJobIdGet get_function_job(function_job_id)

Get Function Job

Get function job

New in *version 0.8.0*

### Example


```python
import osparc_client
from osparc_client.models.response_get_function_job_v0_function_jobs_function_job_id_get import ResponseGetFunctionJobV0FunctionJobsFunctionJobIdGet
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
    api_instance = osparc_client.FunctionJobsApi(api_client)
    function_job_id = 'function_job_id_example' # str | 

    try:
        # Get Function Job
        api_response = api_instance.get_function_job(function_job_id)
        print("The response of FunctionJobsApi->get_function_job:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FunctionJobsApi->get_function_job: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **function_job_id** | **str**|  | 

### Return type

[**ResponseGetFunctionJobV0FunctionJobsFunctionJobIdGet**](ResponseGetFunctionJobV0FunctionJobsFunctionJobIdGet.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Function job not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **list_function_jobs**
> PageAnnotatedUnionRegisteredProjectFunctionJobRegisteredPythonCodeFunctionJobRegisteredSolverFunctionJobFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass list_function_jobs(limit=limit, offset=offset)

List Function Jobs

List function jobs

New in *version 0.8.0*

### Example


```python
import osparc_client
from osparc_client.models.page_annotated_union_registered_project_function_job_registered_python_code_function_job_registered_solver_function_job_field_info_annotation_none_type_required_true_discriminator_function_class import PageAnnotatedUnionRegisteredProjectFunctionJobRegisteredPythonCodeFunctionJobRegisteredSolverFunctionJobFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass
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
    api_instance = osparc_client.FunctionJobsApi(api_client)
    limit = 20 # int | Page size limit (optional) (default to 20)
    offset = 0 # int | Page offset (optional) (default to 0)

    try:
        # List Function Jobs
        api_response = api_instance.list_function_jobs(limit=limit, offset=offset)
        print("The response of FunctionJobsApi->list_function_jobs:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FunctionJobsApi->list_function_jobs: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **int**| Page size limit | [optional] [default to 20]
 **offset** | **int**| Page offset | [optional] [default to 0]

### Return type

[**PageAnnotatedUnionRegisteredProjectFunctionJobRegisteredPythonCodeFunctionJobRegisteredSolverFunctionJobFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass**](PageAnnotatedUnionRegisteredProjectFunctionJobRegisteredPythonCodeFunctionJobRegisteredSolverFunctionJobFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass.md)

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

# **register_function_job**
> ResponseRegisterFunctionJobV0FunctionJobsPost register_function_job(function_job)

Register Function Job

Create function job

New in *version 0.8.0*

### Example


```python
import osparc_client
from osparc_client.models.function_job import FunctionJob
from osparc_client.models.response_register_function_job_v0_function_jobs_post import ResponseRegisterFunctionJobV0FunctionJobsPost
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
    api_instance = osparc_client.FunctionJobsApi(api_client)
    function_job = osparc_client.FunctionJob() # FunctionJob | 

    try:
        # Register Function Job
        api_response = api_instance.register_function_job(function_job)
        print("The response of FunctionJobsApi->register_function_job:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FunctionJobsApi->register_function_job: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **function_job** | [**FunctionJob**](FunctionJob.md)|  | 

### Return type

[**ResponseRegisterFunctionJobV0FunctionJobsPost**](ResponseRegisterFunctionJobV0FunctionJobsPost.md)

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

