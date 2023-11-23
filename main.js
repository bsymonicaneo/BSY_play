import { Bodies, Body, Engine, Events, Render, Runner, World } from "matter-js"; // Web 2D 물리엔진 matter-js install 필요
import { FRUITS } from "./fruits";

const engine = Engine.create();
const render = Render.create({
  engine,
  element: document.body,
  options: { // Background options
    wireframes: false, // 디폴트 true로 되어있을 경우, 검은색으로 노출됨
    background: "#dbffdd",
    width: 620,
    height: 850,
  }
});

// Create ingame element
const world = engine.world;

// 게임 틀 만들기
// Create the left walls
const leftWall = Bodies.rectangle(15, 395, 30, 790, { // 인자 순서 x, y, width, height
  isStatic: true, // 왼쪽벽이 고정됨
  render: { fillStyle: "#030a2b" } // full fill color
});

// Create the right walls
const rightWall = Bodies.rectangle(605, 395, 30, 790, { 
  isStatic: true, // 오른쪽벽이 고정됨
  render: { fillStyle: "#030a2b" } // full fill color
});

// Create the ground walls
const ground = Bodies.rectangle(310, 820, 620, 60, { 
  isStatic: true, // 바닥이 고정됨
  render: { fillStyle: "#030a2b" } // full fill color
});

// Create the Tapline
const topLine = Bodies.rectangle(310, 150, 620, 2, { 
  name: "topLine",
  isStatic: true, // 탑 라인이 고정됨
  isSensor: true, // 탑 라인에 부딪치지 않고 감지만 되도록
  render: { fillStyle: "#030a2b" } // full fill color
})

// 게임 틀 화면 그리기
World.add(world, [leftWall, rightWall, ground, topLine]); // world add the left wall

Render.run(render); // Run the renderer to web
Runner.run(engine); // Run the runner to web



let currentBody = null;
let currentFruit = null;
let disableAction = false; // 연속 액션을 막는 전역변수 
let interval = null; // 초기화
let num_suika = 0; // 승리 판정 수박이 2개인지 체크


// 과일 추가하기
function addFruit() {
  const index = 9;
  // const index = Math.floor(Math.random() * 10); // 등장하는 과일 랜덤 설정 (*N개까지 등장), floor를 써서 내림하여 정수 처리
  console.log("addFruit Index value:", index);
  const fruit = FRUITS[index];

  const body = Bodies.circle(300, 50, fruit.radius, { // Bodies 에서 원 circle 오브제를 만듬 
    index: index,
    isSleeping: true, 
    render: {
      sprite: { texture: `${fruit.name}.png`}
    },
    restitution: 0.8, // 복원력 (튀기는 운동)
  });

  currentBody = body;
  currentFruit = fruit;

  World.add(world, body);
}

// 과일 움직이기고 떨어트리기
window.onkeydown = (event) => {
  if (disableAction) { // disable action이 true일 경우(막혀있다면) 밑에 코드 실행 안함 체크
    return;
  }

  switch (event.code) {
    case "ArrowLeft": // 왼쪽 이동
      if (interval) // 인터벌이 있으면
        return;

      interval = setInterval(() => {
        if (currentBody.position.x - currentFruit.radius > 30) // 과일이 화면을 벗어나지 못하게 예외처리
          Body.setPosition(currentBody, {
            x: currentBody.position.x - 1,
            y: currentBody.position.y,
          });
      }, 5); // 5초마다 좌우로 부드럽게 움직이도록 만들기
      break;

    case "ArrowRight": //오른쪽 이동
      if (interval)
        return;

      interval = setInterval(() => {
        if (currentBody.position.x + currentFruit.radius < 587) // 과일이 화면을 벗어나지 못하게 예외처리
          Body.setPosition(currentBody, {
            x: currentBody.position.x + 1,
            y: currentBody.position.y,
          });
        }, 5);  
      break;

    case "Space": // 아래 이동
      currentBody.isSleeping = false;
      disableAction = true;

      setTimeout(() => { //일정 시간 뒤에 코드가 실행되도록 하는 ㅗ드
        addFruit(); // 과일 추가
        disableAction = false; // 연속 드랍 불가 처리
      }, 1000);
      break;
  }
}

window.onkeyup = (event) => { // 손가락을 키에서 떼면 인터벌 종료 체크
  switch (event.code) {
    case "ArrowLeft":
    case "ArrowRight":
      clearInterval(interval); 
      interval = null;
  }
}

// 과일 충돌 판정
Events.on(engine, "collisionStart", (event) => {
  event.pairs.forEach((collision) => {
    // 충돌한 두 개체 중 인덱스가 같은 과일이 있는지 확인 합니다.
    if (collision.bodyA.index === collision.bodyB.index) { 
      // 현재 충돌한 과일의 인덱스를 가져옵니다.
      const index = collision.bodyA.index;

      // 충돌한 과일이 수박(인덱스 10)인 경우 더 이상 실행하지 않고 함수를 종료합니다.
      if (index === FRUITS.length - 1) {
        return;
      }  
      
      // 충돌한 두 개체(같은 인덱스)를 세계에서 제거합니다.
      World.remove(world, [collision.bodyA, collision.bodyB]);

      // 제거된 과일의 인덱스 값에 +1을 해서 다음 인덱스의 과일을 가져옵니다.
      const newFruit = FRUITS[index + 1]; 

      // 새로운 과일에 대한 Body를 생성합니다.
      const newBody = Bodies.circle( 
        collision.collision.supports[0].x, // x좌표
        collision.collision.supports[0].y, // y좌표
        newFruit.radius,                   // 반지름
        {
          render: { 
            sprite: { texture: `${newFruit.name}.png` } // 생성된 새로운 과일을 표시하는데 사용되는 이미지 파일의 경로 지정
          },
          index: index + 1, // 새로운 과일의 인덱스
        }
      );
      console.log("newFruit Index value:", index + 1);

      // 세계에 새로운 과일 Body를 추가합니다.
      World.add(world, newBody);

      // 승리 판정 (새로운 과일의 인덱스가 10이고 누적 수박 개수가 2일 경우 승리 알림창을 띄우고 게임 종료)
      if (index + 1 === 10) { // 새로 등장한 과일이 인덱스 10일 경우
        num_suika++; // 누적 수박 개수를 증가시킵니다.

        if (num_suika === 2) { // 누적 수박 개수가 2개일 경우
          alert("You win! You collected 2 watermelons!"); // 승리 알림을 띄움
          // 게임 종료 로직 추가 (함수 실행을 종료하여 게임이 더 이상 진행되지 않도록 합니다.)
          return;
        }
      }
          
      // 실패 판정 (disableAction이 false이고 충돌한 개체 중 하나가 "topLine"인 경우 실패 알림창을 띄웁니다.)
      if (
        !disableAction &&
        (collision.bodyA.name === "topLine" || collision.bodyB.name === "topLine")
      ) { // disableAction이 아니고, bodya/b가 탑라인 일때
        alert("Game over!"); // 실패 알림을 띄움
        return;
      }
    }
  }); 
});

addFruit();