# .FilesApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**abortMultipartUpload**](FilesApi.md#abortMultipartUpload) | **POST** /v0/files/{file_id}:abort | Abort Multipart Upload
[**completeMultipartUpload**](FilesApi.md#completeMultipartUpload) | **POST** /v0/files/{file_id}:complete | Complete Multipart Upload
[**deleteFile**](FilesApi.md#deleteFile) | **DELETE** /v0/files/{file_id} | Delete File
[**downloadFile**](FilesApi.md#downloadFile) | **GET** /v0/files/{file_id}/content | Download File
[**getFile**](FilesApi.md#getFile) | **GET** /v0/files/{file_id} | Get File
[**getFilesPage**](FilesApi.md#getFilesPage) | **GET** /v0/files/page | Get Files Page
[**getUploadLinks**](FilesApi.md#getUploadLinks) | **POST** /v0/files/content | Get Upload Links
[**listFiles**](FilesApi.md#listFiles) | **GET** /v0/files | List Files
[**searchFilesPage**](FilesApi.md#searchFilesPage) | **GET** /v0/files:search | Search Files Page
[**uploadFile**](FilesApi.md#uploadFile) | **PUT** /v0/files/content | Upload File


# **abortMultipartUpload**
> any abortMultipartUpload(bodyAbortMultipartUploadV0FilesFileIdAbortPost)


### Example


```typescript
import { createConfiguration, FilesApi } from '';
import type { FilesApiAbortMultipartUploadRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FilesApi(configuration);

const request: FilesApiAbortMultipartUploadRequest = {
  
  fileId: "file_id_example",
  
  bodyAbortMultipartUploadV0FilesFileIdAbortPost: {
    clientFile: null,
  },
};

const data = await apiInstance.abortMultipartUpload(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **bodyAbortMultipartUploadV0FilesFileIdAbortPost** | **BodyAbortMultipartUploadV0FilesFileIdAbortPost**|  |
 **fileId** | [**string**] |  | defaults to undefined


### Return type

**any**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

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

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **completeMultipartUpload**
> any completeMultipartUpload(bodyCompleteMultipartUploadV0FilesFileIdCompletePost)


### Example


```typescript
import { createConfiguration, FilesApi } from '';
import type { FilesApiCompleteMultipartUploadRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FilesApi(configuration);

const request: FilesApiCompleteMultipartUploadRequest = {
  
  fileId: "file_id_example",
  
  bodyCompleteMultipartUploadV0FilesFileIdCompletePost: {
    clientFile: null,
    uploadedParts: {
      parts: [
        {
          number: 0,
          eTag: "eTag_example",
        },
      ],
    },
  },
};

const data = await apiInstance.completeMultipartUpload(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **bodyCompleteMultipartUploadV0FilesFileIdCompletePost** | **BodyCompleteMultipartUploadV0FilesFileIdCompletePost**|  |
 **fileId** | [**string**] |  | defaults to undefined


### Return type

**any**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

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

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **deleteFile**
> any deleteFile()


### Example


```typescript
import { createConfiguration, FilesApi } from '';
import type { FilesApiDeleteFileRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FilesApi(configuration);

const request: FilesApiDeleteFileRequest = {
  
  fileId: "file_id_example",
};

const data = await apiInstance.deleteFile(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **fileId** | [**string**] |  | defaults to undefined


### Return type

**any**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

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

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **downloadFile**
> HttpFile downloadFile()


### Example


```typescript
import { createConfiguration, FilesApi } from '';
import type { FilesApiDownloadFileRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FilesApi(configuration);

const request: FilesApiDownloadFileRequest = {
  
  fileId: "file_id_example",
};

const data = await apiInstance.downloadFile(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **fileId** | [**string**] |  | defaults to undefined


### Return type

**HttpFile**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

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

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getFile**
> any getFile()

Gets metadata for a given file resource

### Example


```typescript
import { createConfiguration, FilesApi } from '';
import type { FilesApiGetFileRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FilesApi(configuration);

const request: FilesApiGetFileRequest = {
  
  fileId: "file_id_example",
};

const data = await apiInstance.getFile(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **fileId** | [**string**] |  | defaults to undefined


### Return type

**any**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

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

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getFilesPage**
> getFilesPage()


### Example


```typescript
import { createConfiguration, FilesApi } from '';
import type { FilesApiGetFilesPageRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FilesApi(configuration);

const request: FilesApiGetFilesPageRequest = {
    // Page size limit (optional)
  limit: 20,
    // Page offset (optional)
  offset: 0,
};

const data = await apiInstance.getFilesPage(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | [**number**] | Page size limit | (optional) defaults to 20
 **offset** | [**number**] | Page offset | (optional) defaults to 0


### Return type

void (empty response body)

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**501** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getUploadLinks**
> ClientFileUploadData getUploadLinks(clientFile)

Get upload links for uploading a file to storage

### Example


```typescript
import { createConfiguration, FilesApi } from '';
import type { FilesApiGetUploadLinksRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FilesApi(configuration);

const request: FilesApiGetUploadLinksRequest = {
  
  clientFile: null,
};

const data = await apiInstance.getUploadLinks(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **clientFile** | **ClientFile**|  |


### Return type

**ClientFileUploadData**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

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

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **listFiles**
> Array<any> listFiles()

🚨 **Deprecated**: This endpoint is deprecated and will be removed in a future release. Please use `GET /v0/files/page` instead.    Lists all files stored in the system  Added in *version 0.5*:   Removed in *version 0.7*: This endpoint is deprecated and will be removed in a future version

### Example


```typescript
import { createConfiguration, FilesApi } from '';

const configuration = createConfiguration();
const apiInstance = new FilesApi(configuration);

const request = {};

const data = await apiInstance.listFiles(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters
This endpoint does not need any parameter.


### Return type

**Array<any>**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

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

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **searchFilesPage**
> PageFile searchFilesPage()

Search files

### Example


```typescript
import { createConfiguration, FilesApi } from '';
import type { FilesApiSearchFilesPageRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FilesApi(configuration);

const request: FilesApiSearchFilesPageRequest = {
  
  sha256Checksum: "62ECB020842930cc01FFCCfeEe150AC32DcAEc8a83DDD7dBF7567C88195ffcea",
  
  fileId: "file_id_example",
    // Page size limit (optional)
  limit: 20,
    // Page offset (optional)
  offset: 0,
};

const data = await apiInstance.searchFilesPage(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **sha256Checksum** | [**string**] |  | (optional) defaults to undefined
 **fileId** | [**string**] |  | (optional) defaults to undefined
 **limit** | [**number**] | Page size limit | (optional) defaults to 20
 **offset** | [**number**] | Page offset | (optional) defaults to 0


### Return type

**PageFile**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

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

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **uploadFile**
> any uploadFile()

Uploads a single file to the system

### Example


```typescript
import { createConfiguration, FilesApi } from '';
import type { FilesApiUploadFileRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FilesApi(configuration);

const request: FilesApiUploadFileRequest = {
  
  file: { data: Buffer.from(fs.readFileSync('/path/to/file', 'utf-8')), name: '/path/to/file' },
  
  contentLength: "content-length_example",
};

const data = await apiInstance.uploadFile(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **file** | [**HttpFile**] |  | defaults to undefined
 **contentLength** | [**string**] |  | (optional) defaults to undefined


### Return type

**any**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

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

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)


