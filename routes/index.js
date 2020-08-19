const express = require('express');
const router = express.Router();


router.get('/:channel/:version/:file', function(req, res) {
  res.render('index', { title: 'Express' });
});

router.get('/:channel/:version/:file/md5', function(req, res) {
  res.render('index', { title: 'Express' });
});

router.get('/:channel/:version/:file/sha', function(req, res) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
