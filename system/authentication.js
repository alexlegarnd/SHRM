const jwt = require('jsonwebtoken');
const config = require('../config');
const result = require('../system/request.result.enum');
const configuration = require('./configuration');
const tools = require('./tools');
const crypto = require('crypto');
const fs = require('fs');
const logger = require('./logger');

const ADMIN = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918';


class Authentication {

    users = {};
    token_validity = configuration.getProperty('token_validity', '2h');
    app_folder = `${tools.addTrailingSeparatorPath(configuration.getProperty('repo_path'))}.shrm`
    users_file = `${this.app_folder}/.administrators`;
    static CLASSNAME = 'Authentication';

    constructor() {
        if (fs.existsSync(this.users_file)) {
            const data = fs.readFileSync(this.users_file, 'UTF-8');
            const lines = data.split(/\r?\n/);

            for (const line of lines) {
                // Works with "username_hash|password_hash"
                const couple = line.split(/\|/);
                if (couple.length === 2) {
                    this.users[couple[0]] = couple[1];
                }
            }
            logger.info(Authentication.CLASSNAME, `${Object.keys(this.users).length} users loaded`)
        } else {
            this.users[ADMIN] = ADMIN;
            fs.writeFile(this.users_file, `${ADMIN}|${ADMIN}`, function (err) {
                if (err) return console.log(err);
            });
        }
    }


    credentialHandler (req, res) {
        const username = req.headers['x-username'];
        const password = req.headers['x-password'];

        if (username && password) {
            if (this.authenticate(username, password)) {
                let token = jwt.sign(
                    { username: username },
                    config.secret,
                    { expiresIn: this.token_validity }
                );
                res.send({
                    status: result.SUCCESS,
                    message: `Authentication successful, this token is valid ${this.token_validity}`,
                    token: token
                });
            } else {
                res.send({ status: result.FAILED, message: 'Incorrect username or password'});
            }
        } else {
            res.send({ status: result.FAILED, message: 'Username or password missing'});
        }
    }

    tokenHandler(req, res, next) {
        let token = req.headers['authorization'];
        if (token.startsWith('Bearer ')) {
            // Remove Bearer from string
            token = token.slice(7, token.length);
        }

        if (token) {
            jwt.verify(token, config.secret, (err) => {
                if (err) {
                    res.send({ status: result.FAILED, message: err.message });
                    return;
                }
                next();
            });
        } else {
            res.send({ status: result.FAILED, message: 'Authentication failed: no token found' });
        }
    }

    authenticate(username, password) {
        const uSum = crypto.createHash('sha256');
        const pSum = crypto.createHash('sha256');
        uSum.update(username);
        pSum.update(password)
        const uHash = uSum.digest('hex');
        const pHash = pSum.digest('hex');
        return (this.users[uHash] && this.users[uHash] === pHash);
    }

}

module.exports = new Authentication();