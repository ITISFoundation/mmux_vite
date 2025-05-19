# osparc_client.SolversApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**create_solver_job**](SolversApi.md#create_solver_job) | **POST** /v0/solvers/{solver_key}/releases/{version}/jobs | Create Solver Job
[**delete_job**](SolversApi.md#delete_job) | **DELETE** /v0/solvers/{solver_key}/releases/{version}/jobs/{job_id} | Delete Job
[**get_job**](SolversApi.md#get_job) | **GET** /v0/solvers/{solver_key}/releases/{version}/jobs/{job_id} | Get Job
[**get_job_custom_metadata**](SolversApi.md#get_job_custom_metadata) | **GET** /v0/solvers/{solver_key}/releases/{version}/jobs/{job_id}/metadata | Get Job Custom Metadata
[**get_job_output_logfile**](SolversApi.md#get_job_output_logfile) | **GET** /v0/solvers/{solver_key}/releases/{version}/jobs/{job_id}/outputs/logfile | Get Job Output Logfile
[**get_job_outputs**](SolversApi.md#get_job_outputs) | **GET** /v0/solvers/{solver_key}/releases/{version}/jobs/{job_id}/outputs | Get Job Outputs
[**get_job_pricing_unit**](SolversApi.md#get_job_pricing_unit) | **GET** /v0/solvers/{solver_key}/releases/{version}/jobs/{job_id}/pricing_unit | Get Job Pricing Unit
[**get_job_wallet**](SolversApi.md#get_job_wallet) | **GET** /v0/solvers/{solver_key}/releases/{version}/jobs/{job_id}/wallet | Get Job Wallet
[**get_jobs_page**](SolversApi.md#get_jobs_page) | **GET** /v0/solvers/{solver_key}/releases/{version}/jobs/page | Get Jobs Page
[**get_log_stream**](SolversApi.md#get_log_stream) | **GET** /v0/solvers/{solver_key}/releases/{version}/jobs/{job_id}/logstream | Get Log Stream
[**get_solver**](SolversApi.md#get_solver) | **GET** /v0/solvers/{solver_key}/latest | Get Solver
[**get_solver_pricing_plan**](SolversApi.md#get_solver_pricing_plan) | **GET** /v0/solvers/{solver_key}/releases/{version}/pricing_plan | Get Solver Pricing Plan
[**get_solver_release**](SolversApi.md#get_solver_release) | **GET** /v0/solvers/{solver_key}/releases/{version} | Get Solver Release
[**inspect_job**](SolversApi.md#inspect_job) | **POST** /v0/solvers/{solver_key}/releases/{version}/jobs/{job_id}:inspect | Inspect Job
[**list_jobs**](SolversApi.md#list_jobs) | **GET** /v0/solvers/{solver_key}/releases/{version}/jobs | List Jobs
[**list_solver_ports**](SolversApi.md#list_solver_ports) | **GET** /v0/solvers/{solver_key}/releases/{version}/ports | List Solver Ports
[**list_solver_releases**](SolversApi.md#list_solver_releases) | **GET** /v0/solvers/{solver_key}/releases | List Solver Releases
[**list_solvers**](SolversApi.md#list_solvers) | **GET** /v0/solvers | List Solvers
[**list_solvers_releases**](SolversApi.md#list_solvers_releases) | **GET** /v0/solvers/releases | Lists All Releases
[**replace_job_custom_metadata**](SolversApi.md#replace_job_custom_metadata) | **PATCH** /v0/solvers/{solver_key}/releases/{version}/jobs/{job_id}/metadata | Replace Job Custom Metadata
[**start_job**](SolversApi.md#start_job) | **POST** /v0/solvers/{solver_key}/releases/{version}/jobs/{job_id}:start | Start Job
[**stop_job**](SolversApi.md#stop_job) | **POST** /v0/solvers/{solver_key}/releases/{version}/jobs/{job_id}:stop | Stop Job


# **create_solver_job**
> Job create_solver_job(solver_key, version, job_inputs, hidden=hidden, x_simcore_parent_project_uuid=x_simcore_parent_project_uuid, x_simcore_parent_node_id=x_simcore_parent_node_id)

Create Solver Job

Creates a job in a specific release with given inputs.

NOTE: This operation does **not** start the job

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
    api_instance = osparc_client.SolversApi(api_client)
    solver_key = 'solver_key_example' # str | 
    version = 'version_example' # str | 
    job_inputs = osparc_client.JobInputs() # JobInputs | 
    hidden = True # bool |  (optional) (default to True)
    x_simcore_parent_project_uuid = 'x_simcore_parent_project_uuid_example' # str |  (optional)
    x_simcore_parent_node_id = 'x_simcore_parent_node_id_example' # str |  (optional)

    try:
        # Create Solver Job
        api_response = api_instance.create_solver_job(solver_key, version, job_inputs, hidden=hidden, x_simcore_parent_project_uuid=x_simcore_parent_project_uuid, x_simcore_parent_node_id=x_simcore_parent_node_id)
        print("The response of SolversApi->create_solver_job:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SolversApi->create_solver_job: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solver_key** | **str**|  | 
 **version** | **str**|  | 
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
**201** | Successful Response |  -  |
**402** | Payment required |  -  |
**404** | Job/wallet/pricing details not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **delete_job**
> delete_job(solver_key, version, job_id)

Delete Job

Deletes an existing solver job

New in *version 0.7*

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
    api_instance = osparc_client.SolversApi(api_client)
    solver_key = 'solver_key_example' # str | 
    version = 'version_example' # str | 
    job_id = 'job_id_example' # str | 

    try:
        # Delete Job
        api_instance.delete_job(solver_key, version, job_id)
    except Exception as e:
        print("Exception when calling SolversApi->delete_job: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solver_key** | **str**|  | 
 **version** | **str**|  | 
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
**402** | Payment required |  -  |
**404** | Job/wallet/pricing details not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_job**
> Job get_job(solver_key, version, job_id)

Get Job

Gets job of a given solver

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.job import Job
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
    api_instance = osparc_client.SolversApi(api_client)
    solver_key = 'solver_key_example' # str | 
    version = 'version_example' # str | 
    job_id = 'job_id_example' # str | 

    try:
        # Get Job
        api_response = api_instance.get_job(solver_key, version, job_id)
        print("The response of SolversApi->get_job:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SolversApi->get_job: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solver_key** | **str**|  | 
 **version** | **str**|  | 
 **job_id** | **str**|  | 

### Return type

[**Job**](Job.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**402** | Payment required |  -  |
**404** | Job/wallet/pricing details not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_job_custom_metadata**
> JobMetadata get_job_custom_metadata(solver_key, version, job_id)

Get Job Custom Metadata

Gets custom metadata from a job

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
    api_instance = osparc_client.SolversApi(api_client)
    solver_key = 'solver_key_example' # str | 
    version = 'version_example' # str | 
    job_id = 'job_id_example' # str | 

    try:
        # Get Job Custom Metadata
        api_response = api_instance.get_job_custom_metadata(solver_key, version, job_id)
        print("The response of SolversApi->get_job_custom_metadata:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SolversApi->get_job_custom_metadata: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solver_key** | **str**|  | 
 **version** | **str**|  | 
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
**404** | Metadata not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_job_output_logfile**
> bytearray get_job_output_logfile(solver_key, version, job_id)

Get Job Output Logfile

Special extra output with persistent logs file for the solver run.

**NOTE**: this is not a log stream but a predefined output that is only
available after the job is done.

New in *version 0.4.0*

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
    api_instance = osparc_client.SolversApi(api_client)
    solver_key = 'solver_key_example' # str | 
    version = 'version_example' # str | 
    job_id = 'job_id_example' # str | 

    try:
        # Get Job Output Logfile
        api_response = api_instance.get_job_output_logfile(solver_key, version, job_id)
        print("The response of SolversApi->get_job_output_logfile:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SolversApi->get_job_output_logfile: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solver_key** | **str**|  | 
 **version** | **str**|  | 
 **job_id** | **str**|  | 

### Return type

**bytearray**

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/octet-stream, application/zip, text/plain, application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**307** | Successful Response |  -  |
**200** | Returns a log file |  -  |
**404** | Log not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_job_outputs**
> JobOutputs get_job_outputs(solver_key, version, job_id)

Get Job Outputs

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
    api_instance = osparc_client.SolversApi(api_client)
    solver_key = 'solver_key_example' # str | 
    version = 'version_example' # str | 
    job_id = 'job_id_example' # str | 

    try:
        # Get Job Outputs
        api_response = api_instance.get_job_outputs(solver_key, version, job_id)
        print("The response of SolversApi->get_job_outputs:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SolversApi->get_job_outputs: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solver_key** | **str**|  | 
 **version** | **str**|  | 
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
**402** | Payment required |  -  |
**404** | Job not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_job_pricing_unit**
> PricingUnitGetLegacy get_job_pricing_unit(solver_key, version, job_id)

Get Job Pricing Unit

Get job pricing unit

New in *version 0.7*

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.pricing_unit_get_legacy import PricingUnitGetLegacy
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
    api_instance = osparc_client.SolversApi(api_client)
    solver_key = 'solver_key_example' # str | 
    version = 'version_example' # str | 
    job_id = 'job_id_example' # str | 

    try:
        # Get Job Pricing Unit
        api_response = api_instance.get_job_pricing_unit(solver_key, version, job_id)
        print("The response of SolversApi->get_job_pricing_unit:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SolversApi->get_job_pricing_unit: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solver_key** | **str**|  | 
 **version** | **str**|  | 
 **job_id** | **str**|  | 

### Return type

[**PricingUnitGetLegacy**](PricingUnitGetLegacy.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Pricing unit not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_job_wallet**
> WalletGetWithAvailableCreditsLegacy get_job_wallet(solver_key, version, job_id)

Get Job Wallet

Get job wallet

New in *version 0.7*

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.wallet_get_with_available_credits_legacy import WalletGetWithAvailableCreditsLegacy
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
    api_instance = osparc_client.SolversApi(api_client)
    solver_key = 'solver_key_example' # str | 
    version = 'version_example' # str | 
    job_id = 'job_id_example' # str | 

    try:
        # Get Job Wallet
        api_response = api_instance.get_job_wallet(solver_key, version, job_id)
        print("The response of SolversApi->get_job_wallet:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SolversApi->get_job_wallet: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solver_key** | **str**|  | 
 **version** | **str**|  | 
 **job_id** | **str**|  | 

### Return type

[**WalletGetWithAvailableCreditsLegacy**](WalletGetWithAvailableCreditsLegacy.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Wallet not found |  -  |
**403** | Access to wallet is not allowed |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_jobs_page**
> PageJob get_jobs_page(solver_key, version, limit=limit, offset=offset)

Get Jobs Page

List of jobs on a specific released solver (includes pagination)

New in *version 0.7*

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.page_job import PageJob
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
    api_instance = osparc_client.SolversApi(api_client)
    solver_key = 'solver_key_example' # str | 
    version = 'version_example' # str | 
    limit = 20 # int | Page size limit (optional) (default to 20)
    offset = 0 # int | Page offset (optional) (default to 0)

    try:
        # Get Jobs Page
        api_response = api_instance.get_jobs_page(solver_key, version, limit=limit, offset=offset)
        print("The response of SolversApi->get_jobs_page:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SolversApi->get_jobs_page: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solver_key** | **str**|  | 
 **version** | **str**|  | 
 **limit** | **int**| Page size limit | [optional] [default to 20]
 **offset** | **int**| Page offset | [optional] [default to 0]

### Return type

[**PageJob**](PageJob.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**402** | Payment required |  -  |
**404** | Job/wallet/pricing details not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_log_stream**
> Response200GetLogStreamV0SolversSolverKeyReleasesVersionJobsJobIdLogstreamGet get_log_stream(solver_key, version, job_id)

Get Log Stream

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.response200_get_log_stream_v0_solvers_solver_key_releases_version_jobs_job_id_logstream_get import Response200GetLogStreamV0SolversSolverKeyReleasesVersionJobsJobIdLogstreamGet
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
    api_instance = osparc_client.SolversApi(api_client)
    solver_key = 'solver_key_example' # str | 
    version = 'version_example' # str | 
    job_id = 'job_id_example' # str | 

    try:
        # Get Log Stream
        api_response = api_instance.get_log_stream(solver_key, version, job_id)
        print("The response of SolversApi->get_log_stream:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SolversApi->get_log_stream: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solver_key** | **str**|  | 
 **version** | **str**|  | 
 **job_id** | **str**|  | 

### Return type

[**Response200GetLogStreamV0SolversSolverKeyReleasesVersionJobsJobIdLogstreamGet**](Response200GetLogStreamV0SolversSolverKeyReleasesVersionJobsJobIdLogstreamGet.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/x-ndjson, application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Returns a JobLog or an ErrorGet |  -  |
**409** | Conflict: Logs are already being streamed |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_solver**
> Solver get_solver(solver_key)

Get Solver

Gets latest release of a solver

Added in *version 0.7.1*: `version_display` field in the response

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.solver import Solver
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
    api_instance = osparc_client.SolversApi(api_client)
    solver_key = 'solver_key_example' # str | 

    try:
        # Get Solver
        api_response = api_instance.get_solver(solver_key)
        print("The response of SolversApi->get_solver:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SolversApi->get_solver: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solver_key** | **str**|  | 

### Return type

[**Solver**](Solver.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_solver_pricing_plan**
> ServicePricingPlanGetLegacy get_solver_pricing_plan(solver_key, version)

Get Solver Pricing Plan

Gets solver pricing plan

New in *version 0.7*

Added in *version 0.7.1*: `version_display` field in the response

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.service_pricing_plan_get_legacy import ServicePricingPlanGetLegacy
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
    api_instance = osparc_client.SolversApi(api_client)
    solver_key = 'solver_key_example' # str | 
    version = 'version_example' # str | 

    try:
        # Get Solver Pricing Plan
        api_response = api_instance.get_solver_pricing_plan(solver_key, version)
        print("The response of SolversApi->get_solver_pricing_plan:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SolversApi->get_solver_pricing_plan: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solver_key** | **str**|  | 
 **version** | **str**|  | 

### Return type

[**ServicePricingPlanGetLegacy**](ServicePricingPlanGetLegacy.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_solver_release**
> Solver get_solver_release(solver_key, version)

Get Solver Release

Gets a specific release of a solver

Added in *version 0.7.1*: `version_display` field in the response

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.solver import Solver
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
    api_instance = osparc_client.SolversApi(api_client)
    solver_key = 'solver_key_example' # str | 
    version = 'version_example' # str | 

    try:
        # Get Solver Release
        api_response = api_instance.get_solver_release(solver_key, version)
        print("The response of SolversApi->get_solver_release:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SolversApi->get_solver_release: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solver_key** | **str**|  | 
 **version** | **str**|  | 

### Return type

[**Solver**](Solver.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **inspect_job**
> JobStatus inspect_job(solver_key, version, job_id)

Inspect Job

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
    api_instance = osparc_client.SolversApi(api_client)
    solver_key = 'solver_key_example' # str | 
    version = 'version_example' # str | 
    job_id = 'job_id_example' # str | 

    try:
        # Inspect Job
        api_response = api_instance.inspect_job(solver_key, version, job_id)
        print("The response of SolversApi->inspect_job:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SolversApi->inspect_job: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solver_key** | **str**|  | 
 **version** | **str**|  | 
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
**402** | Payment required |  -  |
**404** | Job/wallet/pricing details not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **list_jobs**
> List[Job] list_jobs(solver_key, version)

List Jobs

🚨 **Deprecated**: This endpoint is deprecated and will be removed in a future release.
Please use `GET /{solver_key}/releases/{version}/jobs/page` instead.



List of jobs in a specific released solver (limited to 20 jobs)

New in *version 0.5*

Removed in *version 0.7*: This endpoint is deprecated and will be removed in a future version

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.job import Job
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
    api_instance = osparc_client.SolversApi(api_client)
    solver_key = 'solver_key_example' # str | 
    version = 'version_example' # str | 

    try:
        # List Jobs
        api_response = api_instance.list_jobs(solver_key, version)
        print("The response of SolversApi->list_jobs:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SolversApi->list_jobs: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solver_key** | **str**|  | 
 **version** | **str**|  | 

### Return type

[**List[Job]**](Job.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**402** | Payment required |  -  |
**404** | Job/wallet/pricing details not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **list_solver_ports**
> OnePageSolverPort list_solver_ports(solver_key, version)

List Solver Ports

Lists inputs and outputs of a given solver

New in *version 0.5.0*

Added in *version 0.7.1*: `version_display` field in the response

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.one_page_solver_port import OnePageSolverPort
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
    api_instance = osparc_client.SolversApi(api_client)
    solver_key = 'solver_key_example' # str | 
    version = 'version_example' # str | 

    try:
        # List Solver Ports
        api_response = api_instance.list_solver_ports(solver_key, version)
        print("The response of SolversApi->list_solver_ports:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SolversApi->list_solver_ports: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solver_key** | **str**|  | 
 **version** | **str**|  | 

### Return type

[**OnePageSolverPort**](OnePageSolverPort.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **list_solver_releases**
> List[Solver] list_solver_releases(solver_key)

List Solver Releases

Lists all releases of a given (one) solver

Added in *version 0.7.1*: `version_display` field in the response

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.solver import Solver
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
    api_instance = osparc_client.SolversApi(api_client)
    solver_key = 'solver_key_example' # str | 

    try:
        # List Solver Releases
        api_response = api_instance.list_solver_releases(solver_key)
        print("The response of SolversApi->list_solver_releases:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SolversApi->list_solver_releases: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solver_key** | **str**|  | 

### Return type

[**List[Solver]**](Solver.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **list_solvers**
> List[Solver] list_solvers()

List Solvers

🚨 **Deprecated**: This endpoint is deprecated and will be removed in a future release.
Please use `GET /v0/solvers/page` instead.



Lists all available solvers (latest version)

New in *version 0.5.0*

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.solver import Solver
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
    api_instance = osparc_client.SolversApi(api_client)

    try:
        # List Solvers
        api_response = api_instance.list_solvers()
        print("The response of SolversApi->list_solvers:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SolversApi->list_solvers: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**List[Solver]**](Solver.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **list_solvers_releases**
> List[Solver] list_solvers_releases()

Lists All Releases

🚨 **Deprecated**: This endpoint is deprecated and will be removed in a future release.
Please use `GET /v0/solvers/{solver_key}/releases/page` instead.



Lists all released solvers (not just latest version)

New in *version 0.5.0*

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.solver import Solver
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
    api_instance = osparc_client.SolversApi(api_client)

    try:
        # Lists All Releases
        api_response = api_instance.list_solvers_releases()
        print("The response of SolversApi->list_solvers_releases:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SolversApi->list_solvers_releases: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**List[Solver]**](Solver.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **replace_job_custom_metadata**
> JobMetadata replace_job_custom_metadata(solver_key, version, job_id, job_metadata_update)

Replace Job Custom Metadata

Updates custom metadata from a job

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
    api_instance = osparc_client.SolversApi(api_client)
    solver_key = 'solver_key_example' # str | 
    version = 'version_example' # str | 
    job_id = 'job_id_example' # str | 
    job_metadata_update = osparc_client.JobMetadataUpdate() # JobMetadataUpdate | 

    try:
        # Replace Job Custom Metadata
        api_response = api_instance.replace_job_custom_metadata(solver_key, version, job_id, job_metadata_update)
        print("The response of SolversApi->replace_job_custom_metadata:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SolversApi->replace_job_custom_metadata: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solver_key** | **str**|  | 
 **version** | **str**|  | 
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
**404** | Metadata not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **start_job**
> JobStatus start_job(solver_key, version, job_id, cluster_id=cluster_id)

Start Job

Starts job job_id created with the solver solver_key:version

Added in *version 0.4.3*: query parameter `cluster_id`
Added in *version 0.6*: responds with a 202 when successfully starting a computation
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
    api_instance = osparc_client.SolversApi(api_client)
    solver_key = 'solver_key_example' # str | 
    version = 'version_example' # str | 
    job_id = 'job_id_example' # str | 
    cluster_id = 56 # int |  (optional)

    try:
        # Start Job
        api_response = api_instance.start_job(solver_key, version, job_id, cluster_id=cluster_id)
        print("The response of SolversApi->start_job:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SolversApi->start_job: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solver_key** | **str**|  | 
 **version** | **str**|  | 
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

# **stop_job**
> JobStatus stop_job(solver_key, version, job_id)

Stop Job

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
    api_instance = osparc_client.SolversApi(api_client)
    solver_key = 'solver_key_example' # str | 
    version = 'version_example' # str | 
    job_id = 'job_id_example' # str | 

    try:
        # Stop Job
        api_response = api_instance.stop_job(solver_key, version, job_id)
        print("The response of SolversApi->stop_job:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SolversApi->stop_job: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solver_key** | **str**|  | 
 **version** | **str**|  | 
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
**402** | Payment required |  -  |
**404** | Job/wallet/pricing details not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

