// import { GLTFLoader } from "/Users/HY/Desktop/new study/second_project/second_project/waiting_test/node_modules/three/examples/jsm/loaders/GLTFLoader.js";
// GLTFLoader = require("three/examples/jsm/loaders/GLTFLoader");

let container,
  scene,
  camera,
  renderer,
  raycaster,
  objects = [];
let keyState = {};
let sphere;

let player, playerId, moveSpeed, turnSpeed;

let playerData;

let otherPlayers = [],
  otherPlayersId = [];

let randomNumber_maker = function (range) {
  let _ranNum = Math.floor(Math.random() * range);
  return _ranNum;
};
let randomColor = function () {
  let hexCode = "0x";
  const hexValues = [
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
  ];
  for (let i = 0; i < 6; i++) {
    let _randomNum = Math.floor(Math.random() * hexValues.length);
    hexCode += hexValues[_randomNum];
  }
  let result = hexCode.valueOf();
  console.log(result);
  // `${_colorNum[0]}${_colorNum[1]}${_colorNum[2]}${_colorNum[3]}${_colorNum[4]}${_colorNum[5]}`;
  return result;
};
console.log(randomColor());

var loadWorld = function () {
  init();
  animate();
  setLight();

  function init() {
    //Setup------------------------------------------
    container = document.getElementById("container");

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
    camera.position.z = 5;
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    raycaster = new THREE.Raycaster();

    // ------------------메쉬 가져오기-------------------
    // 캐릭터 불러오기
    // var gltfLoder = new GLTFLoader();
    // gltfLoder
    //   .load(path.resolve(__dirname, "/data/RobotExpressive.glb"))
    //   .then((gltf) => {
    //     var model = gltf.scene;
    //     scene.add(model);
    //   });
    // var url = "/data/RobotExpressive.glb";
    // gltfLoder.load(url, (gltf) => {
    //   var model = gltf.scene;
    //   // 씬에 추가
    //   this._scene.add(model);
    // });

    // 땅 만들깅
    var planeGeometry = new THREE.PlaneGeometry(100, 100);
    var planeMaterial = new THREE.MeshPhongMaterial({ color: 0x878787 });
    var plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -1;
    scene.add(plane);
    objects.push(plane);

    //Sphere------------------
    // var sphere_geometry = new THREE.SphereGeometry(1);
    var sphere_geometry = new THREE.CapsuleGeometry(1, 1, 1);
    var sphere_material = new THREE.MeshNormalMaterial();
    sphere = new THREE.Mesh(sphere_geometry, sphere_material);
    sphere.position.set(1, 0, 1);

    scene.add(sphere);
    objects.push(sphere); //if you are interested in detecting an intersection with this sphere

    //Events------------------------------------------
    document.addEventListener("click", onMouseClick, false);
    document.addEventListener("mousedown", onMouseDown, false);
    document.addEventListener("mouseup", onMouseUp, false);
    document.addEventListener("mousemove", onMouseMove, false);
    document.addEventListener("mouseout", onMouseOut, false);
    document.addEventListener("keydown", onKeyDown, false);
    document.addEventListener("keyup", onKeyUp, false);
    window.addEventListener("resize", onWindowResize, false);

    //Final touches-----------------------------------
    container.appendChild(renderer.domElement);
    document.body.appendChild(container);
  }

  function animate() {
    requestAnimationFrame(animate);
    render();
  }
  function render() {
    if (player) {
      updateCameraPosition();

      checkKeyStates();

      camera.lookAt(player.position);
    }
    //Render Scene---------------------------------------
    renderer.clear();
    renderer.render(scene, camera);
  }

  function onMouseClick() {
    intersects = calculateIntersects(event);
    // console.log(intersects[0]);
    // console.log(intersects[1]);
    // console.log(intersects[2]);
    // console.log(otherPlayers[0]);
    // console.log(otherPlayers[1]);
    // console.log(otherPlayers[2]);
    if (intersects.length > 0) {
      //If object is intersected by mouse pointer, do something
      if (intersects[0].object == otherPlayers[1]) {
        console.log("click")
        socket.emit("result");
        // alert("승리!");
      } else if (intersects[0].object == otherPlayers[0]) {
        console.log("클릭")
        socket.emit("result");
        // alert("승리!");
      }
    }
  }
  function onMouseDown() {}
  function onMouseUp() {}
  function onMouseMove() {}
  function onMouseOut() {}
  function onKeyDown(event) {
    //event = event || window.event;

    keyState[event.keyCode || event.which] = true;
  }

  function onKeyUp(event) {
    //event = event || window.event;

    keyState[event.keyCode || event.which] = false;
  }

  function addPointLight(x, y, z) {
    const _color = 0xffffff;
    const _intensity = 1.5;

    const pointLight = new THREE.PointLight(_color, _intensity, 1000);
    pointLight.position.set(x, y, z);
    scene.add(pointLight);
  }
  function setLight() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    addPointLight(500, 150, 500);
    addPointLight(-500, 150, 500);
    addPointLight(-500, 150, -500);
    addPointLight(500, 150, -500);

    const shadowLight = new THREE.DirectionalLight(0xffffff, 0.2);
    shadowLight.position.set(200, 500, 200);
    shadowLight.target.position.set(0, 0, 0);
    scene.add(shadowLight);
    scene.add(shadowLight.target);
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  function calculateIntersects(event) {
    //Determine objects intersected by raycaster
    event.preventDefault();

    var vector = new THREE.Vector3();
    vector.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1,
      0.5
    );
    vector.unproject(camera);

    raycaster.ray.set(camera.position, vector.sub(camera.position).normalize());

    var intersects = raycaster.intersectObjects(objects);

    return intersects;
  }
};

