///<reference path="./node_modules/@types/node/index.d.ts"/>
///<reference path="./node_modules/@types/superagent/index.d.ts"/>

import tools from "./tools"
import * as fs from "fs";
import * as path from "path";
import * as Bridge from "./bridge/bridge"
import * as OneDriveModels from "./bridge/OneDriveModels"

async function test() {
    try {
        // View all drives.
        // console.log(await Bridge.OneDrive.getDrive());

        // View all files for root.
        // var items = await Bridge.OneDrive.getRootItems();
        // console.log(items);

        // View all files for path.
        // var items = await Bridge.OneDrive.getItemsWithPath("/DataBackup");
        // console.log(items);

        // Using directory id to upload larger file, support small file too.
        // await Bridge.OneDrive.uploadLargeFile(path.join(__dirname, "linux_fs.pdf"), "01E573MHWN5HGSUJ4JDRAJ4SWDJTAYLIZM", "test.bin");
    } catch (err) {
        if (err.status == undefined) return console.error(err);
        console.error(err.status, err.response.res.text);
    }
};

test();