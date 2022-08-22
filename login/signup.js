
const signup_id = document.querySelector(".signup_id");
const signup_pw = document.querySelector(".signup_pw");
const confirm_pw = document.querySelector(".confirm_pw");
const check = document.querySelector(".check");
const submit = document.querySelector(".submit");

// 정규표현식 확인 함수 생성
function regCheck() {
    const regID = /^[0-9a-zA-Z]{3,8}$/;
    const ID = regID.test(signup_id.value);
    if (ID == false) {alert("ID를 다시 입력해주세요")};

    const regPW = /^[a-zA-Z0-9]{8,16}$/;
    const PW = regPW.test(signup_pw.value);
    if (PW == false) {alert("비밀번호를 다시 입력해주세요")};

    if (signup_pw !== confirm_pw) {alert("비밀번호를 동일하게 입력해주세요")};

    if (ID == true && PW == true) {alert("Submit 버튼을 눌러주세요")};
};

