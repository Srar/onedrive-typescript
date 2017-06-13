import * as fs from "fs";
import tools from "../tools";
import * as superagent from "superagent";
import { SingleLogin } from "./SingleLogin";
import { DiscoveryService } from "./DiscoveryService";

const config = require("../config.json");

import { OnedriveConfigModel } from "./models/OnedriveConfigModel";
import { SingleLoginConfigModel } from "./models/SingleLoginConfigModel";

var onedriveStorage: OnedriveConfigModel = null;
var onedriveStorageFile: string = "./storage/onedrive.json";
if (fs.existsSync(onedriveStorageFile)) {
    onedriveStorage = JSON.parse(fs.readFileSync(onedriveStorageFile).toString());
}

import * as OneDriveModels from "./OneDriveModels"

export class OneDrive {

    static async useCacheGetItemsWithPath(pathArray: Array<string>): Promise<OneDriveModels.GetRootItemsResponseModel> {
        var pathString = "";
        var lastestDirectory: OneDriveModels.GetRootItemsResponseModel = null;
        for (var path of pathArray) {
            pathString += "/" + path;
            var cachePath = "./cache/" + pathString.replace(/\//g, ".");
            if (fs.existsSync(cachePath)) {
                lastestDirectory = JSON.parse(<string>await tools.readFile(cachePath));
            } else {
                lastestDirectory = await OneDrive.getItemsWithPath(pathString);;
            }
            if (lastestDirectory == null) return null;
            await tools.saveObjectToJsonFile(cachePath, lastestDirectory);
        }
        return lastestDirectory;
    }

    static async useCacheAutoCreateDirectoryWithPath(pathArray: Array<string>): Promise<void> {
        var lastestDirectory: OneDriveModels.GetRootItemsResponseModel = null;
        for (var i = 0; i < pathArray.length; i++) {
            var directory = await OneDrive.useCacheGetItemsWithPath(pathArray.slice(0, i + 1));
            if (directory == null) {
                /* 从Root创建 */
                if (i == 0) {
                    await OneDrive.createDirectoryInRootDirectory(pathArray[0]);
                } else {
                    await OneDrive.createDirectoryForParentDirectory(lastestDirectory.id, pathArray[i]);
                }
                i--;
            } else {
                lastestDirectory = directory;
            }
        }
    }

    static async getDrive(): Promise<OneDriveModels.GetDeviceResponseModel> {
        return <OneDriveModels.GetDeviceResponseModel>await OneDrive.getRequest(await DiscoveryService.appendUrl("/drive"));
    }

    static async getRootItems(): Promise<OneDriveModels.GetRootItemsResponseModel> {
        return OneDrive.getItemsWithPath("");
    }

    static async getItemsWithPath(path: string): Promise<OneDriveModels.GetRootItemsResponseModel> {
        try {
            return <OneDriveModels.GetRootItemsResponseModel>await OneDrive.getRequest(await DiscoveryService.appendUrl(`/drive/root:${path}?expand=children(select=id,lastModifiedDateTime,size,name,folder,file)`));
        } catch (error) {
            if (error.status == undefined) throw error;
            if (error.status === 404) return null;
        }
    }

    static async createDirectoryInRootDirectory(directoryName: string): Promise<void> {
        await OneDrive.postJsonRequest(await DiscoveryService.appendUrl("/drive/root/children"), {
            "name": directoryName,
            "folder": {}
        });
    }

    static async createDirectoryForParentDirectory(parentId: string, directoryName: string): Promise<void> {
        await OneDrive.postJsonRequest(await DiscoveryService.appendUrl(`/drive/items/${parentId}/children`), {
            "name": directoryName,
            "folder": {}
        });
    }

    static async uploadFileToDirectoryWithBuffer(file: Buffer, parentId: string, fileName: string): Promise<OneDriveModels.Item> {
        var response = await OneDrive.uploadFileWithBuffer(file, `/drive/items/${parentId}:/${fileName}:/content`);
        return <OneDriveModels.Item>JSON.parse(response.text);
    }

    static async getItemDownloadUrlWithItemId(itemId: string): Promise<string> {
        var response = await OneDrive.getRequest(await DiscoveryService.appendUrl(`/drive/items/${itemId}/content`), {}, false, true);
        if (response["statusCode"] !== 200) {
            throw "Onedrive返回错误";
        }
        if (response["redirects"] == undefined || response["redirects"].length === 0) {
            throw "Onedrive返回错误";
        }
        return response["redirects"][0];
    }

    static async refreshOneDriveToken(): Promise<string> {
        if (onedriveStorage != null && onedriveStorage.expiresTime > tools.getTime()) {
            return onedriveStorage.accessToken;
        }

        await SingleLogin.refreshSingleLoginToken();
        var postData = {
            client_id: config.clientId,
            redirect_uri: config.redirectUrl,
            client_secret: config.clientSecret,
            refresh_token: "",
            resource: "",
            grant_type: "refresh_token"
        };

        postData.resource = await DiscoveryService.getResourceId();

        if (onedriveStorage == null) {
            var singleLoginSession: SingleLoginConfigModel = await SingleLogin.getSingleLoginSession();
            postData.refresh_token = singleLoginSession.refreshToken;
        } else {
            postData.refresh_token = onedriveStorage.refreshToken;
        }

        var response = await tools.postRequest("https://login.microsoftonline.com/common/oauth2/token", postData);
        onedriveStorage = {
            expiresTime: parseInt(response["expires_in"]) + tools.getTime(),
            accessToken: response["access_token"],
            refreshToken: response["refresh_token"]
        }
        await tools.saveObjectToJsonFile(onedriveStorageFile, onedriveStorage);
        return onedriveStorage.accessToken;
    }

    static async uploadLargeFile(filePath: string, parentId: string, fileName: string, uploadSession?: string): Promise<void> {

        var session: {
            uploadUrl: string,
            nextExpectedRanges: Array<string>
        } = <{
            uploadUrl: string,
            nextExpectedRanges: Array<string>
        }>await OneDrive.postJsonRequest(await DiscoveryService.appendUrl(`/drive/items/${parentId}:/${fileName}:/createUploadSession`), {});

        var token = await OneDrive.refreshOneDriveToken();
        var file = await tools.openFile(filePath, "r+");
        try {
            var fileSize: number = fs.statSync(filePath).size;
            var range: number = 1024 * 1024 * 8;
            if (range > fileSize) range = fileSize;
            var pointer: number = range;
            var lastPointer: number = 0;

            for (var firstLoop = true; ; firstLoop = false) {

                var uploadBuffer: Buffer = null;
                if (firstLoop) {
                    uploadBuffer = new Buffer((pointer - lastPointer));
                    await tools.readFileOriginally(file, uploadBuffer, 0, uploadBuffer.length, lastPointer);
                    await this.putRequest(session.uploadUrl, uploadBuffer, {
                        "Content-Range": `bytes ${lastPointer}-${pointer - 1}/${fileSize}`,
                    });

                } else {
                    uploadBuffer = new Buffer((pointer - lastPointer + 1));
                    await tools.readFileOriginally(file, uploadBuffer, 0, uploadBuffer.length, lastPointer - 1);
                    await this.putRequest(session.uploadUrl, uploadBuffer, {
                        "Content-Range": `bytes ${lastPointer - 1}-${pointer - 1}/${fileSize}`,
                    });

                }

                lastPointer = pointer + 1;
                if (pointer == fileSize) break;
                if (pointer + range > fileSize) {
                    pointer = pointer + (fileSize - pointer);
                } else {
                    pointer = pointer + range;
                }
            }
        } catch (error) {
            throw error;
        } finally {
            await tools.closeFile(file);
        }
    }

    static uploadFileWithBuffer(file: Buffer, url: string): Promise<superagent.Response> {
        return new Promise((resolve, reject) => {
            var accessToken = "";
            OneDrive.refreshOneDriveToken().then(token => {
                accessToken = token;
                return DiscoveryService.appendUrl(url);
            }).then(url => {
                superagent.put(url)
                    .set("Content-Type", "text/plain")
                    .set("Authorization", `Bearer ${accessToken}`)
                    .send(file).end(function (err, response) {
                        if (err) return reject(err);
                        resolve(response);
                    })
            }).catch(err => reject(err));
        });
    }

    static putRequest(url: string, file: Buffer, header?: object): Promise<superagent.Response> {
        return new Promise(async (resolve, reject) => {
            var accessToken: string = await OneDrive.refreshOneDriveToken();
            if (header == undefined || header == null) {
                header = {
                    Authorization: `Bearer ${accessToken}`
                }
            } else {
                header["Authorization"] = `Bearer ${accessToken}`;
            }
            superagent.put(url).set(header).send(file).end(function (err, response) {
                if (err) return reject(err);
                resolve(response);
            })
        });

    }

    static async postRequest(url: string, data?: any, header?: object, toJson?: boolean, returnResponse?: boolean): Promise<object> {
        var accessToken: string = await OneDrive.refreshOneDriveToken();
        if (header == undefined || header == null) {
            header = {
                Accept: "application/json; odata.metadata=none",
                Authorization: `Bearer ${accessToken}`
            }
        } else {
            header["Accept"] = "application/json; odata.metadata=none";
            header["Authorization"] = `Bearer ${accessToken}`;
        }
        return tools.postRequest(url, data, header, toJson, returnResponse);
    }

    static async postJsonRequest(url: string, data?: any, header?: object, toJson?: boolean, returnResponse?: boolean): Promise<object> {
        var accessToken: string = await OneDrive.refreshOneDriveToken();
        if (header == undefined || header == null) {
            header = {
                Accept: "application/json; odata.metadata=none",
                Authorization: `Bearer ${accessToken}`
            }
        } else {
            header["Accept"] = "application/json; odata.metadata=none";
            header["Authorization"] = `Bearer ${accessToken}`;
        }
        return tools.postJsonRequest(url, data, header, toJson, returnResponse);
    }

    static async getRequest(url: string, header?: object, toJson?: boolean, returnResponse?: boolean): Promise<object> {
        var accessToken: string = await OneDrive.refreshOneDriveToken();
        if (header == undefined || header == null) {
            header = {
                Accept: "application/json; odata.metadata=none",
                Authorization: `Bearer ${accessToken}`
            }
        } else {
            header["Accept"] = "application/json; odata.metadata=none";
            header["Authorization"] = `Bearer ${accessToken}`;
        }
        return tools.getRequest(url, header, toJson, returnResponse);
    }
}



