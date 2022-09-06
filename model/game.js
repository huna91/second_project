const _sequelize = require("sequelize");

class Game extends _sequelize.Model {
  // 테이블 생성,연결하기위한 init()
  static init(sequelize) {
    return super.init(
      {
        room: {
          type: _sequelize.INTEGER(2),
          allowNull: false,
          primaryKey: true,
        },
        user_1: {
          type: _sequelize.STRING(24),
          allowNull: true,
        },
        user_2: {
          type: _sequelize.STRING(24),
          allowNull: true,
        },
        active: {
          type: _sequelize.INTEGER(1),
          allowNull: false,
        },
        active_end: {
          type: _sequelize.INTEGER(1),
          allowNull: false,
        },
      },
      {
        sequelize,
        timestamps: true,
        underscored: true,
        modelName: "Game",
        tableName: "games",
        paranoid: false,
        charset: "utf8",
        collate: "utf8_general_ci",
      }
    );
  }
  // 관계형은 아직 없음
}

module.exports = Game;
