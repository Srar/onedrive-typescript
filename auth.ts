///<reference path="./node_modules/@types/node/index.d.ts"/>
///<reference path="./node_modules/@types/superagent/index.d.ts"/>

const config = require("./config.json");

import tools from "./tools"
import * as Bridge from "./bridge/bridge"

console.log("Please open this url with browser:");
console.log("");
console.log(getUrlForCode());
console.log("");
process.stdout.write("Code:");
process.stdin.resume();
process.stdin.setEncoding("utf8");

process.stdin.once("data", async function (code) {
    code = code.trim();
    process.stdin.pause();
    try {
        console.log(">> 正在与SSO通讯中...");
        var response = await Bridge.SingleLogin.requestSingleLoginWithOAuthCode(code);
        var singelLoginStorage: Bridge.SingleLoginConfigModel = {
            code: code,
            expiresTime: response.expires_in + tools.getTime(),
            accessToken: response.access_token,
            refreshToken: response.refresh_token
        }
        console.log(">> SSO已授权.");
        await tools.saveObjectToJsonFile("./storage/singleLogin.json", singelLoginStorage)
        Bridge.SingleLogin.setSingleLoginSession(singelLoginStorage);

        console.log(">> 正在与DiscoveryService通讯中...");
        await Bridge.DiscoveryService.getService();
        console.log(">> DiscoveryService已响应.")

        console.log(">> 正在与OneDrive通讯中...");
        await Bridge.OneDrive.refreshOneDriveToken();
        console.log(">> OneDrive已授权.")

        console.log("已完成验证.");
        process.exit(0);
    } catch (err) {
        if (err.status == undefined) {
            console.log("网络连接错误: " + err);
        } else {
            console.log("onedrive服务器返回: " + err.status + " " + err.response.res.text);
        }
    }
});

function getUrlForCode() {
    return `https://login.microsoftonline.com/common/oauth2/authorize?redirect_uri=${encodeURI(config.redirectUrl)}&response_type=code&client_id=${config.clientId}`;
}

