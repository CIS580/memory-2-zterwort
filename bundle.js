(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

/* Classes */
const Game = require('./game');
const debug = false;

/* Global variables */
var canvas = document.getElementById('screen');
var game = new Game(canvas, update, render);
var image = new Image();
var blip = new Audio();
blip.src = 'assets/blip.wav';
var flip = new Audio();
flip.src = 'assets/flip.wav';
var wrong = new Audio();
wrong.src = 'assets/wrong.wav';
var correct = new Audio();
correct.src = 'assets/correct.wav';
image.src = 'assets/animals.png';
var timer = 0;

// We have 9 pairs of possible cards that are about 212px square
var cards = [0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8];
var board = [];
while(cards.length > 0) {
  var index = Math.floor(Math.random() * (cards.length - 1));
  board.push({card: cards[index], flip: false});
  cards.splice(index, 1);
}
var state = "waiting for click 1";
var scores = [0,0];
var player = 0;
var card1;
var card2;
var currentIndex, currentX, currentY;

canvas.onclick = function(event){
  event.preventDefault();
  switch(state){
    case "waiting for click 1":
    if(!board[currentIndex] || board[currentIndex].flip) return blip.play();
    card1 = board[currentIndex];
    card1.flip = true;
    flip.play();
    state = "waiting for click 2"
    break;
    case "waiting for click 2":
    if(!board[currentIndex] || board[currentIndex].flip) return blip.play();
    card2 = board[currentIndex];
    card2.flip = true;
    flip.play();
    state = "waiting ..."
    timer = 0;
    break;
  }
}

// TODO: Place the cards on the board in random order
canvas.onmousemove = function(event){
  event.preventDefault();
  currentX = event.offsetX;
  currentY = event.offsetY;
  var x = Math.floor((currentX + 3) / 165);
  var y = Math.floor((currentY + 3) / 165);
  currentIndex = y * 6 + x;
}

canvas.oncontextmenu = function(event){
  event.preventDefault();
}


/**
 * @function masterLoop
 * Advances the game in sync with the refresh rate of the screen
 * @param {DOMHighResTimeStamp} timestamp the current time
 */
var masterLoop = function(timestamp) {
  game.loop(timestamp);
  window.requestAnimationFrame(masterLoop);
}
masterLoop(performance.now());


/**
 * @function update
 * Updates the game state, moving
 * game objects and handling interactions
 * between them.
 * @param {DOMHighResTimeStamp} elapsedTime indicates
 * the number of milliseconds passed since the last frame.
 */
function update(elapsedTime) {
  if(state == "waiting ..."){
    timer += elapsedTime;
    if(timer > 1300){
      if(card1.card == card2.card){
        correct.play();
      } else {
        wrong.play();
        card1.flip = false;
        card2.flip = false;
      }
      state = "waiting for click 1";
    }
  }
}

/**
  * @function render
  * Renders the current game state into a back buffer.
  * @param {DOMHighResTimeStamp} elapsedTime indicates
  * the number of milliseconds passed since the last frame.
  * @param {CanvasRenderingContext2D} ctx the context to render to
  */
function render(elapsedTime, ctx) {
  ctx.fillStyle = "#ff7777";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // TODO: Render the board
  for(var y = 0; y < 3; y++) {
    for(var x = 0; x < 6; x++) {
      var card = board[y * 6 + x];
      if(card.flip) {
        // render cute animal
        ctx.drawImage(image,
          // Source rect
          card.card % 3 * 212, Math.floor(card.card / 3) * 212, 212, 212,
          // Dest rect
          x * 165 + 3, y * 165 + 3, 160, 160
        );
      } else {
        // draw the back of the card (212x212px)
        ctx.fillStyle = "#3333ff";
        ctx.fillRect(x * 165 + 3, y * 165 + 3, 160, 160);
      }
    }
  }

  if(debug){
    var x = currentIndex % 6;
    var y = Math.floor(currentIndex / 6);
    ctx.strokeStyle = "#ff0000";
    ctx.beginPath();
    ctx.arc(currentX, currentY, 3, 0, 2*Math.PI);
    ctx.rect(x * 165 + 3, y * 165 + 3, 163, 163);
    ctx.stroke();
  }
}

},{"./game":2}],2:[function(require,module,exports){
"use strict";

/**
 * @module exports the Game class
 */
module.exports = exports = Game;

/**
 * @constructor Game
 * Creates a new game object
 * @param {canvasDOMElement} screen canvas object to draw into
 * @param {function} updateFunction function to update the game
 * @param {function} renderFunction function to render the game
 */
function Game(screen, updateFunction, renderFunction) {
  this.update = updateFunction;
  this.render = renderFunction;

  // Set up buffers
  this.frontBuffer = screen;
  this.frontCtx = screen.getContext('2d');
  this.backBuffer = document.createElement('canvas');
  this.backBuffer.width = screen.width;
  this.backBuffer.height = screen.height;
  this.backCtx = this.backBuffer.getContext('2d');

  // Start the game loop
  this.oldTime = performance.now();
  this.paused = false;
}

/**
 * @function pause
 * Pause or unpause the game
 * @param {bool} pause true to pause, false to start
 */
Game.prototype.pause = function(flag) {
  this.paused = (flag == true);
}

/**
 * @function loop
 * The main game loop.
 * @param{time} the current time as a DOMHighResTimeStamp
 */
Game.prototype.loop = function(newTime) {
  var game = this;
  var elapsedTime = newTime - this.oldTime;
  this.oldTime = newTime;

  if(!this.paused) this.update(elapsedTime);
  this.render(elapsedTime, this.frontCtx);

  // Flip the back buffer
  this.frontCtx.drawImage(this.backBuffer, 0, 0);
}

},{}]},{},[1]);
