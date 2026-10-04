var express = require('express');
var router = express.Router();
var sampleController = require('../controllers/sampleController');

/* GET sample LLM call. */
router.get('/', sampleController.sampleCall);

module.exports = router;
