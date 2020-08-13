const fs = require('fs');


class Configuration {
    properties = {};

    getProperty(name, default_value = undefined) {
        if (this.properties[name]) {
            return this.properties[name];
        }
        return default_value;
    }

    load() {
        const buffer = fs.readFileSync('./config.json', {flag: 'r', encoding: 'utf8'});
        this.properties = JSON.parse(buffer.toString('utf8'));
    }
}

config = new Configuration();
config.load();

module.exports = config;