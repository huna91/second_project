import * as THREE from "../js/three.module.js";
import { OrbitControls } from "../js/OrbitControls.js";
import { GLTFLoader } from "../js/GLTFLoader.js";
import Stats from "../js/stats.module.js";
import { Octree } from "../js/Octree.js";
import { Capsule } from "../js/Capsule.js";
// import * as THREEx from "./js/threex.domevents.js";

class App {
  constructor() {
    const divContainer = document.querySelector("#move_container");
    this._divContainer = divContainer;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    divContainer.appendChild(renderer.domElement);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;

    this._renderer = renderer;

    const scene = new THREE.Scene();
    this._scene = scene;

    //this._setupOctree();
    this._setupCamera();
    this._setupLight();
    this._setupModel();
    this._setupControls();

    window.onresize = this.resize.bind(this);
    this.resize();

    requestAnimationFrame(this.render.bind(this));
  }

  // setFromObject() {
  // 	const sphere = new THREE.SphereGeometry();
  // 	const object = new THREE.Mesh(
  // 		sphere,
  // 		new THREE.MeshBasicMaterial(0xff0000)
  // 	);
  // 	const box = new THREE.BoxHelper(object, 0xffff00);
  // 	scene.add(box);
  // }

  _setupOctree(model) {
    this._worldOctree = new Octree();
    this._worldOctree.fromGraphNode(model);
  }

  _setupControls() {
    this._controls = new OrbitControls(this._camera, this._divContainer);
    this._controls.target.set(0, 100, 0);
    this._controls.enablePan = false;
    this._controls.enableDamping = true;

    const stats = new Stats();
    this._divContainer.appendChild(stats.dom);
    this._fps = stats;

    this._pressedKeys = {};

    document.addEventListener("keydown", (event) => {
      this._pressedKeys[event.key.toLowerCase()] = true;
      this._processAnimation();
    });

    document.addEventListener("keyup", (event) => {
      this._pressedKeys[event.key.toLowerCase()] = false;
      this._processAnimation();
    });
  }

  _processAnimation() {
    const previousAnimationAction = this._currentAnimationAction;

    if (
      this._pressedKeys["w"] ||
      this._pressedKeys["a"] ||
      this._pressedKeys["s"] ||
      this._pressedKeys["d"]
    ) {
      if (this._pressedKeys["shift"]) {
        this._currentAnimationAction = this._animationMap["Run"];
        // this._speed = 350;
        this._maxSpeed = 500;
        this._acceleration = 20;
      } else {
        this._currentAnimationAction = this._animationMap["Walk"];
        //this._speed = 80;
        this._maxSpeed = 200;
        this._acceleration = 20;
      }
    } else if (this._pressedKeys["Space"]) {
      this._currentAnimationAction = this._animationMap["Run"];
      this._acceleration = 500;
    } else {
      this._currentAnimationAction = this._animationMap["Idle"];
      this._speed = 0;
      this._maxSpeed = 0;
      this._acceleration = 0;
    }

    if (previousAnimationAction !== this._currentAnimationAction) {
      previousAnimationAction.fadeOut(0.5);
      this._currentAnimationAction.reset().fadeIn(0.5).play();
    }
  }

  _setupModel() {
    // const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
    // const planeMaterial = new THREE.MeshPhongMaterial({ color: 0x878787 });
    // const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    // plane.rotation.x = -Math.PI/2;
    // this._scene.add(plane);
    // plane.receiveShadow = true;

    // this._worldOctree.fromGraphNode(plane);

    // const page_1 = new THREE.SphereGeometry(10, 10, 10);
    // const meterial_page_1 = new THREE.MeshNormalMaterial({
    // 	wireframe: true,
    // });
    // const sphere_page_1 = new THREE.Mesh(page_1, meterial_page_1);
    // scene.add(sphere_page_1);
    // const animate = () => {
    // 	requestAnimationFrame(animate);
    // 	renderer.render(scene, camera);
    // };
    // animate();
    const loader = new GLTFLoader();

    loader.load("../data/character.glb", (gltf) => {
      const model = gltf.scene;
      this._scene.add(model);

      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
        }
      });

