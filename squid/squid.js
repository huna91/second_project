import * as THREE from "three";
import { OrbitControls } from "OrbitControls";
import { GLTFLoader } from "./jsm/loaders/GLTFLoader.js";
import Stats from "./jsm/libs/stats.module.js";
import { Octree } from "./jsm/math/Octree.js";
import { Capsule } from "./jsm/math/Capsule.js";

class App {
  constructor() {
    const divContainer = document.querySelector("#webgl-container");
    this._divContainer = divContainer;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    divContainer.appendChild(renderer.domElement);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;

    this._renderer = renderer;

    const scene = new THREE.Scene();
    this._scene = scene;

    this._setupOctree();
    this._setupCamera();
    this._setupLight();
    this._setupModel();
    this._setupControls();

    window.onresize = this.resize.bind(this);
    this.resize();

    requestAnimationFrame(this.render.bind(this));
  }

  // 충돌검사 할 수 있는 Octree 메서드
  _setupOctree() {
    // 캐릭터가 충돌 할
    this._worldOctree = new Octree();
  }

  // 총 컨트롤 메서드
  _setupControls() {
    this._controls = new OrbitControls(this._camera, this._divContainer);
    this._controls.target.set(0, 0, 0);
    // OrbitControls에서 shift기능을 꺼줘서 달릴때 화면 조절 가능하게 함 => 소스도 변경 해줌
    this._controls.enablePan = false;
    // 마우스로 화면 회전시 부드럽게 하기위해 Damping 기능 사용
    this._controls.enableDamping = true;

    const stats = new Stats();
    this._divContainer.appendChild(stats.dom);
    this._fps = stats;

    // 키보드 입력 컨트롤
    this._pressedkeys = {};

    // 키보드가 눌렸을때 동작 이벤트
    document.addEventListener("keydown", (e) => {
      this._pressedkeys[e.key.toLowerCase()] = true;
      this._processAnimation();
      console.log(this._pressedkeys);
    });
    // 키보드가 떼졌을때 동작 이벤트
    document.addEventListener("keyup", (e) => {
      this._pressedkeys[e.key.toLowerCase()] = false;
      this._processAnimation();
      this._jumpAcctive = 0;
    });
    // document.addEventListener("mousedown", (e) => {
    //   this._pressedmouse[e.m];
    // });
  }

