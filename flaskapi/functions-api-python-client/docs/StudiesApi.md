# osparc_client.StudiesApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**clone_study**](StudiesApi.md#clone_study) | **POST** /v0/studies/{study_id}:clone | Clone Study
[**create_study_job**](StudiesApi.md#create_study_job) | **POST** /v0/studies/{study_id}/jobs | Create Study Job
[**delete_study_job**](StudiesApi.md#delete_study_job) | **DELETE** /v0/studies/{study_id}/jobs/{job_id} | Delete Study Job
[**get_study**](StudiesApi.md#get_study) | **GET** /v0/studies/{study_id} | Get Study
[**get_study_job_custom_metadata**](StudiesApi.md#get_study_job_custom_metadata) | **GET** /v0/studies/{study_id}/jobs/{job_id}/metadata | Get Study Job Custom Metadata
[**get_study_job_output_logfile**](StudiesApi.md#get_study_job_output_logfile) | **GET** /v0/studies/{study_id}/jobs/{job_id}/outputs/log-links | Get download links for study job log files
[**get_study_job_outputs**](StudiesApi.md#get_study_job_outputs) | **POST** /v0/studies/{study_id}/jobs/{job_id}/outputs | Get Study Job Outputs
[**inspect_study_job**](StudiesApi.md#inspect_study_job) | **POST** /v0/studies/{study_id}/jobs/{job_id}:inspect | Inspect Study Job
[**list_studies**](StudiesApi.md#list_studies) | **GET** /v0/studies | List Studies
[**list_study_ports**](StudiesApi.md#list_study_ports) | **GET** /v0/studies/{study_id}/ports | List Study Ports
[**replace_study_job_custom_metadata**](StudiesApi.md#replace_study_job_custom_metadata) | **PUT** /v0/studies/{study_id}/jobs/{job_id}/metadata | Replace Study Job Custom Metadata
[**start_study_job**](StudiesApi.md#start_study_job) | **POST** /v0/studies/{study_id}/jobs/{job_id}:start | Start Study Job
[**stop_study_job**](StudiesApi.md#stop_study_job) | **POST** /v0/studies/{study_id}/jobs/{job_id}:stop | Stop Study Job


# **clone_study**
> Study clone_study(study_id, x_simcore_parent_project_uuid=x_simcore_parent_project_uuid, x_simcore_parent_node_id=x_simcore_parent_node_id)

Clone Study

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.study import Study
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
    api_instance = osparc_client.StudiesApi(api_client)
    study_id = 'study_id_example' # str | 
    x_simcore_parent_project_uuid = 'x_simcore_parent_project_uuid_example' # str |  (optional)
    x_simcore_parent_node_id = 'x_simcore_parent_node_id_example' # str |  (optional)

    try:
        # Clone Study
        api_response = api_instance.clone_study(study_id, x_simcore_parent_project_uuid=x_simcore_parent_project_uuid, x_simcore_parent_node_id=x_simcore_parent_node_id)
        print("The response of StudiesApi->clone_study:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling StudiesApi->clone_study: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **study_id** | **str**|  | 
 **x_simcore_parent_project_uuid** | **str**|  | [optional] 
 **x_simcore_parent_node_id** | **str**|  | [optional] 

### Return type

[**Study**](Study.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | Successful Response |  -  |
**404** | Study not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **create_study_job**
> Job create_study_job(study_id, job_inputs, hidden=hidden, x_simcore_parent_project_uuid=x_simcore_parent_project_uuid, x_simcore_parent_node_id=x_simcore_parent_node_id)

Create Study Job

hidden -- if True (default) hides project from UI

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.job import Job
from osparc_client.models.job_inputs import JobInputs
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
    api_instance = osparc_client.StudiesApi(api_client)
    study_id = 'study_id_example' # str | 
    job_inputs = osparc_client.JobInputs() # JobInputs | 
    hidden = True # bool |  (optional) (default to True)
    x_simcore_parent_project_uuid = 'x_simcore_parent_project_uuid_example' # str |  (optional)
    x_simcore_parent_node_id = 'x_simcore_parent_node_id_example' # str |  (optional)

    try:
        # Create Study Job
        api_response = api_instance.create_study_job(study_id, job_inputs, hidden=hidden, x_simcore_parent_project_uuid=x_simcore_parent_project_uuid, x_simcore_parent_node_id=x_simcore_parent_node_id)
        print("The response of StudiesApi->create_study_job:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling StudiesApi->create_study_job: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **study_id** | **str**|  | 
 **job_inputs** | [**JobInputs**](JobInputs.md)|  | 
 **hidden** | **bool**|  | [optional] [default to True]
 **x_simcore_parent_project_uuid** | **str**|  | [optional] 
 **x_simcore_parent_node_id** | **str**|  | [optional] 

### Return type

[**Job**](Job.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **delete_study_job**
> delete_study_job(study_id, job_id)

Delete Study Job

Deletes an existing study job

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
    api_instance = osparc_client.StudiesApi(api_client)
    study_id = 'study_id_example' # str | 
    job_id = 'job_id_example' # str | 

    try:
        # Delete Study Job
        api_instance.delete_study_job(study_id, job_id)
    except Exception as e:
        print("Exception when calling StudiesApi->delete_study_job: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **study_id** | **str**|  | 
 **job_id** | **str**|  | 

### Return type

void (empty response body)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**204** | Successful Response |  -  |
**404** | Not Found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_study**
> Study get_study(study_id)

Get Study

New in *version 0.5.0*

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.study import Study
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
    api_instance = osparc_client.StudiesApi(api_client)
    study_id = 'study_id_example' # str | 

    try:
        # Get Study
        api_response = api_instance.get_study(study_id)
        print("The response of StudiesApi->get_study:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling StudiesApi->get_study: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **study_id** | **str**|  | 

### Return type

[**Study**](Study.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Study not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_study_job_custom_metadata**
> JobMetadata get_study_job_custom_metadata(study_id, job_id)

Get Study Job Custom Metadata

Get custom metadata from a study's job

New in *version 0.7*

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.job_metadata import JobMetadata
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
    api_instance = osparc_client.StudiesApi(api_client)
    study_id = 'study_id_example' # str | 
    job_id = 'job_id_example' # str | 

    try:
        # Get Study Job Custom Metadata
        api_response = api_instance.get_study_job_custom_metadata(study_id, job_id)
        print("The response of StudiesApi->get_study_job_custom_metadata:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling StudiesApi->get_study_job_custom_metadata: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **study_id** | **str**|  | 
 **job_id** | **str**|  | 

### Return type

[**JobMetadata**](JobMetadata.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_study_job_output_logfile**
> JobLogsMap get_study_job_output_logfile(study_id, job_id)

Get download links for study job log files

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.job_logs_map import JobLogsMap
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
    api_instance = osparc_client.StudiesApi(api_client)
    study_id = 'study_id_example' # str | 
    job_id = 'job_id_example' # str | 

    try:
        # Get download links for study job log files
        api_response = api_instance.get_study_job_output_logfile(study_id, job_id)
        print("The response of StudiesApi->get_study_job_output_logfile:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling StudiesApi->get_study_job_output_logfile: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **study_id** | **str**|  | 
 **job_id** | **str**|  | 

### Return type

[**JobLogsMap**](JobLogsMap.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_study_job_outputs**
> JobOutputs get_study_job_outputs(study_id, job_id)

Get Study Job Outputs

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.job_outputs import JobOutputs
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
    api_instance = osparc_client.StudiesApi(api_client)
    study_id = 'study_id_example' # str | 
    job_id = 'job_id_example' # str | 

    try:
        # Get Study Job Outputs
        api_response = api_instance.get_study_job_outputs(study_id, job_id)
        print("The response of StudiesApi->get_study_job_outputs:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling StudiesApi->get_study_job_outputs: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **study_id** | **str**|  | 
 **job_id** | **str**|  | 

### Return type

[**JobOutputs**](JobOutputs.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **inspect_study_job**
> JobStatus inspect_study_job(study_id, job_id)

Inspect Study Job

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.job_status import JobStatus
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
    api_instance = osparc_client.StudiesApi(api_client)
    study_id = 'study_id_example' # str | 
    job_id = 'job_id_example' # str | 

    try:
        # Inspect Study Job
        api_response = api_instance.inspect_study_job(study_id, job_id)
        print("The response of StudiesApi->inspect_study_job:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling StudiesApi->inspect_study_job: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **study_id** | **str**|  | 
 **job_id** | **str**|  | 

### Return type

[**JobStatus**](JobStatus.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **list_studies**
> PageStudy list_studies(limit=limit, offset=offset)

List Studies

New in *version 0.5.0*

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.page_study import PageStudy
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
    api_instance = osparc_client.StudiesApi(api_client)
    limit = 20 # int | Page size limit (optional) (default to 20)
    offset = 0 # int | Page offset (optional) (default to 0)

    try:
        # List Studies
        api_response = api_instance.list_studies(limit=limit, offset=offset)
        print("The response of StudiesApi->list_studies:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling StudiesApi->list_studies: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **int**| Page size limit | [optional] [default to 20]
 **offset** | **int**| Page offset | [optional] [default to 0]

### Return type

[**PageStudy**](PageStudy.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **list_study_ports**
> OnePageStudyPort list_study_ports(study_id)

List Study Ports

Lists metadata on ports of a given study

New in *version 0.5.0*

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.one_page_study_port import OnePageStudyPort
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
    api_instance = osparc_client.StudiesApi(api_client)
    study_id = 'study_id_example' # str | 

    try:
        # List Study Ports
        api_response = api_instance.list_study_ports(study_id)
        print("The response of StudiesApi->list_study_ports:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling StudiesApi->list_study_ports: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **study_id** | **str**|  | 

### Return type

[**OnePageStudyPort**](OnePageStudyPort.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Study not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **replace_study_job_custom_metadata**
> JobMetadata replace_study_job_custom_metadata(study_id, job_id, job_metadata_update)

Replace Study Job Custom Metadata

Changes custom metadata of a study's job

New in *version 0.7*

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.job_metadata import JobMetadata
from osparc_client.models.job_metadata_update import JobMetadataUpdate
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
    api_instance = osparc_client.StudiesApi(api_client)
    study_id = 'study_id_example' # str | 
    job_id = 'job_id_example' # str | 
    job_metadata_update = osparc_client.JobMetadataUpdate() # JobMetadataUpdate | 

    try:
        # Replace Study Job Custom Metadata
        api_response = api_instance.replace_study_job_custom_metadata(study_id, job_id, job_metadata_update)
        print("The response of StudiesApi->replace_study_job_custom_metadata:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling StudiesApi->replace_study_job_custom_metadata: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **study_id** | **str**|  | 
 **job_id** | **str**|  | 
 **job_metadata_update** | [**JobMetadataUpdate**](JobMetadataUpdate.md)|  | 

### Return type

[**JobMetadata**](JobMetadata.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **start_study_job**
> JobStatus start_study_job(study_id, job_id, cluster_id=cluster_id)

Start Study Job

Changed in *version 0.6.0*: Now responds with a 202 when successfully starting a computation
Changed in *version 0.8*: query parameter `cluster_id` deprecated

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.job_status import JobStatus
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
    api_instance = osparc_client.StudiesApi(api_client)
    study_id = 'study_id_example' # str | 
    job_id = 'job_id_example' # str | 
    cluster_id = 56 # int |  (optional)

    try:
        # Start Study Job
        api_response = api_instance.start_study_job(study_id, job_id, cluster_id=cluster_id)
        print("The response of StudiesApi->start_study_job:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling StudiesApi->start_study_job: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **study_id** | **str**|  | 
 **job_id** | **str**|  | 
 **cluster_id** | **int**|  | [optional] 

### Return type

[**JobStatus**](JobStatus.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**202** | Successful Response |  -  |
**402** | Payment required |  -  |
**404** | Job/wallet/pricing details not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**200** | Job already started |  -  |
**406** | Cluster not found |  -  |
**422** | Configuration error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **stop_study_job**
> JobStatus stop_study_job(study_id, job_id)

Stop Study Job

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.job_status import JobStatus
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
    api_instance = osparc_client.StudiesApi(api_client)
    study_id = 'study_id_example' # str | 
    job_id = 'job_id_example' # str | 

    try:
        # Stop Study Job
        api_response = api_instance.stop_study_job(study_id, job_id)
        print("The response of StudiesApi->stop_study_job:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling StudiesApi->stop_study_job: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **study_id** | **str**|  | 
 **job_id** | **str**|  | 

### Return type

[**JobStatus**](JobStatus.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

