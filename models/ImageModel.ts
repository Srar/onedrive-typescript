export const ImageTable: string = "image"

export interface ImageModel {
    hash: string,
    file_id: string,
    file_size: number,
    file_type: string,
    ip: string,
    upload_time: number,
    access_count?: number,
    account_id: number,
    disabled?: "Y" | "N",
}