const express = require('express');
const router = express.Router();
const system_path = require('../system/path');
const result = require('../system/request.result.enum');

router.use((req, res, next) => {
    // Check token and auth
    next();
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
                system_path.isFileAlreadyUpload(channel, version, file.name).then((exist) => {
                    if (!exist) {
                        system_path.copyFile(channel, version, file, (err) => {
                            if (!err) {
                                res.send({ status: result.SUCCESS, message: '' });
                            } else {
                                res.send({ status: result.FAILED, message: err.message });
                            }
                        });
                    } else {
                        res.send({ status: result.FAILED,
                            message: 'This file already exists. Delete it to upload a new copy' });
                    }
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
