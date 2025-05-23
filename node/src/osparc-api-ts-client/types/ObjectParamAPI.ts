import { ResponseContext, RequestContext, HttpFile, HttpInfo } from '../http/http';
import { Configuration, ConfigurationOptions } from '../configuration'
import type { Middleware } from '../middleware';

import { BodyAbortMultipartUploadV0FilesFileIdAbortPost } from '../models/BodyAbortMultipartUploadV0FilesFileIdAbortPost';
import { BodyCompleteMultipartUploadV0FilesFileIdCompletePost } from '../models/BodyCompleteMultipartUploadV0FilesFileIdCompletePost';
import { BodyCreateProgramJobV0ProgramsProgramKeyReleasesVersionJobsPost } from '../models/BodyCreateProgramJobV0ProgramsProgramKeyReleasesVersionJobsPost';
import { ClientFile } from '../models/ClientFile';
import { ClientFileUploadData } from '../models/ClientFileUploadData';
import { ErrorGet } from '../models/ErrorGet';
import { FileUploadCompletionBody } from '../models/FileUploadCompletionBody';
import { FileUploadData } from '../models/FileUploadData';
import { Function } from '../models/Function';
import { FunctionJob } from '../models/FunctionJob';
import { FunctionJobCollection } from '../models/FunctionJobCollection';
import { FunctionJobCollectionListFunctionJobs200ResponseInner } from '../models/FunctionJobCollectionListFunctionJobs200ResponseInner';
import { FunctionJobCollectionStatus } from '../models/FunctionJobCollectionStatus';
import { FunctionJobStatus } from '../models/FunctionJobStatus';
import { GetCreditPriceLegacy } from '../models/GetCreditPriceLegacy';
import { Groups } from '../models/Groups';
import { HTTPValidationError } from '../models/HTTPValidationError';
import { JSONFunctionInputSchema } from '../models/JSONFunctionInputSchema';
import { JSONFunctionOutputSchema } from '../models/JSONFunctionOutputSchema';
import { Job } from '../models/Job';
import { JobInputs } from '../models/JobInputs';
import { JobLog } from '../models/JobLog';
import { JobLogsMap } from '../models/JobLogsMap';
import { JobMetadata } from '../models/JobMetadata';
import { JobMetadataUpdate } from '../models/JobMetadataUpdate';
import { JobOutputs } from '../models/JobOutputs';
import { JobStatus } from '../models/JobStatus';
import { LicensedItemCheckoutData } from '../models/LicensedItemCheckoutData';
import { LicensedItemCheckoutGet } from '../models/LicensedItemCheckoutGet';
import { LicensedItemGet } from '../models/LicensedItemGet';
import { LicensedResource } from '../models/LicensedResource';
import { LicensedResourceSource } from '../models/LicensedResourceSource';
import { LicensedResourceSourceFeaturesDict } from '../models/LicensedResourceSourceFeaturesDict';
import { LicensedResourceType } from '../models/LicensedResourceType';
import { Links } from '../models/Links';
import { LogLink } from '../models/LogLink';
import { Meta } from '../models/Meta';
import { MetadataValue } from '../models/MetadataValue';
import { ModelFile } from '../models/ModelFile';
import { OnePageSolverPort } from '../models/OnePageSolverPort';
import { OnePageStudyPort } from '../models/OnePageStudyPort';
import { PageAnnotatedUnionRegisteredProjectFunctionJobRegisteredPythonCodeFunctionJobRegisteredSolverFunctionJobFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass } from '../models/PageAnnotatedUnionRegisteredProjectFunctionJobRegisteredPythonCodeFunctionJobRegisteredSolverFunctionJobFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass';
import { PageAnnotatedUnionRegisteredProjectFunctionRegisteredPythonCodeFunctionRegisteredSolverFunctionFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass } from '../models/PageAnnotatedUnionRegisteredProjectFunctionRegisteredPythonCodeFunctionRegisteredSolverFunctionFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass';
import { PageAnnotatedUnionRegisteredProjectFunctionRegisteredPythonCodeFunctionRegisteredSolverFunctionFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClassItemsInner } from '../models/PageAnnotatedUnionRegisteredProjectFunctionRegisteredPythonCodeFunctionRegisteredSolverFunctionFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClassItemsInner';
import { PageFile } from '../models/PageFile';
import { PageJob } from '../models/PageJob';
import { PageLicensedItemGet } from '../models/PageLicensedItemGet';
import { PageRegisteredFunctionJobCollection } from '../models/PageRegisteredFunctionJobCollection';
import { PageStudy } from '../models/PageStudy';
import { PricingPlanClassification } from '../models/PricingPlanClassification';
import { PricingUnitGetLegacy } from '../models/PricingUnitGetLegacy';
import { Profile } from '../models/Profile';
import { ProfileUpdate } from '../models/ProfileUpdate';
import { Program } from '../models/Program';
import { ProjectFunction } from '../models/ProjectFunction';
import { ProjectFunctionJob } from '../models/ProjectFunctionJob';
import { PythonCodeFunction } from '../models/PythonCodeFunction';
import { PythonCodeFunctionJob } from '../models/PythonCodeFunctionJob';
import { RegisteredFunctionJobCollection } from '../models/RegisteredFunctionJobCollection';
import { RegisteredProjectFunction } from '../models/RegisteredProjectFunction';
import { RegisteredProjectFunctionJob } from '../models/RegisteredProjectFunctionJob';
import { RegisteredPythonCodeFunction } from '../models/RegisteredPythonCodeFunction';
import { RegisteredPythonCodeFunctionJob } from '../models/RegisteredPythonCodeFunctionJob';
import { RegisteredSolverFunction } from '../models/RegisteredSolverFunction';
import { RegisteredSolverFunctionJob } from '../models/RegisteredSolverFunctionJob';
import { Response200GetLogStreamV0SolversSolverKeyReleasesVersionJobsJobIdLogstreamGet } from '../models/Response200GetLogStreamV0SolversSolverKeyReleasesVersionJobsJobIdLogstreamGet';
import { ResponseGetFunctionJobV0FunctionJobsFunctionJobIdGet } from '../models/ResponseGetFunctionJobV0FunctionJobsFunctionJobIdGet';
import { ResponseGetFunctionV0FunctionsFunctionIdGet } from '../models/ResponseGetFunctionV0FunctionsFunctionIdGet';
import { ResponseRegisterFunctionJobV0FunctionJobsPost } from '../models/ResponseRegisterFunctionJobV0FunctionJobsPost';
import { ResponseRegisterFunctionV0FunctionsPost } from '../models/ResponseRegisterFunctionV0FunctionsPost';
import { ResponseRunFunctionV0FunctionsFunctionIdRunPost } from '../models/ResponseRunFunctionV0FunctionsFunctionIdRunPost';
import { ResponseUpdateFunctionDescriptionV0FunctionsFunctionIdDescriptionPatch } from '../models/ResponseUpdateFunctionDescriptionV0FunctionsFunctionIdDescriptionPatch';
import { ResponseUpdateFunctionTitleV0FunctionsFunctionIdTitlePatch } from '../models/ResponseUpdateFunctionTitleV0FunctionsFunctionIdTitlePatch';
import { RunningState } from '../models/RunningState';
import { ServicePricingPlanGetLegacy } from '../models/ServicePricingPlanGetLegacy';
import { Solver } from '../models/Solver';
import { SolverFunction } from '../models/SolverFunction';
import { SolverFunctionJob } from '../models/SolverFunctionJob';
import { SolverPort } from '../models/SolverPort';
import { Study } from '../models/Study';
import { StudyPort } from '../models/StudyPort';
import { UnitExtraInfoTier } from '../models/UnitExtraInfoTier';
import { UploadLinks } from '../models/UploadLinks';
import { UploadedPart } from '../models/UploadedPart';
import { UserFile } from '../models/UserFile';
import { UserFileToProgramJob } from '../models/UserFileToProgramJob';
import { UserRoleEnum } from '../models/UserRoleEnum';
import { UsersGroup } from '../models/UsersGroup';
import { ValidationError } from '../models/ValidationError';
import { ValidationErrorLocInner } from '../models/ValidationErrorLocInner';
import { ValuesValue } from '../models/ValuesValue';
import { WalletGetWithAvailableCreditsLegacy } from '../models/WalletGetWithAvailableCreditsLegacy';
import { WalletStatus } from '../models/WalletStatus';

import { ObservableCreditsApi } from "./ObservableAPI";
import { CreditsApiRequestFactory, CreditsApiResponseProcessor} from "../apis/CreditsApi";

export interface CreditsApiGetCreditsPriceRequest {
}

export class ObjectCreditsApi {
    private api: ObservableCreditsApi

    public constructor(configuration: Configuration, requestFactory?: CreditsApiRequestFactory, responseProcessor?: CreditsApiResponseProcessor) {
        this.api = new ObservableCreditsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * New in *version 0.6*
     * Get Credits Price
     * @param param the request object
     */
    public getCreditsPriceWithHttpInfo(param: CreditsApiGetCreditsPriceRequest = {}, options?: ConfigurationOptions): Promise<HttpInfo<GetCreditPriceLegacy>> {
        return this.api.getCreditsPriceWithHttpInfo( options).toPromise();
    }

    /**
     * New in *version 0.6*
     * Get Credits Price
     * @param param the request object
     */
    public getCreditsPrice(param: CreditsApiGetCreditsPriceRequest = {}, options?: ConfigurationOptions): Promise<GetCreditPriceLegacy> {
        return this.api.getCreditsPrice( options).toPromise();
    }

}

import { ObservableFilesApi } from "./ObservableAPI";
import { FilesApiRequestFactory, FilesApiResponseProcessor} from "../apis/FilesApi";

export interface FilesApiAbortMultipartUploadRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof FilesApiabortMultipartUpload
     */
    fileId: string
    /**
     * 
     * @type BodyAbortMultipartUploadV0FilesFileIdAbortPost
     * @memberof FilesApiabortMultipartUpload
     */
    bodyAbortMultipartUploadV0FilesFileIdAbortPost: BodyAbortMultipartUploadV0FilesFileIdAbortPost
}

export interface FilesApiCompleteMultipartUploadRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof FilesApicompleteMultipartUpload
     */
    fileId: string
    /**
     * 
     * @type BodyCompleteMultipartUploadV0FilesFileIdCompletePost
     * @memberof FilesApicompleteMultipartUpload
     */
    bodyCompleteMultipartUploadV0FilesFileIdCompletePost: BodyCompleteMultipartUploadV0FilesFileIdCompletePost
}

export interface FilesApiDeleteFileRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof FilesApideleteFile
     */
    fileId: string
}

export interface FilesApiDownloadFileRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof FilesApidownloadFile
     */
    fileId: string
}

export interface FilesApiGetFileRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof FilesApigetFile
     */
    fileId: string
}

export interface FilesApiGetFilesPageRequest {
    /**
     * Page size limit
     * Minimum: 1
     * Maximum: 50
     * Defaults to: 20
     * @type number
     * @memberof FilesApigetFilesPage
     */
    limit?: number
    /**
     * Page offset
     * Minimum: 0
     * Defaults to: 0
     * @type number
     * @memberof FilesApigetFilesPage
     */
    offset?: number
}

export interface FilesApiGetUploadLinksRequest {
    /**
     * 
     * @type ClientFile
     * @memberof FilesApigetUploadLinks
     */
    clientFile: ClientFile
}

export interface FilesApiListFilesRequest {
}

export interface FilesApiSearchFilesPageRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof FilesApisearchFilesPage
     */
    sha256Checksum?: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof FilesApisearchFilesPage
     */
    fileId?: string
    /**
     * Page size limit
     * Minimum: 1
     * Maximum: 50
     * Defaults to: 20
     * @type number
     * @memberof FilesApisearchFilesPage
     */
    limit?: number
    /**
     * Page offset
     * Minimum: 0
     * Defaults to: 0
     * @type number
     * @memberof FilesApisearchFilesPage
     */
    offset?: number
}

export interface FilesApiUploadFileRequest {
    /**
     * 
     * Defaults to: undefined
     * @type HttpFile
     * @memberof FilesApiuploadFile
     */
    file: HttpFile
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof FilesApiuploadFile
     */
    contentLength?: string
}

export class ObjectFilesApi {
    private api: ObservableFilesApi

