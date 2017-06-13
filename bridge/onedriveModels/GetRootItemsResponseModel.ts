import { Item } from "./Item"

export interface GetRootItemsResponseModel extends Item {
    children: Array<Item>,
    "@odata.nextLink"?: string
}