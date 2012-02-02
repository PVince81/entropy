/**
 *  Entropy (CSS3 renderer)
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

ParticleView = function(container, model) {
    this.model = model;

    var el = document.createElement('span');
    el.className = "particle";
    el.style.position = "absolute";
    el.style.width = ( model.radius * 2 ) + "px";
    el.style.height = ( model.radius * 2 ) + "px";
    el.style["border-radius"] = model.radius;

    el.style.backgroundColor = model.currentColor.color;
    if (/Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent)){ 
        el.style.background = "-moz-radial-gradient(50% 50%, farthest-side, " + model.currentColor.color + ", #000)";
    }
    else {
        el.style.background = "-webkit-gradient(radial, 50% 50%, 0, 50% 50%, " + model.radius + ", from(" + model.currentColor.color + "), to(#000))";
//        el.style["-webkit-mask-image"] = "-webkit-gradient(radial, 50% 50%, 0, 50% 50%, " + model.radius + ", from(#FFF), to(rgba(0,0,0,0))";
    }

    el.draggable = false;
    this.el = el;
    container.appendChild(el);
    this.update();
}

ParticleView.prototype = {
    /**
     * Updates the view position based on the model
     */
    update: function() {
        var model = this.model;
        this.el.style.left = (model.x - model.radius) + "px";
        this.el.style.top = (model.y - model.radius) + "px";
    }
}

CSSView = function(container, model, config) {
    this.container = container;
    this.config = config;
    this.model = model;
    this.width = container.clientWidth;
    this.height = container.clientHeight;
    this.particleViews = [];

    this._initViews();
}

CSSView.prototype = {
    _initViews : function() {
        var particles = this.model.particles;
        var views = [];
        for ( var i = 0; i < particles.length; i++ ) {
            var particle = particles[i];
            var view = new ParticleView(this.container, particle);
            this.particleViews.push(view);
        }
    },

    render : function() {
        var views = this.particleViews;
        for ( var i = 0; i < views.length; i++ ) {
            var view = views[i];
            view.update(); 
        }
    }
}
