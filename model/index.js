// 모듈 불러오기
const _sequelize = require("sequelize");
// 모듈화한 파일 불러오기
const config = require("../config/config");
const User = require("./users");
const Room = require("./room");

// sequelize 객체 생성
const sequelize = new _sequelize(
  config.dev.database,
  config.dev.username,
  config.dev.password,
  config.dev
);

// DB 빈객체 생성
const DB = {};
// DB에 키값 추가
DB.sequelize = sequelize;
DB.User = User;
DB.Room = Room;
// 테이블 생성 실행
User.init(sequelize);
Room.init(sequelize);
// 관계형으로 맺어주는 함수 사용
//User.associate(DB);

module.exports = DB;
