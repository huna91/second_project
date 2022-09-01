// 사용할 모듈 불러오기
const express = require("express");
const path = require("path");
const fs = require("fs");
const ejs = require("ejs");
const socketio = require("socket.io");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookie = require("cookie-parser");
const mysql = require("mysql2");
const session = require("express-session");
const world = require("./game/js/server_world");
// model/index.js 에서 키값 가져오기
const { sequelize, User, Room, Game } = require("./model");
// const Room = require("./model/room");

// express 실행
const app = express();
// 포트번호
const PORT = 3010;

// 포트 열기
const server = app.listen(PORT, () => {
  console.log(`${PORT}번 포트 연결`);
});

const io = socketio(server);

// 기본 경로 설정

// html파일 기본경로는 최상위폴더로 지정해놨습니다.
app.set("views", path.join(__dirname));
// html을 제외한 다른 파일들 경로 지정
app.use(express.static(__dirname + "/intro"));
app.use("/login/", express.static(path.join(__dirname + "/login")));
app.use("/game/", express.static(path.join(__dirname + "/game")));
app.use("/join/", express.static(path.join(__dirname + "/join")));
app.use("/waiting/", express.static(path.join(__dirname + "/waiting")));
// DB 모듈?용 파일 경로 지정
app.use("/config/", express.static(path.join(__dirname + "/config")));
app.use("/model/", express.static(path.join(__dirname + "/model")));
// three.js 경로 지정
app.use(
  "/build/",
  express.static(path.join(__dirname, "node_modules/three/build"))
);
app.use(
  "/jsm/",
  express.static(path.join(__dirname, "node_modules/three/examples/jsm"))
);

// 뷰엔진을 ejs방식으로 설정
app.engine("html", ejs.renderFile);
// 뷰엔진을 html을 랜더링할 때 사용
app.set("view engine", "html");
// body객체 사용함 설정
app.use(express.urlencoded({ extended: false }));
// cookie-parser 사용준비
app.use(cookie());

// 세션 사용준비
app.use(
  session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: true,
  })
);

// mysql 연결
const client = mysql.createConnection({
  user: "root",
  password: process.env.DATABASE_PASSWORD,
  database: "teamproject",
  multipleStatements: true,
});

// *******************************초기화*********************************
sequelize
  .sync({ force: false })
  .then(() => {
    // 연결 성공
    console.log("DB 연결");
  })
  .catch((err) => {
    // 연결 실패
    console.log(err);
  });

// 첫번째 페이지
app.get("/", (req, res) => {
  res.render("/intro/");
});

// 미들웨어 생성. 토큰 확인하는 함수
const middleware = (req, res, next) => {
  const { access_token, refresh_token } = req.session;
  // access_token 확인
  jwt.verify(access_token, process.env.ACCESS_TOKEN_KEY, (err, acc_decoded) => {
    if (err) {
      // access_token이 만료 되었으면
      jwt.verify(
        refresh_token,
        process.env.REFRESH_TOKEN_KEY,
        (err, ref_decoded) => {
          if (err) {
            res.render("login/err/relogin");
          } else {
            const sql = "SELECT * FROM users WHERE user_i_d=?;";
            client.query(sql, [ref_decoded.userID], (err, result) => {
              if (err) {
                console.log("DB 연결을 확인해주세요");
              } else {
                if (result[0]?.refreshToken == refresh_token) {
                  const accessToken = jwt.sign(
                    { userID: ref_decoded.userID },
                    process.env.ACCESS_TOKEN_KEY,
                    { expiresIn: "1h" }
                  );
                  req.session.access_token = accessToken;
                  next();
                } else {
                  res.render("login/err/relogin");
                }
              }
            });
          }
        }
      );
    } else {
      next();
    }
  });
};

// login/signup 페이지 불러오는거
app.get("/signup", (req, res) => {
  res.render("login/signup");
});

