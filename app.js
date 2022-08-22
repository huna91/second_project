const express = require("express");
const app = express();
const path = require("path");
const PORT = 3010;

app.use(express.static(__dirname + "/squid"));
app.use("/login/", express.static(path.join(__dirname + "/login")));
app.use("/intro/", express.static(path.join(__dirname + "/intro")));
app.use("/join/", express.static(path.join(__dirname + "/join")));
app.use("/waiting/", express.static(path.join(__dirname + "/waiting")));

app.use(
  "/build/",
  express.static(path.join(__dirname, "node_modules/three/build"))
);
app.use(
  "/jsm/",
  express.static(path.join(__dirname, "node_modules/three/examples/jsm"))
);

app.listen(PORT, () => {
  console.log(`${PORT}번 포트 연결`);
});
