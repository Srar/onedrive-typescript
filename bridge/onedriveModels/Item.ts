export interface Item {
    id: string,
    name: string,
    size?: number,
    file?: {
        quickXorHash: string
    },
    folder?: {
        childCount: number
    }
}