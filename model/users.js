
const _sequelize = require("sequelize");

class User extends _sequelize.Model {
    // 테이블 생성,연결하기위한 init()
    static init(sequelize) {
        return super.init(
        {
            userID : {
                type : _sequelize.STRING(8),
                allowNull : false,
                primaryKey : true
            },
            password : {
                type : _sequelize.TEXT,
                allowNull : false
            }
        },
        {
            sequelize,
            timestamps : true,
            underscored : true,
            modelName : "User",
            tableName : "users",
            paranoid : false,
            charset : "utf8",
            collate : "utf8_general_ci"
        });
    };
    // 관계형은 아직 없음
};

module.exports = User;
