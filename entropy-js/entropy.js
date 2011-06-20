/**
 *  Entropy
 *
 *  By Vincent Petry - PVince81 at yahoo dot fr
 *
 *  ---------------------------------------------------------------------------
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.*
 */

Config = {
    //screenSize : [640, 480],
    screenSize : ["auto", "auto"],
    backgroundColor : "#000000",
    fps : 30,
    minRadius : 5,
    maxRadius : 15,
    gravity : [0.0, 0.3],
    gravityEnabled : true,
    weightEnabled : true,
//    ejection : 1.0,
    friction : 1.01,
    strengthCoef : 0.03,
    particleCount : 100,
    colorList : null
}

Color = function(r, g, b) {
    if ( arguments.length == 3 ) {
        this.setRgb(r, g, b);
    }
    else if ( arguments.length == 1 ) {
        var value = r;
        this.setRgb( parseInt( value.substr(1, 2), 16 ),
                    parseInt( value.substr(3, 2), 16 ),
                    parseInt( value.substr(5, 2), 16 ) );
    }
}

Color.prototype = {
    r : 0,
    g : 0,
    b : 0,
    color : "#FFFFFF",

    getColor : function() {
        return this.color;
    },

    setRgb : function(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.color = "rgb(" + r + "," + g + "," + b + ")";
    }
}

Particle = function(x, y, color, radius) {
    if ( !radius ) {
        radius = Config.minRadius
    }
    this.color = color;
    this.currentColor = color;
    this.originalColor = color;
//    this.colorChange = 0.0;
    this.x = x;
    this.y = y;
    this.vx = Math.floor(Math.random() * 2.0 - 1.0);
    this.vy = Math.floor(Math.random() * 2.0 - 1.0);
    this.radius = radius;
    this.weight = this.radius / 10.0;
}

View = function(canvas, model, config) {
    this.canvas = canvas;
    this.config = config;
    this.model = model;
    this.context = canvas.getContext("2d");
    this.width = canvas.width;
    this.height = canvas.height;
}

View.prototype = {
    FULL_ANGLE : Math.PI * 2, 

    render : function() {
        this.context.fillStyle = this.config.backgroundColor;
        this.context.fillRect(0, 0, this.width, this.height);
       
        var particles = this.model.particles; 
        for ( var i = 0; i < particles.length; i++ ) {
            var particle = particles[i];
            var color = particle.color.color;
            this.context.fillStyle = color;
            this.context.lineStyle = color; 
            this.context.beginPath();
            this.context.arc(particle.x, particle.y, particle.radius, 0, this.FULL_ANGLE, false);
            this.context.fill();

//            this.context.fillRect(particle.x - particle.radius, particle.y - particle.radius, particle.radius * 2, particle.radius * 2);
        }
    }
}

Model = function(config) {
    this.config = config;
    this.particles = []; 
    this.particleCount = config.particleCount;

    this.colors = null;
    if ( this.config.colorList ) {
        this.colors = [];
        for ( var i = 0; i < this.config.colorList.length; i++ ) {
            this.colors.push( new Color(this.config.colorList[i]) );
        } 
    }
}

Model.prototype = {

    colors : null,

    generateParticles : function() {
        while ( this.particles.length < this.particleCount ) {
            this.particles.push(this.generateParticle());
        }
    },

    generateParticle : function() {
        var min = 20;
        var max = 200;
        var color;
        if ( this.colors ) {
            var index = parseInt(Math.floor(Math.random() * this.colors.length));
            color = this.colors[index];
        }
        else {
            var r = parseInt(Math.floor(Math.random() * (max-min) + min));
            var g = parseInt(Math.floor(Math.random() * (max-min) + min));
            var b = parseInt(Math.floor(Math.random() * (max-min) + min));
            color = new Color(r, g, b);
        }

        var x = Math.floor(Math.random() * this.config.screenSize[0]);
        var y = Math.floor(Math.random() * this.config.screenSize[1]);
        var radius = Math.floor(Math.random() * (this.config.maxRadius - this.config.minRadius) + this.config.minRadius);
        return new Particle(x, y, color, radius);
    }
      
}

Controller = function(config, model) {
    this.config = config;
    this.model = model;
    this.effect = 0;
    this.target = null;
    this.width = config.screenSize[0];
    this.height = config.screenSize[1];
}