// login/signup 정보 받아오는거
app.post("/signup", (req, res) => {
  const { id, password, confirm } = req.body;
  console.log(id, "회원가입시도");
  // 받아온 id, password 정규식 검사
  const regID = /^[0-9a-zA-Z가-힣]{3,8}$/;
  const regPW = /^[a-zA-Z0-9]{8,16}$/;
  const ID = regID.test(id);
  const PW = regPW.test(password);
  if (ID == false) {
    res.render("login/err/ID_err");
  } else if (PW == false) {
    res.render("login/err/pw_err");
  } else if (password != confirm) {
    res.render("login/err/dupPW_err");
  } else if (ID == true && PW == true) {
    // 정규식 통과하면 실행
    User.findOne({
      where: {
        userID: id,
      },
    }).then((e) => {
      // then >> 작업에 성공하면!!
      // password 암호화
      bcrypt.hash(password, 10, (err, data) => {
        // 아이디 중복인지 확인
        if (e === null) {
          // 아이디 중복이 아니면 실행
          const signup = User.create({
            userID: id,
            password: data,
          });
          console.log("가입성공");
          res.redirect("/login");
        } else {
          // 아이디 중복시
          console.log("가입실패");
          res.render("login/err/dupID_err");
        }
      });
    });
  }
});
let sql =
  // login/login 페이지 정보 받아서 확인후 넘기기
  app.post("/login", (req, res) => {
    const { id, password } = req.body;
    console.log(id, "로그인 시도");
    // 데이터베이스에서 입력한 ID가 있는지 검색
    User.findOne({
      where: {
        userID: id,
      },
    }).then((e) => {
      // 아이디가 없으면
      if (e === null) {
        console.log(id, "로그인 실패");
        res.render("login/err/login_err");
      } else {
        // 아이디가 있으면 입력한 패스워드와 DB의 패스워드 비교
        bcrypt.compare(password, e.password, (err, same) => {
          // 패스워드가 맞으면
          if (same) {
            console.log(id, "로그인 성공");
            // access token 발급
            const accessToken = jwt.sign(
              {
                userID: id,
              },
              process.env.ACCESS_TOKEN_KEY,
              {
                // 유효기간 1시간
                expiresIn: "1h",
              }
            );
            // resfresh token 발급
            const refreshToken = jwt.sign(
              {
                userID: id,
              },
              process.env.REFRESH_TOKEN_KEY,
              {
                expiresIn: "1d",
              }
            );
            // 쿼리문으로 DB에 refresh token을 저장
            const sql = "UPDATE users SET refresh_token=? WHERE user_i_d=?;";
            client.query(sql, [refreshToken, id]);
            // 세션에 각 토큰값을 할당, express-session에 저장
            req.session.access_token = accessToken;
            req.session.refresh_token = refreshToken;
            req.session.ids = id;
            //console.log(accessToken, refreshToken);
            // 페이지 이동
            res.redirect("/waiting");
          } else {
            // 패스워드가 틀리면
            console.log("password Error");
            res.render("login/err/login_err");
          }
        });
      }
    });
  });
let myId;

// 대기실 입장페이지 불러오는거
app.get("/waiting", middleware, (req, res) => {
  const username = req.session;
  myId = username.ids;
  // req.session 에 저장 해놓은 ids 값을 랜더링 하면서 넘김
  res.render("waiting/waiting", { user: username.ids });
});

// ------------------------ 소켓 연결 ------------------------
// 접속유저
let users = {};