    public constructor(configuration: Configuration, requestFactory?: FilesApiRequestFactory, responseProcessor?: FilesApiResponseProcessor) {
        this.api = new ObservableFilesApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Abort Multipart Upload
     * @param param the request object
     */
    public abortMultipartUploadWithHttpInfo(param: FilesApiAbortMultipartUploadRequest, options?: ConfigurationOptions): Promise<HttpInfo<any>> {
        return this.api.abortMultipartUploadWithHttpInfo(param.fileId, param.bodyAbortMultipartUploadV0FilesFileIdAbortPost,  options).toPromise();
    }

    /**
     * Abort Multipart Upload
     * @param param the request object
     */
    public abortMultipartUpload(param: FilesApiAbortMultipartUploadRequest, options?: ConfigurationOptions): Promise<any> {
        return this.api.abortMultipartUpload(param.fileId, param.bodyAbortMultipartUploadV0FilesFileIdAbortPost,  options).toPromise();
    }

    /**
     * Complete Multipart Upload
     * @param param the request object
     */
    public completeMultipartUploadWithHttpInfo(param: FilesApiCompleteMultipartUploadRequest, options?: ConfigurationOptions): Promise<HttpInfo<any>> {
        return this.api.completeMultipartUploadWithHttpInfo(param.fileId, param.bodyCompleteMultipartUploadV0FilesFileIdCompletePost,  options).toPromise();
    }

    /**
     * Complete Multipart Upload
     * @param param the request object
     */
    public completeMultipartUpload(param: FilesApiCompleteMultipartUploadRequest, options?: ConfigurationOptions): Promise<any> {
        return this.api.completeMultipartUpload(param.fileId, param.bodyCompleteMultipartUploadV0FilesFileIdCompletePost,  options).toPromise();
    }

    /**
     * Delete File
     * @param param the request object
     */
    public deleteFileWithHttpInfo(param: FilesApiDeleteFileRequest, options?: ConfigurationOptions): Promise<HttpInfo<any>> {
        return this.api.deleteFileWithHttpInfo(param.fileId,  options).toPromise();
    }

    /**
     * Delete File
     * @param param the request object
     */
    public deleteFile(param: FilesApiDeleteFileRequest, options?: ConfigurationOptions): Promise<any> {
        return this.api.deleteFile(param.fileId,  options).toPromise();
    }

    /**
     * Download File
     * @param param the request object
     */
    public downloadFileWithHttpInfo(param: FilesApiDownloadFileRequest, options?: ConfigurationOptions): Promise<HttpInfo<HttpFile>> {
        return this.api.downloadFileWithHttpInfo(param.fileId,  options).toPromise();
    }

    /**
     * Download File
     * @param param the request object
     */
    public downloadFile(param: FilesApiDownloadFileRequest, options?: ConfigurationOptions): Promise<HttpFile> {
        return this.api.downloadFile(param.fileId,  options).toPromise();
    }

    /**
     * Gets metadata for a given file resource
     * Get File
     * @param param the request object
     */
    public getFileWithHttpInfo(param: FilesApiGetFileRequest, options?: ConfigurationOptions): Promise<HttpInfo<any>> {
        return this.api.getFileWithHttpInfo(param.fileId,  options).toPromise();
    }

    /**
     * Gets metadata for a given file resource
     * Get File
     * @param param the request object
     */
    public getFile(param: FilesApiGetFileRequest, options?: ConfigurationOptions): Promise<any> {
        return this.api.getFile(param.fileId,  options).toPromise();
    }

    /**
     * Get Files Page
     * @param param the request object
     */
    public getFilesPageWithHttpInfo(param: FilesApiGetFilesPageRequest = {}, options?: ConfigurationOptions): Promise<HttpInfo<void>> {
        return this.api.getFilesPageWithHttpInfo(param.limit, param.offset,  options).toPromise();
    }

    /**
     * Get Files Page
     * @param param the request object
     */
    public getFilesPage(param: FilesApiGetFilesPageRequest = {}, options?: ConfigurationOptions): Promise<void> {
        return this.api.getFilesPage(param.limit, param.offset,  options).toPromise();
    }

    /**
     * Get upload links for uploading a file to storage
     * Get Upload Links
     * @param param the request object
     */
    public getUploadLinksWithHttpInfo(param: FilesApiGetUploadLinksRequest, options?: ConfigurationOptions): Promise<HttpInfo<ClientFileUploadData>> {
        return this.api.getUploadLinksWithHttpInfo(param.clientFile,  options).toPromise();
    }

    /**
     * Get upload links for uploading a file to storage
     * Get Upload Links
     * @param param the request object
     */
    public getUploadLinks(param: FilesApiGetUploadLinksRequest, options?: ConfigurationOptions): Promise<ClientFileUploadData> {
        return this.api.getUploadLinks(param.clientFile,  options).toPromise();
    }

    /**
     * 🚨 **Deprecated**: This endpoint is deprecated and will be removed in a future release. Please use `GET /v0/files/page` instead.    Lists all files stored in the system  Added in *version 0.5*:   Removed in *version 0.7*: This endpoint is deprecated and will be removed in a future version
     * List Files
     * @param param the request object
     */
    public listFilesWithHttpInfo(param: FilesApiListFilesRequest = {}, options?: ConfigurationOptions): Promise<HttpInfo<Array<any>>> {
        return this.api.listFilesWithHttpInfo( options).toPromise();
    }

    /**
     * 🚨 **Deprecated**: This endpoint is deprecated and will be removed in a future release. Please use `GET /v0/files/page` instead.    Lists all files stored in the system  Added in *version 0.5*:   Removed in *version 0.7*: This endpoint is deprecated and will be removed in a future version
     * List Files
     * @param param the request object
     */
    public listFiles(param: FilesApiListFilesRequest = {}, options?: ConfigurationOptions): Promise<Array<any>> {
        return this.api.listFiles( options).toPromise();
    }

    /**
     * Search files
     * Search Files Page
     * @param param the request object
     */
    public searchFilesPageWithHttpInfo(param: FilesApiSearchFilesPageRequest = {}, options?: ConfigurationOptions): Promise<HttpInfo<PageFile>> {
        return this.api.searchFilesPageWithHttpInfo(param.sha256Checksum, param.fileId, param.limit, param.offset,  options).toPromise();
    }

    /**
     * Search files
     * Search Files Page
     * @param param the request object
     */
    public searchFilesPage(param: FilesApiSearchFilesPageRequest = {}, options?: ConfigurationOptions): Promise<PageFile> {
        return this.api.searchFilesPage(param.sha256Checksum, param.fileId, param.limit, param.offset,  options).toPromise();
    }

    /**
     * Uploads a single file to the system
     * Upload File
     * @param param the request object
     */
    public uploadFileWithHttpInfo(param: FilesApiUploadFileRequest, options?: ConfigurationOptions): Promise<HttpInfo<any>> {
        return this.api.uploadFileWithHttpInfo(param.file, param.contentLength,  options).toPromise();
    }

    /**
     * Uploads a single file to the system
     * Upload File
     * @param param the request object
     */
    public uploadFile(param: FilesApiUploadFileRequest, options?: ConfigurationOptions): Promise<any> {
        return this.api.uploadFile(param.file, param.contentLength,  options).toPromise();
    }

}

import { ObservableFunctionJobCollectionsApi } from "./ObservableAPI";
import { FunctionJobCollectionsApiRequestFactory, FunctionJobCollectionsApiResponseProcessor} from "../apis/FunctionJobCollectionsApi";

export interface FunctionJobCollectionsApiDeleteFunctionJobCollectionRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof FunctionJobCollectionsApideleteFunctionJobCollection
     */
    functionJobCollectionId: string
}

export interface FunctionJobCollectionsApiFunctionJobCollectionListFunctionJobsRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof FunctionJobCollectionsApifunctionJobCollectionListFunctionJobs
     */
    functionJobCollectionId: string
}

export interface FunctionJobCollectionsApiFunctionJobCollectionStatusRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof FunctionJobCollectionsApifunctionJobCollectionStatus
     */
    functionJobCollectionId: string
}

export interface FunctionJobCollectionsApiGetFunctionJobCollectionRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof FunctionJobCollectionsApigetFunctionJobCollection
     */
    functionJobCollectionId: string
}

export interface FunctionJobCollectionsApiListFunctionJobCollectionsRequest {
    /**
     * Page size limit
     * Minimum: 1
     * Maximum: 50
     * Defaults to: 20
     * @type number
     * @memberof FunctionJobCollectionsApilistFunctionJobCollections
     */
    limit?: number
    /**
     * Page offset
     * Minimum: 0
     * Defaults to: 0
     * @type number
     * @memberof FunctionJobCollectionsApilistFunctionJobCollections
     */
    offset?: number
}

export interface FunctionJobCollectionsApiRegisterFunctionJobCollectionRequest {
    /**
     * 
     * @type FunctionJobCollection
     * @memberof FunctionJobCollectionsApiregisterFunctionJobCollection
     */
    functionJobCollection: FunctionJobCollection
}

export class ObjectFunctionJobCollectionsApi {
    private api: ObservableFunctionJobCollectionsApi

    public constructor(configuration: Configuration, requestFactory?: FunctionJobCollectionsApiRequestFactory, responseProcessor?: FunctionJobCollectionsApiResponseProcessor) {
        this.api = new ObservableFunctionJobCollectionsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Delete function job collection  New in *version 0.8.0*
     * Delete Function Job Collection
     * @param param the request object
     */
    public deleteFunctionJobCollectionWithHttpInfo(param: FunctionJobCollectionsApiDeleteFunctionJobCollectionRequest, options?: ConfigurationOptions): Promise<HttpInfo<any>> {
        return this.api.deleteFunctionJobCollectionWithHttpInfo(param.functionJobCollectionId,  options).toPromise();
    }

    /**
     * Delete function job collection  New in *version 0.8.0*
     * Delete Function Job Collection
     * @param param the request object
     */
    public deleteFunctionJobCollection(param: FunctionJobCollectionsApiDeleteFunctionJobCollectionRequest, options?: ConfigurationOptions): Promise<any> {
        return this.api.deleteFunctionJobCollection(param.functionJobCollectionId,  options).toPromise();
    }

    /**
     * Get the function jobs in function job collection  New in *version 0.8.0*
     * Function Job Collection List Function Jobs
     * @param param the request object
     */
    public functionJobCollectionListFunctionJobsWithHttpInfo(param: FunctionJobCollectionsApiFunctionJobCollectionListFunctionJobsRequest, options?: ConfigurationOptions): Promise<HttpInfo<Array<FunctionJobCollectionListFunctionJobs200ResponseInner>>> {
        return this.api.functionJobCollectionListFunctionJobsWithHttpInfo(param.functionJobCollectionId,  options).toPromise();
    }

    /**
     * Get the function jobs in function job collection  New in *version 0.8.0*
     * Function Job Collection List Function Jobs
     * @param param the request object
     */
    public functionJobCollectionListFunctionJobs(param: FunctionJobCollectionsApiFunctionJobCollectionListFunctionJobsRequest, options?: ConfigurationOptions): Promise<Array<FunctionJobCollectionListFunctionJobs200ResponseInner>> {
        return this.api.functionJobCollectionListFunctionJobs(param.functionJobCollectionId,  options).toPromise();
    }

    /**
     * Get function job collection status  New in *version 0.8.0*
     * Function Job Collection Status
     * @param param the request object
     */
    public functionJobCollectionStatusWithHttpInfo(param: FunctionJobCollectionsApiFunctionJobCollectionStatusRequest, options?: ConfigurationOptions): Promise<HttpInfo<FunctionJobCollectionStatus>> {
        return this.api.functionJobCollectionStatusWithHttpInfo(param.functionJobCollectionId,  options).toPromise();
    }

    /**
     * Get function job collection status  New in *version 0.8.0*
     * Function Job Collection Status
     * @param param the request object
     */
    public functionJobCollectionStatus(param: FunctionJobCollectionsApiFunctionJobCollectionStatusRequest, options?: ConfigurationOptions): Promise<FunctionJobCollectionStatus> {
        return this.api.functionJobCollectionStatus(param.functionJobCollectionId,  options).toPromise();
    }

    /**
     * Get function job collection  New in *version 0.8.0*
     * Get Function Job Collection
     * @param param the request object
     */
    public getFunctionJobCollectionWithHttpInfo(param: FunctionJobCollectionsApiGetFunctionJobCollectionRequest, options?: ConfigurationOptions): Promise<HttpInfo<RegisteredFunctionJobCollection>> {
        return this.api.getFunctionJobCollectionWithHttpInfo(param.functionJobCollectionId,  options).toPromise();
    }

    /**
     * Get function job collection  New in *version 0.8.0*
     * Get Function Job Collection
     * @param param the request object
     */
    public getFunctionJobCollection(param: FunctionJobCollectionsApiGetFunctionJobCollectionRequest, options?: ConfigurationOptions): Promise<RegisteredFunctionJobCollection> {
        return this.api.getFunctionJobCollection(param.functionJobCollectionId,  options).toPromise();
    }

    /**
     * List function job collections  New in *version 0.8.0*
     * List Function Job Collections
     * @param param the request object
     */
    public listFunctionJobCollectionsWithHttpInfo(param: FunctionJobCollectionsApiListFunctionJobCollectionsRequest = {}, options?: ConfigurationOptions): Promise<HttpInfo<PageRegisteredFunctionJobCollection>> {
        return this.api.listFunctionJobCollectionsWithHttpInfo(param.limit, param.offset,  options).toPromise();
    }

    /**
     * List function job collections  New in *version 0.8.0*
     * List Function Job Collections
     * @param param the request object
     */
    public listFunctionJobCollections(param: FunctionJobCollectionsApiListFunctionJobCollectionsRequest = {}, options?: ConfigurationOptions): Promise<PageRegisteredFunctionJobCollection> {
        return this.api.listFunctionJobCollections(param.limit, param.offset,  options).toPromise();
    }

    /**
     * Register function job collection  New in *version 0.8.0*
     * Register Function Job Collection
     * @param param the request object
     */
    public registerFunctionJobCollectionWithHttpInfo(param: FunctionJobCollectionsApiRegisterFunctionJobCollectionRequest, options?: ConfigurationOptions): Promise<HttpInfo<RegisteredFunctionJobCollection>> {
        return this.api.registerFunctionJobCollectionWithHttpInfo(param.functionJobCollection,  options).toPromise();
    }

    /**
     * Register function job collection  New in *version 0.8.0*
     * Register Function Job Collection
     * @param param the request object
     */
    public registerFunctionJobCollection(param: FunctionJobCollectionsApiRegisterFunctionJobCollectionRequest, options?: ConfigurationOptions): Promise<RegisteredFunctionJobCollection> {
        return this.api.registerFunctionJobCollection(param.functionJobCollection,  options).toPromise();
    }

}

import { ObservableFunctionJobsApi } from "./ObservableAPI";
import { FunctionJobsApiRequestFactory, FunctionJobsApiResponseProcessor} from "../apis/FunctionJobsApi";

export interface FunctionJobsApiDeleteFunctionJobRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof FunctionJobsApideleteFunctionJob
     */
    functionJobId: string
}

