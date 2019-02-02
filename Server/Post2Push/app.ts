import debug = require('debug');
import express = require('express');
import path = require('path');
import webpush = require('web-push');
import AppConfiguration = require('./config/app.config');

import baseEndpoints from './routes/get';
import channelEndpoints from './routes/channels';
import subscriptionEndpoints from './routes/subscriptions';

console.log("Initializing express...");
var app = express();
app.use(express.static(path.join(__dirname, 'public')));

console.log("Configuring routes...");
app.use('/', baseEndpoints);
app.use('/channels', channelEndpoints);
app.use('/subscriptions', subscriptionEndpoints);

app.use(require('body-parser').json());

console.log("Setting up vapid...");
const appConfig = new AppConfiguration();
webpush.setVapidDetails(appConfig.vapidContactInfo, appConfig.publicVapidKey, appConfig.privateVapidKey);

// catch 404 and forward to error handler
console.log("Configuring error handlers...");
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err['status'] = 404;
    next(err);
});

// development error handler: stacktraces
if (app.get('env') === 'development') {
    app.use((err: any, req, res, next) => {
        res.status(400).send('error', {
            message: err.message,
            error: err
        });
        //res.status(err['status'] || 500).send('error', {
        //    message: err.message,
        //    error: err
        //});
    });
}

// production error handler: no stacktraces leaked to user
app.use((err: any, req, res, next) => {
    res.status(err.status || 500).send('error', {
        message: err.message,
        error: {}
    });
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
