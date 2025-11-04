const mysql = require('mysql2/promise');
require('dotenv').config();

class Database {
    constructor() {
        if (Database.instance) {
            return Database.instance;
        }

        this.pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            database: process.env.DB_NAME || '',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            connectTimeout: 60000
        });

        Database.instance = this;
    }

    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    getConnection() {
        return this.pool.getConnection();
    }

    async query(sql, params) {
        return this.pool.query(sql, params);
    }
}

module.exports = Database.getInstance();