export interface FunctionJobsApiFunctionJobOutputsRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof FunctionJobsApifunctionJobOutputs
     */
    functionJobId: string
}

export interface FunctionJobsApiFunctionJobStatusRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof FunctionJobsApifunctionJobStatus
     */
    functionJobId: string
}

export interface FunctionJobsApiGetFunctionJobRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof FunctionJobsApigetFunctionJob
     */
    functionJobId: string
}

export interface FunctionJobsApiListFunctionJobsRequest {
    /**
     * Page size limit
     * Minimum: 1
     * Maximum: 50
     * Defaults to: 20
     * @type number
     * @memberof FunctionJobsApilistFunctionJobs
     */
    limit?: number
    /**
     * Page offset
     * Minimum: 0
     * Defaults to: 0
     * @type number
     * @memberof FunctionJobsApilistFunctionJobs
     */
    offset?: number
}

export interface FunctionJobsApiRegisterFunctionJobRequest {
    /**
     * 
     * @type FunctionJob
     * @memberof FunctionJobsApiregisterFunctionJob
     */
    functionJob: FunctionJob
}

export class ObjectFunctionJobsApi {
    private api: ObservableFunctionJobsApi

    public constructor(configuration: Configuration, requestFactory?: FunctionJobsApiRequestFactory, responseProcessor?: FunctionJobsApiResponseProcessor) {
        this.api = new ObservableFunctionJobsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Delete function job  New in *version 0.8.0*
     * Delete Function Job
     * @param param the request object
     */
    public deleteFunctionJobWithHttpInfo(param: FunctionJobsApiDeleteFunctionJobRequest, options?: ConfigurationOptions): Promise<HttpInfo<any>> {
        return this.api.deleteFunctionJobWithHttpInfo(param.functionJobId,  options).toPromise();
    }

    /**
     * Delete function job  New in *version 0.8.0*
     * Delete Function Job
     * @param param the request object
     */
    public deleteFunctionJob(param: FunctionJobsApiDeleteFunctionJobRequest, options?: ConfigurationOptions): Promise<any> {
        return this.api.deleteFunctionJob(param.functionJobId,  options).toPromise();
    }

    /**
     * Get function job outputs  New in *version 0.8.0*
     * Function Job Outputs
     * @param param the request object
     */
    public functionJobOutputsWithHttpInfo(param: FunctionJobsApiFunctionJobOutputsRequest, options?: ConfigurationOptions): Promise<HttpInfo<any>> {
        return this.api.functionJobOutputsWithHttpInfo(param.functionJobId,  options).toPromise();
    }

    /**
     * Get function job outputs  New in *version 0.8.0*
     * Function Job Outputs
     * @param param the request object
     */
    public functionJobOutputs(param: FunctionJobsApiFunctionJobOutputsRequest, options?: ConfigurationOptions): Promise<any> {
        return this.api.functionJobOutputs(param.functionJobId,  options).toPromise();
    }

    /**
     * Get function job status  New in *version 0.8.0*
     * Function Job Status
     * @param param the request object
     */
    public functionJobStatusWithHttpInfo(param: FunctionJobsApiFunctionJobStatusRequest, options?: ConfigurationOptions): Promise<HttpInfo<FunctionJobStatus>> {
        return this.api.functionJobStatusWithHttpInfo(param.functionJobId,  options).toPromise();
    }

    /**
     * Get function job status  New in *version 0.8.0*
     * Function Job Status
     * @param param the request object
     */
    public functionJobStatus(param: FunctionJobsApiFunctionJobStatusRequest, options?: ConfigurationOptions): Promise<FunctionJobStatus> {
        return this.api.functionJobStatus(param.functionJobId,  options).toPromise();
    }

    /**
     * Get function job  New in *version 0.8.0*
     * Get Function Job
     * @param param the request object
     */
    public getFunctionJobWithHttpInfo(param: FunctionJobsApiGetFunctionJobRequest, options?: ConfigurationOptions): Promise<HttpInfo<ResponseGetFunctionJobV0FunctionJobsFunctionJobIdGet>> {
        return this.api.getFunctionJobWithHttpInfo(param.functionJobId,  options).toPromise();
    }

    /**
     * Get function job  New in *version 0.8.0*
     * Get Function Job
     * @param param the request object
     */
    public getFunctionJob(param: FunctionJobsApiGetFunctionJobRequest, options?: ConfigurationOptions): Promise<ResponseGetFunctionJobV0FunctionJobsFunctionJobIdGet> {
        return this.api.getFunctionJob(param.functionJobId,  options).toPromise();
    }

    /**
     * List function jobs  New in *version 0.8.0*
     * List Function Jobs
     * @param param the request object
     */
    public listFunctionJobsWithHttpInfo(param: FunctionJobsApiListFunctionJobsRequest = {}, options?: ConfigurationOptions): Promise<HttpInfo<PageAnnotatedUnionRegisteredProjectFunctionJobRegisteredPythonCodeFunctionJobRegisteredSolverFunctionJobFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass>> {
        return this.api.listFunctionJobsWithHttpInfo(param.limit, param.offset,  options).toPromise();
    }

    /**
     * List function jobs  New in *version 0.8.0*
     * List Function Jobs
     * @param param the request object
     */
    public listFunctionJobs(param: FunctionJobsApiListFunctionJobsRequest = {}, options?: ConfigurationOptions): Promise<PageAnnotatedUnionRegisteredProjectFunctionJobRegisteredPythonCodeFunctionJobRegisteredSolverFunctionJobFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass> {
        return this.api.listFunctionJobs(param.limit, param.offset,  options).toPromise();
    }

    /**
     * Create function job  New in *version 0.8.0*
     * Register Function Job
     * @param param the request object
     */
    public registerFunctionJobWithHttpInfo(param: FunctionJobsApiRegisterFunctionJobRequest, options?: ConfigurationOptions): Promise<HttpInfo<ResponseRegisterFunctionJobV0FunctionJobsPost>> {
        return this.api.registerFunctionJobWithHttpInfo(param.functionJob,  options).toPromise();
    }

    /**
     * Create function job  New in *version 0.8.0*
     * Register Function Job
     * @param param the request object
     */
    public registerFunctionJob(param: FunctionJobsApiRegisterFunctionJobRequest, options?: ConfigurationOptions): Promise<ResponseRegisterFunctionJobV0FunctionJobsPost> {
        return this.api.registerFunctionJob(param.functionJob,  options).toPromise();
    }

}

import { ObservableFunctionsApi } from "./ObservableAPI";
import { FunctionsApiRequestFactory, FunctionsApiResponseProcessor} from "../apis/FunctionsApi";

export interface FunctionsApiDeleteFunctionRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof FunctionsApideleteFunction
     */
    functionId: string
}

export interface FunctionsApiGetFunctionRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof FunctionsApigetFunction
     */
    functionId: string
}

export interface FunctionsApiGetFunctionInputschemaRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof FunctionsApigetFunctionInputschema
     */
    functionId: string
}

export interface FunctionsApiGetFunctionOutputschemaRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof FunctionsApigetFunctionOutputschema
     */
    functionId: string
}

export interface FunctionsApiListFunctionJobsForFunctionidRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof FunctionsApilistFunctionJobsForFunctionid
     */
    functionId: string
    /**
     * Page size limit
     * Minimum: 1
     * Maximum: 50
     * Defaults to: 20
     * @type number
     * @memberof FunctionsApilistFunctionJobsForFunctionid
     */
    limit?: number
    /**
     * Page offset
     * Minimum: 0
     * Defaults to: 0
     * @type number
     * @memberof FunctionsApilistFunctionJobsForFunctionid
     */
    offset?: number
}

export interface FunctionsApiListFunctionsRequest {
    /**
     * Page size limit
     * Minimum: 1
     * Maximum: 50
     * Defaults to: 20
     * @type number
     * @memberof FunctionsApilistFunctions
     */
    limit?: number
    /**
     * Page offset
     * Minimum: 0
     * Defaults to: 0
     * @type number
     * @memberof FunctionsApilistFunctions
     */
    offset?: number
}

export interface FunctionsApiMapFunctionRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof FunctionsApimapFunction
     */
    functionId: string
    /**
     * 
     * @type Array&lt;any | null&gt;
     * @memberof FunctionsApimapFunction
     */
    requestBody: Array<any | null>
}

export interface FunctionsApiRegisterFunctionRequest {
    /**
     * 
     * @type Function
     * @memberof FunctionsApiregisterFunction
     */
    _function: Function
}

export interface FunctionsApiRunFunctionRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof FunctionsApirunFunction
     */
    functionId: string
    /**
     * 
     * @type any
     * @memberof FunctionsApirunFunction
     */
    body: any
}

export interface FunctionsApiUpdateFunctionDescriptionRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof FunctionsApiupdateFunctionDescription
     */
    functionId: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof FunctionsApiupdateFunctionDescription
     */
    description: string
}

export interface FunctionsApiUpdateFunctionTitleRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof FunctionsApiupdateFunctionTitle
     */
    functionId: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof FunctionsApiupdateFunctionTitle
     */
    title: string
}

export interface FunctionsApiValidateFunctionInputsRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof FunctionsApivalidateFunctionInputs
     */
    functionId: string
    /**
     * 
     * @type any
     * @memberof FunctionsApivalidateFunctionInputs
     */
    body: any
}

export class ObjectFunctionsApi {
    private api: ObservableFunctionsApi

