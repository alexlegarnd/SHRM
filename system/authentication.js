const jwt = require('jsonwebtoken');
const result = require('./result.enum');
const configuration = require('./configuration');
const accounts = require('./account.manager');
const logger = require('./logger');


class Authentication {

    token_validity = configuration.getProperty('token_validity', '2h');
    static CLASSNAME = 'Authentication';

    authenticationHandler(req, res, next) {
        if (req.path !== '/login') {
            if (req.headers['authorization']) {
                this.tokenHandler(req, res, next);
            } else {
                const ip = (req.headers['x-forwarded-for']) ? req.headers['x-forwarded-for'] : req.connection.remoteAddress;
                logger.warning(Authentication.CLASSNAME, `${ip} trying to access to ${req.path} without authenticate`);
                res.send({ status: result.FAILED, message: 'You need to be authenticated to access this method' });
            }
        } else {
            next();
        }
    }

    adminCredentialHandler (req, res) {
        const username = req.body['username'];
        const password = req.body['password'];
        logger.debug(Authentication.CLASSNAME, `{username: ${username}, password: ${password}}`);

        if (username && password) {
            accounts.authenticateAdministrator(username, password).then((success) => {
                if (success) {
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
            });
        } else {
            res.send({ status: result.FAILED, message: 'Username or password missing'});
        }
    }

    credentialHandler (req, res) {
        const username = req.body['username'];
        const password = req.body['password'];
        logger.debug(Authentication.CLASSNAME, `{username: ${username}, password: ${password}}`);

        if (username && password) {
            accounts.authenticate(username, password).then((success) => {
                if (success) {
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
            });
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
            jwt.verify(token, configuration.jwt_secret_key, (err, decoded) => {
                if (err) {
                    logger.debug(Authentication.CLASSNAME, err.message);
                    res.send({ status: result.FAILED, message: err.message });
                    return;
                }
                logger.debug(Authentication.CLASSNAME, `JWT Token '${token}' valid`);
                logger.debug(Authentication.CLASSNAME, `Logged user: ${decoded.username}`);
                req.body.username = decoded.username;
                next();
            });
        } else {
            logger.debug(Authentication.CLASSNAME, `JWT Token '${token}' is not a valid token`);
            res.send({ status: result.FAILED, message: 'Authentication failed: no token found' });
        }
    }

    async hasAccess(username, channel) {
        return await accounts.hasAccess(channel, username);
    }

}

module.exports = new Authentication();