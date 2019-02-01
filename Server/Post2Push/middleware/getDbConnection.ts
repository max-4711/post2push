/**
 * Middleware um Verbindung zur Datenbank herzustellen
 * und an das Request-Object anzuhängen,
 * damit Verbindung im Request-Handler verwendet werden kann;
 * Kann keine Verbindung zur Datenbank hergestellt werden,
 * wird die Anfrage direkt an dieser Stelle mit HTTP/500 beendet,
 * da weitere Verarbeitung der Anfrage sinnlos wäre
 */

var db = require('../db/db.init');

var getDbConnection = function (req, res, next) {

    db.getConnection(function (err, connection) {

        // Verbindung konnte nicht hergestellt werden -> Anfrage beenden
        if (err) {
            var error = {
                message: 'Verbindung zur Datenbank fehlgeschlagen!'
            };
            return res.status(500).json(error);
        }

        // Verbidung erfolgreich hergestellt
        else {
            req.dBconnection = connection;
            next();
        }

    });
};

module.exports = getDbConnection;