  // 애니메이션 실행 함수
  _processAnimation() {
    const previousAnimationAction = this._currentAnimationAction;

    // if (this._pressedkeys[" "]) {
    //   this._jumpAcctive === 1;
    //   this._currentAnimationAction = this._animationMap["Jump"];
    //   this._jump_maxSpeed = 100;
    //   this._jump_acceleration = 50;
    //   if (
    //     this._pressedkeys["w"] ||
    //     this._pressedkeys["a"] ||
    //     this._pressedkeys["s"] ||
    //     this._pressedkeys["d"]
    //   ) {
    //     if (this._pressedkeys["shift"]) {
    //       this._currentAnimationAction = this._animationMap["Running"];
    //       // this._speed = 50;
    //       this._maxSpeed = 20;
    //       this._acceleration = 1;
    //     } else {
    //       this._currentAnimationAction = this._animationMap["Walking"];
    //       // this._speed = 20;
    //       this._maxSpeed = 10;
    //       this._acceleration = 1;
    //       if (this._pressedkeys["c"]) {
    //         this._currentAnimationAction = this._animationMap["Sitting"];
    //       }
    //     }
    //   } else {
    //     this._currentAnimationAction = this._animationMap["Idle"];
    //     this._speed = 0;
    //     this._maxSpeed = 0;
    //     this._acceleration = 0;
    //     if (this._pressedkeys["c"]) {
    //       this._currentAnimationAction = this._animationMap["Sitting"];
    //     } else if (this._pressedkeys["t"]) {
    //       this._currentAnimationAction = this._animationMap["ThumbsUp"];
    //     }
    //   }
    // } else {
    //   if (
    //     this._pressedkeys["w"] ||
    //     this._pressedkeys["a"] ||
    //     this._pressedkeys["s"] ||
    //     this._pressedkeys["d"]
    //   ) {
    //     if (this._pressedkeys["shift"]) {
    //       this._currentAnimationAction = this._animationMap["Running"];
    //       // this._speed = 50;
    //       this._maxSpeed = 20;
    //       this._acceleration = 1;
    //     } else {
    //       this._currentAnimationAction = this._animationMap["Walking"];
    //       // this._speed = 20;
    //       this._maxSpeed = 10;
    //       this._acceleration = 1;
    //       if (this._pressedkeys["c"]) {
    //         this._currentAnimationAction = this._animationMap["Sitting"];
    //       }
    //     }
    //   } else {
    //     this._currentAnimationAction = this._animationMap["Idle"];
    //     this._speed = 0;
    //     this._maxSpeed = 0;
    //     this._acceleration = 0;
    //     if (this._pressedkeys["c"]) {
    //       this._currentAnimationAction = this._animationMap["Sitting"];
    //     } else if (this._pressedkeys["t"]) {
    //       this._currentAnimationAction = this._animationMap["ThumbsUp"];
    //     }
    //   }
    // }

    // 이전 컨트롤
    if (
      this._pressedkeys["w"] ||
      this._pressedkeys["a"] ||
      this._pressedkeys["s"] ||
      this._pressedkeys["d"]
    ) {
      if (this._pressedkeys["shift"]) {
        this._currentAnimationAction = this._animationMap["Running"];
        // this._speed = 50;
        this._maxSpeed = 20;
        this._acceleration = 1;
        if (this._pressedkeys[" "]) {
          this._currentAnimationAction = this._animationMap["Jump"];
          this._jumpAcctive = 1;
          this._jump_maxSpeed = 40;
          this._jump_acceleration = 1;
        }
      } else {
        this._currentAnimationAction = this._animationMap["Walking"];
        // this._speed = 20;
        this._maxSpeed = 10;
        this._acceleration = 1;
        if (this._pressedkeys[" "]) {
          this._currentAnimationAction = this._animationMap["Jump"];
          this._jumpAcctive = 1;
          this._jump_maxSpeed = 40;
          this._jump_acceleration = 1;
        } else if (this._pressedkeys["c"]) {
          this._currentAnimationAction = this._animationMap["Sitting"];
        }
      }
    } else {
      this._currentAnimationAction = this._animationMap["Idle"];
      this._speed = 0;
      this._maxSpeed = 0;
      this._acceleration = 0;
      if (this._pressedkeys[" "]) {
        this._currentAnimationAction = this._animationMap["Jump"];
        this._jumpAcctive = 1;
        this._jump_maxSpeed = 40;
        this._jump_acceleration = 1;
      } else if (this._pressedkeys["c"]) {
        this._currentAnimationAction = this._animationMap["Sitting"];
      } else if (this._pressedkeys["t"]) {
        this._currentAnimationAction = this._animationMap["ThumbsUp"];
      }
    }

    // 애니메이션 변경 시 동작 컨트롤
    if (previousAnimationAction !== this._currentAnimationAction) {
      previousAnimationAction.fadeOut(0.5);
      this._currentAnimationAction.reset().fadeIn(0.5).play();
    }
  }

  _setupModel() {
    // 캐릭터 땅 만들기
    const planeGeometry = new THREE.PlaneGeometry(100, 100);
    const planeMaterial = new THREE.MeshPhongMaterial({ color: 0x878787 });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    this._scene.add(plane);
    plane.receiveShadow = true;

    this._worldOctree.fromGraphNode(plane);
    // 캐릭터 로드
    const gltfLoder = new GLTFLoader();
    const url = "./data/RobotExpressive.glb";
    gltfLoder.load(url, (gltf) => {
      const model = gltf.scene;
      // 씬에 추가
      this._scene.add(model);
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
        }
      });

      // 캐릭터 데이터의 애니메이션 불러오기
      const animationClips = gltf.animations;
      // 프레임마다 캐릭터에 에니메이션 적용
      const mixer = new THREE.AnimationMixer(model);
      const animationsMap = {};
      animationClips.forEach((clip) => {
        const name = clip.name;
        console.log(name);
        // 애니메이션 액션 객체 저장
        animationsMap[name] = mixer.clipAction(clip);
      });

      // idle 상태 애니메이션 액션 가져옴
      this._mixer = mixer; // 해당 객체를 프레임마다 업데이트 해줘야 함.
      this._animationMap = animationsMap;
      this._currentAnimationAction = this._animationMap["Idle"];
      //액션을 실행하는 함수 호출
      this._currentAnimationAction.play();

      const box = new THREE.Box3().setFromObject(model);
      model.position.y = (box.max.y - box.min.y) / 2;

      // 캡슐화를 위한 범위
      const height = box.max.y - box.min.y;
      const diameter = box.max.z - box.min.z;

