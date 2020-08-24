const fs = require('fs');
const configuration = require('./configuration');
const tools = require('./tools');
const logger = require('./logger');


class CurrentVersionManager {

    static CLASSNAME = 'CurrentVersionManager'
    current_versions = {};

    constructor() {
        const path = `${tools.addTrailingSeparatorPath(configuration.getProperty('repo_path'))}.shrm`;
        if (fs.existsSync(`${path}/.current_version`)) {
            const buffer = fs.readFileSync(`${path}/.current_version`, {flag: 'r', encoding: 'utf8'});
            this.current_versions = JSON.parse(buffer.toString('utf8'));
        }
    }

    set_current_version(channel, version) {
        this.current_versions[channel] = version;
        this.saveToJson();
    }

    async get_current_version(channel) {
        if (this.current_versions[channel]) {
            return `${channel}/${this.current_versions[channel]}`;
        }
        return undefined;
    }

    saveToJson() {
        const path = `${tools.addTrailingSeparatorPath(configuration.getProperty('repo_path'))}.shrm`;
        fs.writeFile(`${path}/.current_version`, JSON.stringify(this.current_versions), function (err) {
            if (err) {
                logger.error(Cache.CLASSNAME, err);
                return;
            }
            logger.debug(CurrentVersionManager.CLASSNAME, 'Current version changed');
        });
    }

}

module.exports = new CurrentVersionManager();