    public constructor(configuration: Configuration, requestFactory?: FunctionsApiRequestFactory, responseProcessor?: FunctionsApiResponseProcessor) {
        this.api = new ObservableFunctionsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Delete function  New in *version 0.8.0*
     * Delete Function
     * @param param the request object
     */
    public deleteFunctionWithHttpInfo(param: FunctionsApiDeleteFunctionRequest, options?: ConfigurationOptions): Promise<HttpInfo<any>> {
        return this.api.deleteFunctionWithHttpInfo(param.functionId,  options).toPromise();
    }

    /**
     * Delete function  New in *version 0.8.0*
     * Delete Function
     * @param param the request object
     */
    public deleteFunction(param: FunctionsApiDeleteFunctionRequest, options?: ConfigurationOptions): Promise<any> {
        return this.api.deleteFunction(param.functionId,  options).toPromise();
    }

    /**
     * Get function  New in *version 0.8.0*
     * Get Function
     * @param param the request object
     */
    public getFunctionWithHttpInfo(param: FunctionsApiGetFunctionRequest, options?: ConfigurationOptions): Promise<HttpInfo<ResponseGetFunctionV0FunctionsFunctionIdGet>> {
        return this.api.getFunctionWithHttpInfo(param.functionId,  options).toPromise();
    }

    /**
     * Get function  New in *version 0.8.0*
     * Get Function
     * @param param the request object
     */
    public getFunction(param: FunctionsApiGetFunctionRequest, options?: ConfigurationOptions): Promise<ResponseGetFunctionV0FunctionsFunctionIdGet> {
        return this.api.getFunction(param.functionId,  options).toPromise();
    }

    /**
     * Get function input schema  New in *version 0.8.0*
     * Get Function Inputschema
     * @param param the request object
     */
    public getFunctionInputschemaWithHttpInfo(param: FunctionsApiGetFunctionInputschemaRequest, options?: ConfigurationOptions): Promise<HttpInfo<JSONFunctionInputSchema>> {
        return this.api.getFunctionInputschemaWithHttpInfo(param.functionId,  options).toPromise();
    }

    /**
     * Get function input schema  New in *version 0.8.0*
     * Get Function Inputschema
     * @param param the request object
     */
    public getFunctionInputschema(param: FunctionsApiGetFunctionInputschemaRequest, options?: ConfigurationOptions): Promise<JSONFunctionInputSchema> {
        return this.api.getFunctionInputschema(param.functionId,  options).toPromise();
    }

    /**
     * Get function output schema  New in *version 0.8.0*
     * Get Function Outputschema
     * @param param the request object
     */
    public getFunctionOutputschemaWithHttpInfo(param: FunctionsApiGetFunctionOutputschemaRequest, options?: ConfigurationOptions): Promise<HttpInfo<JSONFunctionInputSchema>> {
        return this.api.getFunctionOutputschemaWithHttpInfo(param.functionId,  options).toPromise();
    }

    /**
     * Get function output schema  New in *version 0.8.0*
     * Get Function Outputschema
     * @param param the request object
     */
    public getFunctionOutputschema(param: FunctionsApiGetFunctionOutputschemaRequest, options?: ConfigurationOptions): Promise<JSONFunctionInputSchema> {
        return this.api.getFunctionOutputschema(param.functionId,  options).toPromise();
    }

    /**
     * List function jobs for a function  New in *version 0.8.0*
     * List Function Jobs For Functionid
     * @param param the request object
     */
    public listFunctionJobsForFunctionidWithHttpInfo(param: FunctionsApiListFunctionJobsForFunctionidRequest, options?: ConfigurationOptions): Promise<HttpInfo<PageAnnotatedUnionRegisteredProjectFunctionJobRegisteredPythonCodeFunctionJobRegisteredSolverFunctionJobFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass>> {
        return this.api.listFunctionJobsForFunctionidWithHttpInfo(param.functionId, param.limit, param.offset,  options).toPromise();
    }

    /**
     * List function jobs for a function  New in *version 0.8.0*
     * List Function Jobs For Functionid
     * @param param the request object
     */
    public listFunctionJobsForFunctionid(param: FunctionsApiListFunctionJobsForFunctionidRequest, options?: ConfigurationOptions): Promise<PageAnnotatedUnionRegisteredProjectFunctionJobRegisteredPythonCodeFunctionJobRegisteredSolverFunctionJobFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass> {
        return this.api.listFunctionJobsForFunctionid(param.functionId, param.limit, param.offset,  options).toPromise();
    }

    /**
     * List functions  New in *version 0.8.0*
     * List Functions
     * @param param the request object
     */
    public listFunctionsWithHttpInfo(param: FunctionsApiListFunctionsRequest = {}, options?: ConfigurationOptions): Promise<HttpInfo<PageAnnotatedUnionRegisteredProjectFunctionRegisteredPythonCodeFunctionRegisteredSolverFunctionFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass>> {
        return this.api.listFunctionsWithHttpInfo(param.limit, param.offset,  options).toPromise();
    }

    /**
     * List functions  New in *version 0.8.0*
     * List Functions
     * @param param the request object
     */
    public listFunctions(param: FunctionsApiListFunctionsRequest = {}, options?: ConfigurationOptions): Promise<PageAnnotatedUnionRegisteredProjectFunctionRegisteredPythonCodeFunctionRegisteredSolverFunctionFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass> {
        return this.api.listFunctions(param.limit, param.offset,  options).toPromise();
    }

    /**
     * Map function over input parameters  New in *version 0.8.0*
     * Map Function
     * @param param the request object
     */
    public mapFunctionWithHttpInfo(param: FunctionsApiMapFunctionRequest, options?: ConfigurationOptions): Promise<HttpInfo<RegisteredFunctionJobCollection>> {
        return this.api.mapFunctionWithHttpInfo(param.functionId, param.requestBody,  options).toPromise();
    }

    /**
     * Map function over input parameters  New in *version 0.8.0*
     * Map Function
     * @param param the request object
     */
    public mapFunction(param: FunctionsApiMapFunctionRequest, options?: ConfigurationOptions): Promise<RegisteredFunctionJobCollection> {
        return this.api.mapFunction(param.functionId, param.requestBody,  options).toPromise();
    }

    /**
     * Create function  New in *version 0.8.0*
     * Register Function
     * @param param the request object
     */
    public registerFunctionWithHttpInfo(param: FunctionsApiRegisterFunctionRequest, options?: ConfigurationOptions): Promise<HttpInfo<ResponseRegisterFunctionV0FunctionsPost>> {
        return this.api.registerFunctionWithHttpInfo(param._function,  options).toPromise();
    }

    /**
     * Create function  New in *version 0.8.0*
     * Register Function
     * @param param the request object
     */
    public registerFunction(param: FunctionsApiRegisterFunctionRequest, options?: ConfigurationOptions): Promise<ResponseRegisterFunctionV0FunctionsPost> {
        return this.api.registerFunction(param._function,  options).toPromise();
    }

    /**
     * Run function  New in *version 0.8.0*
     * Run Function
     * @param param the request object
     */
    public runFunctionWithHttpInfo(param: FunctionsApiRunFunctionRequest, options?: ConfigurationOptions): Promise<HttpInfo<ResponseRunFunctionV0FunctionsFunctionIdRunPost>> {
        return this.api.runFunctionWithHttpInfo(param.functionId, param.body,  options).toPromise();
    }

    /**
     * Run function  New in *version 0.8.0*
     * Run Function
     * @param param the request object
     */
    public runFunction(param: FunctionsApiRunFunctionRequest, options?: ConfigurationOptions): Promise<ResponseRunFunctionV0FunctionsFunctionIdRunPost> {
        return this.api.runFunction(param.functionId, param.body,  options).toPromise();
    }

    /**
     * Update function  New in *version 0.8.0*
     * Update Function Description
     * @param param the request object
     */
    public updateFunctionDescriptionWithHttpInfo(param: FunctionsApiUpdateFunctionDescriptionRequest, options?: ConfigurationOptions): Promise<HttpInfo<ResponseUpdateFunctionDescriptionV0FunctionsFunctionIdDescriptionPatch>> {
        return this.api.updateFunctionDescriptionWithHttpInfo(param.functionId, param.description,  options).toPromise();
    }

    /**
     * Update function  New in *version 0.8.0*
     * Update Function Description
     * @param param the request object
     */
    public updateFunctionDescription(param: FunctionsApiUpdateFunctionDescriptionRequest, options?: ConfigurationOptions): Promise<ResponseUpdateFunctionDescriptionV0FunctionsFunctionIdDescriptionPatch> {
        return this.api.updateFunctionDescription(param.functionId, param.description,  options).toPromise();
    }

    /**
     * Update function  New in *version 0.8.0*
     * Update Function Title
     * @param param the request object
     */
    public updateFunctionTitleWithHttpInfo(param: FunctionsApiUpdateFunctionTitleRequest, options?: ConfigurationOptions): Promise<HttpInfo<ResponseUpdateFunctionTitleV0FunctionsFunctionIdTitlePatch>> {
        return this.api.updateFunctionTitleWithHttpInfo(param.functionId, param.title,  options).toPromise();
    }

    /**
     * Update function  New in *version 0.8.0*
     * Update Function Title
     * @param param the request object
     */
    public updateFunctionTitle(param: FunctionsApiUpdateFunctionTitleRequest, options?: ConfigurationOptions): Promise<ResponseUpdateFunctionTitleV0FunctionsFunctionIdTitlePatch> {
        return this.api.updateFunctionTitle(param.functionId, param.title,  options).toPromise();
    }

    /**
     * Validate inputs against the function\'s input schema  New in *version 0.8.0*
     * Validate Function Inputs
     * @param param the request object
     */
    public validateFunctionInputsWithHttpInfo(param: FunctionsApiValidateFunctionInputsRequest, options?: ConfigurationOptions): Promise<HttpInfo<Array<any>>> {
        return this.api.validateFunctionInputsWithHttpInfo(param.functionId, param.body,  options).toPromise();
    }

    /**
     * Validate inputs against the function\'s input schema  New in *version 0.8.0*
     * Validate Function Inputs
     * @param param the request object
     */
    public validateFunctionInputs(param: FunctionsApiValidateFunctionInputsRequest, options?: ConfigurationOptions): Promise<Array<any>> {
        return this.api.validateFunctionInputs(param.functionId, param.body,  options).toPromise();
    }

}

import { ObservableLicensedItemsApi } from "./ObservableAPI";
import { LicensedItemsApiRequestFactory, LicensedItemsApiResponseProcessor} from "../apis/LicensedItemsApi";

export interface LicensedItemsApiGetLicensedItemsRequest {
    /**
     * Page size limit
     * Minimum: 1
     * Maximum: 50
     * Defaults to: 20
     * @type number
     * @memberof LicensedItemsApigetLicensedItems
     */
    limit?: number
    /**
     * Page offset
     * Minimum: 0
     * Defaults to: 0
     * @type number
     * @memberof LicensedItemsApigetLicensedItems
     */
    offset?: number
}

export interface LicensedItemsApiReleaseLicensedItemRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof LicensedItemsApireleaseLicensedItem
     */
    licensedItemId: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof LicensedItemsApireleaseLicensedItem
     */
    licensedItemCheckoutId: string
}

export class ObjectLicensedItemsApi {
    private api: ObservableLicensedItemsApi

    public constructor(configuration: Configuration, requestFactory?: LicensedItemsApiRequestFactory, responseProcessor?: LicensedItemsApiResponseProcessor) {
        this.api = new ObservableLicensedItemsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get all licensed items
     * Get Licensed Items
     * @param param the request object
     */
    public getLicensedItemsWithHttpInfo(param: LicensedItemsApiGetLicensedItemsRequest = {}, options?: ConfigurationOptions): Promise<HttpInfo<PageLicensedItemGet>> {
        return this.api.getLicensedItemsWithHttpInfo(param.limit, param.offset,  options).toPromise();
    }

    /**
     * Get all licensed items
     * Get Licensed Items
     * @param param the request object
     */
    public getLicensedItems(param: LicensedItemsApiGetLicensedItemsRequest = {}, options?: ConfigurationOptions): Promise<PageLicensedItemGet> {
        return this.api.getLicensedItems(param.limit, param.offset,  options).toPromise();
    }

    /**
     * Release previously checked out licensed item
     * Release Licensed Item
     * @param param the request object
     */
    public releaseLicensedItemWithHttpInfo(param: LicensedItemsApiReleaseLicensedItemRequest, options?: ConfigurationOptions): Promise<HttpInfo<LicensedItemCheckoutGet>> {
        return this.api.releaseLicensedItemWithHttpInfo(param.licensedItemId, param.licensedItemCheckoutId,  options).toPromise();
    }

    /**
     * Release previously checked out licensed item
     * Release Licensed Item
     * @param param the request object
     */
    public releaseLicensedItem(param: LicensedItemsApiReleaseLicensedItemRequest, options?: ConfigurationOptions): Promise<LicensedItemCheckoutGet> {
        return this.api.releaseLicensedItem(param.licensedItemId, param.licensedItemCheckoutId,  options).toPromise();
    }

}

import { ObservableMetaApi } from "./ObservableAPI";
import { MetaApiRequestFactory, MetaApiResponseProcessor} from "../apis/MetaApi";

export interface MetaApiGetServiceMetadataRequest {
}

export class ObjectMetaApi {
    private api: ObservableMetaApi

