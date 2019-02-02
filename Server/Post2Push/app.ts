import debug = require('debug');
import express = require('express');
import path = require('path');
import webpush = require('web-push');
import AppConfiguration = require('./config/app.config');

import baseEndpoints from './routes/get';
import channelEndpoints from './routes/channels';
import subscriptionEndpoints from './routes/subscriptions';

var app = express();
const appConfig = new AppConfiguration();

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', baseEndpoints);
app.use('/channels', channelEndpoints);
app.use('/subscriptions', subscriptionEndpoints);

app.use(require('body-parser').json());

webpush.setVapidDetails('mailto:info@notifications.studio-4711.com', appConfig.publicVapidKey, appConfig.privateVapidKey);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err['status'] = 404;
    next(err);
});

// development error handler: stacktraces
if (app.get('env') === 'development') {
    app.use((err: any, req, res, next) => {
        res.status(err['status'] || 500).send('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler: no stacktraces leaked to user
app.use((err: any, req, res, next) => {
    res.status(err.status || 500).send('error', {
        message: err.message,
        error: {}
    });
});

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function () {
    debug('Express server listening on port ' + server.address().port);
});
