var express = require('express');
var router = express.Router();
var prisma = require('../db');

/* GET users listing. */
router.get('/', async function(req, res, next) {
  try {
    var users = await prisma.user.findMany();
    res.json(users);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