io.on("connection", (socket) => {
  console.log("소켓 연결 - appjs");
  // waiting 소켓 컨트롤
  socket.on("new-user-joined", (username) => {
    users[socket.id] = username;
    io.emit("user-connected", username);
    io.emit("user-list", users);
  });

  // socket.on("disconnect", () => {
  //   socket.broadcast.emit("user-disconnected", users[socket.id]);
  //   delete users[socket.id];
  //   io.emit("user-list", users);
  // });

  socket.on("message", (data) => {
    socket.broadcast.emit("message", { user: data.user, msg: data.msg });
  });

  // game 소켓 컨트롤
  let id = socket.id;
  world.addPlayer(id);

  let player = world.playerForId(id);
  socket.emit("createPlayer", player);

  socket.broadcast.emit("addOtherPlayer", player);

  socket.on("requestOldPlayers", function () {
    for (var i = 0; i < world.players.length; i++) {
      if (world.players[i].playerId != id)
        socket.emit("addOtherPlayer", world.players[i]);
    }
  });
  socket.on("updatePosition", function (data) {
    let newData = world.updatePlayerData(data);
    socket.broadcast.emit("updatePosition", newData);
  });

  console.log("appjs쪽 : " + socket.id);
  socket.on("gameStart", () => {
    let _id = socket.id;
    socket.emit("gameStart", _id);
  });

  let check_users = [];
  socket.on("gameReady", (ImUsr, room) => {
    Game.findOne({
      where: {
        room: 0,
      },
    }).then((e) => {
      if (e.dataValues.user_1 != null) {
        check_users.push(e.dataValues.user_1);
      }
      if (check_users[0] == null) {
        const sql = "UPDATE games SET user_1=? WHERE room=?;";
        client.query(sql, [ImUsr, room]);
      } else {
        const sql = "UPDATE games SET user_2=? WHERE room=?;";
        client.query(sql, [ImUsr, room]);
      }
      check_users.push(ImUsr);
      console.log(check_users);
      if (check_users.length == 2) {
        const sql = "UPDATE games SET active=? WHERE room=?;";
        client.query(sql, [1, room]);
      }
    });
  });
  socket.on("active_check", (room) => {
    Game.findOne({
      where: {
        room: room,
      },
    }).then((e) => {
      if (e.dataValues.active == 1) {
        socket.emit("game_go");
      }
    });
  });
  // 게임 결과
  socket.on("result", () => {
    Game.findOne({
      where: {
        // 룸 변수 바꾸기
        room: 0,
      },
    }).then((e) => {
      const sql = "UPDATE games SET active=? WHERE room=?";
      // 룸 변수 바꾸기
      client.query(sql, [0, 0]);
      // socket.emit("game_over",myId)
    });
  });
  // 게임 결과 확인 및 종료
  socket.on("game_active_check", () => {
    console.log("들왔나~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
    Game.findOne({
      where: {
        room: 0,
      },
    }).then((e) => {
      if (Number(e.dataValues.active) == 0) {
        socket.emit("game_active_check");
      }
    });
  });
  // *******************room 항목 만들기***************************
  // Game.create({
  //   room: 0,
  //   active: 0,
  // });

  // Room.create({
  //   room: 0,
  //   count: 0,
  //   active: 0,
  // });
  // Room.create({
  //   room: 1,
  //   count: 0,
  //   active: 0,
  // });
  // Room.create({
  //   room: 2,
  //   count: 0,
  //   active: 0,
  // });

  // 대기실 컨트롤
  let rooms = [0, 0, 0];
  let userOut_key = false;
  let outKey = [];
  let rooms_join_user = {
    room1: [],
    room2: [],
    room3: [],
  };

  socket.on("joinChat", () => {
    Room.findOne({
      where: {
        room: 0,
      },
    }).then((e) => {
      rooms[0] = Number(e.dataValues.count);
      if (
        e.dataValues.user_1 !== null &&
        rooms_join_user.room1.find((val) => {
          return val == e.dataValues.user_1;
        }) == undefined
      ) {
        rooms_join_user.room1.push(e.dataValues.user_1);
      }
      if (
        e.dataValues.user_2 !== null &&
        rooms_join_user.room1.find((val) => {
          return val == e.dataValues.user_2;
        }) == undefined
      ) {
        rooms_join_user.room1.push(e.dataValues.user_2);
      }
      if (e.dataValues.user_1 == null && e.dataValues.user_2 == null) {
        rooms_join_user.room1 = [];
      }
      if (e.dataValues.count == 2) {
        Room.findOne({
          where: {
            room: 0,
          },
        }).then((e) => {
          const sql = "UPDATE rooms SET active=? WHERE room=?;";
          client.query(sql, [1, 0]);
        });
      }
    });
    Room.findOne({
      where: {
        room: 1,
      },
    }).then((e) => {
      rooms[1] = Number(e.dataValues.count);
      if (
        e.dataValues.user_1 !== null &&
        rooms_join_user.room2.find((val) => {
          return val == e.dataValues.user_1;
        }) == undefined
      ) {
        rooms_join_user.room2.push(e.dataValues.user_1);
      }
      if (
        e.dataValues.user_2 !== null &&
        rooms_join_user.room2.find((val) => {
          return val == e.dataValues.user_1;
        }) == undefined
      ) {
        rooms_join_user.room2.push(e.dataValues.user_2);
      }
      if (e.dataValues.user_1 == null && e.dataValues.user_2 == null) {
        rooms_join_user.room2 = [];
      }
    });
    Room.findOne({
      where: {
        room: 2,
      },
    }).then((e) => {
      rooms[2] = Number(e.dataValues.count);
      if (
        e.dataValues.user_1 !== null &&
        rooms_join_user.room3.find((val) => {
          return val == e.dataValues.user_1;
        }) == undefined
      ) {
        rooms_join_user.room3.push(e.dataValues.user_1);
      }
      if (
        e.dataValues.user_2 !== null &&
        rooms_join_user.room3.find((val) => {
          return val == e.dataValues.user_1;
        }) == undefined
      ) {
        rooms_join_user.room3.push(e.dataValues.user_2);
      }
      if (e.dataValues.user_1 == null && e.dataValues.user_2 == null) {
        rooms_join_user.room3 = [];
      }
    });

    socket.emit("joinChat", rooms);
    console.log(rooms_join_user);
  });
  socket.on("game_page_open", (key) => {
    Room.findOne({
      where: {
        room: key,
      },
    }).then((e) => {
      if (e.dataValues.active == 1) {
        socket.emit("game_page_open");
      }
    });
  });

  socket.on("roomJoin", (key, userId) => {
    // 유저 접속 아이디 확인

    userOut_key = true;
    outKey[0] = key;
    // 카운트값 업데이트
    Room.findOne({
      where: {
        room: key,
      },
    }).then((e) => {
      // 카운트 값 불러와서 증가
      let _temp = Number(e.dataValues.count);
      _temp = _temp + 1;
      outKey[1] = _temp;
      rooms[key] = _temp;
      // 유저 데이터 넣기
      // console.log("유저 " + e.dataValues.user_1);
      if (e.dataValues.user_1 == null) {
        const _sql = "UPDATE rooms SET user_1=? WHERE room=?;";
        client.query(_sql, [userId, key]);
      } else {
        const _sql = "UPDATE rooms SET user_2=? WHERE room=?;";
        client.query(_sql, [userId, key]);
      }
      const sql = "UPDATE rooms SET count=? WHERE room=?;";
      // 카운트 데이터베이스 업데이트
      client.query(sql, [_temp, key]);
    });

    let userNum = rooms[key] + 1;
    socket.emit("roomJoin", userNum);
  });

  socket.on("roomOut", (key, userId) => {
    // 유저 이름을 키값으로 찾아 방에서 빼기
    userOut_key = false;
    Room.findOne({
      where: {
        user_1: userId,
      },
    })
      .then((e) => {
        // user_1에 들어있을때
        let _temp = Number(e.dataValues.count);
        let _key = Number(e.dataValues.room);
        rooms[_key] = _temp;
        _temp = _temp - 1;
        // 유저 뺴기
        if (_key == 0) {
          rooms_join_user.room1.splice(myId, 1);
        } else if (_key == 1) {
          rooms_join_user.room2.splice(myId, 1);
        } else if (_key == 2) {
          rooms_join_user.room3.splice(myId, 1);
        }
        const sql = "UPDATE rooms SET count=? WHERE user_1=?;";
        client.query(sql, [_temp, userId]);
        const _sql = "UPDATE rooms SET user_1=null WHERE user_1=?;";
        client.query(_sql, [userId]);
        console.log("기존카운트" + rooms[_key]);
        let userNum = rooms[_key] - 1;
        socket.emit("roomOut", userNum, _key);
      })
      .catch(() => {
        Room.findOne({
          where: {
            user_2: userId,
          },
        }).then((e) => {
          // user_2에 들어있을때
          let _temp = Number(e.dataValues.count);
          let _key = Number(e.dataValues.room);
          _temp = _temp - 1;
          // 유저 뺴기
          if (_key == 0) {
            rooms_join_user.room1.splice(myId, 1);
          } else if (_key == 1) {
            rooms_join_user.room2.splice(myId, 1);
          } else if (_key == 2) {
            rooms_join_user.room3.splice(myId, 1);
          }
          const sql = "UPDATE rooms SET count=? WHERE user_2=?;";
          client.query(sql, [_temp, userId]);
          const _sql = "UPDATE rooms SET user_2=null WHERE user_2=?;";
          client.query(_sql, [userId]);
          let userNum = rooms[_key] - 1;
          socket.emit("roomOut", userNum, _key);
        });
      });
  });

  // 대기실에서 접속 끊어서 이벤트 이름 변경
  socket.on("disconnect", function () {
    // 대기실 접속 종료
    socket.broadcast.emit(
      "user-disconnected",
      users[socket.id],
      userOut_key,
      outKey,
      myId
    );
    delete users[socket.id];
    io.emit("user-list", users);
    // game에서 접속종료
    console.log("유저 연결 종료");
    io.emit("removeOtherPlayer", player);
    world.removePlayer(player);
  });
  console.log("아이디: " + myId);
  // 강제로 종료했을 때
  socket.on("user_kick", (userAdd) => {
    Room.findOne({
      where: {
        user_1: userAdd,
      },
    })
      .then((e) => {
        let _temp = Number(e.dataValues.count);
        let _key = Number(e.dataValues.room);
        _temp = _temp - 1;
        // 유저 뺴기
        if (_key == 0) {
          rooms_join_user.room1.splice(myId, 1);
        } else if (_key == 1) {
          rooms_join_user.room2.splice(myId, 1);
        } else if (_key == 2) {
          rooms_join_user.room3.splice(myId, 1);
        }
        rooms[_key] = _temp;
        const sql = "UPDATE rooms SET count=? WHERE user_1=?;";
        client.query(sql, [_temp, userAdd]);
        const _sql = "UPDATE rooms SET user_1=null WHERE user_1=?;";
        client.query(_sql, [userAdd]);
      })
      .catch(() => {
        Room.findOne({
          where: {
            user_2: userAdd,
          },
        }).then((e) => {
          let __temp = Number(e.dataValues.count);
          let _key = Number(e.dataValues.room);
          __temp = __temp - 1;
          // 유저 뺴기
          if (_key == 0) {
            rooms_join_user.room1.splice(myId, 1);
          } else if (_key == 1) {
            rooms_join_user.room2.splice(myId, 1);
          } else if (_key == 2) {
            rooms_join_user.room3.splice(myId, 1);
          }
          rooms[_key] = __temp;
          const sql = "UPDATE rooms SET count=? WHERE user_2=?;";
          client.query(sql, [__temp, userAdd]);
          const _sql = "UPDATE rooms SET user_2=null WHERE user_2=?;";
          client.query(_sql, [userAdd]);
        });
      });
  });
});
