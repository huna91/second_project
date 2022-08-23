const dot = require("dotenv").config();

// 데이터베이스 접속에 필요한 설정값
const config = {
    dev : {
        username : "root",
        password : process.env.DATABASE_PASSWORD,
        database : "teamproject",
        host : "127.0.0.1",
        dialect : "mysql"
    },
};

module.exports = config;