    public constructor(configuration: Configuration, requestFactory?: MetaApiRequestFactory, responseProcessor?: MetaApiResponseProcessor) {
        this.api = new ObservableMetaApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get Service Metadata
     * @param param the request object
     */
    public getServiceMetadataWithHttpInfo(param: MetaApiGetServiceMetadataRequest = {}, options?: ConfigurationOptions): Promise<HttpInfo<Meta>> {
        return this.api.getServiceMetadataWithHttpInfo( options).toPromise();
    }

    /**
     * Get Service Metadata
     * @param param the request object
     */
    public getServiceMetadata(param: MetaApiGetServiceMetadataRequest = {}, options?: ConfigurationOptions): Promise<Meta> {
        return this.api.getServiceMetadata( options).toPromise();
    }

}

import { ObservableProgramsApi } from "./ObservableAPI";
import { ProgramsApiRequestFactory, ProgramsApiResponseProcessor} from "../apis/ProgramsApi";

export interface ProgramsApiCreateProgramJobRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof ProgramsApicreateProgramJob
     */
    programKey: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof ProgramsApicreateProgramJob
     */
    version: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof ProgramsApicreateProgramJob
     */
    xSimcoreParentProjectUuid?: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof ProgramsApicreateProgramJob
     */
    xSimcoreParentNodeId?: string
    /**
     * 
     * @type BodyCreateProgramJobV0ProgramsProgramKeyReleasesVersionJobsPost
     * @memberof ProgramsApicreateProgramJob
     */
    bodyCreateProgramJobV0ProgramsProgramKeyReleasesVersionJobsPost?: BodyCreateProgramJobV0ProgramsProgramKeyReleasesVersionJobsPost
}

export interface ProgramsApiGetProgramReleaseRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof ProgramsApigetProgramRelease
     */
    programKey: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof ProgramsApigetProgramRelease
     */
    version: string
}

export class ObjectProgramsApi {
    private api: ObservableProgramsApi

    public constructor(configuration: Configuration, requestFactory?: ProgramsApiRequestFactory, responseProcessor?: ProgramsApiResponseProcessor) {
        this.api = new ObservableProgramsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Creates a program job
     * Create Program Job
     * @param param the request object
     */
    public createProgramJobWithHttpInfo(param: ProgramsApiCreateProgramJobRequest, options?: ConfigurationOptions): Promise<HttpInfo<Job>> {
        return this.api.createProgramJobWithHttpInfo(param.programKey, param.version, param.xSimcoreParentProjectUuid, param.xSimcoreParentNodeId, param.bodyCreateProgramJobV0ProgramsProgramKeyReleasesVersionJobsPost,  options).toPromise();
    }

    /**
     * Creates a program job
     * Create Program Job
     * @param param the request object
     */
    public createProgramJob(param: ProgramsApiCreateProgramJobRequest, options?: ConfigurationOptions): Promise<Job> {
        return this.api.createProgramJob(param.programKey, param.version, param.xSimcoreParentProjectUuid, param.xSimcoreParentNodeId, param.bodyCreateProgramJobV0ProgramsProgramKeyReleasesVersionJobsPost,  options).toPromise();
    }

    /**
     * Gets a specific release of a solver
     * Get Program Release
     * @param param the request object
     */
    public getProgramReleaseWithHttpInfo(param: ProgramsApiGetProgramReleaseRequest, options?: ConfigurationOptions): Promise<HttpInfo<Program>> {
        return this.api.getProgramReleaseWithHttpInfo(param.programKey, param.version,  options).toPromise();
    }

    /**
     * Gets a specific release of a solver
     * Get Program Release
     * @param param the request object
     */
    public getProgramRelease(param: ProgramsApiGetProgramReleaseRequest, options?: ConfigurationOptions): Promise<Program> {
        return this.api.getProgramRelease(param.programKey, param.version,  options).toPromise();
    }

}

import { ObservableSolversApi } from "./ObservableAPI";
import { SolversApiRequestFactory, SolversApiResponseProcessor} from "../apis/SolversApi";

export interface SolversApiCreateSolverJobRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApicreateSolverJob
     */
    solverKey: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApicreateSolverJob
     */
    version: string
    /**
     * 
     * @type JobInputs
     * @memberof SolversApicreateSolverJob
     */
    jobInputs: JobInputs
    /**
     * 
     * Defaults to: true
     * @type boolean
     * @memberof SolversApicreateSolverJob
     */
    hidden?: boolean
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApicreateSolverJob
     */
    xSimcoreParentProjectUuid?: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApicreateSolverJob
     */
    xSimcoreParentNodeId?: string
}

export interface SolversApiDeleteJobRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApideleteJob
     */
    solverKey: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApideleteJob
     */
    version: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApideleteJob
     */
    jobId: string
}

export interface SolversApiGetJobRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApigetJob
     */
    solverKey: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApigetJob
     */
    version: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApigetJob
     */
    jobId: string
}

export interface SolversApiGetJobCustomMetadataRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApigetJobCustomMetadata
     */
    solverKey: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApigetJobCustomMetadata
     */
    version: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApigetJobCustomMetadata
     */
    jobId: string
}

export interface SolversApiGetJobOutputLogfileRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApigetJobOutputLogfile
     */
    solverKey: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApigetJobOutputLogfile
     */
    version: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApigetJobOutputLogfile
     */
    jobId: string
}

export interface SolversApiGetJobOutputsRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApigetJobOutputs
     */
    solverKey: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApigetJobOutputs
     */
    version: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApigetJobOutputs
     */
    jobId: string
}

export interface SolversApiGetJobPricingUnitRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApigetJobPricingUnit
     */
    solverKey: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApigetJobPricingUnit
     */
    version: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApigetJobPricingUnit
     */
    jobId: string
}

export interface SolversApiGetJobWalletRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApigetJobWallet
     */
    solverKey: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApigetJobWallet
     */
    version: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApigetJobWallet
     */
    jobId: string
}

export interface SolversApiGetLogStreamRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApigetLogStream
     */
    solverKey: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApigetLogStream
     */
    version: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApigetLogStream
     */
    jobId: string
}

export interface SolversApiGetSolverRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApigetSolver
     */
    solverKey: string
}

export interface SolversApiGetSolverPricingPlanRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApigetSolverPricingPlan
     */
    solverKey: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApigetSolverPricingPlan
     */
    version: string
}

export interface SolversApiGetSolverReleaseRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApigetSolverRelease
     */
    solverKey: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApigetSolverRelease
     */
    version: string
}

export interface SolversApiInspectJobRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApiinspectJob
     */
    solverKey: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApiinspectJob
     */
    version: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApiinspectJob
     */
    jobId: string
}

export interface SolversApiListJobsRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApilistJobs
     */
    solverKey: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApilistJobs
     */
    version: string
}

export interface SolversApiListJobsPaginatedRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApilistJobsPaginated
     */
    solverKey: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApilistJobsPaginated
     */
    version: string
    /**
     * Page size limit
     * Minimum: 1
     * Maximum: 50
     * Defaults to: 20
     * @type number
     * @memberof SolversApilistJobsPaginated
     */
    limit?: number
    /**
     * Page offset
     * Minimum: 0
     * Defaults to: 0
     * @type number
     * @memberof SolversApilistJobsPaginated
     */
    offset?: number
}

export interface SolversApiListSolverPortsRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApilistSolverPorts
     */
    solverKey: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApilistSolverPorts
     */
    version: string
}

export interface SolversApiListSolverReleasesRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApilistSolverReleases
     */
    solverKey: string
}

export interface SolversApiListSolversRequest {
}

export interface SolversApiListSolversReleasesRequest {
}

export interface SolversApiReplaceJobCustomMetadataRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApireplaceJobCustomMetadata
     */
    solverKey: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApireplaceJobCustomMetadata
     */
    version: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApireplaceJobCustomMetadata
     */
    jobId: string
    /**
     * 
     * @type JobMetadataUpdate
     * @memberof SolversApireplaceJobCustomMetadata
     */
    jobMetadataUpdate: JobMetadataUpdate
}

export interface SolversApiStartJobRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApistartJob
     */
    solverKey: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApistartJob
     */
    version: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApistartJob
     */
    jobId: string
    /**
     * 
     * Minimum: 0
     * Defaults to: undefined
     * @type number
     * @memberof SolversApistartJob
     */
    clusterId?: number
}

export interface SolversApiStopJobRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApistopJob
     */
    solverKey: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApistopJob
     */
    version: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SolversApistopJob
     */
    jobId: string
}

export class ObjectSolversApi {
    private api: ObservableSolversApi

