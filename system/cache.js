const configuration = require('./configuration');
const tools = require('./tools');
const fs = require('fs');
const logger = require('./logger');

class Cache {

    static CLASSNAME = 'Cache';

    cache = []

    save_timeout;

    app_folder = `${tools.addTrailingSeparatorPath(configuration.getProperty('repo_path'))}.shrm`

    constructor() {
        if(fs.existsSync(`${this.app_folder}/.cache`)) {
            this.loadCache();
            this.checkIntegrity();
        } else {
            this.rebuildCache();
        }
    }

    async addChannel(channel_name) {
        const n = this.cache.filter((c) => c.name === channel_name).length;
        if (n === 0) {
            const c = {
                name: channel_name,
                type: 'channel',
                item_child: []
            };
            this.cache.push(c);
            logger.debug(Cache.CLASSNAME, `Adding new channel: {channel: ${channel_name}}`);
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
                logger.debug(Cache.CLASSNAME, `Adding new version: {channel: ${channel_name},version: ${version_name}}`);
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
                    logger.debug(Cache.CLASSNAME,
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
                if (err) {
                    logger.error(Cache.CLASSNAME, err);
                    return;
                }
                logger.debug(Cache.CLASSNAME, 'Cache saved');
            });
        }, configuration.getProperty('timeout_saving', 3500));
    }

    loadCache() {
        const path = `${this.app_folder}/.cache`;
        if(fs.existsSync(path)) {
            logger.info(Cache.CLASSNAME, 'Loading cache');
            try {
                const buffer = fs.readFileSync(path, {flag: 'r', encoding: 'utf8'});
                this.cache = JSON.parse(buffer.toString('utf8'));
            } catch (e) {
                logger.error(Cache.CLASSNAME, e);
                this.cache = [];
            }
        }
    }

    checkIntegrity() {
        logger.info(Cache.CLASSNAME, 'Checking integrity');
        let isComplete = true;
        const repo = tools.addTrailingSeparatorPath(configuration.getProperty('repo_path'));
        for (const c of this.cache) {
            if (fs.existsSync(`${repo}${c.name}`)) {
                for (const v of c.item_child) {
                    if (fs.existsSync(`${repo}${c.name}/${v.name}`)) {
                        for (const f of v.item_child) {
                            if (!fs.existsSync(`${repo}${c.name}/${v.name}/${f.name}`)) {
                                isComplete = false;
                            }
                        }
                    } else {
                        isComplete = false;
                    }
                }
            } else {
                isComplete = false;
            }
        }

        if (!isComplete) {
            logger.warning(Cache.CLASSNAME, 'Cache corrupted');
            this.rebuildCache();
        } else {
            logger.info(Cache.CLASSNAME, 'Cache complete');
        }
    }

    rebuildCache() {
        logger.info(Cache.CLASSNAME, 'Rebuild cache');
        this.cache = [];
        const repo = tools.addTrailingSeparatorPath(configuration.getProperty('repo_path'));
        fs.readdir(repo, (err, files) => {
            if (err) {
                logger.error(Cache.CLASSNAME, err);
                return;
            }
            for (const file of files) {
                if ((file !== '.shrm')) {
                    logger.debug(Cache.CLASSNAME, `[Rebuild] Channel found: ${file}`)
                    const c = {
                        name: file,
                        type: 'channel',
                        item_child: []
                    };
                    this.rebuildVersionsCache(`${repo}${file}`, c)
                    this.cache.push(c);
                }
            }
        });
        this.saveCache();
    }

    rebuildVersionsCache(path, c) {
        fs.readdir(path, (err, files) => {
            if (err) {
                logger.error(Cache.CLASSNAME, err);
                return;
            }
            for (const file of files) {
                if (fs.lstatSync(`${path}/${file}`).isDirectory()) {
                    logger.debug(Cache.CLASSNAME, `[Rebuild] Version found: ${file}`)
                    const v = {
                        name: file,
                        type: 'version',
                        item_child: []
                    };
                    this.rebuildFilesCache(`${path}/${file}`, v)
                    c.item_child.push(v);
                }
            }
        });
    }

    rebuildFilesCache(path, v) {
        fs.readdir(path, (err, files) => {
            if (err) {
                logger.error(Cache.CLASSNAME, err);
                return;
            }
            for (const file of files) {
                if (!file.endsWith('.md5') && !file.endsWith('.sha') && !file.endsWith('.history')) {
                    if (fs.lstatSync(`${path}/${file}`).isFile()) {
                        logger.debug(Cache.CLASSNAME, `[Rebuild] File found: ${file}`);
                        const f = {
                            name: file,
                            type: 'file'
                        };
                        v.item_child.push(f);
                    } else {
                        logger.debug(Cache.CLASSNAME, `[Rebuild] [Skipped] Dirty file found: ${file}`)
                    }
                }
            }
        });
    }
}

module.exports = new Cache()