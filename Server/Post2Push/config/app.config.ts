/**
 * Erzeugt neuen Connection-Pool zur MySQL-Datenbank
 */
import mysql = require('mysql');

var dbconfig = require('db.config.js');

var pool = mysql.createPool({
    connectionLimit: 20,
    host: dbconfig.host,
    database: dbconfig.database,
    user: dbconfig.user,
    password: dbconfig.password,
    waitForConnections: dbconfig.waitForConnections
});

module.exports = pool;