const configuration = require('./configuration');
const tools = require('./tools');
const fs = require('fs');
const crypto = require('crypto');
const logger = require('./logger');
const passwordHasher = require('./password.hasher');
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
            logger.info(AccountManager.CLASSNAME, `${this.groups.length} groups loaded`);
            logger.info(AccountManager.CLASSNAME, `${this.users.length} users loaded`);
        } else {
            this.resetToDefaultAccount().then(() => this.saveAccount());
        }
    }

    async resetToDefaultAccount() {
        await this.resetDefaultGroups();
        await this.resetDefaultUser();
    }

    async resetDefaultGroups() {
        this.groups = [];
        await this.createGroup('Administrators', 'admin');
    }

    async resetDefaultUser() {
        this.users = [];
        await this.createUser('admin', 'admin', this.groups[0].groupId, 'Administrator');
    }

    async createGroup(groupName, role, access = '*') {
        if (role === 'admin') {
            access = ['*'];
        } else {
            if (!Array.isArray(access)) {
                access = [access];
            }
        }
        const g = {
            groupId: uuidv4(),
            name: groupName,
            role: role,
            access: access
        }
        this.groups.push(g);
    }

    async createUser(username, password, memberOf, fullname) {
        if (!fullname) {
            fullname = username;
        }
        if (!Array.isArray(memberOf)) {
            memberOf = [memberOf];
        }
        const hash = await passwordHasher.getHash(password);
        const u = {
            userId: uuidv4(),
            memberOf: memberOf,
            fullname: fullname,
            username: username,
            password: hash
        }
        this.users.push(u);
    }

    async addUserToGroup(user, group) {
        let gId = undefined;
        for (const g of this.groups) {
            if (g.groupId === group) {
                gId = g.groupId;
            }
        }
        if (gId) {
            const alreadyAdded = (user.memberOf.filter((g) => g === gId).length > 0);
            if (!alreadyAdded) {
                user.memberOf.push(gId);
            }
        }
        return false;
    }

    async authenticate(username, password) {
        logger.debug(AccountManager.CLASSNAME, `Authentication of ${username} as user`);
        const user = await this.getUser(username);
        if (user) {
            return await passwordHasher.verify(password, user.password);
        }
        logger.debug(AccountManager.CLASSNAME, `User ${username} not found`);
        return false;
    }

    async authenticateAdministrator(username, password) {
        logger.debug(AccountManager.CLASSNAME, `Authentication of ${username} as administrator`);
        const user = await this.getUser(username);
        if (user) {
            const userGroups = await this.getGroups(user);
            let isAdmin = false;
            userGroups.forEach((g) => isAdmin = (g.role === 'admin') ? true : isAdmin);
            return await passwordHasher.verify(password, user.password) && isAdmin;
        }
        logger.debug(AccountManager.CLASSNAME, `Administrator ${username} not found`);
        return false;
    }

    async hasAccess(channel, username = 'anonymous') {
        logger.debug(AccountManager.CLASSNAME, `Checking access of ${username} for ${channel} channel`);
        const isPrivate = configuration.getProperty('private', false);
        if (isPrivate) {
            const user = await this.getUser(username);
            if (user) {
                let access = false;
                const groups = await this.getGroups(user);
                for (const g of groups) {
                    access = (g.access.includes('*')) ? true : (g.access.includes(channel)) ? true : access;
                }
                return access;
            }
            return false;
        } else {
            return true;
        }
    }

    async getUser(username) {
        const userFiltered = this.users.filter((u) => u.username === username);
        if (userFiltered.length === 1) {
            return userFiltered[0];
        }
        return undefined;
    }

    async getGroups(user) {
        return user.memberOf.map((gId) => {
            const groupsFiltered = this.groups.filter((g) => g.groupId === gId);
            if (groupsFiltered.length === 1) {
                return groupsFiltered[0];
            }
            return undefined;
        });
    }

    async groupExist(groupId) {
        return (this.groups.filter((g) => g.groupId === groupId).length > 0);
    }

    async deleteUser(username) {
        const user = await this.getUser(username);
        const i = this.users.indexOf(user);
        if (i !== -1) {
            this.users = this.users.slice(i, 1);
            return true;
        }
        return false;
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