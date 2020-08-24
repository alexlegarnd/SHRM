const fs = require('fs');


class Configuration {

    properties = {};
    jwt_secret_key = '';

    constructor() {
        this.load();
    }

    getProperty(name, default_value = undefined) {
        if (this.properties[name]) {
            return this.properties[name];
        }
        return default_value;
    }

    load() {
        const buffer = fs.readFileSync('./config.json', {flag: 'r', encoding: 'utf8'});
        this.properties = JSON.parse(buffer.toString('utf8'));
        if (fs.existsSync('./jwt.json')) {
            const buffer = fs.readFileSync('./jwt.json', {flag: 'r', encoding: 'utf8'});
            this.jwt_secret_key = buffer.toString('utf8');
        } else {
            this.jwt_secret_key = this.generateSecretKey();
            const jwt_json = JSON.stringify({secret: this.jwt_secret_key});
            fs.writeFile('./jwt.json', jwt_json, () => {});
        }
    }

    generateSecretKey() {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }
}

module.exports = new Configuration();