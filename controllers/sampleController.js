var llmService = require('../services/llmService');

exports.sampleCall = async function(req, res, next) {
  try {
    var data = await llmService.invoke('Hello world');
    res.json({ data: data });
  } catch (err) {
    next(err);
  }
};
