const express = require('express');
const router = express.Router();
const result = require('../system/result.enum');
const system_authentication = require('../system/authentication');
const system_path = require('../system/path');
const system_file = require('../system/file');


router.use((req, res, next) => {
    if (req.path !== '/login') {
        if (req.headers['authorization']) {
            system_authentication.tokenHandler(req, res, next);
        } else {
            res.send({ status: result.FAILED, message: 'You need to be authenticated to access this method' });
        }
    } else {
        next();
    }
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

module.exports = router;
