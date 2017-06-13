export interface ServiceModel {
    "@odata.context": string,
    "value": Array<ServiceValueModel>
}

export interface ServiceValueModel {
    "@odata.type": string,
    "@odata.id": string,
    "@odata.editLink": string,
    "capability": string,
    "entityKey": string,
    "providerId": string,
    "providerName": string,
    "serviceAccountType": number,
    "serviceApiVersion": string,
    "serviceEndpointUri": string,
    "serviceId": string,
    "serviceName": string,
    "serviceResourceId": string
}