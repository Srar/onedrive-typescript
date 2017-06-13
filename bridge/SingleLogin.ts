import * as fs from "fs";
import tools from "../tools";
const config = require("../config.json");

import { SingleLoginConfigModel } from "./models/SingleLoginConfigModel"
import { SingleLoginResponseModel  } from "./models/SingleLoginResponseModel"

var singleLoginStorage: SingleLoginConfigModel = null;
var singleLoginStorageFile: string = "./storage/singleLogin.json";
if (fs.existsSync(singleLoginStorageFile)) {
    singleLoginStorage = JSON.parse(fs.readFileSync(singleLoginStorageFile).toString());
}

export class SingleLogin {
    static async requestSingleLoginWithOAuthCode(code: string): Promise<SingleLoginResponseModel> {
        var postData = {
            code: code,
            client_id: config.clientId,
            client_secret: config.clientSecret,
            grant_type: "authorization_code",
            redirect_uri: config.redirectUrl,
            resource: "https://api.office.com/discovery/"
        };

        var response = <SingleLoginResponseModel>await tools.postRequest("https://login.microsoftonline.com/common/oauth2/token", postData, undefined, true)
        response.expires_in = parseInt(response.expires_in.toString());
        response.ext_expires_in = parseInt(response.ext_expires_in.toString());
        response.expires_on = parseInt(response.expires_on.toString());
        response.not_before = parseInt(response.not_before.toString());

        return response;
    }

    static async refreshSingleLoginToken(): Promise<void> {
        if (singleLoginStorage === null) {
            throw new Error("请先执行'npm run auth'.");
        }

        if (singleLoginStorage.expiresTime > tools.getTime()) {
            return;
        }

        var postData = {
            grant_type: "refresh_token",
            refresh_token: singleLoginStorage.refreshToken,
            client_id: config.clientId,
            client_secret: config.clientSecret,
            resource: "https://api.office.com/discovery/"
        };

        var response = <SingleLoginResponseModel>await tools.postRequest("https://login.microsoftonline.com/common/oauth2/token", postData)
        singleLoginStorage.accessToken = response.access_token;
        singleLoginStorage.refreshToken = response.refresh_token;
        singleLoginStorage.expiresTime = parseInt(response.expires_in.toString()) + tools.getTime();

        await tools.saveObjectToJsonFile(singleLoginStorageFile, singleLoginStorage);
    }

    static setSingleLoginSession(model: SingleLoginConfigModel) {
        singleLoginStorage = model;
    }

    static async getSingleLoginSession(): Promise<SingleLoginConfigModel> {
        if (singleLoginStorage === null) {
            throw new Error("请先执行'npm run auth'.");
        }
        await SingleLogin.refreshSingleLoginToken();
        return singleLoginStorage;
    }

    static async postRequest(url: string, data?: object, header?: object, toJson?: boolean): Promise<object> {
        await SingleLogin.refreshSingleLoginToken();
        if (header == undefined || header == null) {
            header = {
                Authorization: `Bearer ${singleLoginStorage.accessToken}`
            }
        } else {
            header["Authorization"] = `Bearer ${singleLoginStorage.accessToken}`;
        }
        return tools.postRequest(url, data, header, toJson);
    }

    static async getRequest(url: string, header?: object, toJson?: boolean): Promise<object> {
        await SingleLogin.refreshSingleLoginToken();
        if (header == undefined || header == null) {
            header = {
                Authorization: `Bearer ${singleLoginStorage.accessToken}`
            }
        } else {
            header["Authorization"] = `Bearer ${singleLoginStorage.accessToken}`;
        }
        return tools.getRequest(url, header, toJson);
    }
}