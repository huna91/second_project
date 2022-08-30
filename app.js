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
const { sequelize, User } = require("./model");
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
// app.use("/intro/", express.static(path.join(__dirname + "/intro")));
app.use("/join/", express.static(path.join(__dirname + "/join")));
app.use("/waiting/", express.static(path.join(__dirname + "/waiting")));
// DB 모듈?용 파일 경로 지정
app.use("/config/", express.static(path.join(__dirname + "/config")));
app.use("/model/", express.static(path.join(__dirname + "/model")));
// three.js 경로 지정
app.use("/build/", express.static(path.join(__dirname, "node_modules/three/build")));
app.use("/jsm/", express.static(path.join(__dirname, "node_modules/three/examples/jsm")));


// 뷰엔진을 ejs방식으로 설정
app.engine("html", ejs.renderFile);
// 뷰엔진을 html을 랜더링할 때 사용
app.set("view engine", "html");
// body객체 사용함 설정
app.use(express.urlencoded({ extended : false }));
// cookie-parser 사용준비
app.use(cookie());

// 세션 사용준비
app.use(session({
  secret : process.env.SESSION_KEY,
  resave : false,
  saveUninitialized : true
}))


// mysql 연결
const client = mysql.createConnection({
  user: "root",
  password: process.env.DATABASE_PASSWORD,
  database: "teamproject",
  multipleStatements: true,
});

// sequelize
sequelize.sync({ force : false })
.then(() => {
  // 연결 성공
  console.log("DB 연결")
}).catch((err) => {
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
      jwt.verify(refresh_token, process.env.REFRESH_TOKEN_KEY, (err, ref_decoded) => {
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
                  {userID : ref_decoded.userID},
                  process.env.ACCESS_TOKEN_KEY,
                  {expiresIn : "1h"}
                );
                req.session.access_token = accessToken;
                next();
              } else {
                res.render("login/err/relogin");
              }
            }
          })
        }
      })
    } else {
      next();
    }
  })
}

// login/signup 페이지 불러오는거
app.get("/signup", (req, res) => {
  res.render("login/signup");
});

// login/signup 정보 받아오는거
app.post("/signup", (req, res) => {
  const { id, password, confirm } = req.body;
  console.log(id, "회원가입시도");
  // 받아온 id, password 정규식 검사
  const regID = /^[0-9a-zA-Z]{3,8}$/;
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

// 대기실 입장페이지 불러오는거
app.get("/waiting", middleware, (req, res) => {
  const username = req.session;
  // req.session 에 저장 해놓은 ids 값을 랜더링 하면서 넘김
  res.render("waiting/waiting", {user : username.ids});
});


// ------------------------ 소켓 연결 ------------------------
// 접속유저
let users = {};

io.on("connection", (socket) => {
  console.log("소켓 연결");
  // waiting 소켓 컨트롤
  socket.on("new-user-joined", (username) => {
    users[socket.id] = username;
    io.emit("user-connected", username);
    io.emit("user-list", users);
  });

  socket.on("disconnect", () => {
    socket.broadcast.emit("user-disconnected", users[socket.id]);
    delete users[socket.id];
    io.emit("user-list", users);
  });

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
  socket.on("disconnect", function () {
    console.log("user disconnected");
    io.emit("removeOtherPlayer", player);
    world.removePlayer(player);
  });
});
