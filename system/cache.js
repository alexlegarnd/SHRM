const configuration = require('./configuration');
const tools = require('./tools');
const fs = require('fs');
const logger = require('./logger');

class Cache {

    static CLASSNAME = 'Cache';

    cache = []

    save_timeout;

    app_folder = `${tools.addTrailingSeparatorPath(configuration.getProperty('repo_path'))}.shrm`

    async addChannel(channel_name) {
        const n = this.cache.filter((c) => c.name === channel_name).length;
        if (n === 0) {
            const c = {
                name: channel_name,
                type: 'channel',
                item_child: []
            };
            this.cache.push(c);
            logger.info(Cache.CLASSNAME, `Adding new channel: {channel: ${channel_name}}`);
            this.saveCache();
            return true;
        }
        logger.warning(Cache.CLASSNAME, `Error while adding new channel: {channel: ${channel_name}}`);
        return false;
    }

    async addVersion(channel_name, version_name) {
        const channels = this.cache.filter((c) => c.name === channel_name);
        if (channels.length === 1) {
            const c = channels[0];
            const n = c.item_child.filter((v) => v.name === version_name).length;
            if (n === 0) {
                const v = {
                    name: version_name,
                    type: 'version',
                    item_child: []
                }
                c.item_child.push(v);
                logger.info(Cache.CLASSNAME, `Adding new version: {channel: ${channel_name},version: ${version_name}}`);
                this.saveCache();
                return true;
            }
        }
        logger.warning(Cache.CLASSNAME,
            `Error while adding new version: {channel: ${channel_name},version: ${version_name}}`);
        return false;
    }

    async addFile(channel_name, version_name, file_name) {
        const channels = this.cache.filter((c) => c.name === channel_name);
        if (channels.length === 1) {
            const c = channels[0];
            const versions = c.item_child.filter((v) => v.name === version_name);
            if (versions.length === 1) {
                const v = versions[0];
                const n = v.item_child.filter((f) => f.name === file_name).length;
                if (n === 0) {
                    const f = {
                        name: file_name,
                        type: 'file'
                    }
                    v.item_child.push(f);
                    logger.info(Cache.CLASSNAME,
                        `Adding new file: {channel: ${channel_name},version: ${version_name}, file: ${file_name}}`);
                    this.saveCache();
                }
                return true;
            }
        }
        logger.warning(Cache.CLASSNAME,
            `Error while adding new file: {channel: ${channel_name},version: ${version_name}, file: ${file_name}}`);
        return false;
    }

    saveCache() {
        if (this.save_timeout !== undefined) {
            clearTimeout(this.save_timeout);
        }
        this.save_timeout = setTimeout(() => {
            fs.writeFile(`${this.app_folder}/.cache`, JSON.stringify(this.cache), function (err) {
                if (err) return console.log(err);
                logger.info(Cache.CLASSNAME, 'Cache saved');
            });
        }, configuration.getProperty('timeout_saving', 3500));
    }
}

module.exports = new Cache()