var createPlayer = function (data) {
  //   var gltfLoder = new GLTFLoader();
  //   var url = "/data/RobotExpressive.glb";
  //   let player;
  //   gltfLoder.load(url, (gltf) => {
  //     var model = gltf.scene;
  //     player = model;
  //   });
  playerData = data;

  var cube_geometry = new THREE.BoxGeometry(data.sizeX, data.sizeY, data.sizeZ);
  var cube_material = new THREE.MeshBasicMaterial({
    color: 0x7777ff,
    wireframe: false,
  });
  player = new THREE.Mesh(cube_geometry, cube_material);
  player.rotation.set(0, 0, 0);

  player.position.x = data.x;
  player.position.y = data.y;
  player.position.z = data.z;
  // player.position.set(50, 0, 50);

  playerId = data.playerId;
  moveSpeed = data.speed;
  turnSpeed = data.turnSpeed;

  updateCameraPosition();

  objects.push(player);
  scene.add(player);

  camera.lookAt(player.position);
};

// 카메라 위치 설정
var updateCameraPosition = function () {
  camera.position.x = player.position.x + 10 * Math.sin(player.rotation.y);
  camera.position.y = player.position.y + 1;
  camera.position.z = player.position.z + 10 * Math.cos(player.rotation.y);
};

var updatePlayerPosition = function (data) {
  var somePlayer = playerForId(data.playerId);

  somePlayer.position.x = data.x + Number(randomNumber_maker(100) - 50);
  somePlayer.position.y = data.y;
  somePlayer.position.z = data.z + Number(randomNumber_maker(100) - 50);
  console.log(somePlayer.position.x);
  console.log(somePlayer.position.y);
  console.log(somePlayer.position.z);
  somePlayer.rotation.x = data.r_x;
  somePlayer.rotation.y = data.r_y;
  somePlayer.rotation.z = data.r_z;
};

