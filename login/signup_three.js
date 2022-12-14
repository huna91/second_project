import * as THREE from 'three';
import { GLTFLoader } from '/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from '/jsm/controls/OrbitControls.js'

class App {
    constructor() {
        const divContainer = document.querySelector("#webgl-container");
        this._divContainer = divContainer;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        divContainer.appendChild(renderer.domElement);

        this._renderer = renderer;

        const scene = new THREE.Scene();
        // 배경색 바꾸는 코드
        //scene.background = new THREE.Color(0xffffff);
        this._scene = scene;

        this._setupCamera();
        this._setupLight();
        this._setupModel();
        this._setupControls();

        window.onresize = this.resize.bind(this);
        this.resize();

        requestAnimationFrame(this.render.bind(this));
    }

    _setupControls() {
        new OrbitControls(this._camera, this._divContainer);
    }

    _setupCamera() {
        const width = this._divContainer.clientWidth/2; //전체화면 넓이의 절반
        const height = this._divContainer.clientHeight;
        const camera = new THREE.PerspectiveCamera(
            60,
            width / height,
            1,
            500
        );
        camera.position.set(4, 8, 10);
        this._camera = camera;
    }

    _setupLight() {
        const color = 0xffffff;  //광원의 색상
        const intensity = 1.5;  //광원의 세기
        const light = new THREE.DirectionalLight(color, intensity);  //색상과 세기로 광원 생성
        light.position.set(0, 1, 1); //광원의 위치
        this._scene.add(light);
    }

    changeAnimation(animationName) {
        const previousAnimationAction = this._currentAnimationAction;
        this._currentAnimationAction = this._animationsMap[animationName];

        if(previousAnimationAction !== this._currentAnimationAction) {
            previousAnimationAction.fadeOut(0.5);
            this._currentAnimationAction.reset().fadeIn(0.5).play();
        }
    }

    _setupAnimations(gltf) {
        const model = gltf.scene;
        const mixer = new THREE.AnimationMixer(model);
        const gltfAnimations = gltf.animations;
        const domControls = document.querySelector("#controls");
        const animationsMap = {};

        gltfAnimations.forEach(animationClip => {
            const name = animationClip.name;
            //console.log(name); // 행동목록 콘솔창에 출력

            const domButton = document.createElement("div");
            domButton.classList.add("button");
            domButton.innerText = name;
            domControls.appendChild(domButton);

            domButton.addEventListener("click", () => {
                const animationName = domButton.innerHTML;
                this.changeAnimation(animationName);
            });

            const animationAction = mixer.clipAction(animationClip);
            animationsMap[name] = animationAction;
        });

        this._mixer = mixer;
        this._animationsMap = animationsMap;
        this._currentAnimationAction = this._animationsMap["Walking"];
        this._currentAnimationAction.play();
    }

    _setupModel() {
        new GLTFLoader().load("/login/data/Robot.glb", (gltf) => {
            const model = gltf.scene;
            this._scene.add(model);

            this._setupAnimations(gltf);
        });
    }

    resize() {
        const width = this._divContainer.clientWidth/2; //전체화면의 넓이의 절반
        const height = this._divContainer.clientHeight;

        this._camera.aspect = width / height;
        this._camera.updateProjectionMatrix();

        this._renderer.setSize(width, height);
    }

    render(time) {
        this._renderer.render(this._scene, this._camera);
        this.update(time);
        requestAnimationFrame(this.render.bind(this));
    }

    update(time) {
        time *= 0.001;

        if(this._mixer) {
            const deltaTime = time - this._previousTime;
            this._mixer.update(deltaTime);
        }

        this._previousTime = time;

        //this._currentAnimationAction.rotation.y = time;
    }
}

window.onload = function() {
    new App();
}

/*
// class들 불러오기
const signup_id = document.querySelector(".signup_id");
const signup_pw = document.querySelector(".signup_pw");
const confirm_pw = document.querySelector(".confirm_pw");
const check = document.querySelector(".check");
const submit = document.querySelector(".submit");

// 정규표현식으로 아이디, 패스워드 체크
check.onclick = function(){
    // 아이디, 패스워드 정규식으로 검사할 변수 생성 및 할당
    const regID = /^[0-9a-zA-Z]{3,8}$/;
    const ID = regID.test(signup_id.value);
    const regPW = /^[a-zA-Z0-9]{8,16}$/;
    const PW = regPW.test(signup_pw.value);

    // 조건에 맞는지 확인하는 if문
    if (ID == false) {alert("ID를 3~8자 영문+숫자 조합으로 입력해주세요")}
    //
    else if (PW == false) {alert("비밀번호를 다시 입력해주세요")}
    else if (signup_pw.value != confirm_pw.value) {alert("비밀번호를 동일하게 입력해주세요")}

    // 다 맞으면 실행. check버튼을 submit으로 변경
    else if (ID == true && PW == true) {
        check.style.display = "none";
        submit.style.display = "block";
        alert("Submit 버튼을 눌러주세요");
    };
};
*/