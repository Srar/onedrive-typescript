import { ServiceModel } from "./ServiceModel"

export interface DiscoveryServiceConfigModel {
    expiresTime: number,
    service: ServiceModel
}