
// 사용할 모듈 불러오기
const express = require("express");
const path = require("path");
const fs = require("fs");
const ejs = require("ejs");
const env = require("dotenv");
const sequelize = require("sequelize");
const mysql = require("mysql2");

const app = express();

const PORT = 3010;


// 기본 경로 설정

// html파일 기본경로는 최상위폴더로 지정해놨습니다.
app.set("views", path.join(__dirname));

// html을 제외한 다른 파일들 경로 지정
app.use(express.static(__dirname + "/squid"));
app.use("/login/", express.static(path.join(__dirname + "/login")));
app.use("/intro/", express.static(path.join(__dirname + "/intro")));
app.use("/join/", express.static(path.join(__dirname + "/join")));
app.use("/waiting/", express.static(path.join(__dirname + "/waiting")));
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
/*
sequelize.sync({ force : false })
  .then(() => {
    // 연결 성공
    console.log("DB 연결")
  }).catch((err) => {
    // 연결 실패
    console.log(err);
  });
*/


// login/signup 페이지 불러오는거
app.get("/signup", (req, res) => {
  res.render("login/signup");
});

// 포트 열기
app.listen(PORT, () => {
  console.log(`${PORT}번 포트 연결`);
});