      // 캐릭터 캡슐화
      model._capsule = new Capsule(
        new THREE.Vector3(0, diameter / 2, 0),
        new THREE.Vector3(0, height - diameter / 2, 0),
        diameter / 2
      );

      const axisHelper = new THREE.AxesHelper(1000);
      this._scene.add(axisHelper);

      const boxHelper = new THREE.BoxHelper(model);
      this._scene.add(boxHelper);
      this._boxHelper = boxHelper;
      this._model = model;

      // 충돌검사 테스트
      const boxG = new THREE.BoxGeometry(100, diameter - 5, 100);
      const boxM = new THREE.Mesh(boxG, planeMaterial);
      boxM.receiveShadow = true;
      boxM.castShadow = true;
      boxM.position.set(50, 0, 0);
      this._scene.add(boxM);
      // 충돌 활성화
      this._worldOctree.fromGraphNode(boxM);
    });
    //
  }

  // // 화면을 채워 랜더링 되도록 하는 함수.
  // _zoomFit(object3D, camera) {
  //   // 모델의 경계박스
  //   const box = new THREE.Box3().setFromObject(object3D);
  //   // 모델의 경계 박스 대각 길이
  //   const sizeBox = box.getSize(new THREE.Vector3()).length();
  //   // 모델의 경계 박스 중심 위치
  //   const centerBox = box.getCenter(new THREE.Vector3());
  //   // 모델의 경계 박스 중심 위치
  //   const halfSizeModel = sizeBox * 0.5;
  //   // 카메라 시야각 벌반
  //   const halfFov = THREE.Math.degToRad(camera.fov * 0.5);
  //   // 모델을 화면에 꽉 채우기 위한 적당한 거리
  //   const distance = halfSizeModel / Math.tan(halfFov);
  //   // 모델 중심에서 카메라 위치로 향하는 방향 단위벡터
  //   const direction = new THREE.Vector3()
  //     .subVectors(camera.position, centerBox)
  //     .normalize();
  //   // 단위벡터 향으로 모델 중심 위치에서 distance 거리에 대한 위치
  //   const position = direction.multiplyScalar(distance).add(centerBox);
  //   camera.position.copy(position);
  //   // 모델의 크기에 맞춰 카메라의 near,far 값을 대략적으로 조정
  //   camera.near = sizeBox / 100;
  //   camera.far = sizeBox * 100;
  //   // 카메라 기본 속성 변경에 따른 투영행렬 업데이트
  //   camera.updateProjectionMatrix();
  //   // 카메라가 모델의 중심을 바라보도록 함
  //   camera.lookAt(centerBox.x, centerBox.y, centerBox.z);
  // }

  _setupCamera() {
    const camera = new THREE.PerspectiveCamera(
      10,
      window.innerWidth / window.innerHeight,
      1,
      5000
    );

    camera.position.set(0, 200, 300);
    this._camera = camera;

    this._scene.add(this._camera);
  }

  _addPointLight(x, y, z, helperColor) {
    const color = 0xffffff;
    const intensity = 1.5;

    const pointLight = new THREE.PointLight(color, intensity, 2000);
    pointLight.position.set(x, y, z);

    this._scene.add(pointLight);

    const pointLightHelper = new THREE.PointLightHelper(
      pointLight,
      10,
      helperColor
    );
    this._scene.add(pointLightHelper);
  }

  _setupLight() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this._scene.add(ambientLight);

    this._addPointLight(500, 150, 500, 0xff0000);
    this._addPointLight(-500, 150, 500, 0xffff00);
    this._addPointLight(-500, 150, -500, 0x00ff00);
    this._addPointLight(500, 150, -500, 0x0000ff);

    const shadowLight = new THREE.DirectionalLight(0xffffff, 0.2);
    shadowLight.position.set(200, 500, 200);
    shadowLight.target.position.set(0, 0, 0);
    const directionalLightHelper = new THREE.DirectionalLightHelper(
      shadowLight,
      10
    );
    this._scene.add(directionalLightHelper);

    this._scene.add(shadowLight);
    this._scene.add(shadowLight.target);

    shadowLight.castShadow = true;
    shadowLight.shadow.mapSize.width = 1024;
    shadowLight.shadow.mapSize.height = 1024;
    shadowLight.shadow.camera.top = shadowLight.shadow.camera.right = 700;
    shadowLight.shadow.camera.bottom = shadowLight.shadow.camera.left = -700;
    shadowLight.shadow.camera.near = 100;
    shadowLight.shadow.camera.far = 900;
    shadowLight.shadow.radius = 5;
    const shadowCameraHelper = new THREE.CameraHelper(
      shadowLight.shadow.camera
    );
    this._scene.add(shadowCameraHelper);
  }

  // 키보드가 눌렸을때 방향의 값을 얻는 함수
  _previousDirectionOffset = 0;

  // 방향키에 따라 움직임 할당
  _directionOffset() {
    const pressedKeys = this._pressedkeys;
    let directionOffset = 0;

    if (pressedKeys["w"]) {
      if (pressedKeys["a"]) {
        directionOffset = Math.PI / 4;
      } else if (pressedKeys["d"]) {
        directionOffset = -Math.PI / 4;
      }
    } else if (pressedKeys["s"]) {
      if (pressedKeys["a"]) {
        directionOffset = Math.PI / 4 + Math.PI / 2;
      } else if (pressedKeys["d"]) {
        directionOffset = -Math.PI / 4 - Math.PI / 2;
      } else {
        directionOffset = Math.PI;
      }
    } else if (pressedKeys["a"]) {
      directionOffset = Math.PI / 2;
    } else if (pressedKeys["d"]) {
      directionOffset = -Math.PI / 2;
    }
    // 키 입력 후 방향 저장
    else {
      directionOffset = this._previousDirectionOffset;
    }

    this._previousDirectionOffset = directionOffset;

    return directionOffset;
  }

  // 속도값 설정
  _speed = 0;
  _maxSpeed = 0;
  _acceleration = 0;

  // 점프값 설정
  _jumpAcctive = 0;
  _jumpSpeed = 0;
  _jump_acceleration = 0;
  _jump_maxSpeed = 0;
  _jumpMax = 0;

  // 충돌 검사(바닥에 있는지에 대한 여부 true이면 지면 false이면 허공)
  // 이걸 기준으로 Y축에 대한 이동을 준다.
  _bOnTheGround = false;
  // y 방향 떨어지는
  _fallingAcceleration = 0;
  _fallingSpeed = 0;

  // 시간에 따른 움직임 설정
  update(time) {
    time *= 0.001; // second unit

    this._controls.update();
    //보조선 출력
    if (this._boxHelper) {
      this._boxHelper.update();
    }
    //fps 출력
    this._fps.update();

    // 애니메이션 출력
    if (this._mixer) {
      // deltaTime : 이전프레임과 현재 프레임의 사이시간
      const deltaTime = time - this._previousTime;
      this._mixer.update(deltaTime);

      // 키보드 입력에 따라 카메라 방향으로 모델을 회전하는 컨트롤
      const angleCameraDirectionAxisY =
        Math.atan2(
          this._camera.position.x - this._model.position.x,
          this._camera.position.z - this._model.position.z
        ) + Math.PI;

      // 위의 angleCameraDirectionAxisY 각도만큼 캐릭터를 회전시키는 객체
      const rotateQuarternion = new THREE.Quaternion();
      rotateQuarternion.setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        angleCameraDirectionAxisY + this._directionOffset()
      );
      this._model.quaternion.rotateTowards(
        rotateQuarternion,
        THREE.MathUtils.degToRad(5)
      );

      // 이동 방향에 대한 기준 설정(카메라 값으로)
      const walkDirection = new THREE.Vector3();
      this._camera.getWorldDirection(walkDirection);

      // 캐릭터가 바닥 기준으로 움직임을 수행해야 하니 y값을
      // this._camera.walkDirection.y = 0;
      //
      walkDirection.y = this._bOnTheGround ? 0 : -1;
      walkDirection.normalize();

      walkDirection.applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        this._directionOffset()
      );
      // walkDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0));

      // 속도 조절 컨트롤
      if (this._speed < this._maxSpeed) {
        this._speed += this._acceleration;
      } else {
        this._speed -= this._acceleration * 2;
      }

      console.log(this._jumpAcctive);
      // 땅 충돌(중력) 컨트롤
      // if (this._jumpAcctive === 1) {
      //   if (!this._bOnTheGround) {
      //     console.log("요기");
      //     console.log(`@@@@@@${this._fallingSpeed}@@@@@@@`);
      //     this._fallingAcceleration = 0;
      //     this._fallingSpeed = 0;
      //   } else {
      //     console.log("어디");
      //     console.log(`@@@@@@${this._fallingSpeed}@@@@@@@`);
      //     this._fallingAcceleration = 3;
      //     this._fallingSpeed -= this._fallingAcceleration;
      //   }
      // } else {
      if (!this._bOnTheGround) {
        this._fallingAcceleration += 1;
        this._fallingSpeed += Math.pow(this._fallingAcceleration, 0.8);
      } else {
        this._fallingAcceleration = 0;
        this._fallingSpeed = 0;
      }
      // }

      // 중력 컨트롤을 위한 속도 벡터 구하기
      const velocity = new THREE.Vector3(
        walkDirection.x * this._speed,
        walkDirection.y * this._fallingSpeed,
        walkDirection.z * this._speed
      );

      const deltaPosition = velocity.clone().multiplyScalar(deltaTime);

      // 점프 컨트롤
      if (this._jumpAcctive === 1) {
        if (this._jumpSpeed < this._jump_maxSpeed) {
          this._jumpSpeed += this._jump_acceleration;
          if (this._jumpAcctive == 1 && this._jumpMax == 1) {
            if (this._jumpSpeed == 0) {
              this._jumpMax = 0;
            }
            this._jumpSpeed -= this._jump_acceleration;
          }
          if (this._jumpSpeed == this._jump_maxSpeed) {
            this._jumpMax = 1;
          }
        }
      } else {
        this._jumpSpeed -= this._jump_acceleration;
      }

      // 캐릭터 이동 전에 캡슐을 이동시킴
      this._model._capsule.translate(deltaPosition);

      // 캡슐과 장애물의 충돌을 검사를 위한 변수
      const result = this._worldOctree.capsuleIntersect(this._model._capsule);
      if (result) {
        // 출돌했을 경우
        console.log("지면지면");
        this._model._capsule.translate(
          result.normal.multiplyScalar(result.depth)
        );
        this._bOnTheGround = true;
      } else {
        console.log("허공허공허공허공허공허공허공허공");
        this._bOnTheGround = false;
        // 충돌하지 않은 경우
      }
      const previousPosition = this._model.position.clone();

      const capsuleHeight =
        this._model._capsule.end.y -
        this._model._capsule.start.y +
        this._model._capsule.radius * 2;

      // if (this._jumpAcctive == 1) {
      //   this._model.position.set(
      //     this._model._capsule.start.x,
      //     this._jumpSpeed,
      //     this._model._capsule.start.z
      //   );
      // } else {
      this._model.position.set(
        this._model._capsule.start.x,
        this._jumpSpeed - this._model._capsule.radius + capsuleHeight / 2,
        this._model._capsule.start.z
      );
      // }

      this._camera.position.x -= previousPosition.x - this._model.position.x;
      this._camera.position.z -= previousPosition.z - this._model.position.z;
      // this._camera.position.y -= previousPosition.y - this._model.position.y;

      // 점프 넣었던 코드
      // if (this._jumpAcctive == 1) {
      //   const moveX = walkDirection.x * (this._speed * deltaTime);
      //   const moveZ = walkDirection.z * (this._speed * deltaTime);
      //   const moveY = this._jumpValue * deltaTime;

      //   this._model.position.x += moveX;
      //   this._model.position.z += moveZ;
      //   this._model.position.y += moveY;

      //   this._camera.position.x += moveX;
      //   this._camera.position.z += moveZ;
      //   this._camera.position.y += moveY;
      // } else if (this._jumpAcctive == 0) {
      //   const moveX = walkDirection.x * (this._speed * deltaTime);
      //   const moveZ = walkDirection.z * (this._speed * deltaTime);
      //   const moveY = this._jumpValue * deltaTime;

      //   this._model.position.x += moveX;
      //   this._model.position.z += moveZ;
      //   this._model.position.y -= moveY;

      //   this._camera.position.x += moveX;
      //   this._camera.position.z += moveZ;
      //   this._camera.position.y -= moveY;
      // } else {
      // }

      this._controls.target.set(
        this._model.position.x,
        this._model.position.y,
        this._model.position.z
      );
    }
    this._previousTime = time;
  }

  render(time) {
    this._renderer.render(this._scene, this._camera);
    this.update(time);

    requestAnimationFrame(this.render.bind(this));
  }

  resize() {
    const width = this._divContainer.clientWidth;
    const height = this._divContainer.clientHeight;

    this._camera.aspect = width / height;
    this._camera.updateProjectionMatrix();

    this._renderer.setSize(width, height);
  }
}

window.onload = function () {
  new App();
};
