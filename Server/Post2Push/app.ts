import debug = require('debug');
import express = require('express');
import path = require('path');
import webpush = require('web-push');
import AppConfiguration = require('./config/app.config');

import baseEndpoints from './routes/get';
import clientEndpoints from './routes/clients';
import channelEndpoints from './routes/channels';
import subscriptionEndpoints from './routes/subscriptions';

const appConfig = new AppConfiguration();

console.log("Initializing express...");
var app = express();
//enable CORS
app.use(function (req: any, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, PUT, PATCH, OPTIONS, HEAD"); //'*' not supported by IE6 New-Gen a.k.a. Safari
    next();
});
app.use(require('body-parser').json());
//app.use(app.router);
app.use(appConfig.baseRoute + '/public', express.static(path.join(__dirname, 'public')));

console.log("Configuring routes...");
app.use(appConfig.baseRoute + '/', baseEndpoints);
app.use(appConfig.baseRoute + '/channels', channelEndpoints);
app.use(appConfig.baseRoute + '/clients', clientEndpoints);
app.use(appConfig.baseRoute + '/subscriptions', subscriptionEndpoints);

console.log("Setting up vapid...");
webpush.setVapidDetails(appConfig.vapidContactInfo, appConfig.publicVapidKey, appConfig.privateVapidKey);

// catch 404 and forward to error handler
console.log("Configuring error handlers...");
app.use(function (req: any, res, next) {
    req.connection.release();
    var err = new Error('Route ' + req.originalUrl + ' does not exist.');
    err['status'] = 404;
    next(err);
});

// development error handler: stacktraces
if (app.get('env') === 'development') {
    app.use((err: any, req: any, res, next) => {
        res.status(err['status'] || 500).json({ 'Error': err.message }).end();
    });
}

// production error handler: no stacktraces leaked to user
app.use((err: any, req: any, res, next) => {
    res.status(err.status || 500).json({ 'Error': err.message }).end();
});

var port = 60000;
if (process.env.PORT !== null && typeof process.env.PORT !== 'undefined') {
    port = +process.env.PORT;
    console.log("Using port " + port + " configured in environment variable 'PORT'.");
}

app.set('port', port);

console.log("Listening on port " + port);

var server = app.listen(app.get('port'), function () {
    debug('Express server listening on port ' + server.address().port);
    console.log("Startup complete.");
});
