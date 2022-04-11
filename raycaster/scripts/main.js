
var CIRCLE = Math.PI * 2;
var MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)

require.config({
    waitSeconds : 2,
    //deps: ['./lib/text', './scripts/json'],
    paths : {
        text : './lib/text', //text is required
        json : './scripts/json' //alias to plugin
    }
});

function Controls() {
    this.codes = {
        37: 'left',
        39: 'right',
        38: 'forward',
        40: 'backward',
        65: 'left', // a
		68: 'right', // d
		87: 'forward', //w 
		83: 'backward', // s
        32: 'fire' };
    this.states = { 'left': false, 'right': false, 'forward': false, 'backward': false, 'fire': false };
    this.timerMovement = 0;
    this.timerMax = 10;
    this.mousePos = { x: 0, y: 0 };
    document.addEventListener('keydown', this.onKey.bind(this, true), false);
    document.addEventListener('keyup', this.onKey.bind(this, false), false);
    document.addEventListener('touchstart', this.onTouch.bind(this), false);
    document.addEventListener('touchmove', this.onTouch.bind(this), false);
    document.addEventListener('touchend', this.onTouchEnd.bind(this), false);
    document.addEventListener('mousemove', this.handleMouseMove.bind(this), false);
    document.addEventListener('mousedown', this.handleMouseDown.bind(this), false);
    document.addEventListener('mouseup', this.onTouchEnd.bind(this), false);
}

Controls.prototype.onTouch = function (event) {
    var t = event.touches[0];
    var pos = this.calcPointerPositions(event)
    this.onTouchEnd(event);
    if (pos.y < camera.height * 0.7) this.onKey(true, { keyCode: 38 });
    else if (pos.x < camera.width * 0.3) this.onKey(true, { keyCode: 37 });
    else if (pos.x > camera.width * 1.7) this.onKey(true, { keyCode: 39 });
    else if (pos.y > camera.height * 1.3) this.onKey(true, { keyCode: 40 });
};

Controls.prototype.onTouchEnd = function (e) {
    this.states = { 'left': false, 'right': false, 'forward': false, 'backward': false };
    e.preventDefault();
    e.stopPropagation();
};

Controls.prototype.handleMouseDown = function (event) {
    var pos = this.calcPointerPositions(event)
    this.onTouchEnd(event);
    console.log(pos.x);
    console.log(camera.width)
    if (pos.y < camera.height * 0.7) this.onKey(true, { keyCode: 38 });
    else if (pos.x < camera.width * 0.3) this.onKey(true, { keyCode: 37 });
    else if (pos.x > camera.width * 1.7) this.onKey(true, { keyCode: 39 });
    else if (pos.y > camera.height * 1.3) this.onKey(true, { keyCode: 40 });
};

Controls.prototype.onKey = function (val, e) {
    var state = this.codes[e.keyCode];
    if (typeof state === 'undefined') return;
    if (this.states[state] == val) {
        //          this.timerMovement += 1;
        //          if (this.timerMovement > this.timerMax) this.timerMovement = 0;
    } else this.timerMovement = 0;
    this.states[state] = val;
    e.preventDefault && e.preventDefault();
    e.stopPropagation && e.stopPropagation();
};

function Bitmap(src, width, height) {
    this.image = new Image();
    this.image.src = src;
    this.width = width;
    this.height = height;
}

function Player(x, y, direction) {
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.weapon = new Bitmap('assets/knife_hand.png', 319, 320);
    //this.weapon = new Bitmap('assets/fish.gif', 32, 32);
    this.paces = 0;
    this.directionFlashlight = 0.0;
}

Player.prototype.rotate = function (angle) {
    this.direction = (this.direction + angle + CIRCLE) % (CIRCLE);
};

Player.prototype.setRotateFlashLight = function (angle) {
    this.directionFlashlight = angle;
};

Player.prototype.walk = function (distance, map) {
    var dx = Math.cos(this.direction) * distance;
    var dy = Math.sin(this.direction) * distance;
    if (map.get(this.x + dx, this.y) == undefined) this.x += dx;
    if (map.get(this.x, this.y + dy) == undefined) this.y += dy;
    this.paces += distance;
};

