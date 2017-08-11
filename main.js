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

const myColor=0x990000;


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
const hexagonRadius=hexWidth/2;
const hexagonHeight=hexHeight;

const hex = new PIXI.Graphics();
hex.beginFill(0x000000);
hex.drawPolygon(getHexPath(hexagonRadius+4,hexagonHeight+8));
hex.endFill();
hex.beginFill(0x666666);
hex.drawPolygon(getHexPath(hexagonRadius,hexagonHeight));
hex.endFill();

const fill = require('flood-fill');
const zero = require('zeros');
const process = require('process');
const grid = zero([50, 50]);

const hexes=[];
const hexByIndex={};
let columnType=0;
let xIndex=0;
let yIndex=0;
for(let x=-200+hexWidth;x<lineWidth;x+=hexWidth-9) {
  yIndex=0;
  for(let y=-200+(columnType===0 ? (hexHeight+8)/2 : hexHeight+8);y<lineHeight;y+=hexHeight+8) {

    const myHex=hex.clone();

    myHex.x = x;
    myHex.y = y;
    myHex.state="empty";
    myHex.xIndex=xIndex;
    myHex.yIndex=yIndex;
    hexByIndex[xIndex+","+yIndex]=myHex;

    mainStage.addChild(myHex);
    hexes.push(myHex);

    if(x>window.innerWidth/2-hexWidth && x<window.innerWidth/2+hexWidth &&
      y+40>window.innerHeight/2-hexHeight && y<window.innerHeight/2+hexHeight) {
      changeHexState(myHex,"full");
    }
    yIndex++;
  }

  columnType=columnType===0 ? 1 : 0;
  xIndex++;
}
console.log("size",xIndex,yIndex);

function reset() {

}


function changeHexState(hex,state) {
  if(hex.state === state)
    return;
  hex.state=state;

  hex.clear();
  hex.beginFill(0x000000);
  hex.drawPolygon(getHexPath(hexagonRadius+4,hexagonHeight+8));
  hex.endFill();
  if(state==="empty") {
    hex.beginFill(0x666666);
    hex.drawPolygon(getHexPath(hexagonRadius,hexagonHeight));
    hex.endFill();
  }
  if(state==="going") {
    hex.beginFill(myColor);
    hex.drawPolygon(getHexPath(hexagonRadius+3,hexagonHeight+3));
    hex.endFill();
    hex.beginFill(0x666666);
    hex.drawPolygon(getHexPath(hexagonRadius,hexagonHeight));
    hex.endFill();
    grid.set(hex.xIndex, hex.yIndex, 1);
  }
  if(state==="full") {
    hex.beginFill(myColor);
    hex.drawPolygon(getHexPath(hexagonRadius,hexagonHeight));
    hex.endFill();
    grid.set(hex.xIndex, hex.yIndex, 1);
  }
  if(state==="debug1") {
    hex.beginFill(0x0000FF);
    hex.drawPolygon(getHexPath(hexagonRadius,hexagonHeight));
    hex.endFill();
  }
  if(state==="debug2") {
    hex.beginFill(0x00FF00);
    hex.drawPolygon(getHexPath(hexagonRadius,hexagonHeight));
    hex.endFill();
  }
}

const circle = new PIXI.Graphics();
circle.beginFill(myColor);
circle.drawCircle(0, 0, 23);
circle.endFill();
circle.x = window.innerWidth/2;
circle.y = window.innerHeight/2;
gameScene.addChild(circle);

const marker = new PIXI.Graphics();
let lines=[];
const point = new PIXI.Point(circle.x-mainStage.x, circle.y-mainStage.y);
marker.clear().beginFill(myColor);
marker.lineStyle(20, myColor, 1);
marker.moveTo(point.x, point.y);
marker.lineTo(point.x, point.y);
let oldPoint = point;

function resetMarker() {
  lines=[];
  marker.clear().beginFill(myColor);
  marker.lineStyle(20, myColor, 1);
}

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

let inside=true;

function oneGoing() {
  return hexes.filter(hex => hex.state==="going").length!==0;
}

function checkHexCollision() {
  hexes.forEach(hex => {
    if(hex.containsPoint(new PIXI.Point(circle.x,circle.y))) {

      //console.log("I have been breached at",hex.x,hex.y);


      if(hex.state==="full" && !inside && oneGoing()) {
        checkGroup(hex);
      }


      if(hex.state==="full") {
        resetMarker();
      }

      if(hex.state === "empty") {
        inside=false;
        changeHexState(hex, "going");
      }

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


function checkGroup(startingHex) {
  console.log("I went back to",startingHex.x,startingHex.y);

  const t=(ref,i,j) => hexByIndex[(ref.xIndex+i)+","+(ref.yIndex+j)];

  function getDirection(ref,state) {
    const results=[];
    for(let i=-1;i<=1;i++) {
      for(let j=-1;j<=1;j++) {
        if(t(ref,i,j).state===state) {
          results.push({i,j});
        }
      }
    }
    return results;
  }

  function getInsidePoint() {
    const {i,j}=getDirection(startingHex,"going")[0];
    const results=getDirection(t(startingHex,i,j),"empty");
    const correct=results.filter(({i:i2,j:j2}) => {
      for(let i3=1;i3<50;i3++) {
        const c=t(startingHex,i+i2*i3,j+j2*i3);
        if(c && c.state==="going") {
          return true;
        }
      }
      return false;
    });

    //changeHexState(t(startingHex,i,j),"debug1");
    if(correct.length===0)
      return null;
    return {i:i+correct[0].i,j:j+correct[0].j};
  }

  const result=getInsidePoint();
  if(result!== null) {

    const {i,j}=result;


    console.log("the truth",i,j,t(startingHex,i,j).state);

    //changeHexState(t(startingHex,i,j),"debug2");

    const height = grid.shape[1];
    const width = grid.shape[0];

    fill(grid, startingHex.xIndex+i, startingHex.yIndex+j, 2);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if(hexByIndex[x+","+y] && grid.get(x, y)===2)
          changeHexState(hexByIndex[x+","+y],"full");
      }
    }
  }

  //state=() => {};
  //return;

  hexes.forEach(hex => {
    if(hex.state!=="going")
      return;
    changeHexState(hex,"full");
  });



  inside=true;
  resetMarker();
}


let state;

state=play;

function gameLoop() {
  requestAnimationFrame(gameLoop);
  state();
  renderer.render(stage);
}

gameLoop();