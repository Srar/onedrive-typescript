export interface SingleLoginResponseModel {
    "token_type": string,
    "scope": string,
    "expires_in": number,
    "ext_expires_in": number,
    "expires_on": number,
    "not_before": number,
    "resource": string,
    "access_token": string,
    "refresh_token": string,
    "id_token": string
}