Player.prototype.update = function (states, map, seconds) {
    if (controls.timerMovement != 0) {
        controls.timerMovement += 1;
        if (controls.timerMovement > controls.timerMax) controls.timerMovement = 0;
        return
    }
    controls.timerMovement += 1;
    /*if (states.left) this.rotate(-Math.PI * seconds);
    if (states.right) this.rotate(Math.PI * seconds);
    if (states.forward) this.walk(3 * seconds, map);
    if (states.backward) this.walk(-3 * seconds, map);*/
    if (states.left) this.rotate(-Math.PI / 2);
    if (states.right) this.rotate(Math.PI / 2);
    if (states.forward) this.walk(1, map);
    if (states.backward) this.walk(-1, map);
    if (states.fire) camera.flashlight = !camera.flashlight;
};

function Map(size) {
    this.size = size;
    this.wallGrid = Array(size*size);
    //this.skybox = new Bitmap('assets/deathvalley_panorama.jpg', 2000, 750);
    this.skybox = new Bitmap('assets/underwater-back.png', 768, 384);
    //this.wallTexture = new Bitmap('assets/wall_texture.jpg', 1024, 1024);
    this.wallTexture = new Bitmap('assets/walls.png', 64, 64);
    this.light = 0;
    this.myLightPos = { x: 10, y: 10 };
    this.myLightStrength = 20;
}

Map.prototype.clear = function (size) {
    this.wallGrid = Array(size*size);
};

Map.prototype.get = function (x, y) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || x > this.size - 1 || y < 0 || y > this.size - 1) return undefined;
    return this.wallGrid[y * this.size + x];
};

Map.prototype.randomize = function () {
    for (var i = 0; i < this.size * this.size; i++) {
        this.wallGrid[i] = Math.random() < 0.3 ? 1 : 0;
    }
};

Map.prototype.fromLdtkJson = function (json, level, layer) {
    var layer = json.levels[level].layerInstances[layer];
    for (var i = 0; i < layer.gridTiles.length; i++) {
        var tile = layer.gridTiles[i];
        var pos =   tile.px[0]/layer.__gridSize +
                    tile.px[1]/layer.__gridSize * layer.__cWid;
        tile.height = Math.random()*2+1
        this.wallGrid[pos] = tile;
    }
};

Map.prototype.cast = function (point, angle, range) {
    var self = this;
    var sin = Math.sin(angle);
    var cos = Math.cos(angle);
    var noWall = { length2: Infinity };
    var tile = {height : 0};

    return ray({ x: point.x, y: point.y, tile: tile, distance: 0 });

    function ray(origin) {
        var stepX = step(sin, cos, origin.x, origin.y);
        var stepY = step(cos, sin, origin.y, origin.x, true);
        var nextStep = stepX.length2 < stepY.length2
            ? inspect(stepX, 1, 0, origin.distance, stepX.y)
            : inspect(stepY, 0, 1, origin.distance, stepY.x);

        if (nextStep.distance > range) return [origin];
        return [origin].concat(ray(nextStep));
    }

    function step(rise, run, x, y, inverted) {
        if (run === 0) return noWall;
        var dx = run > 0 ? Math.floor(x + 1) - x : Math.ceil(x - 1) - x;
        var dy = dx * (rise / run);
        return {
            x: inverted ? y + dy : x + dx,
            y: inverted ? x + dx : y + dy,
            length2: dx * dx + dy * dy
        };
    }

    function inspect(step, shiftX, shiftY, distance, offset) {
        var dx = cos < 0 ? shiftX : 0;
        var dy = sin < 0 ? shiftY : 0;
        step.tile = self.get(step.x - dx, step.y - dy) || 0;
        step.distance = distance + Math.sqrt(step.length2);
        if (shiftX) step.shading = cos < 0 ? 2 : 0;
        else step.shading = sin < 0 ? 2 : 1;
        step.offset = offset - Math.floor(offset);
        return step;
    }
};

Map.prototype.update = function (seconds) {
    if (this.light > 0) this.light = Math.max(this.light - 10 * seconds, 0);
    else if (Math.random() * 5 < seconds) this.light = 2;
};

function Camera(canvas, resolution, focalLength) {
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width = window.innerWidth * 0.5;
    this.height = canvas.height = window.innerHeight * 0.5;
    this.resolution = resolution;
    this.spacing = this.width / resolution;
    this.focalLength = focalLength || 0.7;
    this.range = MOBILE ? 8 : 14;
    this.lightRange = 5;
    this.flashlight = false;
    this.scale = (this.width + this.height) / 1200;
}

