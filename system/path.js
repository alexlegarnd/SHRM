const fs = require('fs');
const channel = require('./channel.enum');
const configuration = require('./configuration');
const system_file = require('./file');
const system_cache = require('./cache');
const tools = require('./tools');
const logger = require('./logger');

class Path {

    static CLASSNAME = 'Path';

    static createRepoIfNotExist() {
        const path = tools.addTrailingSeparatorPath(configuration.getProperty('repo_path'));
        if (!fs.existsSync(path)) {
            logger.info(Path.CLASSNAME,'Initialization of repository')
            fs.mkdirSync(path, { recursive: true, mode: 0o744});
            fs.mkdirSync(`${path}.shrm`, { recursive: false, mode: 0o744 });
        }
        if (!fs.existsSync(`${path}.shrm`)) {
            logger.info(Path.CLASSNAME, 'Initialization of repository')
            fs.mkdirSync(`${path}.shrm`, { recursive: false, mode: 0o744 });
        }
    }

    static async createChannel(c) {
        if (this.isValidChannelName(c)) {
            const path = tools.addTrailingSeparatorPath(configuration.getProperty('repo_path'));
            if (!fs.existsSync(`${path}${c}`)) {
                fs.mkdir(`${path}${c}`, {recursive: false, mode: 0o744}, (err) => {
                    if (!err) {
                        logger.info(Path.CLASSNAME,`Channel '${c}' created`);
                        system_cache.addChannel(c);
                    } else {
                        logger.error(Path.CLASSNAME, `An error occured while creating '${c}' channel`);
                        throw err;
                    }
                });
            } else {
                throw new Error("Channel already exist");
            }
        } else {
            throw new Error("Channel already exist");
        }
    }

    static async isChannelCreated(c) {
        const path = tools.addTrailingSeparatorPath(configuration.getProperty('repo_path'));
        return fs.existsSync(`${path}${c}`);
    }

    static async isFileAlreadyUpload(c, v, fn) {
        const path = tools.addTrailingSeparatorPath(configuration.getProperty('repo_path'));
        if (!fs.existsSync(`${path}${c}/${v}`)) {
            if (!fs.existsSync(`${path}${c}/${v}/${fn}`)) {
                return false;
            }
        }
        return true;
    }

    static copyFile(c, v, file, callback) {
        const path = tools.addTrailingSeparatorPath(configuration.getProperty('repo_path'));
        if (!fs.existsSync(`${path}${c}/${v}/`)) {
            fs.mkdirSync(`${path}${c}/${v}/`, {recursive: false});
            system_cache.addVersion(c, v);
        }
        file.mv(`${path}${c}/${v}/${file.name}`, (err) => {
            if (!err) {
                system_cache.addFile(c, v, file.name).then((b) => {
                    const p = `${path}${c}/${v}`;
                    system_file.createMd5Hash(p, file);
                    system_file.createSha1Hash(p, file);
                });
            }
            callback(err);
        });
    }

    static isValidChannelName(c) {
        let result = false;
        for (let k in channel) {
            if (channel[k] === c) {
                result = true;
            }
        }
        return result;
    }
}

module.exports = Path;