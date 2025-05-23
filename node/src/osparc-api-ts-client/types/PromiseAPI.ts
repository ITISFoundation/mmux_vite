import { ResponseContext, RequestContext, HttpFile, HttpInfo } from '../http/http';
import { Configuration, PromiseConfigurationOptions, wrapOptions } from '../configuration'
import { PromiseMiddleware, Middleware, PromiseMiddlewareWrapper } from '../middleware';

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
import { ObservableCreditsApi } from './ObservableAPI';

import { CreditsApiRequestFactory, CreditsApiResponseProcessor} from "../apis/CreditsApi";
export class PromiseCreditsApi {
    private api: ObservableCreditsApi

    public constructor(
        configuration: Configuration,
        requestFactory?: CreditsApiRequestFactory,
        responseProcessor?: CreditsApiResponseProcessor
    ) {
        this.api = new ObservableCreditsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * New in *version 0.6*
     * Get Credits Price
     */
    public getCreditsPriceWithHttpInfo(_options?: PromiseConfigurationOptions): Promise<HttpInfo<GetCreditPriceLegacy>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getCreditsPriceWithHttpInfo(observableOptions);
        return result.toPromise();
    }

    /**
     * New in *version 0.6*
     * Get Credits Price
     */
    public getCreditsPrice(_options?: PromiseConfigurationOptions): Promise<GetCreditPriceLegacy> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getCreditsPrice(observableOptions);
        return result.toPromise();
    }


}



import { ObservableFilesApi } from './ObservableAPI';

import { FilesApiRequestFactory, FilesApiResponseProcessor} from "../apis/FilesApi";
export class PromiseFilesApi {
    private api: ObservableFilesApi

    public constructor(
        configuration: Configuration,
        requestFactory?: FilesApiRequestFactory,
        responseProcessor?: FilesApiResponseProcessor
    ) {
        this.api = new ObservableFilesApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Abort Multipart Upload
     * @param fileId
     * @param bodyAbortMultipartUploadV0FilesFileIdAbortPost
     */
    public abortMultipartUploadWithHttpInfo(fileId: string, bodyAbortMultipartUploadV0FilesFileIdAbortPost: BodyAbortMultipartUploadV0FilesFileIdAbortPost, _options?: PromiseConfigurationOptions): Promise<HttpInfo<any>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.abortMultipartUploadWithHttpInfo(fileId, bodyAbortMultipartUploadV0FilesFileIdAbortPost, observableOptions);
        return result.toPromise();
    }

    /**
     * Abort Multipart Upload
     * @param fileId
     * @param bodyAbortMultipartUploadV0FilesFileIdAbortPost
     */
    public abortMultipartUpload(fileId: string, bodyAbortMultipartUploadV0FilesFileIdAbortPost: BodyAbortMultipartUploadV0FilesFileIdAbortPost, _options?: PromiseConfigurationOptions): Promise<any> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.abortMultipartUpload(fileId, bodyAbortMultipartUploadV0FilesFileIdAbortPost, observableOptions);
        return result.toPromise();
    }

    /**
     * Complete Multipart Upload
     * @param fileId
     * @param bodyCompleteMultipartUploadV0FilesFileIdCompletePost
     */
    public completeMultipartUploadWithHttpInfo(fileId: string, bodyCompleteMultipartUploadV0FilesFileIdCompletePost: BodyCompleteMultipartUploadV0FilesFileIdCompletePost, _options?: PromiseConfigurationOptions): Promise<HttpInfo<any>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.completeMultipartUploadWithHttpInfo(fileId, bodyCompleteMultipartUploadV0FilesFileIdCompletePost, observableOptions);
        return result.toPromise();
    }

    /**
     * Complete Multipart Upload
     * @param fileId
     * @param bodyCompleteMultipartUploadV0FilesFileIdCompletePost
     */
    public completeMultipartUpload(fileId: string, bodyCompleteMultipartUploadV0FilesFileIdCompletePost: BodyCompleteMultipartUploadV0FilesFileIdCompletePost, _options?: PromiseConfigurationOptions): Promise<any> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.completeMultipartUpload(fileId, bodyCompleteMultipartUploadV0FilesFileIdCompletePost, observableOptions);
        return result.toPromise();
    }

    /**
     * Delete File
     * @param fileId
     */
    public deleteFileWithHttpInfo(fileId: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<any>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.deleteFileWithHttpInfo(fileId, observableOptions);
        return result.toPromise();
    }

    /**
     * Delete File
     * @param fileId
     */
    public deleteFile(fileId: string, _options?: PromiseConfigurationOptions): Promise<any> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.deleteFile(fileId, observableOptions);
        return result.toPromise();
    }

    /**
     * Download File
     * @param fileId
     */
    public downloadFileWithHttpInfo(fileId: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<HttpFile>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.downloadFileWithHttpInfo(fileId, observableOptions);
        return result.toPromise();
    }

    /**
     * Download File
     * @param fileId
     */
    public downloadFile(fileId: string, _options?: PromiseConfigurationOptions): Promise<HttpFile> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.downloadFile(fileId, observableOptions);
        return result.toPromise();
    }

    /**
     * Gets metadata for a given file resource
     * Get File
     * @param fileId
     */
    public getFileWithHttpInfo(fileId: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<any>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getFileWithHttpInfo(fileId, observableOptions);
        return result.toPromise();
    }

    /**
     * Gets metadata for a given file resource
     * Get File
     * @param fileId
     */
    public getFile(fileId: string, _options?: PromiseConfigurationOptions): Promise<any> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getFile(fileId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get Files Page
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public getFilesPageWithHttpInfo(limit?: number, offset?: number, _options?: PromiseConfigurationOptions): Promise<HttpInfo<void>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getFilesPageWithHttpInfo(limit, offset, observableOptions);
        return result.toPromise();
    }

    /**
     * Get Files Page
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public getFilesPage(limit?: number, offset?: number, _options?: PromiseConfigurationOptions): Promise<void> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getFilesPage(limit, offset, observableOptions);
        return result.toPromise();
    }

    /**
     * Get upload links for uploading a file to storage
     * Get Upload Links
     * @param clientFile
     */
    public getUploadLinksWithHttpInfo(clientFile: ClientFile, _options?: PromiseConfigurationOptions): Promise<HttpInfo<ClientFileUploadData>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getUploadLinksWithHttpInfo(clientFile, observableOptions);
        return result.toPromise();
    }

    /**
     * Get upload links for uploading a file to storage
     * Get Upload Links
     * @param clientFile
     */
    public getUploadLinks(clientFile: ClientFile, _options?: PromiseConfigurationOptions): Promise<ClientFileUploadData> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getUploadLinks(clientFile, observableOptions);
        return result.toPromise();
    }

    /**
     * 🚨 **Deprecated**: This endpoint is deprecated and will be removed in a future release. Please use `GET /v0/files/page` instead.    Lists all files stored in the system  Added in *version 0.5*:   Removed in *version 0.7*: This endpoint is deprecated and will be removed in a future version
     * List Files
     */
    public listFilesWithHttpInfo(_options?: PromiseConfigurationOptions): Promise<HttpInfo<Array<any>>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listFilesWithHttpInfo(observableOptions);
        return result.toPromise();
    }

    /**
     * 🚨 **Deprecated**: This endpoint is deprecated and will be removed in a future release. Please use `GET /v0/files/page` instead.    Lists all files stored in the system  Added in *version 0.5*:   Removed in *version 0.7*: This endpoint is deprecated and will be removed in a future version
     * List Files
     */
    public listFiles(_options?: PromiseConfigurationOptions): Promise<Array<any>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listFiles(observableOptions);
        return result.toPromise();
    }

    /**
     * Search files
     * Search Files Page
     * @param [sha256Checksum]
     * @param [fileId]
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public searchFilesPageWithHttpInfo(sha256Checksum?: string, fileId?: string, limit?: number, offset?: number, _options?: PromiseConfigurationOptions): Promise<HttpInfo<PageFile>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.searchFilesPageWithHttpInfo(sha256Checksum, fileId, limit, offset, observableOptions);
        return result.toPromise();
    }

    /**
     * Search files
     * Search Files Page
     * @param [sha256Checksum]
     * @param [fileId]
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public searchFilesPage(sha256Checksum?: string, fileId?: string, limit?: number, offset?: number, _options?: PromiseConfigurationOptions): Promise<PageFile> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.searchFilesPage(sha256Checksum, fileId, limit, offset, observableOptions);
        return result.toPromise();
    }

    /**
     * Uploads a single file to the system
     * Upload File
     * @param file
     * @param [contentLength]
     */
    public uploadFileWithHttpInfo(file: HttpFile, contentLength?: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<any>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.uploadFileWithHttpInfo(file, contentLength, observableOptions);
        return result.toPromise();
    }

    /**
     * Uploads a single file to the system
     * Upload File
     * @param file
     * @param [contentLength]
     */
    public uploadFile(file: HttpFile, contentLength?: string, _options?: PromiseConfigurationOptions): Promise<any> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.uploadFile(file, contentLength, observableOptions);
        return result.toPromise();
    }


}



