const configuration = require('./configuration');
const tools = require('./tools');
const fs = require('fs');
const crypto = require('crypto');
const logger = require('./logger');
const { v4: uuidv4 } = require('uuid');


class AccountManager {

    static CLASSNAME = 'AccountManager';
    static ACCOUNT_FILENAME = '.accounts';

    groups = [];
    users = [];
    algorithm = configuration.getProperty('password_hash_algorithm', 'sha256');

    constructor() {
        const path = `${tools.addTrailingSeparatorPath(configuration.getProperty('repo_path'))}.shrm`;
        if (fs.existsSync(`${path}/${AccountManager.ACCOUNT_FILENAME}`)) {
            const buffer = fs.readFileSync(`${path}/${AccountManager.ACCOUNT_FILENAME}`,
                {flag: 'r', encoding: 'utf8'});
            const object = JSON.parse(buffer.toString('utf8'));
            this.groups = object.groups;
            this.users = object.users;
        } else {
            this.resetToDefaultAccount();
            this.saveAccount();
        }
        logger.info(AccountManager.CLASSNAME, `${this.groups.length} groups loaded`);
        logger.info(AccountManager.CLASSNAME, `${this.users.length} users loaded`);
    }

    resetToDefaultAccount() {
        this.resetDefaultGroups();
        this.resetDefaultUser();
    }

    resetDefaultGroups() {
        this.groups = [
            {
                groupId: uuidv4(),
                name: 'Administrators',
                role: 'admin',
                access: [
                    '*'
                ]
            }
        ];
    }

    resetDefaultUser() {
        this.users = [
            {
                userId: uuidv4(),
                memberOf: [
                    this.groups[0].groupId
                ],
                fullname: 'Administrator',
                username: 'admin',
                password: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'
            }
        ];
    }

    authenticate(username, password) {
        const pSum = crypto.createHash(this.algorithm);
        pSum.update(password);
        const hash = pSum.digest('hex');
        const user = this.getUser(username);
        if (user) {
            return (user.password === hash);
        }
        return false;
    }

    authenticateAdministrator(username, password) {
        const pSum = crypto.createHash(this.algorithm);
        pSum.update(password);
        const hash = pSum.digest('hex');
        const user = this.getUser(username);
        if (user) {
            const userGroups = this.getGroups(user);
            let isAdmin = false;
            userGroups.forEach((g) => isAdmin = (g.role === 'admin') ? true : isAdmin);
            return (user.password === hash) && isAdmin;
        }
        return false;
    }

    getUser(username) {
        const userFiltered = this.users.filter((u) => u.username === username);
        if (userFiltered.length === 1) {
            return userFiltered[0];
        }
        return undefined;
    }

    getGroups(user) {
        return user.memberOf.map((gId) => {
            const groupsFiltered = this.groups.filter((g) => g.groupId === gId);
            if (groupsFiltered.length === 1) {
                return groupsFiltered[0];
            }
            return undefined;
        });

    }

    saveAccount() {
        const path = `${tools.addTrailingSeparatorPath(configuration.getProperty('repo_path'))}.shrm`;
        const object = {
            groups: this.groups,
            users: this.users
        }
        fs.writeFile(`${path}/${AccountManager.ACCOUNT_FILENAME}`,
            JSON.stringify(object), function (err) {
            if (err) {
                logger.error(AccountManager.CLASSNAME, err);
                return;
            }
            logger.info(AccountManager.CLASSNAME, `New user context saved`);
        });
    }

}

module.exports = new AccountManager();