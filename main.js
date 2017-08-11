const PIXI=require("pixi.js");
const crosses=require('robust-segment-intersect');


const renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight,{antialias: true});
renderer.view.style.position = "absolute";
renderer.view.style.display = "block";
renderer.autoResize = true;

document.body.appendChild(renderer.view);
const stage = new PIXI.Container();

gameScene = new PIXI.Container();
stage.addChild(gameScene);

gameOverScene = new PIXI.Container();
message = new PIXI.Text(
  "The End!",
  {fontSize: "64px", fill: "white"}
);

message.x = 120;
message.y = window.innerHeight / 2 - 32;

gameOverScene.addChild(message);
gameOverScene.visible=false;
stage.addChild(gameOverScene);




const mainStage = new PIXI.Container();
gameScene.addChild(mainStage);

const lineWidth=window.innerWidth+400;
const lineHeight=window.innerHeight+400;
const hexWidth=54;
const hexHeight=46;

function getHexPath(hexagonRadius,hexagonHeight) {
  return [
    -hexagonRadius, 0,
    -hexagonRadius/2, hexagonHeight/2,
    hexagonRadius/2, hexagonHeight/2,
    hexagonRadius, 0,
    hexagonRadius/2, -hexagonHeight/2,
    -hexagonRadius/2, -hexagonHeight/2,
  ];
}

const hex = new PIXI.Graphics();
hex.beginFill(0x666666);

const hexagonRadius=hexWidth/2;
const hexagonHeight=hexHeight;
hex.drawPolygon(getHexPath(hexagonRadius,hexagonHeight));
hex.endFill();


const hexes=[];
let columnType=0;
for(let x=-200+hexWidth;x<lineWidth;x+=hexWidth-9) {
  for(let y=-200+(columnType===0 ? (hexHeight+8)/2 : hexHeight+8);y<lineHeight;y+=hexHeight+8) {

    const myHex=hex.clone();

    myHex.x = x;
    myHex.y = y;

    mainStage.addChild(myHex);
    hexes.push(myHex);
  }

  columnType=columnType===0 ? 1 : 0;
}


function changeHexState(hex,state) {
  if(hex.state === state)
    return;
  hex.state=state;
  if(state==="empty") {
    hex.clear();
    hex.beginFill(0x666666);
    hex.drawPolygon(getHexPath(hexagonRadius,hexagonHeight));
    hex.endFill();
  }
  if(state==="going") {
    hex.clear();
    hex.beginFill(0x660000);
    hex.drawPolygon(getHexPath(hexagonRadius+3,hexagonHeight+3));
    hex.endFill();
    hex.beginFill(0x666666);
    hex.drawPolygon(getHexPath(hexagonRadius,hexagonHeight));
    hex.endFill();
  }
  if(state==="full") {

  }
}

const circle = new PIXI.Graphics();
circle.beginFill(0x9966FF);
circle.drawCircle(0, 0, 23);
circle.endFill();
circle.x = window.innerWidth/2;
circle.y = window.innerHeight/2;
gameScene.addChild(circle);

const marker = new PIXI.Graphics();
const lines=[];
const point = new PIXI.Point(circle.x-mainStage.x, circle.y-mainStage.y);
marker.clear().beginFill(0xffd900);
marker.lineStyle(20, 0xffd900, 1);
marker.moveTo(point.x, point.y);
marker.lineTo(point.x, point.y);
let oldPoint = point;

mainStage.addChild(marker);

gameScene.interactive = true;

let pos;
gameScene.on("mousemove", (e) =>  {
  pos=e.data.getLocalPosition(gameScene);

});
const v=3;
const go=true;

function play() {

  if(pos && go) {
    const a=pos.x - circle.x;
    const b=pos.y - circle.y;
    const c=Math.sqrt(a*a+b*b);
    const x=a/c;
    const y=b/c;
    mainStage.x -= v*x;
    mainStage.y -= v*y;

    const point = new PIXI.Point(circle.x-mainStage.x, circle.y-mainStage.y);
    marker.moveTo(point.x, point.y);
    marker.lineTo(oldPoint.x, oldPoint.y);

    const currentLine={first:oldPoint,second:point};
    //console.log(currentLine.first.x,currentLine.first.y,currentLine.second.x,currentLine.second.y);

    oldPoint = point;

    checkHexCollision();
    checkLineCollision(currentLine);

    lines.push(currentLine);
  }
}

function gameOver() {
  gameScene.visible=false;
  gameOverScene.visible=true;

}

function checkHexCollision() {
  hexes.forEach(hex => {
    if(hex.containsPoint(new PIXI.Point(circle.x,circle.y))) {

      //console.log("I have been breached at",hex.x,hex.y);

      changeHexState(hex,"going");

    }
  })
}

function lineIntersect(lineA,lineB) {
  const {first:{x:x1,y:y1},second:{x:x2,y:y2}}=lineA;
  const {first:{x:x3,y:y3},second:{x:x4,y:y4}}=lineB;
  return crosses([x1,y1],[x2,y2],[x3,y3],[x4,y4]);

}

function checkLineCollision(currentLine) {
  lines.forEach((line,i) => {
    if(i===(lines.length-1))
      return;
    if(lineIntersect(currentLine,line)) {
      //console.log("I breach myself at line ",line.first.x,line.first.y,line.second.x,line.second.y);

      state=gameOver;
    }
  });
}


let state;

state=play;

function gameLoop() {
  requestAnimationFrame(gameLoop);
  state();
  renderer.render(stage);
}

gameLoop();