Controller.prototype = {
    /**
     * Update the model one step.
     */
    update : function() {
        var config = this.config;
        var particles = this.model.particles;
        for ( var i = 0; i < particles.length; i++ ) {
            var particle = particles[i];
            // if an effect must be applied
            if ( this.effect > 0 && this.target ) {
                var vecX = this.target[0] - particle.x;
                var vecY = this.target[1] - particle.y;
                // normalize the vector
                var length = Math.sqrt(vecX * vecX + vecY * vecY);
                vecX /= length;
                vecY /= length;
                var strength = length  * config.strengthCoef
                if ( strength > 1.0 ) {
                    strength = 1.0;
                }

//                particle.colorChange = strength;
                                
                if ( this.effect == 2 ) {
                    // circle force
                    particle.vx -= vecY * strength;
                    particle.vy += vecX * strength;
                }
                else {
                    // attraction or repulsion
                    if ( this.effect == 3 ) {
                        strength = -strength;
                    }

                    particle.vx += vecX * strength;
                    particle.vy += vecY * strength;
                }
            }

            if ( config.gravityEnabled ) {
                if ( config.weightEnabled ) {
                    particle.vx += config.gravity[0] * particle.weight;
                    particle.vy += config.gravity[1] * particle.weight;
                } 
                else {
                    particle.vx += config.gravity[0];
                    particle.vy += config.gravity[1];
                }
            }

            particle.vx /= config.friction;
            particle.vy /= config.friction;
            particle.x += particle.vx;
            particle.y += particle.vy;
           
            if ( particle.x + particle.radius >= this.width ) {
                particle.x = 2 * this.width - particle.x - 2 * particle.radius;
                //particle.vx = -particle.vx * config.ejection;
                particle.vx = -particle.vx;
            }
            else if ( particle.x - particle.radius < 0 ) {
                particle.x = -particle.x + 2 * particle.radius;
                //particle.vx = -particle.vx * config.ejection;
                particle.vx = -particle.vx;
            }

            if ( particle.y + particle.radius >= this.height ) {
                particle.y = 2 * this.height - particle.y - 2 * particle.radius;
                //particle.vy = -particle.vy * config.ejection;
                particle.vy = -particle.vy;
            }
            else if ( particle.y - particle.radius < 0 ) {
                particle.y = -particle.y + 2 * particle.radius;
                //particle.vy = -particle.vy * config.ejection;
                particle.vy = -particle.vy;
            }
        }
    }
}

GameEngine = function(canvas,config) {
    this.config = config;
    this.canvas = canvas;
    this.model = new Model(config);
    this.model.generateParticles();
    this.view = new View(canvas, this.model, config);
    this.controller = new Controller(Config, this.model);
    this.timer = null;
   

    this.canvasPos = this.canvas.cumulativeOffset();
    var self = this;
    this.canvas.observe("mousedown", this.mouseDown.bind(this), true);
    this.canvas.observe("mousemove", this.mouseMove.bind(this), true);
    this.canvas.observe("mouseup", this.mouseUp.bind(this), true);
    this.canvas.observe("mouseout", this.mouseUp.bind(this), true);
    this.canvas.observe("contextmenu", function(e) { if (!self.paused) e.stop();});
    window.addEventListener("MozOrientation", this.deviceOrientation.bind(this), true);
    window.addEventListener("deviceorientation", this.deviceOrientation.bind(this), true);
    //window.addEventListener("devicemotion", this.deviceOrientation.bind(this), true);

    $(document).observe("focus", function() { self.pause(false); } );
    $(document).observe("blur", function() { self.pause(true); } );
    $(document).observe("keyup", this.keyUp.bind(this), true);

    this.paused = false;
}

