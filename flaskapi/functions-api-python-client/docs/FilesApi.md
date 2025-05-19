# osparc_client.FilesApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**abort_multipart_upload**](FilesApi.md#abort_multipart_upload) | **POST** /v0/files/{file_id}:abort | Abort Multipart Upload
[**complete_multipart_upload**](FilesApi.md#complete_multipart_upload) | **POST** /v0/files/{file_id}:complete | Complete Multipart Upload
[**delete_file**](FilesApi.md#delete_file) | **DELETE** /v0/files/{file_id} | Delete File
[**download_file**](FilesApi.md#download_file) | **GET** /v0/files/{file_id}/content | Download File
[**get_file**](FilesApi.md#get_file) | **GET** /v0/files/{file_id} | Get File
[**get_files_page**](FilesApi.md#get_files_page) | **GET** /v0/files/page | Get Files Page
[**get_upload_links**](FilesApi.md#get_upload_links) | **POST** /v0/files/content | Get Upload Links
[**list_files**](FilesApi.md#list_files) | **GET** /v0/files | List Files
[**search_files_page**](FilesApi.md#search_files_page) | **GET** /v0/files:search | Search Files Page
[**upload_file**](FilesApi.md#upload_file) | **PUT** /v0/files/content | Upload File


# **abort_multipart_upload**
> object abort_multipart_upload(file_id, body_abort_multipart_upload_v0_files_file_id_abort_post)

Abort Multipart Upload

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.body_abort_multipart_upload_v0_files_file_id_abort_post import BodyAbortMultipartUploadV0FilesFileIdAbortPost
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
    api_instance = osparc_client.FilesApi(api_client)
    file_id = 'file_id_example' # str | 
    body_abort_multipart_upload_v0_files_file_id_abort_post = osparc_client.BodyAbortMultipartUploadV0FilesFileIdAbortPost() # BodyAbortMultipartUploadV0FilesFileIdAbortPost | 

    try:
        # Abort Multipart Upload
        api_response = api_instance.abort_multipart_upload(file_id, body_abort_multipart_upload_v0_files_file_id_abort_post)
        print("The response of FilesApi->abort_multipart_upload:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FilesApi->abort_multipart_upload: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **file_id** | **str**|  | 
 **body_abort_multipart_upload_v0_files_file_id_abort_post** | [**BodyAbortMultipartUploadV0FilesFileIdAbortPost**](BodyAbortMultipartUploadV0FilesFileIdAbortPost.md)|  | 

### Return type

**object**

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **complete_multipart_upload**
> File complete_multipart_upload(file_id, body_complete_multipart_upload_v0_files_file_id_complete_post)

Complete Multipart Upload

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.body_complete_multipart_upload_v0_files_file_id_complete_post import BodyCompleteMultipartUploadV0FilesFileIdCompletePost
from osparc_client.models.file import File
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
    api_instance = osparc_client.FilesApi(api_client)
    file_id = 'file_id_example' # str | 
    body_complete_multipart_upload_v0_files_file_id_complete_post = osparc_client.BodyCompleteMultipartUploadV0FilesFileIdCompletePost() # BodyCompleteMultipartUploadV0FilesFileIdCompletePost | 

    try:
        # Complete Multipart Upload
        api_response = api_instance.complete_multipart_upload(file_id, body_complete_multipart_upload_v0_files_file_id_complete_post)
        print("The response of FilesApi->complete_multipart_upload:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FilesApi->complete_multipart_upload: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **file_id** | **str**|  | 
 **body_complete_multipart_upload_v0_files_file_id_complete_post** | [**BodyCompleteMultipartUploadV0FilesFileIdCompletePost**](BodyCompleteMultipartUploadV0FilesFileIdCompletePost.md)|  | 

### Return type

[**File**](File.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | File not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **delete_file**
> object delete_file(file_id)

Delete File

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
    api_instance = osparc_client.FilesApi(api_client)
    file_id = 'file_id_example' # str | 

    try:
        # Delete File
        api_response = api_instance.delete_file(file_id)
        print("The response of FilesApi->delete_file:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FilesApi->delete_file: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **file_id** | **str**|  | 

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
**404** | File not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **download_file**
> bytearray download_file(file_id)

Download File

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
    api_instance = osparc_client.FilesApi(api_client)
    file_id = 'file_id_example' # str | 

    try:
        # Download File
        api_response = api_instance.download_file(file_id)
        print("The response of FilesApi->download_file:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FilesApi->download_file: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **file_id** | **str**|  | 

### Return type

**bytearray**

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/octet-stream, text/plain

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**307** | Successful Response |  -  |
**404** | File not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**200** | Returns a arbitrary binary data |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_file**
> File get_file(file_id)

Get File

Gets metadata for a given file resource

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.file import File
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
    api_instance = osparc_client.FilesApi(api_client)
    file_id = 'file_id_example' # str | 

    try:
        # Get File
        api_response = api_instance.get_file(file_id)
        print("The response of FilesApi->get_file:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FilesApi->get_file: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **file_id** | **str**|  | 

### Return type

[**File**](File.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | File not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_files_page**
> get_files_page(limit=limit, offset=offset)

Get Files Page

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
    api_instance = osparc_client.FilesApi(api_client)
    limit = 20 # int | Page size limit (optional) (default to 20)
    offset = 0 # int | Page offset (optional) (default to 0)

    try:
        # Get Files Page
        api_instance.get_files_page(limit=limit, offset=offset)
    except Exception as e:
        print("Exception when calling FilesApi->get_files_page: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **int**| Page size limit | [optional] [default to 20]
 **offset** | **int**| Page offset | [optional] [default to 0]

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
**501** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_upload_links**
> ClientFileUploadData get_upload_links(client_file)

Get Upload Links

Get upload links for uploading a file to storage

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.client_file import ClientFile
from osparc_client.models.client_file_upload_data import ClientFileUploadData
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
    api_instance = osparc_client.FilesApi(api_client)
    client_file = osparc_client.ClientFile() # ClientFile | 

    try:
        # Get Upload Links
        api_response = api_instance.get_upload_links(client_file)
        print("The response of FilesApi->get_upload_links:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FilesApi->get_upload_links: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **client_file** | [**ClientFile**](ClientFile.md)|  | 

### Return type

[**ClientFileUploadData**](ClientFileUploadData.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | File not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **list_files**
> List[File] list_files()

List Files

🚨 **Deprecated**: This endpoint is deprecated and will be removed in a future release.
Please use `GET /v0/files/page` instead.



Lists all files stored in the system

Added in *version 0.5*: 

Removed in *version 0.7*: This endpoint is deprecated and will be removed in a future version

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.file import File
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
    api_instance = osparc_client.FilesApi(api_client)

    try:
        # List Files
        api_response = api_instance.list_files()
        print("The response of FilesApi->list_files:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FilesApi->list_files: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**List[File]**](File.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | File not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **search_files_page**
> PageFile search_files_page(sha256_checksum=sha256_checksum, file_id=file_id, limit=limit, offset=offset)

Search Files Page

Search files

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.page_file import PageFile
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
    api_instance = osparc_client.FilesApi(api_client)
    sha256_checksum = 'sha256_checksum_example' # str |  (optional)
    file_id = 'file_id_example' # str |  (optional)
    limit = 20 # int | Page size limit (optional) (default to 20)
    offset = 0 # int | Page offset (optional) (default to 0)

    try:
        # Search Files Page
        api_response = api_instance.search_files_page(sha256_checksum=sha256_checksum, file_id=file_id, limit=limit, offset=offset)
        print("The response of FilesApi->search_files_page:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FilesApi->search_files_page: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **sha256_checksum** | **str**|  | [optional] 
 **file_id** | **str**|  | [optional] 
 **limit** | **int**| Page size limit | [optional] [default to 20]
 **offset** | **int**| Page offset | [optional] [default to 0]

### Return type

[**PageFile**](PageFile.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | File not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **upload_file**
> File upload_file(file, content_length=content_length)

Upload File

Uploads a single file to the system

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.file import File
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
    api_instance = osparc_client.FilesApi(api_client)
    file = None # bytearray | 
    content_length = 'content_length_example' # str |  (optional)

    try:
        # Upload File
        api_response = api_instance.upload_file(file, content_length=content_length)
        print("The response of FilesApi->upload_file:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FilesApi->upload_file: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **file** | **bytearray**|  | 
 **content_length** | **str**|  | [optional] 

### Return type

[**File**](File.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: multipart/form-data
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | File not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

