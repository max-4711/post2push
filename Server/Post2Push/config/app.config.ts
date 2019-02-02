class AppConfig {
    public channelcreationsecret: string;
    public publicVapidKey: string;
    public privateVapidKey: string;

    constructor() {
        this.channelcreationsecret = 'PIPELINE_INSERT_CHANNELCREATIONSECRET';
        this.publicVapidKey = "PIPELINE_INSERT_PUBLICVAPIDKEY";
        this.privateVapidKey = "PIPELINE_INSERT_PRIVATEVAPIDKEY";
    }
}

export = AppConfig;