Camera.prototype.render = function (player, map) {
    var newPlayer = Object.create(player) //shallow copy object player
    newPlayer.walk(-0.5, map); // to see the corridors at sides and the floor under
    var plusRotate = -(this.width - controls.mousePos.x) / this.width / 2;
    newPlayer.rotate(plusRotate);
    player.setRotateFlashLight(plusRotate);
    this.drawSky(newPlayer.direction, map.skybox, map.light);
    this.drawColumns(newPlayer, map);
    this.drawWeapon(newPlayer, -plusRotate);
    this.drawMiniMap(map, player);
};

Camera.prototype.drawSky = function (direction, sky, ambient) {
    var width = sky.width * (this.height / sky.height) * 2;
    var left = (direction / CIRCLE) * -width;

    this.ctx.save();
    this.ctx.drawImage(sky.image, left, 0, width, this.height);
    if (left < width - this.width) {
        this.ctx.drawImage(sky.image, left + width, 0, width, this.height);
    }
    if (ambient > 0) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.globalAlpha = ambient * 0.1;
        this.ctx.fillRect(0, this.height * 0.5, this.width, this.height * 0.5);
    }
    this.ctx.restore();
};

Camera.prototype.drawColumns = function (player, map) {
    this.ctx.save();
    for (var column = 0; column < this.resolution; column++) {
        var x = column / this.resolution - 0.5;
        var angle = Math.atan2(x, this.focalLength);
        var ray = map.cast(player, player.direction + angle, this.range);
        this.drawColumn(column, ray, angle, map);
    }
    this.ctx.restore();
};

Camera.prototype.drawWeapon = function (player, rotate) {
    var bobX = Math.cos(player.paces * 2) * this.scale * 6;
    var bobY = Math.sin(player.paces * 4) * this.scale * 6;
    var left = this.width * 0.66 + bobX + Math.sin(rotate)*this.width/2;
    var top = this.height * 0.6 + bobY;
    this.ctx.drawImage(player.weapon.image, left, top, player.weapon.width * this.scale, player.weapon.height * this.scale);
};

Camera.prototype.drawColumn = function (column, ray, angle, map) {
    var ctx = this.ctx;
    var texture = map.wallTexture;
    var left = Math.floor(column * this.spacing);
    var width = Math.ceil(this.spacing);
    var hit = -1;

    while (++hit < ray.length && ray[hit].height <= 0);

    for (var s = ray.length - 1; s >= 0; s--) {
        var step = ray[s];
        var tile = step.tile
        //if (s === hit) {
        if (tile.height > 0) {
            var textureX = Math.floor(texture.width * step.offset);
            var wall = this.project(tile.height, angle, step.distance);
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
            ctx.drawImage(texture.image, textureX + tile.src[0], tile.src[1], 1, texture.height, left, wall.top, width, wall.height);
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = '#000000';
            ctx.globalAlpha = Math.max(this.calcLightShading(step, map), 0);
            if (this.flashlight) ctx.globalAlpha = Math.min(ctx.globalAlpha, this.calcLightFlashlight(step, column, 150))
            ctx.fillRect(left, wall.top, width, wall.height);
        }

        //this.drawRainDrops(left, angle, step, s);
        //this.drawBubbles(left, angle, step, s);
    }
};

Camera.prototype.drawRainDrops = function (left, angle, step, s) {
    var rainDrops = Math.pow(Math.random(), 3) * s;
    var rain = (rainDrops > 0) && this.project(0.1, angle, step.distance);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.globalAlpha = 0.15;
    while (--rainDrops > 0) this.ctx.fillRect(left, Math.random() * rain.top, 1, rain.height);
}

Camera.prototype.drawBubbles = function (left, angle, step, s) {
    var rainDrops = Math.pow(Math.random(), 100) * s;
    var rain = (rainDrops > 0) && this.project(0.1, angle, step.distance);
    this.ctx.lineWidth = 1
    this.ctx.globalAlpha = 0.15;
    while (--rainDrops > 0) {
        this.ctx.beginPath()
        this.ctx.arc(left - rain.height, Math.random() * rain.top, rain.height, 0, Math.PI * 2, false);
        this.ctx.stroke();
    }
}

// This is the original shading from the player -> far => darker
Camera.prototype.calcLightShading = function (step, map) {
    return (step.distance + step.shading) / this.lightRange - map.light
}

Camera.prototype.calcLightFlashlight = function (step, column, wide) {
    return smoothstep(0.0, 1.0, Math.abs(this.resolution / 2 - column + player.directionFlashlight * this.resolution) / wide + step.distance / this.lightRange / 3)
}

Camera.prototype.project = function (height, angle, distance) {
    var z = distance * Math.cos(angle);
    var wallHeight = this.height * height / z;
    var bottom = this.height / 2 * (1 + 1 / z);
    return {
        top: bottom - wallHeight,
        height: wallHeight
    };
};

