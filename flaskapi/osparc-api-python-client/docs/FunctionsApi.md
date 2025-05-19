# osparc_client.FunctionsApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**delete_function**](FunctionsApi.md#delete_function) | **DELETE** /v0/functions/{function_id} | Delete Function
[**get_function**](FunctionsApi.md#get_function) | **GET** /v0/functions/{function_id} | Get Function
[**get_function_inputschema**](FunctionsApi.md#get_function_inputschema) | **GET** /v0/functions/{function_id}/input_schema | Get Function Inputschema
[**get_function_outputschema**](FunctionsApi.md#get_function_outputschema) | **GET** /v0/functions/{function_id}/output_schema | Get Function Outputschema
[**list_functions**](FunctionsApi.md#list_functions) | **GET** /v0/functions | List Functions
[**map_function**](FunctionsApi.md#map_function) | **POST** /v0/functions/{function_id}:map | Map Function
[**register_function**](FunctionsApi.md#register_function) | **POST** /v0/functions | Register Function
[**run_function**](FunctionsApi.md#run_function) | **POST** /v0/functions/{function_id}:run | Run Function
[**update_function_description**](FunctionsApi.md#update_function_description) | **PATCH** /v0/functions/{function_id}/description | Update Function Description
[**update_function_title**](FunctionsApi.md#update_function_title) | **PATCH** /v0/functions/{function_id}/title | Update Function Title
[**validate_function_inputs**](FunctionsApi.md#validate_function_inputs) | **POST** /v0/functions/{function_id}:validate_inputs | Validate Function Inputs


# **delete_function**
> object delete_function(function_id)

Delete Function

Delete function

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
    api_instance = osparc_client.FunctionsApi(api_client)
    function_id = 'function_id_example' # str | 

    try:
        # Delete Function
        api_response = api_instance.delete_function(function_id)
        print("The response of FunctionsApi->delete_function:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FunctionsApi->delete_function: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **function_id** | **str**|  | 

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
**404** | Function not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_function**
> ResponseGetFunctionV0FunctionsFunctionIdGet get_function(function_id)

Get Function

Get function

### Example


```python
import osparc_client
from osparc_client.models.response_get_function_v0_functions_function_id_get import ResponseGetFunctionV0FunctionsFunctionIdGet
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
    api_instance = osparc_client.FunctionsApi(api_client)
    function_id = 'function_id_example' # str | 

    try:
        # Get Function
        api_response = api_instance.get_function(function_id)
        print("The response of FunctionsApi->get_function:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FunctionsApi->get_function: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **function_id** | **str**|  | 

### Return type

[**ResponseGetFunctionV0FunctionsFunctionIdGet**](ResponseGetFunctionV0FunctionsFunctionIdGet.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Function not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_function_inputschema**
> JSONFunctionInputSchema get_function_inputschema(function_id)

Get Function Inputschema

Get function input schema

### Example


```python
import osparc_client
from osparc_client.models.json_function_input_schema import JSONFunctionInputSchema
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
    api_instance = osparc_client.FunctionsApi(api_client)
    function_id = 'function_id_example' # str | 

    try:
        # Get Function Inputschema
        api_response = api_instance.get_function_inputschema(function_id)
        print("The response of FunctionsApi->get_function_inputschema:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FunctionsApi->get_function_inputschema: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **function_id** | **str**|  | 

### Return type

[**JSONFunctionInputSchema**](JSONFunctionInputSchema.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Function not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_function_outputschema**
> JSONFunctionInputSchema get_function_outputschema(function_id)

Get Function Outputschema

Get function input schema

### Example


```python
import osparc_client
from osparc_client.models.json_function_input_schema import JSONFunctionInputSchema
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
    api_instance = osparc_client.FunctionsApi(api_client)
    function_id = 'function_id_example' # str | 

    try:
        # Get Function Outputschema
        api_response = api_instance.get_function_outputschema(function_id)
        print("The response of FunctionsApi->get_function_outputschema:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FunctionsApi->get_function_outputschema: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **function_id** | **str**|  | 

### Return type

[**JSONFunctionInputSchema**](JSONFunctionInputSchema.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Function not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **list_functions**
> PageAnnotatedUnionRegisteredProjectFunctionRegisteredPythonCodeFunctionRegisteredSolverFunctionFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass list_functions(limit=limit, offset=offset)

List Functions

List functions

### Example


```python
import osparc_client
from osparc_client.models.page_annotated_union_registered_project_function_registered_python_code_function_registered_solver_function_field_info_annotation_none_type_required_true_discriminator_function_class import PageAnnotatedUnionRegisteredProjectFunctionRegisteredPythonCodeFunctionRegisteredSolverFunctionFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass
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
    api_instance = osparc_client.FunctionsApi(api_client)
    limit = 20 # int | Page size limit (optional) (default to 20)
    offset = 0 # int | Page offset (optional) (default to 0)

    try:
        # List Functions
        api_response = api_instance.list_functions(limit=limit, offset=offset)
        print("The response of FunctionsApi->list_functions:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FunctionsApi->list_functions: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **int**| Page size limit | [optional] [default to 20]
 **offset** | **int**| Page offset | [optional] [default to 0]

### Return type

[**PageAnnotatedUnionRegisteredProjectFunctionRegisteredPythonCodeFunctionRegisteredSolverFunctionFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass**](PageAnnotatedUnionRegisteredProjectFunctionRegisteredPythonCodeFunctionRegisteredSolverFunctionFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass.md)

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

# **map_function**
> RegisteredFunctionJobCollection map_function(function_id, request_body)

Map Function

Map function over input parameters

### Example

* Basic Authentication (HTTPBasic):

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
    api_instance = osparc_client.FunctionsApi(api_client)
    function_id = 'function_id_example' # str | 
    request_body = None # List[Optional[object]] | 

    try:
        # Map Function
        api_response = api_instance.map_function(function_id, request_body)
        print("The response of FunctionsApi->map_function:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FunctionsApi->map_function: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **function_id** | **str**|  | 
 **request_body** | [**List[Optional[object]]**](object.md)|  | 

### Return type

[**RegisteredFunctionJobCollection**](RegisteredFunctionJobCollection.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Function not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **register_function**
> ResponseRegisterFunctionV0FunctionsPost register_function(function)

Register Function

Create function

### Example


```python
import osparc_client
from osparc_client.models.function import Function
from osparc_client.models.response_register_function_v0_functions_post import ResponseRegisterFunctionV0FunctionsPost
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
    api_instance = osparc_client.FunctionsApi(api_client)
    function = osparc_client.Function() # Function | 

    try:
        # Register Function
        api_response = api_instance.register_function(function)
        print("The response of FunctionsApi->register_function:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FunctionsApi->register_function: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **function** | [**Function**](Function.md)|  | 

### Return type

[**ResponseRegisterFunctionV0FunctionsPost**](ResponseRegisterFunctionV0FunctionsPost.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Function not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **run_function**
> ResponseRunFunctionV0FunctionsFunctionIdRunPost run_function(function_id, body)

Run Function

Run function

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.response_run_function_v0_functions_function_id_run_post import ResponseRunFunctionV0FunctionsFunctionIdRunPost
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
    api_instance = osparc_client.FunctionsApi(api_client)
    function_id = 'function_id_example' # str | 
    body = None # object | 

    try:
        # Run Function
        api_response = api_instance.run_function(function_id, body)
        print("The response of FunctionsApi->run_function:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FunctionsApi->run_function: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **function_id** | **str**|  | 
 **body** | **object**|  | 

### Return type

[**ResponseRunFunctionV0FunctionsFunctionIdRunPost**](ResponseRunFunctionV0FunctionsFunctionIdRunPost.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Function not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **update_function_description**
> ResponseUpdateFunctionDescriptionV0FunctionsFunctionIdDescriptionPatch update_function_description(function_id, description)

Update Function Description

Update function

### Example


```python
import osparc_client
from osparc_client.models.response_update_function_description_v0_functions_function_id_description_patch import ResponseUpdateFunctionDescriptionV0FunctionsFunctionIdDescriptionPatch
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
    api_instance = osparc_client.FunctionsApi(api_client)
    function_id = 'function_id_example' # str | 
    description = 'description_example' # str | 

    try:
        # Update Function Description
        api_response = api_instance.update_function_description(function_id, description)
        print("The response of FunctionsApi->update_function_description:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FunctionsApi->update_function_description: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **function_id** | **str**|  | 
 **description** | **str**|  | 

### Return type

[**ResponseUpdateFunctionDescriptionV0FunctionsFunctionIdDescriptionPatch**](ResponseUpdateFunctionDescriptionV0FunctionsFunctionIdDescriptionPatch.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Function not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **update_function_title**
> ResponseUpdateFunctionTitleV0FunctionsFunctionIdTitlePatch update_function_title(function_id, title)

Update Function Title

Update function

### Example


```python
import osparc_client
from osparc_client.models.response_update_function_title_v0_functions_function_id_title_patch import ResponseUpdateFunctionTitleV0FunctionsFunctionIdTitlePatch
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
    api_instance = osparc_client.FunctionsApi(api_client)
    function_id = 'function_id_example' # str | 
    title = 'title_example' # str | 

    try:
        # Update Function Title
        api_response = api_instance.update_function_title(function_id, title)
        print("The response of FunctionsApi->update_function_title:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FunctionsApi->update_function_title: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **function_id** | **str**|  | 
 **title** | **str**|  | 

### Return type

[**ResponseUpdateFunctionTitleV0FunctionsFunctionIdTitlePatch**](ResponseUpdateFunctionTitleV0FunctionsFunctionIdTitlePatch.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Function not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **validate_function_inputs**
> List[object] validate_function_inputs(function_id, body)

Validate Function Inputs

Validate inputs against the function's input schema

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
    api_instance = osparc_client.FunctionsApi(api_client)
    function_id = 'function_id_example' # str | 
    body = None # object | 

    try:
        # Validate Function Inputs
        api_response = api_instance.validate_function_inputs(function_id, body)
        print("The response of FunctionsApi->validate_function_inputs:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FunctionsApi->validate_function_inputs: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **function_id** | **str**|  | 
 **body** | **object**|  | 

### Return type

**List[object]**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**400** | Invalid inputs |  -  |
**404** | Function not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

