/**
 *  Entropy (Web GL renderer)
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

GLView = function(canvas, model, config) {
    this.canvas = canvas;
    this.config = config;
    this.model = model;
    this.width = canvas.width;
    this.height = canvas.height;

    this._mvMatrix = mat4.create();
    this._pMatrix = mat4.create();
    mat4.identity(this._pMatrix);
    mat4.identity(this._mvMatrix);

    var gl = null;
    try {
        gl = this.canvas.getContext("webgl");
        if ( gl == null ) {
            gl = this.canvas.getContext("experimental-webgl");
            if ( gl == null ) {
                alert("WebGL not supported !");
                return;
            }
        }

        // test for older versions
        try { 
            var test = new Float32Array([]);
        }
        catch (e) {
            Float32Array = WebGLFloatArray;
        }
        
        this.context = gl;
        gl.viewportWidth = this.canvas.width;
        gl.viewportHeight = this.canvas.height;
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
//        mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, this._pMatrix);
        mat4.ortho(0, gl.viewportWidth, gl.viewportHeight, 0, 0, 1, this._pMatrix);
        var clearColor = new Color(config.backgroundColor);
        gl.clearColor(clearColor.r, clearColor.g, clearColor.b, 1.0);
    } catch (e) {
        alert(e);
    }
    
    if (!gl) {
        alert("Could not initialise WebGL!");
        return;
    }

    this._initShaders();
    this._initBuffers();
    this._initColors();
}

GLView.prototype = {
    FULL_ANGLE : Math.PI * 2,

    _shaderProgram : null,

    _mvMatrix : null,
    _pMatrix : null,
    _texCoords : null,

    _blockVertexBuf : null,

    _initColors : function() {
        var gl = this.context;
        var particles = this.model.particles;
        for ( var i = 0; i < particles.length; i++ ) {
            var particle = particles[i];
            particle.color.glColor = [particle.color.r / 255.0, particle.color.g / 255.0, particle.color.b / 255.0, 1.0];
        }
    },

    render : function() {
        var gl = this.context;
        gl.clear(gl.COLOR_BUFFER_BIT);

        mat4.identity(this._mvMatrix);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._blockVertexBuf);
        gl.vertexAttribPointer(
            this._shaderProgram.vertexPositionAttribute,
            this._blockVertexBuf.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoords);
        gl.vertexAttribPointer(
            this._shaderProgram.aTextureCoord,
            this.texCoords.itemSize, gl.FLOAT, false, 0, 0);

        var particles = this.model.particles;
        for ( var i = 0; i < particles.length; i++ ) {
            var particle = particles[i];
            mat4.identity(this._mvMatrix);
            mat4.translate(this._mvMatrix, [particle.x - particle.radius, particle.y - particle.radius, 0.0]);
            var d = particle.radius * 2.0;
            mat4.scale(this._mvMatrix,[d,d,0.0]);
            
            gl.uniform4fv(this._shaderProgram.aColor, particle.color.glColor);
            this._setMatrixUniforms();
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, this._blockVertexBuf.numItems);
        }
    },

    _setMatrixUniforms : function() {
        this.context.uniformMatrix4fv(this._shaderProgram.pMatrixUniform, false, this._pMatrix);
        this.context.uniformMatrix4fv(this._shaderProgram.mvMatrixUniform, false, this._mvMatrix);
    },

    _initBuffers : function() {
        var gl = this.context;
        this._blockVertexBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._blockVertexBuf);
        vertices = [
          // Single face
          0.0, 0.0, 0.0,
          1.0, 0.0, 0.0,
          0.0, 1.0, 0.0,
          1.0, 1.0, 0.0
        ];
       
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        this._blockVertexBuf.itemSize = 3;
        this._blockVertexBuf.numItems = vertices.length / 3;

        this.texCoords = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoords);
        var texCoords = [
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,
            1.0, 1.0
        ];

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords),
                gl.STATIC_DRAW); 
        this.texCoords.itemSize = 2;
        this.texCoords.numItems = texCoords.length;
    },

    _getShader : function(gl, id) {
        var shaderScript = document.getElementById(id);
        if (!shaderScript) {
            return null;
        }

        var str = "";
        var k = shaderScript.firstChild;
        while (k) {
            if (k.nodeType == 3) {
                str += k.textContent;
            }
            k = k.nextSibling;
        }

        var shader;
        if (shaderScript.type == "x-shader/x-fragment") {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        } else if (shaderScript.type == "x-shader/x-vertex") {
            shader = gl.createShader(gl.VERTEX_SHADER);
        } else {
            return null;
        }

        gl.shaderSource(shader, str);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    },

    _initShaders : function() {
        var gl = this.context;

        var fragmentShader = this._getShader(gl, "shader-fs");
        var vertexShader = this._getShader(gl, "shader-vs");

        this._shaderProgram = gl.createProgram();
        gl.attachShader(this._shaderProgram, vertexShader);
        gl.attachShader(this._shaderProgram, fragmentShader);
        gl.linkProgram(this._shaderProgram);

        if (!gl.getProgramParameter(this._shaderProgram, gl.LINK_STATUS)) {
            alert("Could not initialise shaders");
        }

        gl.useProgram(this._shaderProgram);

        this._shaderProgram.vertexPositionAttribute = gl.getAttribLocation(this._shaderProgram, "aVertexPosition");
        gl.enableVertexAttribArray(this._shaderProgram.vertexPositionAttribute);

        this._shaderProgram.pMatrixUniform = gl.getUniformLocation(this._shaderProgram, "uPMatrix");
        this._shaderProgram.mvMatrixUniform = gl.getUniformLocation(this._shaderProgram, "uMVMatrix");
        this._shaderProgram.aColor = gl.getUniformLocation(this._shaderProgram, "aColor");

        this._shaderProgram.aTextureCoord = gl.getAttribLocation(this._shaderProgram, "aTextureCoord");
        gl.enableVertexAttribArray(this._shaderProgram.aTextureCoord);
    }
}
