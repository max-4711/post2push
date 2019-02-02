/**
 * Middleware um Verbindung zur Datenbank herzustellen
 * und an das Request-Object anzuhängen,
 * damit Verbindung im Request-Handler verwendet werden kann;
 * Kann keine Verbindung zur Datenbank hergestellt werden,
 * wird die Anfrage direkt an dieser Stelle mit HTTP/500 beendet,
 * da weitere Verarbeitung der Anfrage sinnlos wäre
 */

import db = require('./db.init');

var getDbConnection = function (req, res, next) {

    db.getConnection(function (err, connection) {

        // Verbindung konnte nicht hergestellt werden -> Anfrage beenden
        if (err) {
            return res.status(500).json({ 'Error': 'Unable to establish a connection to the database!' });
        }

        // Verbidung erfolgreich hergestellt
        else {
            req.connection = connection;
            next();
        }

    });
};

module.exports = getDbConnection;