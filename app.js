// 사용할 모듈 불러오기
const express = require("express");
const path = require("path");
const fs = require("fs");
const ejs = require("ejs");
const socketio = require("socket.io");
// model/index.js 에서 키값 가져오기
const { sequelize, User } = require("./model");
// game world_server DB 가져오기
const world = require("./game/js/server_world.js");
// 서버몸체 구축
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

// sequelize
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

// intro 페이지 불러오기
app.get("/", (req, res) => {
  res.render("intro/index");
  // fs.readFile("intro/index.html", (err, data) => {
  //   res.end(data);
  // });
});

// login/ID_err 페이지 불러오는거
app.get("/ID_err", (req, res) => {
  res.render("login/ID_err");
});

// login/signup 페이지 불러오는거
app.get("/signup", (req, res) => {
  res.render("login/signup");
});
// login/signup 정보 받아오는거
app.post("/signup", (req, res) => {
  const { id, password } = req.body;
  console.log(id, password, "회원가입시도");
  User.findOne({
    where: {
      userID: id,
    },
  }).then((e) => {
    // then >> 작업에 성공하면!!
    if (e === null) {
      const signup = User.create({
        userID: id,
        password: password,
      });
      console.log("가입성공");
      res.redirect("/waiting");
    } else {
      console.log("가입실패");
      res.redirect("/ID_err");
    }
  });
});

// login error 페이지 불러오는거
app.get("/login_err", (req, res) => {
  res.render("login/login_err");
});

// login/login 페이지 정보 받아서 확인후 넘기기
app.post("/login", (req, res) => {
  const { id, password } = req.body;
  console.log(id, password, "로그인 시도");
  User.findOne({
    where: {
      userID: id,
      password: password,
    },
  }).then((e) => {
    if (e === null) {
      console.log(id, "로그인 실패");
      res.redirect("/login_err");
    } else {
      console.log(id, "로그인 성공");
      res.redirect("/");
    }
  });
});

// game server_world 데이터 가져오기
app.get("/game/js/client_world.js", function (req, res) {
  res.sendFile(__dirname + "/game/js/client_world.js");
});

// 접속유저
let users = {};

io.on("connection", (socket) => {
  console.log("소켓 연결");
  // waiting 소켓 컨트롤
  socket.on("new-user-joined", (username) => {
    users[socket.id] = username;
    socket.broadcast.emit("user-connected", username);
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
