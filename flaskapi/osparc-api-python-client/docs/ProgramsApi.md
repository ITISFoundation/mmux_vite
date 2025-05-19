# osparc_client.ProgramsApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**create_program_job**](ProgramsApi.md#create_program_job) | **POST** /v0/programs/{program_key}/releases/{version}/jobs | Create Program Job
[**get_program_release**](ProgramsApi.md#get_program_release) | **GET** /v0/programs/{program_key}/releases/{version} | Get Program Release


# **create_program_job**
> Job create_program_job(program_key, version, x_simcore_parent_project_uuid=x_simcore_parent_project_uuid, x_simcore_parent_node_id=x_simcore_parent_node_id, body_create_program_job_v0_programs_program_key_releases_version_jobs_post=body_create_program_job_v0_programs_program_key_releases_version_jobs_post)

Create Program Job

Creates a program job

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.body_create_program_job_v0_programs_program_key_releases_version_jobs_post import BodyCreateProgramJobV0ProgramsProgramKeyReleasesVersionJobsPost
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
    api_instance = osparc_client.ProgramsApi(api_client)
    program_key = 'program_key_example' # str | 
    version = 'version_example' # str | 
    x_simcore_parent_project_uuid = 'x_simcore_parent_project_uuid_example' # str |  (optional)
    x_simcore_parent_node_id = 'x_simcore_parent_node_id_example' # str |  (optional)
    body_create_program_job_v0_programs_program_key_releases_version_jobs_post = osparc_client.BodyCreateProgramJobV0ProgramsProgramKeyReleasesVersionJobsPost() # BodyCreateProgramJobV0ProgramsProgramKeyReleasesVersionJobsPost |  (optional)

    try:
        # Create Program Job
        api_response = api_instance.create_program_job(program_key, version, x_simcore_parent_project_uuid=x_simcore_parent_project_uuid, x_simcore_parent_node_id=x_simcore_parent_node_id, body_create_program_job_v0_programs_program_key_releases_version_jobs_post=body_create_program_job_v0_programs_program_key_releases_version_jobs_post)
        print("The response of ProgramsApi->create_program_job:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProgramsApi->create_program_job: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **program_key** | **str**|  | 
 **version** | **str**|  | 
 **x_simcore_parent_project_uuid** | **str**|  | [optional] 
 **x_simcore_parent_node_id** | **str**|  | [optional] 
 **body_create_program_job_v0_programs_program_key_releases_version_jobs_post** | [**BodyCreateProgramJobV0ProgramsProgramKeyReleasesVersionJobsPost**](BodyCreateProgramJobV0ProgramsProgramKeyReleasesVersionJobsPost.md)|  | [optional] 

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
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_program_release**
> Program get_program_release(program_key, version)

Get Program Release

Gets a specific release of a solver

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.program import Program
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
    api_instance = osparc_client.ProgramsApi(api_client)
    program_key = 'program_key_example' # str | 
    version = 'version_example' # str | 

    try:
        # Get Program Release
        api_response = api_instance.get_program_release(program_key, version)
        print("The response of ProgramsApi->get_program_release:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProgramsApi->get_program_release: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **program_key** | **str**|  | 
 **version** | **str**|  | 

### Return type

[**Program**](Program.md)

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

