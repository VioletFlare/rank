const mysql = require('mysql2');
const config = require('../config.js');
const isDev = process.argv.includes("--dev");

let pool;

if (isDev) {
    pool = mysql.createPool(config.DB_CONFIG_DEV);
} else {
    pool = mysql.createPool(config.DB_CONFIG_PROD);
}

module.exports = pool;