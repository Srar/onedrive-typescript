export interface UploadSessionResponseModel {
    uploadUrl: string,
    expirationDateTime: string,
    nextExpectedRanges: Array<string>
}

