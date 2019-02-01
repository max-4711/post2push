class AppConfig {
    public channelcreationsecret: string;

    constructor() {
        this.channelcreationsecret = 'PIPELINE_INSERT_CHANNELCREATIONSECRET';
    }
}

export = AppConfig;