var updatePlayerData = function () {
  playerData.x = player.position.x;
  playerData.y = player.position.y;
  playerData.z = player.position.z;

  playerData.r_x = player.rotation.x;
  playerData.r_y = player.rotation.y;
  playerData.r_z = player.rotation.z;
};
// 방향키 입력에 따른 방향
var checkKeyStates = function () {
  // console.log(keyState);
  // 'W' 위방향
  if (keyState[38] || keyState[87]) {
    if (keyState[16]) {
      player.position.x -= moveSpeed * Math.sin(player.rotation.y) * 2;
      player.position.z -= moveSpeed * Math.cos(player.rotation.y) * 2;
    } else {
      player.position.x -= moveSpeed * Math.sin(player.rotation.y);
      player.position.z -= moveSpeed * Math.cos(player.rotation.y);
    }
    updatePlayerData();
    socket.emit("updatePosition", playerData);
  }
  // "s" 아래방향
  if (keyState[40] || keyState[83]) {
    if (keyState[16]) {
      player.position.x += moveSpeed * Math.sin(player.rotation.y) * 2;
      player.position.z += moveSpeed * Math.cos(player.rotation.y) * 2;
    } else {
      player.position.x += moveSpeed * Math.sin(player.rotation.y);
      player.position.z += moveSpeed * Math.cos(player.rotation.y);
    }
    updatePlayerData();
    socket.emit("updatePosition", playerData);
  }
  // 'a'왼쪽 회전
  if (keyState[37] || keyState[81]) {
    player.position.x -= moveSpeed * Math.cos(player.rotation.y);
    player.position.z += moveSpeed * Math.sin(player.rotation.y);
    updatePlayerData();
    socket.emit("updatePosition", playerData);
  }
  // 'd'오른쪽 회전
  if (keyState[39] || keyState[69]) {
    player.position.x += moveSpeed * Math.cos(player.rotation.y);
    player.position.z -= moveSpeed * Math.sin(player.rotation.y);
    updatePlayerData();
    socket.emit("updatePosition", playerData);
  }
  // 'q' 왼쪽 방향
  if (keyState[65]) {
    player.rotation.y += turnSpeed;
    updatePlayerData();
    socket.emit("updatePosition", playerData);
  }
  // 'e' 오른쪽 방향
  if (keyState[68]) {
    player.rotation.y -= turnSpeed;
    updatePlayerData();
    socket.emit("updatePosition", playerData);
  }
  // " " 스페이스 기능 추가하기
  if (keyState[32]) {
    // player.position.y -= moveSpeed * Math.cos(player.rotation.y);
    updatePlayerPosition.somePlayer.position.x = 100;
    updatePlayerPosition.somePlayer.position.z = 100;
    setTimeout(() => {
      updatePlayerPosition.somePlayer.position.x =
        data.x + Number(randomNumber_maker(100) - 50);
      updatePlayerPosition.somePlayer.position.z =
        data.z + Number(randomNumber_maker(100) - 50);
    });
    updatePlayerData();
    socket.emit("updatePosition", playerData);
  }
};

var addOtherPlayer = function (data) {
  let capsule_geometry = new THREE.CapsuleGeometry(
    data.sizeX,
    data.sizeY,
    data.sizeZ
  );
  let capsule_material = new THREE.MeshBasicMaterial({
    color: Number(randomColor()),
    wireframe: false,
  });
  var otherPlayer = new THREE.Mesh(capsule_geometry, capsule_material);

  otherPlayer.position.x = data.x;
  otherPlayer.position.y = data.y;
  otherPlayer.position.z = data.z;

  otherPlayersId.push(data.playerId);
  otherPlayers.push(otherPlayer);
  objects.push(otherPlayer);
  scene.add(otherPlayer);
};

var removeOtherPlayer = function (data) {
  scene.remove(playerForId(data.playerId));
};

var playerForId = function (id) {
  let index;
  for (var i = 0; i < otherPlayersId.length; i++) {
    if (otherPlayersId[i] == id) {
      index = i;
      break;
    }
  }
  return otherPlayers[index];
};

function update(time) {
  // 초 설정
  time *= 0.001;
}