      const animationClips = gltf.animations; // THREE.AnimationClip[]
      const mixer = new THREE.AnimationMixer(model);
      const animationsMap = {};
      animationClips.forEach((clip) => {
        const name = clip.name;
        // console.log(name);
        animationsMap[name] = mixer.clipAction(clip); // THREE.AnimationAction
      });

      this._mixer = mixer;
      this._animationMap = animationsMap;
      this._currentAnimationAction = this._animationMap["Idle"];
      this._currentAnimationAction.play();

      const box = new THREE.Box3().setFromObject(model);
      model.position.y = (box.max.y - box.min.y) / 2;

      const height = box.max.y - box.min.y;
      const diameter = box.max.z - box.min.z;

      model._capsule = new Capsule(
        new THREE.Vector3(0, diameter / 2, 0),
        new THREE.Vector3(0, height - diameter / 2, 0),
        diameter / 2
      );

      const axisHelper = new THREE.AxesHelper(0);
      this._scene.add(axisHelper);

      const boxHelper = new THREE.BoxHelper(model);
      // this._scene.add(boxHelper);
      this._boxHelper = boxHelper;
      this._model = model;

      // const boxG = new THREE.BoxGeometry(100, diameter-5, 100);
      // const boxM = new THREE.Mesh(boxG, planeMaterial);
      // boxM.receiveShadow = true;
      // boxM.castShadow = true;
      // boxM.position.set(150, 0, 0);
      // this._scene.add(boxM);

