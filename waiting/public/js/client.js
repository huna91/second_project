const socket = io();

let chats = document.querySelector(".chats");
let users_list = document.querySelector(".users-list");
let users_count = document.querySelector(".users-count");
let msg_send = document.querySelector("#user-send");
let user_msg = document.querySelector("#user-msg");

// do {
//   username = prompt("이름을 입력하세요: ");
// } while (!username);

let _userId;
socket.emit("new-user-joined", username);
socket.on("user-connected", (socket_name) => {
  _userId = socket_name;
  userJoin(socket_name, "님이 들어왔어요");
});
function userJoin(name, result) {
  let div = document.createElement("div");
  div.classList.add("user-join");
  let roomIn = `<p><b>${name}</b> ${result}</p>`;
  div.innerHTML = roomIn;
  chats.appendChild(div);
  chats.scrollTop = chats.scrollHeight;
}

socket.on("user-disconnected", (user, userOut_key, outKey, myId) => {
  if (userOut_key == true) {
    // 방 접속 누르고 나갔을때
    join_check[outKey[0]].innerHTML = `( ${Number(outKey[1]) - 1} / 2 )`;
    socket.emit("user_kick", myId);
  }
  userJoin(user, "님이 나갔어요");
});

socket.on("user-list", (users) => {
  users_list.innerHTML = "";
  users_arr = Object.values(users);
  for (i = 0; i < users_arr.length; i++) {
    let p = document.createElement("p");
    p.innerText = users_arr[i];
    users_list.appendChild(p);
  }
  users_count.innerHTML = users_arr.length;
});

msg_send.addEventListener("click", () => {
  let data = {
    user: username,
    msg: user_msg.value,
  };
  if (user_msg.value != "") {
    addMessage(data, "outgoing");
    socket.emit("message", data);
    user_msg.value = "";
  }
});

function addMessage(data, result) {
  let div = document.createElement("div");
  div.classList.add("message", result);
  let content = `<h5>${data.user}<h5>
     <p>${data.msg}</p>`;

  div.innerHTML = content;
  chats.appendChild(div);
  chats.scrollTop = chats.scrollHeight;
}

socket.on("message", (data) => {
  addMessage(data, "incoming");
});
