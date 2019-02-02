﻿class AppConfig {
    public channelcreationsecret: string;
    public publicVapidKey: string;
    public privateVapidKey: string;
    public vapidContactInfo: string;
    public baseRoute: string;

    constructor() {
        this.channelcreationsecret = 'PIPELINE_INSERT_CHANNELCREATIONSECRET';
        this.publicVapidKey = "PIPELINE_INSERT_PUBLICVAPIDKEY";
        this.privateVapidKey = "PIPELINE_INSERT_PRIVATEVAPIDKEY";
        this.vapidContactInfo = "mailto:PIPELINE_INSERT_VAPIDCONTACTINFO";
        this.baseRoute = "/PIPELINE_INSERT_BASEROUTE";
    }
}

export = AppConfig;