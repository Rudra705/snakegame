const CELLS_PER_DIMENSION = 11;
const CELLS_RIGHT_OF_CENTER = (CELLS_PER_DIMENSION - 1) / 2;
const STARTING_NUM_SEGMENTS = 3;
const MS_PER_MOVE = 200;
const AUTO_MS_PER_MOVE = 100;
const SPEEDUP_FACTOR = 3;
var snakeImage;
var food;
var foodImage;
var direction;
var segments;
var keyMappings;
var arenaWidth;
var cellWidth;
var zeroVector;
var nextMoveTime;
var automatic_mode = false;
var rightmostCellCenter;
var snake_body
var ubuntu
var rules
var r;
var gameState = 0;
var _text1;
var score = 0;
var highScore;
var database;
var lives = 3;


function preload() {
  foodImage = loadImage('assets/apple.png');
  snakeImage = loadImage('assets/snake_face.png');
  snake_body = loadImage('assets/snake_body.png');
  rules = loadImage('assets/rules.png');
  ubunut_font = loadFont('assets/Ubuntu-MediumItalic.ttf')
};

function setup() {
  const len = min(windowWidth, windowHeight);
  createCanvas(len,len,WEBGL);
   

  zeroVector = createVector(0, 0, 0);
  arenaWidth = round(width * 0.6);
  cellWidth = round(arenaWidth / CELLS_PER_DIMENSION);
  rightmostCellCenter = cellWidth * CELLS_RIGHT_OF_CENTER;
  mapKeys();
  setUpState();
  // alert("Click the 'h' key for game info.")


  if(gameState === 0){ 
  image(rules,-200,windowHeight/2 - windowHeight );
  }

 database = firebase.database();

  };

function draw() {

  if(gameState === 1){
  if (millis() > nextMoveTime) {
    if (automatic_mode)
      autoSetDirection();
    moveSnake();
    const ms = automatic_mode ? AUTO_MS_PER_MOVE : MS_PER_MOVE ;
    nextMoveTime += keyIsDown(SHIFT) ? ms / SPEEDUP_FACTOR : ms *2;
  }

  positionCamera();
  background(255);
  smooth();
  drawArena();
  drawSnake();
  drawFood();
  
}
  if(gameState === 2){
    drawScore();
  }
};

function keyPressed() {
  console.log("KeyPressed")
  if (keyCode === 32 && gameState === 0 || keyCode === 32 && gameState === 2){
    console.log("Space Key")
    gameState = 1;
  }
  if (keyIsDown(65)) { // 65 keyCode is "a"
    if (automatic_mode = !automatic_mode)
      nextMoveTime = millis();
  } else {
    const requestedDir = keyMappings[key];
    if (requestedDir) {
      const oppositeOfCurrentDir = p5.Vector.mult(direction, -1);
      if (!requestedDir.equals(oppositeOfCurrentDir)) {
        direction = requestedDir;
        if (!nextMoveTime)
          nextMoveTime = millis();
      }
    }
  }
};

function positionCamera() {
  const camX = map(Math.sin(frameCount / 50), -1, 1, 0, -arenaWidth * 0.8);
  const camY = -arenaWidth * 0.8;
  const camZ = (height / 2.0) / Math.tan(Math.PI * 30.0 / 180.0);
  camera(camX, camY, camZ, 0, 0, 0, 0, 1, 0);
}

function mapKeys() {
  const v = createVector;
  const up = v(0, -1, 0);
  const down = v(0, 1, 0);
  const left = v(-1, 0, 0);
  const right = v(1, 0, 0);
  const away = v(0, 0, -1);
  const towards = v(0, 0, 1);
  keyMappings = {
    'w': away,
    's': towards,
    'ArrowLeft': left,
    'ArrowRight': right,
    'ArrowUp': up,
    'ArrowDown': down,
  };
}

function setUpState() {
  direction = createVector(0, 0, 0);
  food = newFoodPosition();
  segments = Array.from({ length: STARTING_NUM_SEGMENTS }, (v, i) =>
    createVector(-i * cellWidth, 0, 0));
}

function newFoodPosition() {
  const m = CELLS_RIGHT_OF_CENTER;
  const c = () => round(random(-m, m)) * cellWidth;
  return createVector(c(), c(), c());
}

function moveSnake() {
  if (automatic_mode || !direction.equals(zeroVector)) {
    const newHeadPos = p5.Vector.add(segments[0], p5.Vector.mult(direction, cellWidth));
    if (collides(newHeadPos)) {
      // r = Math.round(random(1,2))
      
      lives = lives - 1;
      alert("Now you have " + lives + " lives left");
      if(lives === 0){
        gameState = 2;
        sendData();
      }

      setUpState();

    } else {
      if (newHeadPos.equals(food)){
        score = score + 50;
        food = newFoodPosition();
      }else
        segments.pop(); // Discard last
      segments.unshift(newHeadPos); // Put new head on front
    }
  }
}

function collides(pos) {
  const inBounds = pos.array().every(coord => Math.abs(coord) < arenaWidth / 2);
  const collidesWithSelf = segments.some((segment, i) => i > 0 && segment.equals(pos));
  return (collidesWithSelf || !inBounds) ;
}

function autoSetDirection() {
  const head = segments[0];
  const toFoodAxisDistances = p5.Vector.sub(food, head).array();
  let newDir;

  const validDirs = validMoveDirections(head);

  for (let i = 0; i < 3; i++) {
    const d = toFoodAxisDistances[i];
    const a = [0, 0, 0];
    a[i] = d / Math.abs(d); // -1, 0, or 1
    const candidateDir = createVector(...a);
    if (validDirs.some(d => d.equals(candidateDir))) {
      newDir = candidateDir;
      break;
    }
  }
  if (newDir)
    direction = newDir;
  else {
    if (validDirs.length) {
      direction = random(validDirs);
    }
  }
}

