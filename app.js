
// 사용할 모듈 불러오기
const express = require("express");
const path = require("path");
const fs = require("fs");
const ejs = require("ejs");
const socketio = require("socket.io");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
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

// 기본 경로 설정

// html파일 기본경로는 최상위폴더로 지정해놨습니다.
app.set("views", path.join(__dirname));
// html을 제외한 다른 파일들 경로 지정
app.use(express.static(__dirname + "/squid"));
app.use("/login/", express.static(path.join(__dirname + "/login")));
app.use("/intro/", express.static(path.join(__dirname + "/intro")));
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


// sequelize
sequelize.sync({ force : false })
.then(() => {
  // 연결 성공
  console.log("DB 연결")
}).catch((err) => {
  // 연결 실패
  console.log(err);
});


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
  if (ID == false) {res.render("login/err/ID_err")}
  else if (PW == false) {res.render("login/err/pw_err")}
  else if (password != confirm) {res.render("login/err/dupPW_err")}
  else if (ID == true && PW == true) {
    // 정규식 통과하면 실행
    User.findOne({
      where : {
        userID : id
      }
    }).then((e) => { // then >> 작업에 성공하면!!
      // password 암호화
      bcrypt.hash(password, 10, (err, data) => {
        // 아이디 중복인지 확인
        if(e === null){
          // 아이디 중복이 아니면 실행
          const signup = User.create({
            userID : id,
            password : data
          });
          console.log("가입성공")
          res.redirect("/login");
        } else {
          // 아이디 중복시
          console.log("가입실패")
          res.render("login/err/dupID_err");
        }
      })
    })
  }
});

// login/login 페이지 정보 받아서 확인후 넘기기
app.post("/login", (req, res) => {
  const { id, password } = req.body;
  console.log(id, "로그인 시도");
  User.findOne({
    where : {
      userID : id
    }
  }).then((e) => {
    if (e === null) {
      console.log(id, "로그인 실패");
      res.render("login/err/login_err");
    } else {
      bcrypt.compare(password, e.password, (err, same) => {
        if (same) {
          console.log(id, "로그인 성공");
          res.redirect("/");
        } else {
          // password 틀림
          console.log("password 다름");
          res.render("login/err/pw_err");
        }
      })
    }
  });
});
