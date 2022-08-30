const socket = io();
console.log("대기실 소켓");

let username;

let chats = document.querySelector(".chats");
let users_list = document.querySelector(".users-list");
let users_count = document.querySelector(".users-count");
let msg_send = document.querySelector("#user-send");
let user_msg = document.querySelector("#user-msg");

do {
  username = prompt("이름을 입력하세요: ");
} while (!username);

socket.emit("new-user-joined", username);

let users_data = [];
socket.on("user-connected", (socket_name, user_address) => {
  userJoin(socket_name, "님이 들어왔어요");
  users_data = [socket_name, user_address];
});
console.log(users_data);
function userJoin(name, result) {
  let div = document.createElement("div");
  div.classList.add("user-join");
  let roomIn = `<p><b>${name}</b> ${result}</p>`;
  div.innerHTML = roomIn;
  chats.appendChild(div);
  chats.scrollTop = chats.scrollHeight;
}

socket.on("user-disconnected", (user) => {
  userJoin(user, "님이 나갔어요");
});
let users_check = [];
socket.on("user-list", (users) => {
  users_list.innerHTML = "";
  users_check = [];
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