      // this._worldOctree.fromGraphNode(boxM);
    });

    loader.load("../data/space3.glb", (gltf) => {
      const model = gltf.scene;

      this._scene.add(model);

      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this._setupOctree(model);
    });

    loader.load("../data/ss_page.glb", (gltf) => {
      const model = gltf.scene;
      this._ssPage = model;
      //A
      model.position.x = 2300;
      model.position.y = -150;
      //B
      // model.position.x = 1200;
      // model.position.y = 200;
      this._scene.add(model);

      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          console.log("dd");
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    });

    loader.load("../data/hy_page.glb", (gltf) => {
      const model = gltf.scene;
      this._hyPage = model;
      //A
      model.position.x = 0;
      model.position.z = 2000;
      model.position.y = 100;
      model.rotation.y = Math.PI / 2;
      //B
      // model.position.x = 0;
      // model.position.z = 1200;
      // model.position.y = 200;
      // model.rotation.y = Math.PI / 2;
      this._scene.add(model);

      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    });

    loader.load("../data/gg_page.glb", (gltf) => {
      const model = gltf.scene;
      this._ggPage = model;
      //A
      model.position.x = -780;
      model.position.z = -680;
      model.position.y = 350;
      //B
      // model.position.x = -1200;
      // model.position.z = 0;
      // model.position.y = 200;
      this._scene.add(model);

      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      //   this._setupOctree(model);
    });

    loader.load("../data/jh_page.glb", (gltf) => {
      const model = gltf.scene;
      this._jhPage = model;
      //A
      model.position.x = 0;
      model.position.z = -1200;
      model.position.y = 100;
      //B
      // model.position.x = 0;
      // model.position.z = -1200;
      // model.position.y = 200;
      // model.rotation.y = Math.PI / 2;
      this._scene.add(model);

      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    });

    loader.load("../data/logo.glb", (gltf) => {
      const model = gltf.scene;
      this._logo = model;
      //A
      model.position.x = -2100;
      model.position.z = -1000;
      model.position.y = 500;
      //B
      // model.position.x = 0;
      // model.position.z = -1200;
      // model.position.y = 200;
      // model.rotation.y = Math.PI / 2;
      this._scene.add(model);

      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    });

    loader.load("../data/chicken.glb", (gltf) => {
      const model = gltf.scene;
      // this._chicken = model;

      model.position.x = 1000;
      model.position.z = 800;
      model.position.y = 0;
      model.rotation.y = -Math.PI / 4;

      this._scene.add(model);

      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    });
    loader.load("../data/chicken.glb", (gltf) => {
      const model = gltf.scene;
      // this._chicken = model;

      model.position.x = 1000;
      model.position.z = 1000;
      model.position.y = 0;
      model.rotation.y = -Math.PI / 4;

      this._scene.add(model);

      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    });
    loader.load("../data/chicken.glb", (gltf) => {
      const model = gltf.scene;
      // this._chicken = model;

      model.position.x = 800;
      model.position.z = 1000;
      model.position.y = 0;
      model.rotation.y = -Math.PI / 4;

      this._scene.add(model);

      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    });
    loader.load("../data/chicken.glb", (gltf) => {
      const model = gltf.scene;
      // this._chicken = model;

      model.position.x = 1000;
      model.position.z = 600;
      model.position.y = 0;
      model.rotation.y = -Math.PI / 4;

      this._scene.add(model);

      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    });

    loader.load("../data/chicken.glb", (gltf) => {
      const model = gltf.scene;
      // this._chicken = model;

      model.position.x = 1200;
      model.position.z = 700;
      model.position.y = 0;
      model.rotation.y = -Math.PI / 4;

      this._scene.add(model);

      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    });
    loader.load("../data/chicken_1.glb", (gltf) => {
      const model = gltf.scene;
      // this._chicken = model;

      model.position.x = 1600;
      model.position.z = 400;
      model.position.y = 600;
      model.rotation.y = Math.PI + Math.PI / 4;

      this._scene.add(model);

      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    });
  }

  _setupCamera() {
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      8000
    );

    camera.position.set(0, 100, 500);
    this._camera = camera;
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
    // this._scene.add(pointLightHelper);
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
    // this._scene.add(directionalLightHelper);

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
    // this._scene.add(shadowCameraHelper);
  }

  _previousDirectionOffset = 0;

  _directionOffset() {
    const pressedKeys = this._pressedKeys;
    let directionOffset = 0; // w

    if (pressedKeys["w"]) {
      if (pressedKeys["a"]) {
        directionOffset = Math.PI / 4; // w+a (45도)
      } else if (pressedKeys["d"]) {
        directionOffset = -Math.PI / 4; // w+d (-45도)
      }
    } else if (pressedKeys["s"]) {
      if (pressedKeys["a"]) {
        directionOffset = Math.PI / 4 + Math.PI / 2; // s+a (135도)
      } else if (pressedKeys["d"]) {
        directionOffset = -Math.PI / 4 - Math.PI / 2; // s+d (-135도)
      } else {
        directionOffset = Math.PI; // s (180도)
      }
    } else if (pressedKeys["a"]) {
      directionOffset = Math.PI / 2; // a (90도)
    } else if (pressedKeys["d"]) {
      directionOffset = -Math.PI / 2; // d (-90도)
    } else {
      directionOffset = this._previousDirectionOffset;
    }

    this._previousDirectionOffset = directionOffset;

    return directionOffset;
  }

  _speed = 0;
  _maxSpeed = 0;
  _acceleration = 0;

  _bOnTheGround = false;
  _fallingAcceleration = 0;
  _fallingSpeed = 0;

  update(time) {
    time *= 0.001; // second unit

    this._controls.update();

    //박스
    if (this._boxHelper) {
      this._boxHelper.update();
    }
    //fps 창 활성화
    this._fps.update();

    if (this._mixer) {
      const deltaTime = time - this._previousTime;
      this._mixer.update(deltaTime);

      const angleCameraDirectionAxisY =
        Math.atan2(
          this._camera.position.x - this._model.position.x,
          this._camera.position.z - this._model.position.z
        ) + Math.PI;

      const rotateQuarternion = new THREE.Quaternion();
      rotateQuarternion.setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        angleCameraDirectionAxisY + this._directionOffset()
      );

      this._model.quaternion.rotateTowards(
        rotateQuarternion,
        THREE.MathUtils.degToRad(5)
      );

      const walkDirection = new THREE.Vector3();
      this._camera.getWorldDirection(walkDirection);

      //walkDirection.y = 0;
      walkDirection.y = this._bOnTheGround ? 0 : -1;
      walkDirection.normalize();

      walkDirection.applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        this._directionOffset()
      );

      if (this._speed < this._maxSpeed) this._speed += this._acceleration;
      else this._speed -= this._acceleration * 2;

      if (!this._bOnTheGround) {
        this._fallingAcceleration += 1;
        this._fallingSpeed += Math.pow(this._fallingAcceleration, 2);
      } else {
        this._fallingAcceleration = 0;
        this._fallingSpeed = 0;
      }

      const velocity = new THREE.Vector3(
        walkDirection.x * this._speed,
        walkDirection.y * this._fallingSpeed,
        walkDirection.z * this._speed
      );

      const deltaPosition = velocity.clone().multiplyScalar(deltaTime);

      // const moveX = walkDirection.x * (this._speed * deltaTime);
      // const moveZ = walkDirection.z * (this._speed * deltaTime);

      // this._model.position.x += moveX;
      // this._model.position.z += moveZ;

      this._jhPage.rotation.y += 0.03;
      this._ssPage.rotation.y += 0.03;
      this._ggPage.rotation.y += 0.03;
      this._hyPage.rotation.y += 0.03;

      this._model._capsule.translate(deltaPosition);

      const result = this._worldOctree.capsuleIntersect(this._model._capsule);
      if (result) {
        // 충돌한 경우
        this._model._capsule.translate(
          result.normal.multiplyScalar(result.depth)
        );
        this._bOnTheGround = true;
      } else {
        // 충돌하지 않은 경우
        this._bOnTheGround = false;
      }

      const previousPosition = this._model.position.clone();
      const capsuleHeight =
        this._model._capsule.end.y -
        this._model._capsule.start.y +
        this._model._capsule.radius * 2;
      this._model.position.set(
        this._model._capsule.start.x,
        this._model._capsule.start.y -
          this._model._capsule.radius +
          capsuleHeight / 2,
        this._model._capsule.start.z
      );
      //////////////////////////////////////////////////////////////////////////
      ///////////////////////위치로 이동시 페이지 이동////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      //신석님 페이지로 이동
      if (this._model.position.x < 2350 && this._model.position.x > 2250) {
        if (this._model.position.y < -100 && this._model.position.y > -200) {
          window.location.href = "../ss_page/3 project/nuron/index.html";
        }
      }

      //하영님 페이지로 이동
      if (this._model.position.x < 50 && this._model.position.x > -50) {
        if (this._model.position.y < 150 && this._model.position.y > -50) {
          if (this._model.position.z < 2050 && this._model.position.z > 1950) {
            window.location.href = "../hy_page/index.html";
          }
        }
      }

      //경국님 페이지로 이동
      if (this._model.position.x < -730 && this._model.position.x > -830) {
        if (this._model.position.y < 400 && this._model.position.y > 250) {
          if (this._model.position.z < -630 && this._model.position.z > -730) {
            window.location.href = "../gg_page/index.html";
          }
        }
      }

      //종화님 페이지로 이동
      if (this._model.position.x < 50 && this._model.position.x > -50) {
        if (this._model.position.y < 150 && this._model.position.y > -50) {
          if (
            this._model.position.z < -1150 &&
            this._model.position.z > -1250
          ) {
            window.location.href = "../jh/page_JH.html";
          }
        }
      }

      // this._camera.position.x += moveX;
      // this._camera.position.z += moveZ;
      this._camera.position.x -= previousPosition.x - this._model.position.x;
      this._camera.position.z -= previousPosition.z - this._model.position.z;

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