    public constructor(configuration: Configuration, requestFactory?: SolversApiRequestFactory, responseProcessor?: SolversApiResponseProcessor) {
        this.api = new ObservableSolversApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Creates a job in a specific release with given inputs. This operation does not start the job.  New in *version 0.5*
     * Create Solver Job
     * @param param the request object
     */
    public createSolverJobWithHttpInfo(param: SolversApiCreateSolverJobRequest, options?: ConfigurationOptions): Promise<HttpInfo<Job>> {
        return this.api.createSolverJobWithHttpInfo(param.solverKey, param.version, param.jobInputs, param.hidden, param.xSimcoreParentProjectUuid, param.xSimcoreParentNodeId,  options).toPromise();
    }

    /**
     * Creates a job in a specific release with given inputs. This operation does not start the job.  New in *version 0.5*
     * Create Solver Job
     * @param param the request object
     */
    public createSolverJob(param: SolversApiCreateSolverJobRequest, options?: ConfigurationOptions): Promise<Job> {
        return this.api.createSolverJob(param.solverKey, param.version, param.jobInputs, param.hidden, param.xSimcoreParentProjectUuid, param.xSimcoreParentNodeId,  options).toPromise();
    }

    /**
     * Deletes an existing solver job  New in *version 0.7*
     * Delete Job
     * @param param the request object
     */
    public deleteJobWithHttpInfo(param: SolversApiDeleteJobRequest, options?: ConfigurationOptions): Promise<HttpInfo<void>> {
        return this.api.deleteJobWithHttpInfo(param.solverKey, param.version, param.jobId,  options).toPromise();
    }

    /**
     * Deletes an existing solver job  New in *version 0.7*
     * Delete Job
     * @param param the request object
     */
    public deleteJob(param: SolversApiDeleteJobRequest, options?: ConfigurationOptions): Promise<void> {
        return this.api.deleteJob(param.solverKey, param.version, param.jobId,  options).toPromise();
    }

    /**
     * Gets job of a given solver
     * Get Job
     * @param param the request object
     */
    public getJobWithHttpInfo(param: SolversApiGetJobRequest, options?: ConfigurationOptions): Promise<HttpInfo<Job>> {
        return this.api.getJobWithHttpInfo(param.solverKey, param.version, param.jobId,  options).toPromise();
    }

    /**
     * Gets job of a given solver
     * Get Job
     * @param param the request object
     */
    public getJob(param: SolversApiGetJobRequest, options?: ConfigurationOptions): Promise<Job> {
        return this.api.getJob(param.solverKey, param.version, param.jobId,  options).toPromise();
    }

    /**
     * Gets custom metadata from a job  New in *version 0.7*
     * Get Job Custom Metadata
     * @param param the request object
     */
    public getJobCustomMetadataWithHttpInfo(param: SolversApiGetJobCustomMetadataRequest, options?: ConfigurationOptions): Promise<HttpInfo<JobMetadata>> {
        return this.api.getJobCustomMetadataWithHttpInfo(param.solverKey, param.version, param.jobId,  options).toPromise();
    }

    /**
     * Gets custom metadata from a job  New in *version 0.7*
     * Get Job Custom Metadata
     * @param param the request object
     */
    public getJobCustomMetadata(param: SolversApiGetJobCustomMetadataRequest, options?: ConfigurationOptions): Promise<JobMetadata> {
        return this.api.getJobCustomMetadata(param.solverKey, param.version, param.jobId,  options).toPromise();
    }

    /**
     * Special extra output with persistent logs file for the solver run.  **NOTE**: this is not a log stream but a predefined output that is only available after the job is done  New in *version 0.4*
     * Get Job Output Logfile
     * @param param the request object
     */
    public getJobOutputLogfileWithHttpInfo(param: SolversApiGetJobOutputLogfileRequest, options?: ConfigurationOptions): Promise<HttpInfo<HttpFile>> {
        return this.api.getJobOutputLogfileWithHttpInfo(param.solverKey, param.version, param.jobId,  options).toPromise();
    }

    /**
     * Special extra output with persistent logs file for the solver run.  **NOTE**: this is not a log stream but a predefined output that is only available after the job is done  New in *version 0.4*
     * Get Job Output Logfile
     * @param param the request object
     */
    public getJobOutputLogfile(param: SolversApiGetJobOutputLogfileRequest, options?: ConfigurationOptions): Promise<HttpFile> {
        return this.api.getJobOutputLogfile(param.solverKey, param.version, param.jobId,  options).toPromise();
    }

    /**
     * Get Job Outputs
     * @param param the request object
     */
    public getJobOutputsWithHttpInfo(param: SolversApiGetJobOutputsRequest, options?: ConfigurationOptions): Promise<HttpInfo<JobOutputs>> {
        return this.api.getJobOutputsWithHttpInfo(param.solverKey, param.version, param.jobId,  options).toPromise();
    }

    /**
     * Get Job Outputs
     * @param param the request object
     */
    public getJobOutputs(param: SolversApiGetJobOutputsRequest, options?: ConfigurationOptions): Promise<JobOutputs> {
        return this.api.getJobOutputs(param.solverKey, param.version, param.jobId,  options).toPromise();
    }

    /**
     * Get job pricing unit  New in *version 0.7*
     * Get Job Pricing Unit
     * @param param the request object
     */
    public getJobPricingUnitWithHttpInfo(param: SolversApiGetJobPricingUnitRequest, options?: ConfigurationOptions): Promise<HttpInfo<PricingUnitGetLegacy>> {
        return this.api.getJobPricingUnitWithHttpInfo(param.solverKey, param.version, param.jobId,  options).toPromise();
    }

    /**
     * Get job pricing unit  New in *version 0.7*
     * Get Job Pricing Unit
     * @param param the request object
     */
    public getJobPricingUnit(param: SolversApiGetJobPricingUnitRequest, options?: ConfigurationOptions): Promise<PricingUnitGetLegacy> {
        return this.api.getJobPricingUnit(param.solverKey, param.version, param.jobId,  options).toPromise();
    }

    /**
     * Get job wallet  New in *version 0.7*
     * Get Job Wallet
     * @param param the request object
     */
    public getJobWalletWithHttpInfo(param: SolversApiGetJobWalletRequest, options?: ConfigurationOptions): Promise<HttpInfo<WalletGetWithAvailableCreditsLegacy>> {
        return this.api.getJobWalletWithHttpInfo(param.solverKey, param.version, param.jobId,  options).toPromise();
    }

    /**
     * Get job wallet  New in *version 0.7*
     * Get Job Wallet
     * @param param the request object
     */
    public getJobWallet(param: SolversApiGetJobWalletRequest, options?: ConfigurationOptions): Promise<WalletGetWithAvailableCreditsLegacy> {
        return this.api.getJobWallet(param.solverKey, param.version, param.jobId,  options).toPromise();
    }

    /**
     * Get Log Stream
     * @param param the request object
     */
    public getLogStreamWithHttpInfo(param: SolversApiGetLogStreamRequest, options?: ConfigurationOptions): Promise<HttpInfo<Response200GetLogStreamV0SolversSolverKeyReleasesVersionJobsJobIdLogstreamGet>> {
        return this.api.getLogStreamWithHttpInfo(param.solverKey, param.version, param.jobId,  options).toPromise();
    }

    /**
     * Get Log Stream
     * @param param the request object
     */
    public getLogStream(param: SolversApiGetLogStreamRequest, options?: ConfigurationOptions): Promise<Response200GetLogStreamV0SolversSolverKeyReleasesVersionJobsJobIdLogstreamGet> {
        return this.api.getLogStream(param.solverKey, param.version, param.jobId,  options).toPromise();
    }

    /**
     * Gets latest release of a solver  Added in *version 0.7.1*: `version_display` field in the response
     * Get Solver
     * @param param the request object
     */
    public getSolverWithHttpInfo(param: SolversApiGetSolverRequest, options?: ConfigurationOptions): Promise<HttpInfo<Solver>> {
        return this.api.getSolverWithHttpInfo(param.solverKey,  options).toPromise();
    }

    /**
     * Gets latest release of a solver  Added in *version 0.7.1*: `version_display` field in the response
     * Get Solver
     * @param param the request object
     */
    public getSolver(param: SolversApiGetSolverRequest, options?: ConfigurationOptions): Promise<Solver> {
        return this.api.getSolver(param.solverKey,  options).toPromise();
    }

    /**
     * Gets solver pricing plan  New in *version 0.7*  Added in *version 0.7.1*: `version_display` field in the response
     * Get Solver Pricing Plan
     * @param param the request object
     */
    public getSolverPricingPlanWithHttpInfo(param: SolversApiGetSolverPricingPlanRequest, options?: ConfigurationOptions): Promise<HttpInfo<ServicePricingPlanGetLegacy>> {
        return this.api.getSolverPricingPlanWithHttpInfo(param.solverKey, param.version,  options).toPromise();
    }

    /**
     * Gets solver pricing plan  New in *version 0.7*  Added in *version 0.7.1*: `version_display` field in the response
     * Get Solver Pricing Plan
     * @param param the request object
     */
    public getSolverPricingPlan(param: SolversApiGetSolverPricingPlanRequest, options?: ConfigurationOptions): Promise<ServicePricingPlanGetLegacy> {
        return this.api.getSolverPricingPlan(param.solverKey, param.version,  options).toPromise();
    }

    /**
     * Gets a specific release of a solver  Added in *version 0.7.1*: `version_display` field in the response
     * Get Solver Release
     * @param param the request object
     */
    public getSolverReleaseWithHttpInfo(param: SolversApiGetSolverReleaseRequest, options?: ConfigurationOptions): Promise<HttpInfo<Solver>> {
        return this.api.getSolverReleaseWithHttpInfo(param.solverKey, param.version,  options).toPromise();
    }

    /**
     * Gets a specific release of a solver  Added in *version 0.7.1*: `version_display` field in the response
     * Get Solver Release
     * @param param the request object
     */
    public getSolverRelease(param: SolversApiGetSolverReleaseRequest, options?: ConfigurationOptions): Promise<Solver> {
        return this.api.getSolverRelease(param.solverKey, param.version,  options).toPromise();
    }

    /**
     * Inspects the current status of a job  New in *version 0.5*
     * Inspect Job
     * @param param the request object
     */
    public inspectJobWithHttpInfo(param: SolversApiInspectJobRequest, options?: ConfigurationOptions): Promise<HttpInfo<JobStatus>> {
        return this.api.inspectJobWithHttpInfo(param.solverKey, param.version, param.jobId,  options).toPromise();
    }

    /**
     * Inspects the current status of a job  New in *version 0.5*
     * Inspect Job
     * @param param the request object
     */
    public inspectJob(param: SolversApiInspectJobRequest, options?: ConfigurationOptions): Promise<JobStatus> {
        return this.api.inspectJob(param.solverKey, param.version, param.jobId,  options).toPromise();
    }

    /**
     * 🚨 **Deprecated**: This endpoint is deprecated and will be removed in a future release. Please use `GET /{solver_key}/releases/{version}/jobs/page` instead.    List of jobs in a specific released solver (limited to 20 jobs)  New in *version 0.5*  Removed in *version 0.7*: This endpoint is deprecated and will be removed in a future version
     * List Jobs
     * @param param the request object
     */
    public listJobsWithHttpInfo(param: SolversApiListJobsRequest, options?: ConfigurationOptions): Promise<HttpInfo<Array<Job>>> {
        return this.api.listJobsWithHttpInfo(param.solverKey, param.version,  options).toPromise();
    }

    /**
     * 🚨 **Deprecated**: This endpoint is deprecated and will be removed in a future release. Please use `GET /{solver_key}/releases/{version}/jobs/page` instead.    List of jobs in a specific released solver (limited to 20 jobs)  New in *version 0.5*  Removed in *version 0.7*: This endpoint is deprecated and will be removed in a future version
     * List Jobs
     * @param param the request object
     */
    public listJobs(param: SolversApiListJobsRequest, options?: ConfigurationOptions): Promise<Array<Job>> {
        return this.api.listJobs(param.solverKey, param.version,  options).toPromise();
    }

    /**
     * List of jobs on a specific released solver (includes pagination)  New in *version 0.7*
     * List Jobs Paginated
     * @param param the request object
     */
    public listJobsPaginatedWithHttpInfo(param: SolversApiListJobsPaginatedRequest, options?: ConfigurationOptions): Promise<HttpInfo<PageJob>> {
        return this.api.listJobsPaginatedWithHttpInfo(param.solverKey, param.version, param.limit, param.offset,  options).toPromise();
    }

    /**
     * List of jobs on a specific released solver (includes pagination)  New in *version 0.7*
     * List Jobs Paginated
     * @param param the request object
     */
    public listJobsPaginated(param: SolversApiListJobsPaginatedRequest, options?: ConfigurationOptions): Promise<PageJob> {
        return this.api.listJobsPaginated(param.solverKey, param.version, param.limit, param.offset,  options).toPromise();
    }

    /**
     * Lists inputs and outputs of a given solver  New in *version 0.5*  Added in *version 0.7.1*: `version_display` field in the response
     * List Solver Ports
     * @param param the request object
     */
    public listSolverPortsWithHttpInfo(param: SolversApiListSolverPortsRequest, options?: ConfigurationOptions): Promise<HttpInfo<OnePageSolverPort>> {
        return this.api.listSolverPortsWithHttpInfo(param.solverKey, param.version,  options).toPromise();
    }

    /**
     * Lists inputs and outputs of a given solver  New in *version 0.5*  Added in *version 0.7.1*: `version_display` field in the response
     * List Solver Ports
     * @param param the request object
     */
    public listSolverPorts(param: SolversApiListSolverPortsRequest, options?: ConfigurationOptions): Promise<OnePageSolverPort> {
        return this.api.listSolverPorts(param.solverKey, param.version,  options).toPromise();
    }

    /**
     * Lists all releases of a given (one) solver  Added in *version 0.7.1*: `version_display` field in the response
     * List Solver Releases
     * @param param the request object
     */
    public listSolverReleasesWithHttpInfo(param: SolversApiListSolverReleasesRequest, options?: ConfigurationOptions): Promise<HttpInfo<Array<Solver>>> {
        return this.api.listSolverReleasesWithHttpInfo(param.solverKey,  options).toPromise();
    }

    /**
     * Lists all releases of a given (one) solver  Added in *version 0.7.1*: `version_display` field in the response
     * List Solver Releases
     * @param param the request object
     */
    public listSolverReleases(param: SolversApiListSolverReleasesRequest, options?: ConfigurationOptions): Promise<Array<Solver>> {
        return this.api.listSolverReleases(param.solverKey,  options).toPromise();
    }

    /**
     * 🚨 **Deprecated**: This endpoint is deprecated and will be removed in a future release. Please use `GET /v0/solvers/page` instead.    Lists all available solvers (latest version)  New in *version 0.5*
     * List Solvers
     * @param param the request object
     */
    public listSolversWithHttpInfo(param: SolversApiListSolversRequest = {}, options?: ConfigurationOptions): Promise<HttpInfo<Array<Solver>>> {
        return this.api.listSolversWithHttpInfo( options).toPromise();
    }

    /**
     * 🚨 **Deprecated**: This endpoint is deprecated and will be removed in a future release. Please use `GET /v0/solvers/page` instead.    Lists all available solvers (latest version)  New in *version 0.5*
     * List Solvers
     * @param param the request object
     */
    public listSolvers(param: SolversApiListSolversRequest = {}, options?: ConfigurationOptions): Promise<Array<Solver>> {
        return this.api.listSolvers( options).toPromise();
    }

    /**
     * 🚨 **Deprecated**: This endpoint is deprecated and will be removed in a future release. Please use `GET /v0/solvers/{solver_key}/releases/page` instead.    Lists **all** released solvers (not just latest version)  New in *version 0.5*
     * Lists All Releases
     * @param param the request object
     */
    public listSolversReleasesWithHttpInfo(param: SolversApiListSolversReleasesRequest = {}, options?: ConfigurationOptions): Promise<HttpInfo<Array<Solver>>> {
        return this.api.listSolversReleasesWithHttpInfo( options).toPromise();
    }

    /**
     * 🚨 **Deprecated**: This endpoint is deprecated and will be removed in a future release. Please use `GET /v0/solvers/{solver_key}/releases/page` instead.    Lists **all** released solvers (not just latest version)  New in *version 0.5*
     * Lists All Releases
     * @param param the request object
     */
    public listSolversReleases(param: SolversApiListSolversReleasesRequest = {}, options?: ConfigurationOptions): Promise<Array<Solver>> {
        return this.api.listSolversReleases( options).toPromise();
    }

    /**
     * Updates custom metadata from a job  New in *version 0.7*
     * Replace Job Custom Metadata
     * @param param the request object
     */
    public replaceJobCustomMetadataWithHttpInfo(param: SolversApiReplaceJobCustomMetadataRequest, options?: ConfigurationOptions): Promise<HttpInfo<JobMetadata>> {
        return this.api.replaceJobCustomMetadataWithHttpInfo(param.solverKey, param.version, param.jobId, param.jobMetadataUpdate,  options).toPromise();
    }

    /**
     * Updates custom metadata from a job  New in *version 0.7*
     * Replace Job Custom Metadata
     * @param param the request object
     */
    public replaceJobCustomMetadata(param: SolversApiReplaceJobCustomMetadataRequest, options?: ConfigurationOptions): Promise<JobMetadata> {
        return this.api.replaceJobCustomMetadata(param.solverKey, param.version, param.jobId, param.jobMetadataUpdate,  options).toPromise();
    }

    /**
     * Starts job job_id created with the solver solver_key:version  Added in *version 0.4.3*: query parameter `cluster_id`  Added in *version 0.6*: responds with a 202 when successfully starting a computation  Changed in *version 0.7*: query parameter `cluster_id` deprecated
     * Start Job
     * @param param the request object
     */
    public startJobWithHttpInfo(param: SolversApiStartJobRequest, options?: ConfigurationOptions): Promise<HttpInfo<JobStatus>> {
        return this.api.startJobWithHttpInfo(param.solverKey, param.version, param.jobId, param.clusterId,  options).toPromise();
    }

    /**
     * Starts job job_id created with the solver solver_key:version  Added in *version 0.4.3*: query parameter `cluster_id`  Added in *version 0.6*: responds with a 202 when successfully starting a computation  Changed in *version 0.7*: query parameter `cluster_id` deprecated
     * Start Job
     * @param param the request object
     */
    public startJob(param: SolversApiStartJobRequest, options?: ConfigurationOptions): Promise<JobStatus> {
        return this.api.startJob(param.solverKey, param.version, param.jobId, param.clusterId,  options).toPromise();
    }

    /**
     * Stops a running job  New in *version 0.5*
     * Stop Job
     * @param param the request object
     */
    public stopJobWithHttpInfo(param: SolversApiStopJobRequest, options?: ConfigurationOptions): Promise<HttpInfo<JobStatus>> {
        return this.api.stopJobWithHttpInfo(param.solverKey, param.version, param.jobId,  options).toPromise();
    }

    /**
     * Stops a running job  New in *version 0.5*
     * Stop Job
     * @param param the request object
     */
    public stopJob(param: SolversApiStopJobRequest, options?: ConfigurationOptions): Promise<JobStatus> {
        return this.api.stopJob(param.solverKey, param.version, param.jobId,  options).toPromise();
    }

}

import { ObservableStudiesApi } from "./ObservableAPI";
import { StudiesApiRequestFactory, StudiesApiResponseProcessor} from "../apis/StudiesApi";

export interface StudiesApiCloneStudyRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof StudiesApicloneStudy
     */
    studyId: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof StudiesApicloneStudy
     */
    xSimcoreParentProjectUuid?: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof StudiesApicloneStudy
     */
    xSimcoreParentNodeId?: string
}

export interface StudiesApiCreateStudyJobRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof StudiesApicreateStudyJob
     */
    studyId: string
    /**
     * 
     * @type JobInputs
     * @memberof StudiesApicreateStudyJob
     */
    jobInputs: JobInputs
    /**
     * 
     * Defaults to: true
     * @type boolean
     * @memberof StudiesApicreateStudyJob
     */
    hidden?: boolean
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof StudiesApicreateStudyJob
     */
    xSimcoreParentProjectUuid?: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof StudiesApicreateStudyJob
     */
    xSimcoreParentNodeId?: string
}

export interface StudiesApiDeleteStudyJobRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof StudiesApideleteStudyJob
     */
    studyId: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof StudiesApideleteStudyJob
     */
    jobId: string
}

export interface StudiesApiGetStudyRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof StudiesApigetStudy
     */
    studyId: string
}

export interface StudiesApiGetStudyJobCustomMetadataRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof StudiesApigetStudyJobCustomMetadata
     */
    studyId: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof StudiesApigetStudyJobCustomMetadata
     */
    jobId: string
}

export interface StudiesApiGetStudyJobOutputLogfileRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof StudiesApigetStudyJobOutputLogfile
     */
    studyId: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof StudiesApigetStudyJobOutputLogfile
     */
    jobId: string
}

export interface StudiesApiGetStudyJobOutputsRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof StudiesApigetStudyJobOutputs
     */
    studyId: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof StudiesApigetStudyJobOutputs
     */
    jobId: string
}

export interface StudiesApiInspectStudyJobRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof StudiesApiinspectStudyJob
     */
    studyId: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof StudiesApiinspectStudyJob
     */
    jobId: string
}

export interface StudiesApiListStudiesRequest {
    /**
     * Page size limit
     * Minimum: 1
     * Maximum: 50
     * Defaults to: 20
     * @type number
     * @memberof StudiesApilistStudies
     */
    limit?: number
    /**
     * Page offset
     * Minimum: 0
     * Defaults to: 0
     * @type number
     * @memberof StudiesApilistStudies
     */
    offset?: number
}

export interface StudiesApiListStudyPortsRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof StudiesApilistStudyPorts
     */
    studyId: string
}

export interface StudiesApiReplaceStudyJobCustomMetadataRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof StudiesApireplaceStudyJobCustomMetadata
     */
    studyId: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof StudiesApireplaceStudyJobCustomMetadata
     */
    jobId: string
    /**
     * 
     * @type JobMetadataUpdate
     * @memberof StudiesApireplaceStudyJobCustomMetadata
     */
    jobMetadataUpdate: JobMetadataUpdate
}

export interface StudiesApiStartStudyJobRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof StudiesApistartStudyJob
     */
    studyId: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof StudiesApistartStudyJob
     */
    jobId: string
    /**
     * Changed in *version 0.7*: query parameter &#x60;cluster_id&#x60; deprecated 
     * Minimum: 0
     * Defaults to: undefined
     * @type number
     * @memberof StudiesApistartStudyJob
     */
    clusterId?: number
}

export interface StudiesApiStopStudyJobRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof StudiesApistopStudyJob
     */
    studyId: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof StudiesApistopStudyJob
     */
    jobId: string
}

export class ObjectStudiesApi {
    private api: ObservableStudiesApi