GameEngine.prototype = {

    PI180 : 180 / Math.PI, 

    start : function() {
        var self = this;

        this.paused = false;
        this.startTimer();
    },

    startTimer : function() {
        if ( this.timer ) {
            clearInterval( this.timer );
        }
        this.timer = setInterval( this.gameLoop.bind(this), 1000 / this.config.fps );
    },

    stopTimer : function() {
        if ( this.timer != null ) {
            clearInterval(this.timer);
            this.timer = null;
        }
    },

    gameLoop : function() {
        if ( !this.paused ) {
            this.controller.update();
            this.view.render();
        }
    },

    mouseUp : function(ev) {
        this.controller.target = null;
        this.controller.effect = 0;
    },

    mouseDown : function(ev) {
        this.controller.effect = 0;
        if ( ev.isLeftClick() ) {
            this.controller.effect = 1;
        }
        else if ( ev.isMiddleClick() ) {
            this.controller.effect = 2;
        }
        else if ( ev.isRightClick()) {
            this.controller.effect = 3;
        }

        var pos = [Event.pointerX(ev) - this.canvasPos[0], Event.pointerY(ev) - this.canvasPos[1]];
        this.controller.target = pos;
    },

    mouseMove : function(ev) {
        var pos = [Event.pointerX(ev) - this.canvasPos[0], Event.pointerY(ev) - this.canvasPos[1]];
        this.controller.target = pos;
    },

    deviceOrientation : function(ev) {
        /*
        if ( ev.rotationRate ) {
            ev.x = ev.rotationRate.gamma;
            ev.y = ev.rotationRate.beta;
        }
        */
    
        // chrome on desktop reports null, null
        if ( ev.gamma === null ) {
            return;
        }

        if (!ev.gamma && !ev.beta) {
            ev.gamma = ev.x * this.PI180;
            ev.beta = ev.y * this.PI180;
        }

        ev.gamma /= 100.0;
        ev.beta /= 100.0;
        this.config.gravity =  [ev.gamma, ev.beta];
        return false;
    },

    keyUp : function(ev) {
        // G key
        if ( ev.keyCode == 71 ) {
            this.config.gravityEnabled = !this.config.gravityEnabled;
        }
        else if ( ev.keyCode == 87 ) {
            this.config.weightEnabled = !this.config.weightEnabled;
        }
        else if ( ev.keyCode == 80 ) {
            this.pause();
        }
    },

    pause : function( value ) {
        var oldPause = this.paused;
        if ( arguments.length == 0 ) {
            this.paused = !this.paused;
        }
        else {
            this.paused = value;
        }
        if ( oldPause != this.paused ) {
            if ( this.paused ) {
                this.stopTimer();
            }
            else {
                this.startTimer();
            }
        }
    }

}

var gameEngine;

function getUrlParams() {
    var url = window.location.href;
    var queryStartIndex = url.indexOf("?");
    if ( queryStartIndex < 0 ) {
        return {};
    }

    var params = {};
    var queryString = url.substr(queryStartIndex + 1);
    var queryParts = queryString.split("&");
    for ( var i = 0; i < queryParts.length; i++ ) {
        var queryPair = queryParts[i].split("=");
        if ( queryPair.length > 1 ) {
            params[decodeURI(queryPair[0])] = decodeURI(queryPair[1]);
        }
        else {
            params[decodeURI(queryPair[0])] = null;
        }
    }
    return params;
}

function init(canvas) {
    var config = Config;

    var params = getUrlParams();
    if ( params["width"] ) config.screenSize[0] = parseInt(params["width"]);
    if ( params["height"] ) config.screenSize[1] = parseInt(params["height"]);
    if ( params["fps"] ) config.fps = parseInt(params["fps"]);
    if ( params["particles"] ) config.particleCount = parseInt(params["particles"]);
    if ( params["gravity"] ) config.gravityEnabled = params["gravity"].toLowerCase() == "true"

    var clientWidth;
    var clientHeight;    

    if (typeof window.innerWidth != 'undefined') {
      clientWidth = window.innerWidth;
      clientHeight = window.innerHeight;
    }
    else {
        clientWidth = document.compatMode=='CSS1Compat' &&
            !window.opera?document.documentElement.clientWidth:
            document.body.clientWidth;

        clientHeight = document.compatMode=='CSS1Compat' &&
            !window.opera?document.documentElement.clientHeight:
            document.body.clientHeight;
    }

    actualWidth = config.screenSize[0]; 
    actualHeight = config.screenSize[1]; 

    if ( isNaN(actualWidth) ) {
        actualWidth = clientWidth;
    }
    if ( isNaN(actualHeight) ) {
        actualHeight = clientHeight;
    }


    if ( clientWidth < actualWidth ) {
        actualWidth = clientWidth;
    }
    if ( clientHeight < actualHeight ) {
        actualHeight = clientHeight;
    }

    canvas.width = actualWidth;
    canvas.height = actualHeight;
    config.screenSize = [canvas.width, canvas.height]
    gameEngine = new GameEngine(canvas, config);
    gameEngine.start();
}
