const mysql = require('mysql2');
const config = require('../../config.js');
const isDev = process.argv.includes("--dev");

let poolConfig;

if (isDev) {
    poolConfig = config.DB_CONFIG_DEV;
} else {
    poolConfig = config.DB_CONFIG_PROD;
}

poolConfig.multipleStatements = true;

const pool = mysql.createPool(poolConfig);

module.exports = pool;