import * as fs from "fs";
import tools from "../tools";
import { SingleLogin } from "./SingleLogin"
const config = require("../config.json")

import { ServiceModel, ServiceValueModel } from "./models/ServiceModel"
import { DiscoveryServiceConfigModel } from "./models/DiscoveryServiceConfigModel"

var serviceStorage: DiscoveryServiceConfigModel = null;
var serviceStorageFile: string = "./storage/service.json";
if (fs.existsSync(serviceStorageFile)) {
    serviceStorage = JSON.parse(fs.readFileSync(serviceStorageFile).toString());
}

export class DiscoveryService {

    static async getService(): Promise<ServiceModel> {
        if (serviceStorage != null && serviceStorage.expiresTime > tools.getTime()) {
            return serviceStorage.service;
        }
        var response: ServiceModel = <ServiceModel>await SingleLogin.postRequest("https://api.office.com/discovery/v2.0/me/services");
        serviceStorage = {
            service: response,
            expiresTime: tools.getTime() + 3600 * 72,
        }
        await tools.saveObjectToJsonFile(serviceStorageFile, serviceStorage);
        return serviceStorage.service;
    }

    static async getResourceId(): Promise<string> {
        var service: ServiceModel = await DiscoveryService.getService();
        for(var api of serviceStorage.service.value) {
            if(api.serviceApiVersion === "v2.0") {
                return api.serviceResourceId;
            }
        }
        return serviceStorage.service.value[0].serviceResourceId;
    }

    static async getEndpointUri(): Promise<string> {
        var service: ServiceModel = await DiscoveryService.getService();
        for(var api of serviceStorage.service.value) {
            if(api.serviceApiVersion === "v2.0") {
                return api.serviceEndpointUri;
            }
        }
        return serviceStorage.service.value[0].serviceEndpointUri;
    }

    static async appendUrl(path: string): Promise<string> {
        var rescourceId: string = await DiscoveryService.getEndpointUri();
        return `${rescourceId}${path}`;
    }

}