Camera.prototype.drawMiniMap = function(map, player) {

	var ctx = this.ctx,
		mapWidth = this.width * .25,
		mapHeight = mapWidth,
		x = this.width - mapWidth - 20,
		y = 20,
		blockWidth = mapWidth / map.size,
		blockHeight = mapHeight / map.size,
		playerX = player.x / map.size * mapWidth, // coords on map
		playerY = player.y / map.size * mapWidth,
		origFillStyle = ctx.fillStyle,
		wallIndex,
		triangleX = x + playerX,
		triangleY = y + playerY;

	ctx.save();

	ctx.globalAlpha = .3;
	ctx.fillRect(x, y, mapWidth, mapHeight);
	ctx.globalAlpha = .4;

	ctx.fillStyle = '#ffffff';

	for (var row = 0; row < map.size; row++) {
		for (var col = 0; col < map.size; col++) {

			wallIndex = row * map.size + col;

			if (map.wallGrid[wallIndex]) {
				ctx.fillRect(x + (blockWidth * col), y + (blockHeight * row), blockWidth, blockHeight);
			}

		}
	}

	ctx.save();
/*
	for (var i = 0; i < map.objects.length; i++){
		if(map.objects[i]){
				ctx.fillStyle = map.objects[i].color || 'blue';
				ctx.globalAlpha = .8;
				ctx.fillRect(x + (blockWidth * map.objects[i].x) + blockWidth * .25, y + (blockHeight * map.objects[i].y) + blockWidth * .25, blockWidth * .5, blockHeight * .5);
		}
	}
*/	
	ctx.restore();
 

	//player triangle
	ctx.globalAlpha = 1;
	ctx.fillStyle = '#FF0000';
	ctx.moveTo(triangleX,triangleY);
	ctx.translate(triangleX,triangleY);
	
	ctx.rotate(player.direction - Math.PI * .5);
	ctx.beginPath();
	ctx.lineTo(-2, -3); // bottom left of triangle
	ctx.lineTo(0, 2); // tip of triangle
	ctx.lineTo(2,-3); // bottom right of triangle
	ctx.fill();


	ctx.restore();

};

function GameLoop() {
    this.frame = this.frame.bind(this);
    this.lastTime = 0;
    this.callback = function () { };
}

GameLoop.prototype.start = function (callback) {
    this.callback = callback;
    requestAnimationFrame(this.frame);
};

GameLoop.prototype.frame = function (time) {
    var seconds = (time - this.lastTime) / 1000;
    this.lastTime = time;
    if (seconds < 0.2) this.callback(seconds);
    requestAnimationFrame(this.frame);
};

Controls.prototype.handleMouseMove = function (event) {
    this.mousePos = this.calcPointerPositions(event)
}

Controls.prototype.calcPointerPositions = function (event) {
    var eventDoc, doc, body;

    event = event || window.event; // IE-ism
    //var rect = display.getBoundingClientRect();

    // If pageX/Y aren't available and clientX/Y are,
    // calculate pageX/Y - logic taken from jQuery.
    // (This is to support old IE)
    if (event.pageX == null && event.clientX != null) {
        eventDoc = (event.target && event.target.ownerDocument) || document;
        doc = eventDoc.documentElement;
        body = eventDoc.body;

        event.pageX = event.clientX +
            (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
            (doc && doc.clientLeft || body && body.clientLeft || 0);
        event.pageY = event.clientY +
            (doc && doc.scrollTop || body && body.scrollTop || 0) -
            (doc && doc.clientTop || body && body.clientTop || 0);
    }

    var rect = display.getBoundingClientRect();
    return {
        x: event.pageX - rect.left,
        y: event.pageY - rect.top
    }
}

var display = document.getElementById('display');
var player = new Player(8.5, 1.5, Math.PI/2);
var map;
var controls = new Controls();
var camera = new Camera(display, MOBILE ? 160 : 320);
loop = new GameLoop();

//require(["json", "text"]);
const MapJson = require(["json!assets/underwater_map.ldtk!bust"], function(json) {
        console.log(json);

        map = new Map(16);
        map.fromLdtkJson(json, 0, 0);
        loop.start(function frame(seconds) {
            map.update(seconds);
            player.update(controls.states, map, seconds);
            camera.render(player, map);
        });
    });




function smoothstep(min, max, value) {
    var x = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return x * x * (3 - 2 * x);
};