    public constructor(configuration: Configuration, requestFactory?: StudiesApiRequestFactory, responseProcessor?: StudiesApiResponseProcessor) {
        this.api = new ObservableStudiesApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Clone Study
     * @param param the request object
     */
    public cloneStudyWithHttpInfo(param: StudiesApiCloneStudyRequest, options?: ConfigurationOptions): Promise<HttpInfo<Study>> {
        return this.api.cloneStudyWithHttpInfo(param.studyId, param.xSimcoreParentProjectUuid, param.xSimcoreParentNodeId,  options).toPromise();
    }

    /**
     * Clone Study
     * @param param the request object
     */
    public cloneStudy(param: StudiesApiCloneStudyRequest, options?: ConfigurationOptions): Promise<Study> {
        return this.api.cloneStudy(param.studyId, param.xSimcoreParentProjectUuid, param.xSimcoreParentNodeId,  options).toPromise();
    }

    /**
     * hidden -- if True (default) hides project from UI
     * Create Study Job
     * @param param the request object
     */
    public createStudyJobWithHttpInfo(param: StudiesApiCreateStudyJobRequest, options?: ConfigurationOptions): Promise<HttpInfo<Job>> {
        return this.api.createStudyJobWithHttpInfo(param.studyId, param.jobInputs, param.hidden, param.xSimcoreParentProjectUuid, param.xSimcoreParentNodeId,  options).toPromise();
    }

    /**
     * hidden -- if True (default) hides project from UI
     * Create Study Job
     * @param param the request object
     */
    public createStudyJob(param: StudiesApiCreateStudyJobRequest, options?: ConfigurationOptions): Promise<Job> {
        return this.api.createStudyJob(param.studyId, param.jobInputs, param.hidden, param.xSimcoreParentProjectUuid, param.xSimcoreParentNodeId,  options).toPromise();
    }

    /**
     * Deletes an existing study job
     * Delete Study Job
     * @param param the request object
     */
    public deleteStudyJobWithHttpInfo(param: StudiesApiDeleteStudyJobRequest, options?: ConfigurationOptions): Promise<HttpInfo<void>> {
        return this.api.deleteStudyJobWithHttpInfo(param.studyId, param.jobId,  options).toPromise();
    }

    /**
     * Deletes an existing study job
     * Delete Study Job
     * @param param the request object
     */
    public deleteStudyJob(param: StudiesApiDeleteStudyJobRequest, options?: ConfigurationOptions): Promise<void> {
        return this.api.deleteStudyJob(param.studyId, param.jobId,  options).toPromise();
    }

    /**
     * Get study by ID  New in *version 0.5*
     * Get Study
     * @param param the request object
     */
    public getStudyWithHttpInfo(param: StudiesApiGetStudyRequest, options?: ConfigurationOptions): Promise<HttpInfo<Study>> {
        return this.api.getStudyWithHttpInfo(param.studyId,  options).toPromise();
    }

    /**
     * Get study by ID  New in *version 0.5*
     * Get Study
     * @param param the request object
     */
    public getStudy(param: StudiesApiGetStudyRequest, options?: ConfigurationOptions): Promise<Study> {
        return this.api.getStudy(param.studyId,  options).toPromise();
    }

    /**
     * Get custom metadata from a study\'s job  New in *version 0.7*
     * Get Study Job Custom Metadata
     * @param param the request object
     */
    public getStudyJobCustomMetadataWithHttpInfo(param: StudiesApiGetStudyJobCustomMetadataRequest, options?: ConfigurationOptions): Promise<HttpInfo<JobMetadata>> {
        return this.api.getStudyJobCustomMetadataWithHttpInfo(param.studyId, param.jobId,  options).toPromise();
    }

    /**
     * Get custom metadata from a study\'s job  New in *version 0.7*
     * Get Study Job Custom Metadata
     * @param param the request object
     */
    public getStudyJobCustomMetadata(param: StudiesApiGetStudyJobCustomMetadataRequest, options?: ConfigurationOptions): Promise<JobMetadata> {
        return this.api.getStudyJobCustomMetadata(param.studyId, param.jobId,  options).toPromise();
    }

    /**
     * Get download links for study job log files
     * @param param the request object
     */
    public getStudyJobOutputLogfileWithHttpInfo(param: StudiesApiGetStudyJobOutputLogfileRequest, options?: ConfigurationOptions): Promise<HttpInfo<JobLogsMap>> {
        return this.api.getStudyJobOutputLogfileWithHttpInfo(param.studyId, param.jobId,  options).toPromise();
    }

    /**
     * Get download links for study job log files
     * @param param the request object
     */
    public getStudyJobOutputLogfile(param: StudiesApiGetStudyJobOutputLogfileRequest, options?: ConfigurationOptions): Promise<JobLogsMap> {
        return this.api.getStudyJobOutputLogfile(param.studyId, param.jobId,  options).toPromise();
    }

    /**
     * Get Study Job Outputs
     * @param param the request object
     */
    public getStudyJobOutputsWithHttpInfo(param: StudiesApiGetStudyJobOutputsRequest, options?: ConfigurationOptions): Promise<HttpInfo<JobOutputs>> {
        return this.api.getStudyJobOutputsWithHttpInfo(param.studyId, param.jobId,  options).toPromise();
    }

    /**
     * Get Study Job Outputs
     * @param param the request object
     */
    public getStudyJobOutputs(param: StudiesApiGetStudyJobOutputsRequest, options?: ConfigurationOptions): Promise<JobOutputs> {
        return this.api.getStudyJobOutputs(param.studyId, param.jobId,  options).toPromise();
    }

    /**
     * Inspect Study Job
     * @param param the request object
     */
    public inspectStudyJobWithHttpInfo(param: StudiesApiInspectStudyJobRequest, options?: ConfigurationOptions): Promise<HttpInfo<JobStatus>> {
        return this.api.inspectStudyJobWithHttpInfo(param.studyId, param.jobId,  options).toPromise();
    }

    /**
     * Inspect Study Job
     * @param param the request object
     */
    public inspectStudyJob(param: StudiesApiInspectStudyJobRequest, options?: ConfigurationOptions): Promise<JobStatus> {
        return this.api.inspectStudyJob(param.studyId, param.jobId,  options).toPromise();
    }

    /**
     * List all studies  New in *version 0.5*
     * List Studies
     * @param param the request object
     */
    public listStudiesWithHttpInfo(param: StudiesApiListStudiesRequest = {}, options?: ConfigurationOptions): Promise<HttpInfo<PageStudy>> {
        return this.api.listStudiesWithHttpInfo(param.limit, param.offset,  options).toPromise();
    }

    /**
     * List all studies  New in *version 0.5*
     * List Studies
     * @param param the request object
     */
    public listStudies(param: StudiesApiListStudiesRequest = {}, options?: ConfigurationOptions): Promise<PageStudy> {
        return this.api.listStudies(param.limit, param.offset,  options).toPromise();
    }

    /**
     * Lists metadata on ports of a given study  New in *version 0.5*
     * List Study Ports
     * @param param the request object
     */
    public listStudyPortsWithHttpInfo(param: StudiesApiListStudyPortsRequest, options?: ConfigurationOptions): Promise<HttpInfo<OnePageStudyPort>> {
        return this.api.listStudyPortsWithHttpInfo(param.studyId,  options).toPromise();
    }

    /**
     * Lists metadata on ports of a given study  New in *version 0.5*
     * List Study Ports
     * @param param the request object
     */
    public listStudyPorts(param: StudiesApiListStudyPortsRequest, options?: ConfigurationOptions): Promise<OnePageStudyPort> {
        return this.api.listStudyPorts(param.studyId,  options).toPromise();
    }

    /**
     * Changes custom metadata of a study\'s job  New in *version 0.7*
     * Replace Study Job Custom Metadata
     * @param param the request object
     */
    public replaceStudyJobCustomMetadataWithHttpInfo(param: StudiesApiReplaceStudyJobCustomMetadataRequest, options?: ConfigurationOptions): Promise<HttpInfo<JobMetadata>> {
        return this.api.replaceStudyJobCustomMetadataWithHttpInfo(param.studyId, param.jobId, param.jobMetadataUpdate,  options).toPromise();
    }

    /**
     * Changes custom metadata of a study\'s job  New in *version 0.7*
     * Replace Study Job Custom Metadata
     * @param param the request object
     */
    public replaceStudyJobCustomMetadata(param: StudiesApiReplaceStudyJobCustomMetadataRequest, options?: ConfigurationOptions): Promise<JobMetadata> {
        return this.api.replaceStudyJobCustomMetadata(param.studyId, param.jobId, param.jobMetadataUpdate,  options).toPromise();
    }

    /**
     * Changed in *version 0.6*: Now responds with a 202 when successfully starting a computation
     * Start Study Job
     * @param param the request object
     */
    public startStudyJobWithHttpInfo(param: StudiesApiStartStudyJobRequest, options?: ConfigurationOptions): Promise<HttpInfo<JobStatus>> {
        return this.api.startStudyJobWithHttpInfo(param.studyId, param.jobId, param.clusterId,  options).toPromise();
    }

    /**
     * Changed in *version 0.6*: Now responds with a 202 when successfully starting a computation
     * Start Study Job
     * @param param the request object
     */
    public startStudyJob(param: StudiesApiStartStudyJobRequest, options?: ConfigurationOptions): Promise<JobStatus> {
        return this.api.startStudyJob(param.studyId, param.jobId, param.clusterId,  options).toPromise();
    }

    /**
     * Stop Study Job
     * @param param the request object
     */
    public stopStudyJobWithHttpInfo(param: StudiesApiStopStudyJobRequest, options?: ConfigurationOptions): Promise<HttpInfo<JobStatus>> {
        return this.api.stopStudyJobWithHttpInfo(param.studyId, param.jobId,  options).toPromise();
    }

    /**
     * Stop Study Job
     * @param param the request object
     */
    public stopStudyJob(param: StudiesApiStopStudyJobRequest, options?: ConfigurationOptions): Promise<JobStatus> {
        return this.api.stopStudyJob(param.studyId, param.jobId,  options).toPromise();
    }

}

import { ObservableUsersApi } from "./ObservableAPI";
import { UsersApiRequestFactory, UsersApiResponseProcessor} from "../apis/UsersApi";

export interface UsersApiGetMyProfileRequest {
}

export interface UsersApiUpdateMyProfileRequest {
    /**
     * 
     * @type ProfileUpdate
     * @memberof UsersApiupdateMyProfile
     */
    profileUpdate: ProfileUpdate
}

export class ObjectUsersApi {
    private api: ObservableUsersApi

    public constructor(configuration: Configuration, requestFactory?: UsersApiRequestFactory, responseProcessor?: UsersApiResponseProcessor) {
        this.api = new ObservableUsersApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get My Profile
     * @param param the request object
     */
    public getMyProfileWithHttpInfo(param: UsersApiGetMyProfileRequest = {}, options?: ConfigurationOptions): Promise<HttpInfo<Profile>> {
        return this.api.getMyProfileWithHttpInfo( options).toPromise();
    }

    /**
     * Get My Profile
     * @param param the request object
     */
    public getMyProfile(param: UsersApiGetMyProfileRequest = {}, options?: ConfigurationOptions): Promise<Profile> {
        return this.api.getMyProfile( options).toPromise();
    }

    /**
     * Update My Profile
     * @param param the request object
     */
    public updateMyProfileWithHttpInfo(param: UsersApiUpdateMyProfileRequest, options?: ConfigurationOptions): Promise<HttpInfo<Profile>> {
        return this.api.updateMyProfileWithHttpInfo(param.profileUpdate,  options).toPromise();
    }

    /**
     * Update My Profile
     * @param param the request object
     */
    public updateMyProfile(param: UsersApiUpdateMyProfileRequest, options?: ConfigurationOptions): Promise<Profile> {
        return this.api.updateMyProfile(param.profileUpdate,  options).toPromise();
    }

}

import { ObservableWalletsApi } from "./ObservableAPI";
import { WalletsApiRequestFactory, WalletsApiResponseProcessor} from "../apis/WalletsApi";

export interface WalletsApiCheckoutLicensedItemRequest {
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof WalletsApicheckoutLicensedItem
     */
    walletId: number
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof WalletsApicheckoutLicensedItem
     */
    licensedItemId: string
    /**
     * 
     * @type LicensedItemCheckoutData
     * @memberof WalletsApicheckoutLicensedItem
     */
    licensedItemCheckoutData: LicensedItemCheckoutData
}

export interface WalletsApiGetAvailableLicensedItemsForWalletRequest {
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof WalletsApigetAvailableLicensedItemsForWallet
     */
    walletId: number
    /**
     * Page size limit
     * Minimum: 1
     * Maximum: 50
     * Defaults to: 20
     * @type number
     * @memberof WalletsApigetAvailableLicensedItemsForWallet
     */
    limit?: number
    /**
     * Page offset
     * Minimum: 0
     * Defaults to: 0
     * @type number
     * @memberof WalletsApigetAvailableLicensedItemsForWallet
     */
    offset?: number
}

export interface WalletsApiGetDefaultWalletRequest {
}

export interface WalletsApiGetWalletRequest {
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof WalletsApigetWallet
     */
    walletId: number
}

export class ObjectWalletsApi {
    private api: ObservableWalletsApi

    public constructor(configuration: Configuration, requestFactory?: WalletsApiRequestFactory, responseProcessor?: WalletsApiResponseProcessor) {
        this.api = new ObservableWalletsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Checkout licensed item
     * Checkout Licensed Item
     * @param param the request object
     */
    public checkoutLicensedItemWithHttpInfo(param: WalletsApiCheckoutLicensedItemRequest, options?: ConfigurationOptions): Promise<HttpInfo<LicensedItemCheckoutGet>> {
        return this.api.checkoutLicensedItemWithHttpInfo(param.walletId, param.licensedItemId, param.licensedItemCheckoutData,  options).toPromise();
    }

    /**
     * Checkout licensed item
     * Checkout Licensed Item
     * @param param the request object
     */
    public checkoutLicensedItem(param: WalletsApiCheckoutLicensedItemRequest, options?: ConfigurationOptions): Promise<LicensedItemCheckoutGet> {
        return this.api.checkoutLicensedItem(param.walletId, param.licensedItemId, param.licensedItemCheckoutData,  options).toPromise();
    }

    /**
     * Get all available licensed items for a given wallet  New in *version 0.6*
     * Get Available Licensed Items For Wallet
     * @param param the request object
     */
    public getAvailableLicensedItemsForWalletWithHttpInfo(param: WalletsApiGetAvailableLicensedItemsForWalletRequest, options?: ConfigurationOptions): Promise<HttpInfo<PageLicensedItemGet>> {
        return this.api.getAvailableLicensedItemsForWalletWithHttpInfo(param.walletId, param.limit, param.offset,  options).toPromise();
    }

    /**
     * Get all available licensed items for a given wallet  New in *version 0.6*
     * Get Available Licensed Items For Wallet
     * @param param the request object
     */
    public getAvailableLicensedItemsForWallet(param: WalletsApiGetAvailableLicensedItemsForWalletRequest, options?: ConfigurationOptions): Promise<PageLicensedItemGet> {
        return this.api.getAvailableLicensedItemsForWallet(param.walletId, param.limit, param.offset,  options).toPromise();
    }

    /**
     * Get default wallet  New in *version 0.7*
     * Get Default Wallet
     * @param param the request object
     */
    public getDefaultWalletWithHttpInfo(param: WalletsApiGetDefaultWalletRequest = {}, options?: ConfigurationOptions): Promise<HttpInfo<WalletGetWithAvailableCreditsLegacy>> {
        return this.api.getDefaultWalletWithHttpInfo( options).toPromise();
    }

    /**
     * Get default wallet  New in *version 0.7*
     * Get Default Wallet
     * @param param the request object
     */
    public getDefaultWallet(param: WalletsApiGetDefaultWalletRequest = {}, options?: ConfigurationOptions): Promise<WalletGetWithAvailableCreditsLegacy> {
        return this.api.getDefaultWallet( options).toPromise();
    }

    /**
     * Get wallet  New in *version 0.7*
     * Get Wallet
     * @param param the request object
     */
    public getWalletWithHttpInfo(param: WalletsApiGetWalletRequest, options?: ConfigurationOptions): Promise<HttpInfo<WalletGetWithAvailableCreditsLegacy>> {
        return this.api.getWalletWithHttpInfo(param.walletId,  options).toPromise();
    }

    /**
     * Get wallet  New in *version 0.7*
     * Get Wallet
     * @param param the request object
     */
    public getWallet(param: WalletsApiGetWalletRequest, options?: ConfigurationOptions): Promise<WalletGetWithAvailableCreditsLegacy> {
        return this.api.getWallet(param.walletId,  options).toPromise();
    }

}
