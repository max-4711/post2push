/**
 * Erzeugt neuen Connection-Pool zur MySQL-Datenbank
 */
import mysql = require('mysql');
import dbconfig = require('../config/db.config');
var dbConfiguration = new dbconfig();

var pool = mysql.createPool({
    connectionLimit: dbConfiguration.connectionLimit,
    host: dbConfiguration.host,
    database: dbConfiguration.database,
    user: dbConfiguration.user,
    password: dbConfiguration.password,
    waitForConnections: dbConfiguration.waitForConnections,
    port: dbConfiguration.port
});

export = pool;