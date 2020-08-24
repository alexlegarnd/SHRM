const express = require('express');
const router = express.Router();
const configuration = require('../system/configuration');
const result = require('../system/result.enum');
const tools = require('../system/tools');
const system_path = require('../system/path');
const system_authentication = require('../system/authentication');
const system_cache = require('../system/cache');
const system_currentversion = require('../system/currentversion.manager');
const logger = require('../system/logger');

const isPrivate = configuration.getProperty('private', false);

router.use((req, res, next) => {
  const ip = (req.headers['x-forwarded-for']) ? req.headers['x-forwarded-for'] : req.connection.remoteAddress;
  logger.info('HTTP', `${ip} => ${req.method} ${req.path}`);
  if (isPrivate) {
    system_authentication.authenticationHandler(req, res, next);
  } else {
    next();
  }
});

router.post('/login', (req, res) => {
  if (isPrivate) {
    system_authentication.credentialHandler(req, res);
  } else {
    res.send({status: result.FAILED, message: "This repository is public, no token is needed"});
  }
});

router.get('/get/:channel/:version/:file', function(req, res) {
  const channel = req.params['channel'];
  const version = req.params['version'];
  const file = req.params['file'];
  const path = tools.addTrailingSeparatorPath(configuration.getProperty('repo_path'));
  system_authentication.hasAccess(req.body.username, channel).then((access) => {
    if (access) {
      system_path.isFileAlreadyUpload(channel, version, file).then((exist) => {
        if (exist) {
          if (!file.endsWith('.md5') && !file.endsWith('.sha')) {
            res.sendFile(`${path}${channel}/${version}/${file}`);
          } else {
            res.send({status: result.SUCCESS, message: "This file exist but for getting hash " +
                  "use '/md5' or '/sha' instead of '/get'"});
          }

        } else {
          res.send({status: result.FAILED, message: 'file not found'});
        }
      });
    } else {
      res.send({status: result.FAILED, message: 'You are not allowed to access to this channel'});
    }
  });
});

router.get('/md5/:channel/:version/:file', function(req, res) {
  const channel = req.params['channel'];
  const version = req.params['version'];
  const file = req.params['file'];
  const path = tools.addTrailingSeparatorPath(configuration.getProperty('repo_path'));
  system_authentication.hasAccess(req.body.username, channel).then((access) => {
    if (access) {
      system_path.isFileAlreadyUpload(channel, version, file).then((exist) => {
        if (exist) {
          if (!file.endsWith('.md5') && !file.endsWith('.sha')) {
            res.sendFile(`${path}${channel}/${version}/${file}.md5`);
          } else {
            res.send({status: result.SUCCESS, message: "Try without .md5 or .sha extension"});
          }
        } else {
          res.send({status: result.FAILED, message: 'file not found'});
        }
      });
    } else {
      res.send({status: result.FAILED, message: 'You are not allowed to access to this channel'});
    }
  });
});

router.get('/sha/:channel/:version/:file', function(req, res) {
  const channel = req.params['channel'];
  const version = req.params['version'];
  const file = req.params['file'];
  const path = tools.addTrailingSeparatorPath(configuration.getProperty('repo_path'));
  system_authentication.hasAccess(req.body.username, channel).then((access) => {
    if (access) {
      system_path.isFileAlreadyUpload(channel, version, file).then((exist) => {
        if (exist) {
          if (!file.endsWith('.md5') && !file.endsWith('.sha')) {
            res.sendFile(`${path}${channel}/${version}/${file}.sha`);
          } else {
            res.send({status: result.SUCCESS, message: "Try without .md5 or .sha extension"});
          }
        } else {
          res.send({status: result.FAILED, message: 'file not found'});
        }
      });
    } else {
      res.send({status: result.FAILED, message: 'You are not allowed to access to this channel'});
    }
  });
});

router.get('/list/channels', (req, res) => {
  system_cache.getChannels().then((c) => {
    res.send({status: result.SUCCESS, message: c.length, channels: c});
  })
});

router.get('/list/:channel/versions', (req, res) => {
  const channel = req.params['channel'];
  system_cache.getVersions(channel).then((v) => {
    res.send({status: result.SUCCESS, message: v.length, channels: v});
  })
});

router.get('/list/:channel/:version/files', (req, res) => {
  const channel = req.params['channel'];
  const version = req.params['version'];
  system_cache.getVersions(channel, version).then((f) => {
    res.send({status: result.SUCCESS, message: f.length, channels: f});
  })
});

router.get('/current/:channel', (req, res) => {
  const channel = req.params['channel'];
  system_currentversion.get_current_version(channel).then((current_version) => {
    if (current_version) {
      res.send({status: result.SUCCESS, message: current_version});
    } else {
      res.send({status: result.FAILED, message: `No current version for channel ${channel}`});
    }
  })
});

module.exports = router;
