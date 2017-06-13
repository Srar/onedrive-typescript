import * as fs from "fs"
import * as crypto from "crypto";
import * as superagent from "superagent"

export default {

    openFile(filePath: string, flags: string): Promise<number> {
        return new Promise((resolve, reject) => {
            fs.open(filePath, flags, function (err, id) {
                if (err) return reject(err);
                resolve(id);
            });
        });
    },

    closeFile(fd: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            fs.close(fd, function (err) {
                if (err) return reject(err);
                resolve();
            });
        });
    },

    readFileOriginally(fd: number, buffer: Buffer, offset: number, length: number, position: number): Promise<number> {
        return new Promise((resolve, reject) => {
            fs.read(fd, buffer, offset, length, position, function (err, bytes) {
                if (err) return reject(err);
                resolve(bytes);
            });
        });
    },

    getFileExtendNameWithContentType(contentType: string): string {
        switch (contentType) {
            case "jpeg": return "jpg"
            default: return contentType;
        }
    },

    getTime(): number {
        return Math.floor(new Date().getTime() / 1000);
    },

    saveObjectToJsonFile(path: string, data: object) {
        return new Promise((resolve, reject) => {
            fs.writeFile(path, JSON.stringify(data, null, 4), function (err) {
                if (err) return reject(err)
                resolve();
            })
        });
    },

    readFile(path: string, returnBuffer?: boolean): Promise<string | Buffer> {
        return new Promise((resolve, reject) => {
            fs.readFile(path, function (err, content) {
                if (err) return reject(err)
                if(returnBuffer === true) return resolve(content);
                resolve(content.toString());
            });
        });
    },

    getFileSize(path: string): Promise<number> {
        return new Promise((resolve, reject) => {
            fs.stat(path, (err, stats: fs.Stats) => {
                if (err) return reject(err);
                resolve(stats.size);
            })
        });
    },

    postRequest: function (url: string, data?: any, header?: object, toJson?: boolean, returnResponse?: boolean): Promise<object> {
        return new Promise((resolve, reject) => {
            superagent.post(url).type('form').set(header || {}).send(data || {}).end(function (err, res) {
                if (err) return reject(err);
                if (returnResponse === true) resolve(res);
                toJson === false ? resolve(res.text) : resolve(JSON.parse(res.text));
            });
        });
    },

    postJsonRequest: function (url: string, data?: object, header?: object, toJson?: boolean, returnResponse?: boolean): Promise<object> {
        return new Promise((resolve, reject) => {
            superagent.post(url).set(header || {}).set('Content-Type', 'application/json').send(JSON.stringify(data)).end(function (err, res) {
                if (err) return reject(err);
                if (returnResponse === true) resolve(res);
                toJson === false ? resolve(res.text) : resolve(JSON.parse(res.text));
            });
        });
    },

    getRequest: function (url: string, header?: object, toJson?: boolean, returnResponse?: boolean): Promise<object> {
        return new Promise((resolve, reject) => {
            superagent.get(url).set(header || {}).end(function (err, res) {
                if (err) return reject(err);
                if (returnResponse === true) resolve(res);
                toJson === false ? resolve(res.text) : resolve(JSON.parse(res.text));
            });
        });
    }

}