import { ObservableFunctionJobCollectionsApi } from './ObservableAPI';

import { FunctionJobCollectionsApiRequestFactory, FunctionJobCollectionsApiResponseProcessor} from "../apis/FunctionJobCollectionsApi";
export class PromiseFunctionJobCollectionsApi {
    private api: ObservableFunctionJobCollectionsApi

    public constructor(
        configuration: Configuration,
        requestFactory?: FunctionJobCollectionsApiRequestFactory,
        responseProcessor?: FunctionJobCollectionsApiResponseProcessor
    ) {
        this.api = new ObservableFunctionJobCollectionsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Delete function job collection  New in *version 0.8.0*
     * Delete Function Job Collection
     * @param functionJobCollectionId
     */
    public deleteFunctionJobCollectionWithHttpInfo(functionJobCollectionId: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<any>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.deleteFunctionJobCollectionWithHttpInfo(functionJobCollectionId, observableOptions);
        return result.toPromise();
    }

    /**
     * Delete function job collection  New in *version 0.8.0*
     * Delete Function Job Collection
     * @param functionJobCollectionId
     */
    public deleteFunctionJobCollection(functionJobCollectionId: string, _options?: PromiseConfigurationOptions): Promise<any> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.deleteFunctionJobCollection(functionJobCollectionId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get the function jobs in function job collection  New in *version 0.8.0*
     * Function Job Collection List Function Jobs
     * @param functionJobCollectionId
     */
    public functionJobCollectionListFunctionJobsWithHttpInfo(functionJobCollectionId: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Array<FunctionJobCollectionListFunctionJobs200ResponseInner>>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.functionJobCollectionListFunctionJobsWithHttpInfo(functionJobCollectionId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get the function jobs in function job collection  New in *version 0.8.0*
     * Function Job Collection List Function Jobs
     * @param functionJobCollectionId
     */
    public functionJobCollectionListFunctionJobs(functionJobCollectionId: string, _options?: PromiseConfigurationOptions): Promise<Array<FunctionJobCollectionListFunctionJobs200ResponseInner>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.functionJobCollectionListFunctionJobs(functionJobCollectionId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get function job collection status  New in *version 0.8.0*
     * Function Job Collection Status
     * @param functionJobCollectionId
     */
    public functionJobCollectionStatusWithHttpInfo(functionJobCollectionId: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<FunctionJobCollectionStatus>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.functionJobCollectionStatusWithHttpInfo(functionJobCollectionId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get function job collection status  New in *version 0.8.0*
     * Function Job Collection Status
     * @param functionJobCollectionId
     */
    public functionJobCollectionStatus(functionJobCollectionId: string, _options?: PromiseConfigurationOptions): Promise<FunctionJobCollectionStatus> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.functionJobCollectionStatus(functionJobCollectionId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get function job collection  New in *version 0.8.0*
     * Get Function Job Collection
     * @param functionJobCollectionId
     */
    public getFunctionJobCollectionWithHttpInfo(functionJobCollectionId: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<RegisteredFunctionJobCollection>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getFunctionJobCollectionWithHttpInfo(functionJobCollectionId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get function job collection  New in *version 0.8.0*
     * Get Function Job Collection
     * @param functionJobCollectionId
     */
    public getFunctionJobCollection(functionJobCollectionId: string, _options?: PromiseConfigurationOptions): Promise<RegisteredFunctionJobCollection> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getFunctionJobCollection(functionJobCollectionId, observableOptions);
        return result.toPromise();
    }

    /**
     * List function job collections  New in *version 0.8.0*
     * List Function Job Collections
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public listFunctionJobCollectionsWithHttpInfo(limit?: number, offset?: number, _options?: PromiseConfigurationOptions): Promise<HttpInfo<PageRegisteredFunctionJobCollection>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listFunctionJobCollectionsWithHttpInfo(limit, offset, observableOptions);
        return result.toPromise();
    }

    /**
     * List function job collections  New in *version 0.8.0*
     * List Function Job Collections
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public listFunctionJobCollections(limit?: number, offset?: number, _options?: PromiseConfigurationOptions): Promise<PageRegisteredFunctionJobCollection> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listFunctionJobCollections(limit, offset, observableOptions);
        return result.toPromise();
    }

    /**
     * Register function job collection  New in *version 0.8.0*
     * Register Function Job Collection
     * @param functionJobCollection
     */
    public registerFunctionJobCollectionWithHttpInfo(functionJobCollection: FunctionJobCollection, _options?: PromiseConfigurationOptions): Promise<HttpInfo<RegisteredFunctionJobCollection>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.registerFunctionJobCollectionWithHttpInfo(functionJobCollection, observableOptions);
        return result.toPromise();
    }

    /**
     * Register function job collection  New in *version 0.8.0*
     * Register Function Job Collection
     * @param functionJobCollection
     */
    public registerFunctionJobCollection(functionJobCollection: FunctionJobCollection, _options?: PromiseConfigurationOptions): Promise<RegisteredFunctionJobCollection> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.registerFunctionJobCollection(functionJobCollection, observableOptions);
        return result.toPromise();
    }


}



import { ObservableFunctionJobsApi } from './ObservableAPI';

import { FunctionJobsApiRequestFactory, FunctionJobsApiResponseProcessor} from "../apis/FunctionJobsApi";
export class PromiseFunctionJobsApi {
    private api: ObservableFunctionJobsApi

    public constructor(
        configuration: Configuration,
        requestFactory?: FunctionJobsApiRequestFactory,
        responseProcessor?: FunctionJobsApiResponseProcessor
    ) {
        this.api = new ObservableFunctionJobsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Delete function job  New in *version 0.8.0*
     * Delete Function Job
     * @param functionJobId
     */
    public deleteFunctionJobWithHttpInfo(functionJobId: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<any>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.deleteFunctionJobWithHttpInfo(functionJobId, observableOptions);
        return result.toPromise();
    }

    /**
     * Delete function job  New in *version 0.8.0*
     * Delete Function Job
     * @param functionJobId
     */
    public deleteFunctionJob(functionJobId: string, _options?: PromiseConfigurationOptions): Promise<any> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.deleteFunctionJob(functionJobId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get function job outputs  New in *version 0.8.0*
     * Function Job Outputs
     * @param functionJobId
     */
    public functionJobOutputsWithHttpInfo(functionJobId: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<any>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.functionJobOutputsWithHttpInfo(functionJobId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get function job outputs  New in *version 0.8.0*
     * Function Job Outputs
     * @param functionJobId
     */
    public functionJobOutputs(functionJobId: string, _options?: PromiseConfigurationOptions): Promise<any> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.functionJobOutputs(functionJobId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get function job status  New in *version 0.8.0*
     * Function Job Status
     * @param functionJobId
     */
    public functionJobStatusWithHttpInfo(functionJobId: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<FunctionJobStatus>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.functionJobStatusWithHttpInfo(functionJobId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get function job status  New in *version 0.8.0*
     * Function Job Status
     * @param functionJobId
     */
    public functionJobStatus(functionJobId: string, _options?: PromiseConfigurationOptions): Promise<FunctionJobStatus> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.functionJobStatus(functionJobId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get function job  New in *version 0.8.0*
     * Get Function Job
     * @param functionJobId
     */
    public getFunctionJobWithHttpInfo(functionJobId: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<ResponseGetFunctionJobV0FunctionJobsFunctionJobIdGet>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getFunctionJobWithHttpInfo(functionJobId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get function job  New in *version 0.8.0*
     * Get Function Job
     * @param functionJobId
     */
    public getFunctionJob(functionJobId: string, _options?: PromiseConfigurationOptions): Promise<ResponseGetFunctionJobV0FunctionJobsFunctionJobIdGet> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getFunctionJob(functionJobId, observableOptions);
        return result.toPromise();
    }

    /**
     * List function jobs  New in *version 0.8.0*
     * List Function Jobs
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public listFunctionJobsWithHttpInfo(limit?: number, offset?: number, _options?: PromiseConfigurationOptions): Promise<HttpInfo<PageAnnotatedUnionRegisteredProjectFunctionJobRegisteredPythonCodeFunctionJobRegisteredSolverFunctionJobFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listFunctionJobsWithHttpInfo(limit, offset, observableOptions);
        return result.toPromise();
    }

    /**
     * List function jobs  New in *version 0.8.0*
     * List Function Jobs
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public listFunctionJobs(limit?: number, offset?: number, _options?: PromiseConfigurationOptions): Promise<PageAnnotatedUnionRegisteredProjectFunctionJobRegisteredPythonCodeFunctionJobRegisteredSolverFunctionJobFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listFunctionJobs(limit, offset, observableOptions);
        return result.toPromise();
    }

    /**
     * Create function job  New in *version 0.8.0*
     * Register Function Job
     * @param functionJob
     */
    public registerFunctionJobWithHttpInfo(functionJob: FunctionJob, _options?: PromiseConfigurationOptions): Promise<HttpInfo<ResponseRegisterFunctionJobV0FunctionJobsPost>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.registerFunctionJobWithHttpInfo(functionJob, observableOptions);
        return result.toPromise();
    }

    /**
     * Create function job  New in *version 0.8.0*
     * Register Function Job
     * @param functionJob
     */
    public registerFunctionJob(functionJob: FunctionJob, _options?: PromiseConfigurationOptions): Promise<ResponseRegisterFunctionJobV0FunctionJobsPost> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.registerFunctionJob(functionJob, observableOptions);
        return result.toPromise();
    }


}



import { ObservableFunctionsApi } from './ObservableAPI';

import { FunctionsApiRequestFactory, FunctionsApiResponseProcessor} from "../apis/FunctionsApi";
export class PromiseFunctionsApi {
    private api: ObservableFunctionsApi

    public constructor(
        configuration: Configuration,
        requestFactory?: FunctionsApiRequestFactory,
        responseProcessor?: FunctionsApiResponseProcessor
    ) {
        this.api = new ObservableFunctionsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Delete function  New in *version 0.8.0*
     * Delete Function
     * @param functionId
     */
    public deleteFunctionWithHttpInfo(functionId: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<any>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.deleteFunctionWithHttpInfo(functionId, observableOptions);
        return result.toPromise();
    }

    /**
     * Delete function  New in *version 0.8.0*
     * Delete Function
     * @param functionId
     */
    public deleteFunction(functionId: string, _options?: PromiseConfigurationOptions): Promise<any> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.deleteFunction(functionId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get function  New in *version 0.8.0*
     * Get Function
     * @param functionId
     */
    public getFunctionWithHttpInfo(functionId: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<ResponseGetFunctionV0FunctionsFunctionIdGet>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getFunctionWithHttpInfo(functionId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get function  New in *version 0.8.0*
     * Get Function
     * @param functionId
     */
    public getFunction(functionId: string, _options?: PromiseConfigurationOptions): Promise<ResponseGetFunctionV0FunctionsFunctionIdGet> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getFunction(functionId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get function input schema  New in *version 0.8.0*
     * Get Function Inputschema
     * @param functionId
     */
    public getFunctionInputschemaWithHttpInfo(functionId: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<JSONFunctionInputSchema>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getFunctionInputschemaWithHttpInfo(functionId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get function input schema  New in *version 0.8.0*
     * Get Function Inputschema
     * @param functionId
     */
    public getFunctionInputschema(functionId: string, _options?: PromiseConfigurationOptions): Promise<JSONFunctionInputSchema> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getFunctionInputschema(functionId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get function output schema  New in *version 0.8.0*
     * Get Function Outputschema
     * @param functionId
     */
    public getFunctionOutputschemaWithHttpInfo(functionId: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<JSONFunctionInputSchema>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getFunctionOutputschemaWithHttpInfo(functionId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get function output schema  New in *version 0.8.0*
     * Get Function Outputschema
     * @param functionId
     */
    public getFunctionOutputschema(functionId: string, _options?: PromiseConfigurationOptions): Promise<JSONFunctionInputSchema> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getFunctionOutputschema(functionId, observableOptions);
        return result.toPromise();
    }

    /**
     * List function jobs for a function  New in *version 0.8.0*
     * List Function Jobs For Functionid
     * @param functionId
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public listFunctionJobsForFunctionidWithHttpInfo(functionId: string, limit?: number, offset?: number, _options?: PromiseConfigurationOptions): Promise<HttpInfo<PageAnnotatedUnionRegisteredProjectFunctionJobRegisteredPythonCodeFunctionJobRegisteredSolverFunctionJobFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listFunctionJobsForFunctionidWithHttpInfo(functionId, limit, offset, observableOptions);
        return result.toPromise();
    }

    /**
     * List function jobs for a function  New in *version 0.8.0*
     * List Function Jobs For Functionid
     * @param functionId
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public listFunctionJobsForFunctionid(functionId: string, limit?: number, offset?: number, _options?: PromiseConfigurationOptions): Promise<PageAnnotatedUnionRegisteredProjectFunctionJobRegisteredPythonCodeFunctionJobRegisteredSolverFunctionJobFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listFunctionJobsForFunctionid(functionId, limit, offset, observableOptions);
        return result.toPromise();
    }

    /**
     * List functions  New in *version 0.8.0*
     * List Functions
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public listFunctionsWithHttpInfo(limit?: number, offset?: number, _options?: PromiseConfigurationOptions): Promise<HttpInfo<PageAnnotatedUnionRegisteredProjectFunctionRegisteredPythonCodeFunctionRegisteredSolverFunctionFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listFunctionsWithHttpInfo(limit, offset, observableOptions);
        return result.toPromise();
    }

    /**
     * List functions  New in *version 0.8.0*
     * List Functions
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public listFunctions(limit?: number, offset?: number, _options?: PromiseConfigurationOptions): Promise<PageAnnotatedUnionRegisteredProjectFunctionRegisteredPythonCodeFunctionRegisteredSolverFunctionFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listFunctions(limit, offset, observableOptions);
        return result.toPromise();
    }

    /**
     * Map function over input parameters  New in *version 0.8.0*
     * Map Function
     * @param functionId
     * @param requestBody
     */
    public mapFunctionWithHttpInfo(functionId: string, requestBody: Array<any | null>, _options?: PromiseConfigurationOptions): Promise<HttpInfo<RegisteredFunctionJobCollection>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.mapFunctionWithHttpInfo(functionId, requestBody, observableOptions);
        return result.toPromise();
    }

    /**
     * Map function over input parameters  New in *version 0.8.0*
     * Map Function
     * @param functionId
     * @param requestBody
     */
    public mapFunction(functionId: string, requestBody: Array<any | null>, _options?: PromiseConfigurationOptions): Promise<RegisteredFunctionJobCollection> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.mapFunction(functionId, requestBody, observableOptions);
        return result.toPromise();
    }

    /**
     * Create function  New in *version 0.8.0*
     * Register Function
     * @param _function
     */
    public registerFunctionWithHttpInfo(_function: Function, _options?: PromiseConfigurationOptions): Promise<HttpInfo<ResponseRegisterFunctionV0FunctionsPost>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.registerFunctionWithHttpInfo(_function, observableOptions);
        return result.toPromise();
    }

    /**
     * Create function  New in *version 0.8.0*
     * Register Function
     * @param _function
     */
    public registerFunction(_function: Function, _options?: PromiseConfigurationOptions): Promise<ResponseRegisterFunctionV0FunctionsPost> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.registerFunction(_function, observableOptions);
        return result.toPromise();
    }

    /**
     * Run function  New in *version 0.8.0*
     * Run Function
     * @param functionId
     * @param body
     */
    public runFunctionWithHttpInfo(functionId: string, body: any, _options?: PromiseConfigurationOptions): Promise<HttpInfo<ResponseRunFunctionV0FunctionsFunctionIdRunPost>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.runFunctionWithHttpInfo(functionId, body, observableOptions);
        return result.toPromise();
    }

    /**
     * Run function  New in *version 0.8.0*
     * Run Function
     * @param functionId
     * @param body
     */
    public runFunction(functionId: string, body: any, _options?: PromiseConfigurationOptions): Promise<ResponseRunFunctionV0FunctionsFunctionIdRunPost> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.runFunction(functionId, body, observableOptions);
        return result.toPromise();
    }

    /**
     * Update function  New in *version 0.8.0*
     * Update Function Description
     * @param functionId
     * @param description
     */
    public updateFunctionDescriptionWithHttpInfo(functionId: string, description: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<ResponseUpdateFunctionDescriptionV0FunctionsFunctionIdDescriptionPatch>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.updateFunctionDescriptionWithHttpInfo(functionId, description, observableOptions);
        return result.toPromise();
    }

    /**
     * Update function  New in *version 0.8.0*
     * Update Function Description
     * @param functionId
     * @param description
     */
    public updateFunctionDescription(functionId: string, description: string, _options?: PromiseConfigurationOptions): Promise<ResponseUpdateFunctionDescriptionV0FunctionsFunctionIdDescriptionPatch> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.updateFunctionDescription(functionId, description, observableOptions);
        return result.toPromise();
    }

    /**
     * Update function  New in *version 0.8.0*
     * Update Function Title
     * @param functionId
     * @param title
     */
    public updateFunctionTitleWithHttpInfo(functionId: string, title: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<ResponseUpdateFunctionTitleV0FunctionsFunctionIdTitlePatch>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.updateFunctionTitleWithHttpInfo(functionId, title, observableOptions);
        return result.toPromise();
    }

    /**
     * Update function  New in *version 0.8.0*
     * Update Function Title
     * @param functionId
     * @param title
     */
    public updateFunctionTitle(functionId: string, title: string, _options?: PromiseConfigurationOptions): Promise<ResponseUpdateFunctionTitleV0FunctionsFunctionIdTitlePatch> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.updateFunctionTitle(functionId, title, observableOptions);
        return result.toPromise();
    }

    /**
     * Validate inputs against the function\'s input schema  New in *version 0.8.0*
     * Validate Function Inputs
     * @param functionId
     * @param body
     */
    public validateFunctionInputsWithHttpInfo(functionId: string, body: any, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Array<any>>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.validateFunctionInputsWithHttpInfo(functionId, body, observableOptions);
        return result.toPromise();
    }

    /**
     * Validate inputs against the function\'s input schema  New in *version 0.8.0*
     * Validate Function Inputs
     * @param functionId
     * @param body
     */
    public validateFunctionInputs(functionId: string, body: any, _options?: PromiseConfigurationOptions): Promise<Array<any>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.validateFunctionInputs(functionId, body, observableOptions);
        return result.toPromise();
    }


}



import { ObservableLicensedItemsApi } from './ObservableAPI';

import { LicensedItemsApiRequestFactory, LicensedItemsApiResponseProcessor} from "../apis/LicensedItemsApi";
export class PromiseLicensedItemsApi {
    private api: ObservableLicensedItemsApi

    public constructor(
        configuration: Configuration,
        requestFactory?: LicensedItemsApiRequestFactory,
        responseProcessor?: LicensedItemsApiResponseProcessor
    ) {
        this.api = new ObservableLicensedItemsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get all licensed items
     * Get Licensed Items
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public getLicensedItemsWithHttpInfo(limit?: number, offset?: number, _options?: PromiseConfigurationOptions): Promise<HttpInfo<PageLicensedItemGet>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getLicensedItemsWithHttpInfo(limit, offset, observableOptions);
        return result.toPromise();
    }

    /**
     * Get all licensed items
     * Get Licensed Items
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public getLicensedItems(limit?: number, offset?: number, _options?: PromiseConfigurationOptions): Promise<PageLicensedItemGet> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getLicensedItems(limit, offset, observableOptions);
        return result.toPromise();
    }

    /**
     * Release previously checked out licensed item
     * Release Licensed Item
     * @param licensedItemId
     * @param licensedItemCheckoutId
     */
    public releaseLicensedItemWithHttpInfo(licensedItemId: string, licensedItemCheckoutId: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<LicensedItemCheckoutGet>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.releaseLicensedItemWithHttpInfo(licensedItemId, licensedItemCheckoutId, observableOptions);
        return result.toPromise();
    }

    /**
     * Release previously checked out licensed item
     * Release Licensed Item
     * @param licensedItemId
     * @param licensedItemCheckoutId
     */
    public releaseLicensedItem(licensedItemId: string, licensedItemCheckoutId: string, _options?: PromiseConfigurationOptions): Promise<LicensedItemCheckoutGet> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.releaseLicensedItem(licensedItemId, licensedItemCheckoutId, observableOptions);
        return result.toPromise();
    }


}



import { ObservableMetaApi } from './ObservableAPI';

import { MetaApiRequestFactory, MetaApiResponseProcessor} from "../apis/MetaApi";
export class PromiseMetaApi {
    private api: ObservableMetaApi

    public constructor(
        configuration: Configuration,
        requestFactory?: MetaApiRequestFactory,
        responseProcessor?: MetaApiResponseProcessor
    ) {
        this.api = new ObservableMetaApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get Service Metadata
     */
    public getServiceMetadataWithHttpInfo(_options?: PromiseConfigurationOptions): Promise<HttpInfo<Meta>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getServiceMetadataWithHttpInfo(observableOptions);
        return result.toPromise();
    }

    /**
     * Get Service Metadata
     */
    public getServiceMetadata(_options?: PromiseConfigurationOptions): Promise<Meta> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getServiceMetadata(observableOptions);
        return result.toPromise();
    }


}



import { ObservableProgramsApi } from './ObservableAPI';

import { ProgramsApiRequestFactory, ProgramsApiResponseProcessor} from "../apis/ProgramsApi";
export class PromiseProgramsApi {
    private api: ObservableProgramsApi

    public constructor(
        configuration: Configuration,
        requestFactory?: ProgramsApiRequestFactory,
        responseProcessor?: ProgramsApiResponseProcessor
    ) {
        this.api = new ObservableProgramsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Creates a program job
     * Create Program Job
     * @param programKey
     * @param version
     * @param [xSimcoreParentProjectUuid]
     * @param [xSimcoreParentNodeId]
     * @param [bodyCreateProgramJobV0ProgramsProgramKeyReleasesVersionJobsPost]
     */
    public createProgramJobWithHttpInfo(programKey: string, version: string, xSimcoreParentProjectUuid?: string, xSimcoreParentNodeId?: string, bodyCreateProgramJobV0ProgramsProgramKeyReleasesVersionJobsPost?: BodyCreateProgramJobV0ProgramsProgramKeyReleasesVersionJobsPost, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Job>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.createProgramJobWithHttpInfo(programKey, version, xSimcoreParentProjectUuid, xSimcoreParentNodeId, bodyCreateProgramJobV0ProgramsProgramKeyReleasesVersionJobsPost, observableOptions);
        return result.toPromise();
    }

    /**
     * Creates a program job
     * Create Program Job
     * @param programKey
     * @param version
     * @param [xSimcoreParentProjectUuid]
     * @param [xSimcoreParentNodeId]
     * @param [bodyCreateProgramJobV0ProgramsProgramKeyReleasesVersionJobsPost]
     */
    public createProgramJob(programKey: string, version: string, xSimcoreParentProjectUuid?: string, xSimcoreParentNodeId?: string, bodyCreateProgramJobV0ProgramsProgramKeyReleasesVersionJobsPost?: BodyCreateProgramJobV0ProgramsProgramKeyReleasesVersionJobsPost, _options?: PromiseConfigurationOptions): Promise<Job> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.createProgramJob(programKey, version, xSimcoreParentProjectUuid, xSimcoreParentNodeId, bodyCreateProgramJobV0ProgramsProgramKeyReleasesVersionJobsPost, observableOptions);
        return result.toPromise();
    }

    /**
     * Gets a specific release of a solver
     * Get Program Release
     * @param programKey
     * @param version
     */
    public getProgramReleaseWithHttpInfo(programKey: string, version: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Program>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getProgramReleaseWithHttpInfo(programKey, version, observableOptions);
        return result.toPromise();
    }

    /**
     * Gets a specific release of a solver
     * Get Program Release
     * @param programKey
     * @param version
     */
    public getProgramRelease(programKey: string, version: string, _options?: PromiseConfigurationOptions): Promise<Program> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getProgramRelease(programKey, version, observableOptions);
        return result.toPromise();
    }


}



import { ObservableSolversApi } from './ObservableAPI';

import { SolversApiRequestFactory, SolversApiResponseProcessor} from "../apis/SolversApi";
export class PromiseSolversApi {
    private api: ObservableSolversApi

    public constructor(
        configuration: Configuration,
        requestFactory?: SolversApiRequestFactory,
        responseProcessor?: SolversApiResponseProcessor
    ) {
        this.api = new ObservableSolversApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Creates a job in a specific release with given inputs. This operation does not start the job.  New in *version 0.5*
     * Create Solver Job
     * @param solverKey
     * @param version
     * @param jobInputs
     * @param [hidden]
     * @param [xSimcoreParentProjectUuid]
     * @param [xSimcoreParentNodeId]
     */
    public createSolverJobWithHttpInfo(solverKey: string, version: string, jobInputs: JobInputs, hidden?: boolean, xSimcoreParentProjectUuid?: string, xSimcoreParentNodeId?: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Job>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.createSolverJobWithHttpInfo(solverKey, version, jobInputs, hidden, xSimcoreParentProjectUuid, xSimcoreParentNodeId, observableOptions);
        return result.toPromise();
    }

    /**
     * Creates a job in a specific release with given inputs. This operation does not start the job.  New in *version 0.5*
     * Create Solver Job
     * @param solverKey
     * @param version
     * @param jobInputs
     * @param [hidden]
     * @param [xSimcoreParentProjectUuid]
     * @param [xSimcoreParentNodeId]
     */
    public createSolverJob(solverKey: string, version: string, jobInputs: JobInputs, hidden?: boolean, xSimcoreParentProjectUuid?: string, xSimcoreParentNodeId?: string, _options?: PromiseConfigurationOptions): Promise<Job> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.createSolverJob(solverKey, version, jobInputs, hidden, xSimcoreParentProjectUuid, xSimcoreParentNodeId, observableOptions);
        return result.toPromise();
    }

    /**
     * Deletes an existing solver job  New in *version 0.7*
     * Delete Job
     * @param solverKey
     * @param version
     * @param jobId
     */
    public deleteJobWithHttpInfo(solverKey: string, version: string, jobId: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<void>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.deleteJobWithHttpInfo(solverKey, version, jobId, observableOptions);
        return result.toPromise();
    }

    /**
     * Deletes an existing solver job  New in *version 0.7*
     * Delete Job
     * @param solverKey
     * @param version
     * @param jobId
     */
    public deleteJob(solverKey: string, version: string, jobId: string, _options?: PromiseConfigurationOptions): Promise<void> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.deleteJob(solverKey, version, jobId, observableOptions);
        return result.toPromise();
    }

    /**
     * Gets job of a given solver
     * Get Job
     * @param solverKey
     * @param version
     * @param jobId
     */
    public getJobWithHttpInfo(solverKey: string, version: string, jobId: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Job>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getJobWithHttpInfo(solverKey, version, jobId, observableOptions);
        return result.toPromise();
    }

    /**
     * Gets job of a given solver
     * Get Job
     * @param solverKey
     * @param version
     * @param jobId
     */
    public getJob(solverKey: string, version: string, jobId: string, _options?: PromiseConfigurationOptions): Promise<Job> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getJob(solverKey, version, jobId, observableOptions);
        return result.toPromise();
    }

    /**
     * Gets custom metadata from a job  New in *version 0.7*
     * Get Job Custom Metadata
     * @param solverKey
     * @param version
     * @param jobId
     */
    public getJobCustomMetadataWithHttpInfo(solverKey: string, version: string, jobId: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<JobMetadata>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getJobCustomMetadataWithHttpInfo(solverKey, version, jobId, observableOptions);
        return result.toPromise();
    }

    /**
     * Gets custom metadata from a job  New in *version 0.7*
     * Get Job Custom Metadata
     * @param solverKey
     * @param version
     * @param jobId
     */
    public getJobCustomMetadata(solverKey: string, version: string, jobId: string, _options?: PromiseConfigurationOptions): Promise<JobMetadata> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getJobCustomMetadata(solverKey, version, jobId, observableOptions);
        return result.toPromise();
    }

    /**
     * Special extra output with persistent logs file for the solver run.  **NOTE**: this is not a log stream but a predefined output that is only available after the job is done  New in *version 0.4*
     * Get Job Output Logfile
     * @param solverKey
     * @param version
     * @param jobId
     */
    public getJobOutputLogfileWithHttpInfo(solverKey: string, version: string, jobId: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<HttpFile>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getJobOutputLogfileWithHttpInfo(solverKey, version, jobId, observableOptions);
        return result.toPromise();
    }

    /**
     * Special extra output with persistent logs file for the solver run.  **NOTE**: this is not a log stream but a predefined output that is only available after the job is done  New in *version 0.4*
     * Get Job Output Logfile
     * @param solverKey
     * @param version
     * @param jobId
     */
    public getJobOutputLogfile(solverKey: string, version: string, jobId: string, _options?: PromiseConfigurationOptions): Promise<HttpFile> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getJobOutputLogfile(solverKey, version, jobId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get Job Outputs
     * @param solverKey
     * @param version
     * @param jobId
     */
    public getJobOutputsWithHttpInfo(solverKey: string, version: string, jobId: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<JobOutputs>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getJobOutputsWithHttpInfo(solverKey, version, jobId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get Job Outputs
     * @param solverKey
     * @param version
     * @param jobId
     */
    public getJobOutputs(solverKey: string, version: string, jobId: string, _options?: PromiseConfigurationOptions): Promise<JobOutputs> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getJobOutputs(solverKey, version, jobId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get job pricing unit  New in *version 0.7*
     * Get Job Pricing Unit
     * @param solverKey
     * @param version
     * @param jobId
     */
    public getJobPricingUnitWithHttpInfo(solverKey: string, version: string, jobId: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<PricingUnitGetLegacy>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getJobPricingUnitWithHttpInfo(solverKey, version, jobId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get job pricing unit  New in *version 0.7*
     * Get Job Pricing Unit
     * @param solverKey
     * @param version
     * @param jobId
     */
    public getJobPricingUnit(solverKey: string, version: string, jobId: string, _options?: PromiseConfigurationOptions): Promise<PricingUnitGetLegacy> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getJobPricingUnit(solverKey, version, jobId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get job wallet  New in *version 0.7*
     * Get Job Wallet
     * @param solverKey
     * @param version
     * @param jobId
     */
    public getJobWalletWithHttpInfo(solverKey: string, version: string, jobId: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<WalletGetWithAvailableCreditsLegacy>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getJobWalletWithHttpInfo(solverKey, version, jobId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get job wallet  New in *version 0.7*
     * Get Job Wallet
     * @param solverKey
     * @param version
     * @param jobId
     */
    public getJobWallet(solverKey: string, version: string, jobId: string, _options?: PromiseConfigurationOptions): Promise<WalletGetWithAvailableCreditsLegacy> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getJobWallet(solverKey, version, jobId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get Log Stream
     * @param solverKey
     * @param version
     * @param jobId
     */
    public getLogStreamWithHttpInfo(solverKey: string, version: string, jobId: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Response200GetLogStreamV0SolversSolverKeyReleasesVersionJobsJobIdLogstreamGet>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getLogStreamWithHttpInfo(solverKey, version, jobId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get Log Stream
     * @param solverKey
     * @param version
     * @param jobId
     */
    public getLogStream(solverKey: string, version: string, jobId: string, _options?: PromiseConfigurationOptions): Promise<Response200GetLogStreamV0SolversSolverKeyReleasesVersionJobsJobIdLogstreamGet> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getLogStream(solverKey, version, jobId, observableOptions);
        return result.toPromise();
    }

    /**
     * Gets latest release of a solver  Added in *version 0.7.1*: `version_display` field in the response
     * Get Solver
     * @param solverKey
     */
    public getSolverWithHttpInfo(solverKey: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Solver>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getSolverWithHttpInfo(solverKey, observableOptions);
        return result.toPromise();
    }

    /**
     * Gets latest release of a solver  Added in *version 0.7.1*: `version_display` field in the response
     * Get Solver
     * @param solverKey
     */
    public getSolver(solverKey: string, _options?: PromiseConfigurationOptions): Promise<Solver> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getSolver(solverKey, observableOptions);
        return result.toPromise();
    }

    /**
     * Gets solver pricing plan  New in *version 0.7*  Added in *version 0.7.1*: `version_display` field in the response
     * Get Solver Pricing Plan
     * @param solverKey
     * @param version
     */
    public getSolverPricingPlanWithHttpInfo(solverKey: string, version: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<ServicePricingPlanGetLegacy>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getSolverPricingPlanWithHttpInfo(solverKey, version, observableOptions);
        return result.toPromise();
    }

    /**
     * Gets solver pricing plan  New in *version 0.7*  Added in *version 0.7.1*: `version_display` field in the response
     * Get Solver Pricing Plan
     * @param solverKey
     * @param version
     */
    public getSolverPricingPlan(solverKey: string, version: string, _options?: PromiseConfigurationOptions): Promise<ServicePricingPlanGetLegacy> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getSolverPricingPlan(solverKey, version, observableOptions);
        return result.toPromise();
    }

    /**
     * Gets a specific release of a solver  Added in *version 0.7.1*: `version_display` field in the response
     * Get Solver Release
     * @param solverKey
     * @param version
     */
    public getSolverReleaseWithHttpInfo(solverKey: string, version: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Solver>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getSolverReleaseWithHttpInfo(solverKey, version, observableOptions);
        return result.toPromise();
    }

    /**
     * Gets a specific release of a solver  Added in *version 0.7.1*: `version_display` field in the response
     * Get Solver Release
     * @param solverKey
     * @param version
     */
    public getSolverRelease(solverKey: string, version: string, _options?: PromiseConfigurationOptions): Promise<Solver> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getSolverRelease(solverKey, version, observableOptions);
        return result.toPromise();
    }

    /**
     * Inspects the current status of a job  New in *version 0.5*
     * Inspect Job
     * @param solverKey
     * @param version
     * @param jobId
     */
    public inspectJobWithHttpInfo(solverKey: string, version: string, jobId: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<JobStatus>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.inspectJobWithHttpInfo(solverKey, version, jobId, observableOptions);
        return result.toPromise();
    }

    /**
     * Inspects the current status of a job  New in *version 0.5*
     * Inspect Job
     * @param solverKey
     * @param version
     * @param jobId
     */
    public inspectJob(solverKey: string, version: string, jobId: string, _options?: PromiseConfigurationOptions): Promise<JobStatus> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.inspectJob(solverKey, version, jobId, observableOptions);
        return result.toPromise();
    }

    /**
     * 🚨 **Deprecated**: This endpoint is deprecated and will be removed in a future release. Please use `GET /{solver_key}/releases/{version}/jobs/page` instead.    List of jobs in a specific released solver (limited to 20 jobs)  New in *version 0.5*  Removed in *version 0.7*: This endpoint is deprecated and will be removed in a future version
     * List Jobs
     * @param solverKey
     * @param version
     */
    public listJobsWithHttpInfo(solverKey: string, version: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Array<Job>>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listJobsWithHttpInfo(solverKey, version, observableOptions);
        return result.toPromise();
    }

    /**
     * 🚨 **Deprecated**: This endpoint is deprecated and will be removed in a future release. Please use `GET /{solver_key}/releases/{version}/jobs/page` instead.    List of jobs in a specific released solver (limited to 20 jobs)  New in *version 0.5*  Removed in *version 0.7*: This endpoint is deprecated and will be removed in a future version
     * List Jobs
     * @param solverKey
     * @param version
     */
    public listJobs(solverKey: string, version: string, _options?: PromiseConfigurationOptions): Promise<Array<Job>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listJobs(solverKey, version, observableOptions);
        return result.toPromise();
    }

    /**
     * List of jobs on a specific released solver (includes pagination)  New in *version 0.7*
     * List Jobs Paginated
     * @param solverKey
     * @param version
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public listJobsPaginatedWithHttpInfo(solverKey: string, version: string, limit?: number, offset?: number, _options?: PromiseConfigurationOptions): Promise<HttpInfo<PageJob>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listJobsPaginatedWithHttpInfo(solverKey, version, limit, offset, observableOptions);
        return result.toPromise();
    }

    /**
     * List of jobs on a specific released solver (includes pagination)  New in *version 0.7*
     * List Jobs Paginated
     * @param solverKey
     * @param version
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public listJobsPaginated(solverKey: string, version: string, limit?: number, offset?: number, _options?: PromiseConfigurationOptions): Promise<PageJob> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listJobsPaginated(solverKey, version, limit, offset, observableOptions);
        return result.toPromise();
    }

    /**
     * Lists inputs and outputs of a given solver  New in *version 0.5*  Added in *version 0.7.1*: `version_display` field in the response
     * List Solver Ports
     * @param solverKey
     * @param version
     */
    public listSolverPortsWithHttpInfo(solverKey: string, version: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<OnePageSolverPort>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listSolverPortsWithHttpInfo(solverKey, version, observableOptions);
        return result.toPromise();
    }

    /**
     * Lists inputs and outputs of a given solver  New in *version 0.5*  Added in *version 0.7.1*: `version_display` field in the response
     * List Solver Ports
     * @param solverKey
     * @param version
     */
    public listSolverPorts(solverKey: string, version: string, _options?: PromiseConfigurationOptions): Promise<OnePageSolverPort> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listSolverPorts(solverKey, version, observableOptions);
        return result.toPromise();
    }

    /**
     * Lists all releases of a given (one) solver  Added in *version 0.7.1*: `version_display` field in the response
     * List Solver Releases
     * @param solverKey
     */
    public listSolverReleasesWithHttpInfo(solverKey: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Array<Solver>>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listSolverReleasesWithHttpInfo(solverKey, observableOptions);
        return result.toPromise();
    }

    /**
     * Lists all releases of a given (one) solver  Added in *version 0.7.1*: `version_display` field in the response
     * List Solver Releases
     * @param solverKey
     */
    public listSolverReleases(solverKey: string, _options?: PromiseConfigurationOptions): Promise<Array<Solver>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listSolverReleases(solverKey, observableOptions);
        return result.toPromise();
    }

    /**
     * 🚨 **Deprecated**: This endpoint is deprecated and will be removed in a future release. Please use `GET /v0/solvers/page` instead.    Lists all available solvers (latest version)  New in *version 0.5*
     * List Solvers
     */
    public listSolversWithHttpInfo(_options?: PromiseConfigurationOptions): Promise<HttpInfo<Array<Solver>>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listSolversWithHttpInfo(observableOptions);
        return result.toPromise();
    }

    /**
     * 🚨 **Deprecated**: This endpoint is deprecated and will be removed in a future release. Please use `GET /v0/solvers/page` instead.    Lists all available solvers (latest version)  New in *version 0.5*
     * List Solvers
     */
    public listSolvers(_options?: PromiseConfigurationOptions): Promise<Array<Solver>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listSolvers(observableOptions);
        return result.toPromise();
    }

    /**
     * 🚨 **Deprecated**: This endpoint is deprecated and will be removed in a future release. Please use `GET /v0/solvers/{solver_key}/releases/page` instead.    Lists **all** released solvers (not just latest version)  New in *version 0.5*
     * Lists All Releases
     */
    public listSolversReleasesWithHttpInfo(_options?: PromiseConfigurationOptions): Promise<HttpInfo<Array<Solver>>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listSolversReleasesWithHttpInfo(observableOptions);
        return result.toPromise();
    }

    /**
     * 🚨 **Deprecated**: This endpoint is deprecated and will be removed in a future release. Please use `GET /v0/solvers/{solver_key}/releases/page` instead.    Lists **all** released solvers (not just latest version)  New in *version 0.5*
     * Lists All Releases
     */
    public listSolversReleases(_options?: PromiseConfigurationOptions): Promise<Array<Solver>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listSolversReleases(observableOptions);
        return result.toPromise();
    }

    /**
     * Updates custom metadata from a job  New in *version 0.7*
     * Replace Job Custom Metadata
     * @param solverKey
     * @param version
     * @param jobId
     * @param jobMetadataUpdate
     */
    public replaceJobCustomMetadataWithHttpInfo(solverKey: string, version: string, jobId: string, jobMetadataUpdate: JobMetadataUpdate, _options?: PromiseConfigurationOptions): Promise<HttpInfo<JobMetadata>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.replaceJobCustomMetadataWithHttpInfo(solverKey, version, jobId, jobMetadataUpdate, observableOptions);
        return result.toPromise();
    }

    /**
     * Updates custom metadata from a job  New in *version 0.7*
     * Replace Job Custom Metadata
     * @param solverKey
     * @param version
     * @param jobId
     * @param jobMetadataUpdate
     */
    public replaceJobCustomMetadata(solverKey: string, version: string, jobId: string, jobMetadataUpdate: JobMetadataUpdate, _options?: PromiseConfigurationOptions): Promise<JobMetadata> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.replaceJobCustomMetadata(solverKey, version, jobId, jobMetadataUpdate, observableOptions);
        return result.toPromise();
    }

    /**
     * Starts job job_id created with the solver solver_key:version  Added in *version 0.4.3*: query parameter `cluster_id`  Added in *version 0.6*: responds with a 202 when successfully starting a computation  Changed in *version 0.7*: query parameter `cluster_id` deprecated
     * Start Job
     * @param solverKey
     * @param version
     * @param jobId
     * @param [clusterId]
     */
    public startJobWithHttpInfo(solverKey: string, version: string, jobId: string, clusterId?: number, _options?: PromiseConfigurationOptions): Promise<HttpInfo<JobStatus>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.startJobWithHttpInfo(solverKey, version, jobId, clusterId, observableOptions);
        return result.toPromise();
    }

    /**
     * Starts job job_id created with the solver solver_key:version  Added in *version 0.4.3*: query parameter `cluster_id`  Added in *version 0.6*: responds with a 202 when successfully starting a computation  Changed in *version 0.7*: query parameter `cluster_id` deprecated
     * Start Job
     * @param solverKey
     * @param version
     * @param jobId
     * @param [clusterId]
     */
    public startJob(solverKey: string, version: string, jobId: string, clusterId?: number, _options?: PromiseConfigurationOptions): Promise<JobStatus> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.startJob(solverKey, version, jobId, clusterId, observableOptions);
        return result.toPromise();
    }

    /**
     * Stops a running job  New in *version 0.5*
     * Stop Job
     * @param solverKey
     * @param version
     * @param jobId
     */
    public stopJobWithHttpInfo(solverKey: string, version: string, jobId: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<JobStatus>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.stopJobWithHttpInfo(solverKey, version, jobId, observableOptions);
        return result.toPromise();
    }

    /**
     * Stops a running job  New in *version 0.5*
     * Stop Job
     * @param solverKey
     * @param version
     * @param jobId
     */
    public stopJob(solverKey: string, version: string, jobId: string, _options?: PromiseConfigurationOptions): Promise<JobStatus> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.stopJob(solverKey, version, jobId, observableOptions);
        return result.toPromise();
    }


}



import { ObservableStudiesApi } from './ObservableAPI';

import { StudiesApiRequestFactory, StudiesApiResponseProcessor} from "../apis/StudiesApi";
export class PromiseStudiesApi {
    private api: ObservableStudiesApi

    public constructor(
        configuration: Configuration,
        requestFactory?: StudiesApiRequestFactory,
        responseProcessor?: StudiesApiResponseProcessor
    ) {
        this.api = new ObservableStudiesApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Clone Study
     * @param studyId
     * @param [xSimcoreParentProjectUuid]
     * @param [xSimcoreParentNodeId]
     */
    public cloneStudyWithHttpInfo(studyId: string, xSimcoreParentProjectUuid?: string, xSimcoreParentNodeId?: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Study>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.cloneStudyWithHttpInfo(studyId, xSimcoreParentProjectUuid, xSimcoreParentNodeId, observableOptions);
        return result.toPromise();
    }

    /**
     * Clone Study
     * @param studyId
     * @param [xSimcoreParentProjectUuid]
     * @param [xSimcoreParentNodeId]
     */
    public cloneStudy(studyId: string, xSimcoreParentProjectUuid?: string, xSimcoreParentNodeId?: string, _options?: PromiseConfigurationOptions): Promise<Study> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.cloneStudy(studyId, xSimcoreParentProjectUuid, xSimcoreParentNodeId, observableOptions);
        return result.toPromise();
    }

    /**
     * hidden -- if True (default) hides project from UI
     * Create Study Job
     * @param studyId
     * @param jobInputs
     * @param [hidden]
     * @param [xSimcoreParentProjectUuid]
     * @param [xSimcoreParentNodeId]
     */
    public createStudyJobWithHttpInfo(studyId: string, jobInputs: JobInputs, hidden?: boolean, xSimcoreParentProjectUuid?: string, xSimcoreParentNodeId?: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Job>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.createStudyJobWithHttpInfo(studyId, jobInputs, hidden, xSimcoreParentProjectUuid, xSimcoreParentNodeId, observableOptions);
        return result.toPromise();
    }

    /**
     * hidden -- if True (default) hides project from UI
     * Create Study Job
     * @param studyId
     * @param jobInputs
     * @param [hidden]
     * @param [xSimcoreParentProjectUuid]
     * @param [xSimcoreParentNodeId]
     */
    public createStudyJob(studyId: string, jobInputs: JobInputs, hidden?: boolean, xSimcoreParentProjectUuid?: string, xSimcoreParentNodeId?: string, _options?: PromiseConfigurationOptions): Promise<Job> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.createStudyJob(studyId, jobInputs, hidden, xSimcoreParentProjectUuid, xSimcoreParentNodeId, observableOptions);
        return result.toPromise();
    }

    /**
     * Deletes an existing study job
     * Delete Study Job
     * @param studyId
     * @param jobId
     */
    public deleteStudyJobWithHttpInfo(studyId: string, jobId: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<void>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.deleteStudyJobWithHttpInfo(studyId, jobId, observableOptions);
        return result.toPromise();
    }

    /**
     * Deletes an existing study job
     * Delete Study Job
     * @param studyId
     * @param jobId
     */
    public deleteStudyJob(studyId: string, jobId: string, _options?: PromiseConfigurationOptions): Promise<void> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.deleteStudyJob(studyId, jobId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get study by ID  New in *version 0.5*
     * Get Study
     * @param studyId
     */
    public getStudyWithHttpInfo(studyId: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Study>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getStudyWithHttpInfo(studyId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get study by ID  New in *version 0.5*
     * Get Study
     * @param studyId
     */
    public getStudy(studyId: string, _options?: PromiseConfigurationOptions): Promise<Study> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getStudy(studyId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get custom metadata from a study\'s job  New in *version 0.7*
     * Get Study Job Custom Metadata
     * @param studyId
     * @param jobId
     */
    public getStudyJobCustomMetadataWithHttpInfo(studyId: string, jobId: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<JobMetadata>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getStudyJobCustomMetadataWithHttpInfo(studyId, jobId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get custom metadata from a study\'s job  New in *version 0.7*
     * Get Study Job Custom Metadata
     * @param studyId
     * @param jobId
     */
    public getStudyJobCustomMetadata(studyId: string, jobId: string, _options?: PromiseConfigurationOptions): Promise<JobMetadata> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getStudyJobCustomMetadata(studyId, jobId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get download links for study job log files
     * @param studyId
     * @param jobId
     */
    public getStudyJobOutputLogfileWithHttpInfo(studyId: string, jobId: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<JobLogsMap>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getStudyJobOutputLogfileWithHttpInfo(studyId, jobId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get download links for study job log files
     * @param studyId
     * @param jobId
     */
    public getStudyJobOutputLogfile(studyId: string, jobId: string, _options?: PromiseConfigurationOptions): Promise<JobLogsMap> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getStudyJobOutputLogfile(studyId, jobId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get Study Job Outputs
     * @param studyId
     * @param jobId
     */
    public getStudyJobOutputsWithHttpInfo(studyId: string, jobId: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<JobOutputs>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getStudyJobOutputsWithHttpInfo(studyId, jobId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get Study Job Outputs
     * @param studyId
     * @param jobId
     */
    public getStudyJobOutputs(studyId: string, jobId: string, _options?: PromiseConfigurationOptions): Promise<JobOutputs> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getStudyJobOutputs(studyId, jobId, observableOptions);
        return result.toPromise();
    }

    /**
     * Inspect Study Job
     * @param studyId
     * @param jobId
     */
    public inspectStudyJobWithHttpInfo(studyId: string, jobId: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<JobStatus>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.inspectStudyJobWithHttpInfo(studyId, jobId, observableOptions);
        return result.toPromise();
    }

    /**
     * Inspect Study Job
     * @param studyId
     * @param jobId
     */
    public inspectStudyJob(studyId: string, jobId: string, _options?: PromiseConfigurationOptions): Promise<JobStatus> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.inspectStudyJob(studyId, jobId, observableOptions);
        return result.toPromise();
    }

    /**
     * List all studies  New in *version 0.5*
     * List Studies
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public listStudiesWithHttpInfo(limit?: number, offset?: number, _options?: PromiseConfigurationOptions): Promise<HttpInfo<PageStudy>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listStudiesWithHttpInfo(limit, offset, observableOptions);
        return result.toPromise();
    }

    /**
     * List all studies  New in *version 0.5*
     * List Studies
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public listStudies(limit?: number, offset?: number, _options?: PromiseConfigurationOptions): Promise<PageStudy> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listStudies(limit, offset, observableOptions);
        return result.toPromise();
    }

    /**
     * Lists metadata on ports of a given study  New in *version 0.5*
     * List Study Ports
     * @param studyId
     */
    public listStudyPortsWithHttpInfo(studyId: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<OnePageStudyPort>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listStudyPortsWithHttpInfo(studyId, observableOptions);
        return result.toPromise();
    }

    /**
     * Lists metadata on ports of a given study  New in *version 0.5*
     * List Study Ports
     * @param studyId
     */
    public listStudyPorts(studyId: string, _options?: PromiseConfigurationOptions): Promise<OnePageStudyPort> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listStudyPorts(studyId, observableOptions);
        return result.toPromise();
    }

    /**
     * Changes custom metadata of a study\'s job  New in *version 0.7*
     * Replace Study Job Custom Metadata
     * @param studyId
     * @param jobId
     * @param jobMetadataUpdate
     */
    public replaceStudyJobCustomMetadataWithHttpInfo(studyId: string, jobId: string, jobMetadataUpdate: JobMetadataUpdate, _options?: PromiseConfigurationOptions): Promise<HttpInfo<JobMetadata>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.replaceStudyJobCustomMetadataWithHttpInfo(studyId, jobId, jobMetadataUpdate, observableOptions);
        return result.toPromise();
    }

    /**
     * Changes custom metadata of a study\'s job  New in *version 0.7*
     * Replace Study Job Custom Metadata
     * @param studyId
     * @param jobId
     * @param jobMetadataUpdate
     */
    public replaceStudyJobCustomMetadata(studyId: string, jobId: string, jobMetadataUpdate: JobMetadataUpdate, _options?: PromiseConfigurationOptions): Promise<JobMetadata> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.replaceStudyJobCustomMetadata(studyId, jobId, jobMetadataUpdate, observableOptions);
        return result.toPromise();
    }

    /**
     * Changed in *version 0.6*: Now responds with a 202 when successfully starting a computation
     * Start Study Job
     * @param studyId
     * @param jobId
     * @param [clusterId] Changed in *version 0.7*: query parameter &#x60;cluster_id&#x60; deprecated 
     */
    public startStudyJobWithHttpInfo(studyId: string, jobId: string, clusterId?: number, _options?: PromiseConfigurationOptions): Promise<HttpInfo<JobStatus>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.startStudyJobWithHttpInfo(studyId, jobId, clusterId, observableOptions);
        return result.toPromise();
    }

    /**
     * Changed in *version 0.6*: Now responds with a 202 when successfully starting a computation
     * Start Study Job
     * @param studyId
     * @param jobId
     * @param [clusterId] Changed in *version 0.7*: query parameter &#x60;cluster_id&#x60; deprecated 
     */
    public startStudyJob(studyId: string, jobId: string, clusterId?: number, _options?: PromiseConfigurationOptions): Promise<JobStatus> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.startStudyJob(studyId, jobId, clusterId, observableOptions);
        return result.toPromise();
    }

    /**
     * Stop Study Job
     * @param studyId
     * @param jobId
     */
    public stopStudyJobWithHttpInfo(studyId: string, jobId: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<JobStatus>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.stopStudyJobWithHttpInfo(studyId, jobId, observableOptions);
        return result.toPromise();
    }

    /**
     * Stop Study Job
     * @param studyId
     * @param jobId
     */
    public stopStudyJob(studyId: string, jobId: string, _options?: PromiseConfigurationOptions): Promise<JobStatus> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.stopStudyJob(studyId, jobId, observableOptions);
        return result.toPromise();
    }


}



import { ObservableUsersApi } from './ObservableAPI';

import { UsersApiRequestFactory, UsersApiResponseProcessor} from "../apis/UsersApi";
export class PromiseUsersApi {
    private api: ObservableUsersApi

    public constructor(
        configuration: Configuration,
        requestFactory?: UsersApiRequestFactory,
        responseProcessor?: UsersApiResponseProcessor
    ) {
        this.api = new ObservableUsersApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get My Profile
     */
    public getMyProfileWithHttpInfo(_options?: PromiseConfigurationOptions): Promise<HttpInfo<Profile>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getMyProfileWithHttpInfo(observableOptions);
        return result.toPromise();
    }

    /**
     * Get My Profile
     */
    public getMyProfile(_options?: PromiseConfigurationOptions): Promise<Profile> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getMyProfile(observableOptions);
        return result.toPromise();
    }

    /**
     * Update My Profile
     * @param profileUpdate
     */
    public updateMyProfileWithHttpInfo(profileUpdate: ProfileUpdate, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Profile>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.updateMyProfileWithHttpInfo(profileUpdate, observableOptions);
        return result.toPromise();
    }

    /**
     * Update My Profile
     * @param profileUpdate
     */
    public updateMyProfile(profileUpdate: ProfileUpdate, _options?: PromiseConfigurationOptions): Promise<Profile> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.updateMyProfile(profileUpdate, observableOptions);
        return result.toPromise();
    }


}



import { ObservableWalletsApi } from './ObservableAPI';

import { WalletsApiRequestFactory, WalletsApiResponseProcessor} from "../apis/WalletsApi";
export class PromiseWalletsApi {
    private api: ObservableWalletsApi

    public constructor(
        configuration: Configuration,
        requestFactory?: WalletsApiRequestFactory,
        responseProcessor?: WalletsApiResponseProcessor
    ) {
        this.api = new ObservableWalletsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Checkout licensed item
     * Checkout Licensed Item
     * @param walletId
     * @param licensedItemId
     * @param licensedItemCheckoutData
     */
    public checkoutLicensedItemWithHttpInfo(walletId: number, licensedItemId: string, licensedItemCheckoutData: LicensedItemCheckoutData, _options?: PromiseConfigurationOptions): Promise<HttpInfo<LicensedItemCheckoutGet>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.checkoutLicensedItemWithHttpInfo(walletId, licensedItemId, licensedItemCheckoutData, observableOptions);
        return result.toPromise();
    }

    /**
     * Checkout licensed item
     * Checkout Licensed Item
     * @param walletId
     * @param licensedItemId
     * @param licensedItemCheckoutData
     */
    public checkoutLicensedItem(walletId: number, licensedItemId: string, licensedItemCheckoutData: LicensedItemCheckoutData, _options?: PromiseConfigurationOptions): Promise<LicensedItemCheckoutGet> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.checkoutLicensedItem(walletId, licensedItemId, licensedItemCheckoutData, observableOptions);
        return result.toPromise();
    }

    /**
     * Get all available licensed items for a given wallet  New in *version 0.6*
     * Get Available Licensed Items For Wallet
     * @param walletId
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public getAvailableLicensedItemsForWalletWithHttpInfo(walletId: number, limit?: number, offset?: number, _options?: PromiseConfigurationOptions): Promise<HttpInfo<PageLicensedItemGet>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getAvailableLicensedItemsForWalletWithHttpInfo(walletId, limit, offset, observableOptions);
        return result.toPromise();
    }

    /**
     * Get all available licensed items for a given wallet  New in *version 0.6*
     * Get Available Licensed Items For Wallet
     * @param walletId
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public getAvailableLicensedItemsForWallet(walletId: number, limit?: number, offset?: number, _options?: PromiseConfigurationOptions): Promise<PageLicensedItemGet> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getAvailableLicensedItemsForWallet(walletId, limit, offset, observableOptions);
        return result.toPromise();
    }

    /**
     * Get default wallet  New in *version 0.7*
     * Get Default Wallet
     */
    public getDefaultWalletWithHttpInfo(_options?: PromiseConfigurationOptions): Promise<HttpInfo<WalletGetWithAvailableCreditsLegacy>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getDefaultWalletWithHttpInfo(observableOptions);
        return result.toPromise();
    }

    /**
     * Get default wallet  New in *version 0.7*
     * Get Default Wallet
     */
    public getDefaultWallet(_options?: PromiseConfigurationOptions): Promise<WalletGetWithAvailableCreditsLegacy> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getDefaultWallet(observableOptions);
        return result.toPromise();
    }

    /**
     * Get wallet  New in *version 0.7*
     * Get Wallet
     * @param walletId
     */
    public getWalletWithHttpInfo(walletId: number, _options?: PromiseConfigurationOptions): Promise<HttpInfo<WalletGetWithAvailableCreditsLegacy>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getWalletWithHttpInfo(walletId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get wallet  New in *version 0.7*
     * Get Wallet
     * @param walletId
     */
    public getWallet(walletId: number, _options?: PromiseConfigurationOptions): Promise<WalletGetWithAvailableCreditsLegacy> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getWallet(walletId, observableOptions);
        return result.toPromise();
    }


}



