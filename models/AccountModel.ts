export const AccountTable: string = "account"

export interface AccountModel {
    id?: number,
    username: string,
    password: string,
    lastest_upload?: number,
    disabled_login?: "Y" | "N",
    disabled_upload?: "Y" | "N",
    disabled_access_image?: "Y" | "N"
}