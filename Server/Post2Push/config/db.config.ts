class DbConfig {
    public host: string;
    public database: string;
    public user: string;
    public password: string;
    public port: number;
    public connectionLimit: number;
    public waitForConnections: boolean;

    constructor() {
        this.host = 'localhost';
        this.database = 'PIPELINE_INSERT_DATABASE_NAME';
        this.user = 'PIPELINE_INSERT_DATABASE_USER';
        this.password = 'PIPELINE_INSERT_DATABASE_PASSWORD';
        this.port = 3306;
        this.connectionLimit = 20;
        this.waitForConnections = true;
    }
}

export = DbConfig;