function validMoveDirections(head) {
  const validDirs = [];
  [-1, 1].forEach(n => {
    for (let axis = 0; axis < 3; axis++) {
      const dirArray = [0, 0, 0];
      dirArray[axis] = n;
      const candidateDir = createVector(...dirArray);
      const candidatePos = p5.Vector.add(head, p5.Vector.mult(candidateDir, cellWidth));
      if (!collides(candidatePos))
        validDirs.push(candidateDir);
    }
  });
  return validDirs;
}

function drawArena() {
  stroke('gray');
  const l = rightmostCellCenter + cellWidth / 2;
  const s = -l;
  const q = TAU / 4;

  [
    [[0, 0, s], 0, 0],
    [[l, 0, 0], 0, q],
    [[0, l, 0], q, 0],
  ].forEach(xf => {
    const [pos, xRot, yRot] = xf;
    at(...pos, () => {
      rotateX(xRot);
      rotateY(yRot);
      for (let v = s; v <= l; v += cellWidth) {
        line(s, v, 0, l, v, 0);
        line(v, s, 0, v, l, 0);
      }
    });
  });
}

function drawSnake() {
  const segmentWidth = cellWidth * 0.9;
  texture(snakeImage);
  segments.forEach((segment, i) => {
    stroke('gray');
    // fill(i === 0 ? 255 : 0, 255, 0, 70);
    at(...segment.array(), () => box(map(i, 0, segments.length, segmentWidth, segmentWidth * 0.5))); 

    stroke(0, 255, 0);
    // fill(0, 255, 0, 60);
    // drawReferenceStructures(segments[0], segmentWidth);
    texture(snake_body);
  
  });
}

function drawFood() {
  noStroke();
  texture(foodImage);
  const itemWidth = cellWidth * 0.8;
  texture(foodImage);
  at(...food.array(), () => box(itemWidth));
  stroke(255, 0, 0);
  fill(255, 0, 0, 60);
  drawReferenceStructures(food, itemWidth);
  // r = Math.round(random(1,2));
  // if(r){
  // switch(r){
  //   case 1:
  //   //  drawFood();
  //     texture(foodImage);
  //     at(...food.array(), () => box(itemWidth));
  //     stroke(255, 0, 0);
  //     fill(255, 0, 0, 60);
  //     drawReferenceStructures(food, itemWidth);
  //    break;
  //    case 2:
  //      fill('blue')
  //     //  const itemWidth = cellWidth * 0.8;
  //      at(...food.array(), () => box(itemWidth));
  //     stroke(255, 0, 0);
  //     fill(255, 0, 0, 60);
  //     drawReferenceStructures(food, itemWidth);
  //      break;
  //     default : case 1:
  //      break;
  // } 
  // }
}


// function drawPoison(){
//   noStroke();
//   // texture(foodImage);
//   const itemWidth = cellWidth * 0.8;
//   at(...food.array(), () => box(itemWidth));

//   stroke(255, 0, 0);
//   fill('blue');
//   drawReferenceStructures(food, itemWidth);
// }

function drawReferenceStructures(pos, objWidth) {
  const l = arenaWidth / 2; // Largest coordinate value
  const s = -l; // Smallest
  const { x, y, z } = pos;
  line(x, y, z, l, y, z);
  line(x, y, z, x, l, z);
  line(x, y, z, x, y, s);

  noStroke();
  const w = objWidth;
  const f = 0.1; // Length on flat dimension
  at(l, y, z, () => box(f, w, w));
  at(x, l, z, () => box(w, f, w));
  at(x, y, s, () => box(w, w, f));
}

function drawScore(){ 
  _text = createGraphics(window.innerWidth, window.innerHeight);
  _text.textFont(ubunut_font);
  _text.textAlign(CENTER);
  _text.textSize(35);
  _text.fill('black');
  _text.text('Game Over \n' + 
  'Type your name below to\nsee scoreboard of  the world.\n\n'+
  'Your Score is '+ score+
  '\n\nPress F5 to Replay', width * 0.9, height * 0.5);
  

  background('skyblue');
  texture(_text);
  rotateY(map(mouseX, 0, width, 0, 3));
  plane(window.innerWidth, window.innerHeight);

}
// sending data to the database 
function sendData(){
  var input = createInput();
  input.position(width * 0.5, height * 0.7);

  var submit_Button = createButton("Submit");
  submit_Button.position(width * 0.5, height * 0.75);


  // showing the leaderboard and doing other tasks when button is clicked 
  submit_Button.mousePressed(() => {
    console.log("button Pressed");
    var name = input.value();
    console.log(name);
    
    var ref = database.ref('scores');
    var data = {
      name: name,
      score: score,
    }
    ref.push(data);
    ref.on('value', gotData, errData);
    submit_Button.hide();

    window.scroll({
      top: windowHeight/2 - windowHeight, 
      behavior: 'smooth' 
     });
    input.hide();
  });


}
function gotData(data) {
  var scores = data.val();
  var keys = Object.keys(scores);
  
  var scorelistings = selectAll('.scoreListing');
  for(var i =0; i< scorelistings.length; i++){
    scorelistings[i].remove();
  }
  console.log(keys)
  for(var i = 0; i < keys.length;i++){
    var k = keys[i];
    var name = scores[k].name;
    var score = scores[k].score;
    
    console.log(key);
    // console.log(name + ": " + score);
    // console.log(name,score);
    var li = createElement('li',name +": " + score);
    li.class('scorelist');
    li.parent('scorelist');
  }



};
function errData(data){
  console.log('Error Getting Data')
}
function at(x, y, z, fn) {
  push();
  translate(x, y, z);
  fn();
  pop();
}
