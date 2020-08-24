const VERSION = require('../version');
const express = require('express');
const router = express.Router();
const result = require('../system/result.enum');
const system_authentication = require('../system/authentication');
const accounts = require('../system/account.manager');
const system_path = require('../system/path');
const system_file = require('../system/file');

router.use((req, res, next) => {
    system_authentication.authenticationHandler(req, res, next);
});

router.get('/uptime', (req, res) => {
    res.send({status: result.SUCCESS, message: process.uptime()});
});

router.get('/memoryusage', (req, res) => {
    res.send({status: result.SUCCESS, message: "Hint: heapTotal and heapUsed refer to V8's memory usage"
        ,memory: process.memoryUsage()});
});

router.get('/version', (req, res) => {
    res.send({status: result.SUCCESS, message: VERSION});
});

router.post('/login', (req, res) => {
    system_authentication.adminCredentialHandler(req, res);
});

router.get('/new/channel/:channel', (req, res) => {
    const channel = req.params['channel'];
    system_path.createChannel(channel).then(() => {
        res.send({ status: result.SUCCESS, message: 'Channel created' });
    }).catch((err) => {
        res.send({ status: result.FAILED, message: err.message });
    });
});

router.post('/post/:channel/:version', (req, res) => {
    const channel = req.params['channel'];
    const version = req.params['version'];
    if (req.files['archive']) {
        system_path.isChannelCreated(channel).then((is_created) => {
            if (is_created) {
                const file = req.files.archive;
                system_file.addToHistory(channel, version, file.name).then(() => {
                    system_path.copyFile(channel, version, file, (err) => {
                        if (!err) {
                            res.send({ status: result.SUCCESS, message: 'File added successfully' });
                        } else {
                            res.send({ status: result.FAILED, message: err.message });
                        }
                    });
                });
            } else {
                res.send({ status: result.FAILED, message: 'This channel does not exist' });
            }
        }).catch(err => {
            res.send({ status: result.FAILED, message: err.message });
        });
    } else {
        res.send({ status: result.FAILED, message: 'Request did not contain an archive file' });
    }
});

router.post('/user/add/:group', (req, res) => {
    const group = req.params['group'];
    const username = req.body.username;
    const password = req.body.password;
    const fullname = (req.body.fullname) ? req.body.fullname : username;
    if (username && password) {
        accounts.groupExist(group).then((exist) => {
            if (exist) {
                accounts.getUser(username).then((user) => {
                    if (user) {
                        accounts.addUserToGroup(user, group).then(() =>
                            res.send({ status: result.SUCCESS, message: `${username} is added to ${group}` }));
                    } else {
                        accounts.createUser(username, password, group, fullname)
                            .then(() => res.send(
                                { status: result.SUCCESS, message: `${username} created and added to ${group}` }));
                    }
                    accounts.saveAccount();
                });
            } else {
                res.send({ status: result.FAILED, message: `Group: ${group} is not a valid group id` });
            }
        });
    } else {
        res.send({ status: result.FAILED, message: `username or password missing` });
    }
});

router.post('/user/remove/:user', (req, res) => {
    const username = req.params['user'];
    accounts.deleteUser(username).then((done) => {
        if (done) {
            res.send({ status: result.SUCCESS, message: `${username} is deleted from users` });
        } else {
            res.send({ status: result.FAILED, message: `${username} is not a valid username` });
        }
    })
});

router.post('/group/new/', (req, res) => {
    const group = req.body.name;
    const access = req.body['channelAllowed'];
    accounts.groupExist(group).then((exist) => {
        if (!exist) {
            accounts.createGroup(group, access).then(() => {
                res.send({ status: result.SUCCESS, message: `Group ${group} created` });
            })
        } else {
            res.send({ status: result.FAILED, message: `Group: ${group} already exist` });
        }
    });
});



module.exports = router;
