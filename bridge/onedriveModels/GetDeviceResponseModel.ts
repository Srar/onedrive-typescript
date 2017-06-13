export interface GetDeviceResponseModel {
    id: string,
    type: string,
    owner: object,
    quota: GetDeviceResponseQuotaModel
}

export interface GetDeviceResponseQuotaModel {
    deleted: number,
    remaining: number,
    state: string,
    total: number
}