var prisma = require('../db');

function create(input, output) {
  return prisma.llmLog.create({ data: { input: input, output: output } });
}

module.exports = { create: create };
