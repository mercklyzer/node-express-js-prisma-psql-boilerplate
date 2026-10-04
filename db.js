require('dotenv/config');
var { PrismaClient } = require('@prisma/client');
var { PrismaPg } = require('@prisma/adapter-pg');

var adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
var prisma = new PrismaClient({ adapter });

module.exports = prisma;
