import * as fs from "fs";

if(!fs.existsSync("./storage")) {
    fs.mkdirSync("./storage");
}

if(!fs.existsSync("./cache")) {
    fs.mkdirSync("./cache");
}

export * from "./SingleLogin";
export * from "./DiscoveryService";
export * from "./OneDrive";

export * from "./models/DiscoveryServiceConfigModel";
export * from "./models/OnedriveConfigModel";
export * from "./models/ServiceModel";
export * from "./models/SingleLoginConfigModel";
export * from "./models/SingleLoginResponseModel";