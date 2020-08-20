const jwt = require('jsonwebtoken');
const result = require('./result.enum');
const configuration = require('./configuration');
const accounts = require('./account.manager');

const ADMIN = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918';


class Authentication {

    token_validity = configuration.getProperty('token_validity', '2h');
    static CLASSNAME = 'Authentication';

    adminCredentialHandler (req, res) {
        const username = req.body['username'];
        const password = req.body['password'];

        if (username && password) {
            if (accounts.authenticateAdministrator(username, password)) {
                let token = jwt.sign(
                    { username: username },
                    configuration.jwt_secret_key,
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

    credentialHandler (req, res) {
        const username = req.body['username'];
        const password = req.body['password'];

        if (username && password) {
            if (accounts.authenticate(username, password)) {
                let token = jwt.sign(
                    { username: username },
                    configuration.jwt_secret_key,
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
            jwt.verify(token, configuration.jwt_secret_key, (err) => {
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

}

module.exports = new Authentication();