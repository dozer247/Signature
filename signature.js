'use strict';
window.requestAnimFrame = (function(){
        return  window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
        })();
var Paint = function(options) {
      var canvas = options.el;
      // Size the canvas

      var w = $(canvas).width(), h = $(canvas).height();
      canvas.width = w;
      canvas.height = h;
      // Set the default line style.
      var ctx = canvas.getContext("2d");
      // ctx.lineWidth = options.size || Math.ceil(Math.random() * 35);
      ctx.lineCap = options.lineCap || "round";

      this.positions = []
      this.keepDrawing = false;
      this.startX = w;
      this.startY= h;
      this.previousFrame = 0;
      this.x = 0;
      this.y =0;

      this.ctx = ctx;
      this.canvas = canvas;
      // All of the lines associated with a pointer.
      this.lines = {};
      // All of the pointers currently on the screen.
      this.pointers = {};
      this.boundingBox = {
                left: 0,
                top: 0,
                right: w,
                bottom: h
            };



       var el, doc = document.documentElement, x = -doc.offsetLeft, y = -doc.offsetTop;
       for (el = options.el; el.offsetParent && el.offsetParent != doc; el = el.offsetParent) {
               x += el.offsetLeft - el.scrollLeft;
               y += el.offsetTop - el.scrollTop;
       }
      this.offset = {x: x, y: y};
      this.initEvents();


      // Setup render loop.
      requestAnimFrame(this.renderLoop.bind(this));
    };
    Paint.prototype.initEvents = function() {
        var canvas = this.canvas;
        if (window.PointerEvent){
            canvas.addEventListener('pointerdown', this.onPointerDown.bind(this),false);
            canvas.addEventListener('pointermove', this.onPointerMove.bind(this),false);
            canvas.addEventListener('pointerup', this.onPointerUp.bind(this),false);
            canvas.addEventListener('pointercancel', this.onPointerUp.bind(this),false);
        }else {
            
                canvas.addEventListener('touchmove', this.onTouchMove.bind(this), false);
                canvas.addEventListener('touchend', this.onTouchEnd.bind(this), false);
                // This prevents the fake mouse event from being dispatched as well
                canvas.removeEventListener('mousedown', this.mouseDownEvent);
                canvas.addEventListener('touchstart', this.onTouchStart.bind(this), false);
            
                canvas.addEventListener('mousemove', this.onTouchMove.bind(this), false);
                canvas.addEventListener('mouseup', this.onTouchEnd.bind(this), false);
                canvas.addEventListener('mousedown', this.onTouchStart.bind(this), false);
            
        }
    };


    Paint.prototype.removeEvents = function() {
        var canvas = this.canvas;
        if (window.PointerEvent){
            canvas.removeEventListener('pointerdown', this.onPointerDown);
            canvas.removeEventListener('pointermove', this.onPointerMove);
            canvas.removeEventListener('pointerup', this.onPointerUp);
            canvas.removeEventListener('pointercancel', this.onPointerUp);
        }else {
            
                canvas.removeEventListener('touchmove', this.onTouchMove.bind(this), false);
                canvas.removeEventListener('touchend', this.onTouchEnd.bind(this), false);
                // This prevents the fake mouse event from being dispatched as well
                canvas.removeEventListener('mousedown', this.mouseDownEvent);
                canvas.removeEventListener('touchstart', this.onTouchStart.bind(this), false);
            
                canvas.removeEventListener('mousemove', this.onTouchMove.bind(this), false);
                canvas.removeEventListener('mouseup', this.onTouchEnd.bind(this), false);
                canvas.removeEventListener('mousedown', this.onTouchStart.bind(this), false);
            
        }
    };

    Paint.prototype.getImg= function(){
        var ctx = this.canvas.getContext('2d'),
        bb = this.boundingBox;
        return ctx.getImageData(bb.left - 5 , bb.top - 5,
                                bb.right - bb.left + 10,
                                bb.bottom - bb.top + 10);
    };
    Paint.prototype.onPointerDown = function(event) {
        console.log('onPointerDown', event.type);
        var width = event.pointerType === 'touch' ? (event.width || 10) : 4;
        this.pointers[event.pointerId] = new Pointer({x: event.clientX - this.offset.x, y: event.clientY - this.offset.y, width: width});
    };

    Paint.prototype.onPointerMove = function(event) {
        console.log('onPointerMove', event.type);
        var pointer = this.pointers[event.pointerId];
        // Check if there's a pointer that's down.
        if (pointer) {
            pointer.setTarget({x: event.clientX - this.offset.x, y: event.clientY -  this.offset.y});
            //console.log('pointers', pointer);
        }
    };

    Paint.prototype.onPointerUp = function(event) {
        console.log('onPointerUp', event.type);
      delete this.pointers[event.pointerId];
    };

     Paint.prototype.onTouchStart =function(event) {

        if (event.eventPhase == Event.AT_TARGET && (!event.targetTouches || event.targetTouches.length == 1)){
            console.log("touch start")
            var t = event.targetTouches ? event.targetTouches[0] : event;
            this.positions = []
            this.keepDrawing = true;
            this.previousFrame = 0;
            this.x = this.offset.x;
            this.y = this.offset.y; // XXX This caches it effectively, so scrolling while drawing doesn't work
            this.startX = t.clientX - this.x;
            this.startY = t.clientY - this.y;
            this.ctx.moveTo(t.clientX - this.x, t.clientY - this.y);
            //this.positions.push([t.clientX - this.x, t.clientY - this.y, t.force || t.webkitForce || 0.1]);
        }

    }
    Paint.prototype.onTouchMove =function(event) {

        if (event.eventPhase == Event.AT_TARGET && (!event.targetTouches || event.targetTouches.length == 1)) {
            console.log("touch move")
            event.preventDefault();
            var t = event.targetTouches ? event.targetTouches[0] : event;
            this.positions.push([t.clientX - this.x, t.clientY - this.y, t.force || t.webkitForce || 0.1]);
        }
    }
    Paint.prototype.onTouchEnd =function(event) {

        if (event.eventPhase == Event.AT_TARGET) {
            console.log("touch end")
            this.keepDrawing = false;
            this.positions = []
        }
    }
    Paint.prototype.clear = function() {
            
        this.ctx.beginPath();
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.boundingBox) delete this.boundingBox;
    },

    Paint.prototype.renderLoop = function(lastRender) {
        if (window.PointerEvent){
            if (!this.boundingBox && Object.keys(this.pointers).length > 0) {
                var key = Object.keys(this.pointers)[0];
                this.boundingBox = {
                    left:  this.pointers[key].x,
                    top: this.pointers[key].y,
                    right: this.pointers[key].x,
                    bottom: this.pointers[key].y
                };
            }

            var bb = this.boundingBox; // For perf, "just in case"

          // Go through all pointers, rendering the last segment.
            for (var pointerId in this.pointers) {
                var pointer = this.pointers[pointerId];
                if (pointer.isDelta()) {
                    //console.log('rendering', pointer.targetX);
                    var ctx = this.ctx;
                    //ctx.lineWidth = pointer.width;
                    ctx.strokeStyle = pointer.color;
                    ctx.beginPath();
                    ctx.moveTo(pointer.x, pointer.y);

                    ctx.lineTo(pointer.targetX, pointer.targetY);

                    if(typeof bb !=undefined){
                        bb.left = Math.min(bb.left, pointer.targetX);
                        bb.right = Math.max(bb.right, pointer.targetX);
                        bb.top = Math.min(bb.top, pointer.targetY);
                        bb.bottom = Math.max(bb.bottom, pointer.targetY);
                    }else{
                        bb.left = pointer.targetX;
                        bb.right = pointer.targetX;
                        bb.top = pointer.targetY;
                        bb.bottom =  pointer.targetY;
                    }


                  ctx.stroke();
                  ctx.closePath();

                  pointer.didReachTarget();
                }
            }
            requestAnimFrame(this.renderLoop.bind(this));
        }else{
            if (lastRender - this.previousFrame >= 40 && this.keepDrawing ==true) { // Don't try to draw too often
                console.log("render")
                var p = this.positions;
                this.positions = [];
                var i, l = p.length;
                if (!this.boundingBox && l > 0)
                    this.boundingBox = {
                        left: this.startX,
                        top: this.startY,
                        right: this.startX,
                        bottom: this.startY
                    };
                if (l > 0) {
                    var bb = this.boundingBox; // For perf, "just in case"

                    for(i = 0; i < l; i++) {
                        // Force isn't available (on Android)
                        // ctx.lineWidth = p[2] * 10;
                        this.ctx.lineTo(p[i][0], p[i][1]);
                        
                        bb.left = Math.min(bb.left, p[i][0]);
                        bb.right = Math.max(bb.right, p[i][0]);
                        bb.top = Math.min(bb.top, p[i][1]);
                        bb.bottom = Math.max(bb.bottom, p[i][1]);
                    }
                    this.ctx.stroke();
                    
                }
                this.previousFrame = lastRender;
            }
            requestAnimFrame(this.renderLoop.bind(this));
        }
        
        
    };

    function Pointer(options) {
      this.x = options.x;
      this.y = options.y;
      this.width = options.width;


      this.color = '#000F55'
    };


    Pointer.prototype.setTarget = function(options) {
        this.targetX = options.x;
        this.targetY = options.y;
    };

    Pointer.prototype.didReachTarget = function() {
        this.x = this.targetX;
        this.y = this.targetY;
    };

    Pointer.prototype.isDelta = function() {
        return this.targetX && this.targetY &&
            (this.x != this.targetX || this.y != this.targetY);
    }


    
    var signature = {
        getSignature: function(successCallback, errorCallback) {
           signature.getSignatureFallback.apply(signature, arguments);
           
        },
        getSignatureFallback: function(successCallback, errorCallback, title, webpage) {
            title = title || "Please sign below";
            var popup = document.createElement('div'),
            cleanUp = function() {
                okButton.removeEventListener('click', okFun);
                cancelButton.removeEventListener('click', cancelFun);

                this.paint.removeEvents()
               
                popup.remove();
            }.bind(this),
            okFun = function(ev) {
                var imgData = null;

                 //1Place mobile app: nav button labels on top of the signature pad, so we need to change 
                //the z-index=-1 to  hide nav labels when displaying the pad and roll back the change when the popup is closed
                var btnLabels = document.getElementsByClassName("ui-btn-text");
                console.log(btnLabels.length);
                for(var i=btnLabels.length-1; i>=0; i--){
                    btnLabels[i].style.zIndex = "1";
                }


                if (this.paint.boundingBox) {
                    
                    imgData = this.paint.getImg()
                }
                cleanUp();
                successCallback(imgData);
            }.bind(this), 
            cancelFun = function(ev) {

                //1Place mobile app: nav button labels on top of the signature pad, so we need to change 
                //the z-index=-1 to  hide nav labels when displaying the pad and roll back the change when the popup is closed
                var btnLabels = document.getElementsByClassName("ui-btn-text");
                for(var i=btnLabels.length-1; i>=0; i--){
                    btnLabels[i].style.zIndex = "1";
                }

                cleanUp();
                successCallback(null);
            },

            okButton, cancelButton, canvas;
            
            //determineOffset = this.determineOffset.bind(this);

            popup.id = 'signature-window';
            popup.style.position = 'fixed';
            popup.style.top = '0';
            popup.style.left = '0';
            popup.style.width = '100%';
            popup.style.height = '100%';
            popup.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            popup.style.zIndex = '1150';

             //1Place mobile app: use 100% width when displaying on smart phones
            var finalWidth;
            if ($(window).width()<450){
                finalWidth = '100%';
            }else{
                finalWidth = '50%';
            }

            // TODO: Translatable strings for OK/Cancel, make colors configurable. Inline styling is also ugly
            popup.innerHTML = '<div style="position: relative; margin: 2em auto; width: '+finalWidth+'; height: 10%; background-color: black;">'+
                '  <div style="color: white">'+
                '    <h3 style="margin: 0.1em 0;" id="title"></h3>'+
                '    <h3 style="margin: 0.1em 0; position: absolute; right: 0.5em; top: 0; cursor: pointer;" id="cancel">╳</span>'+
                '  </div>'+
                // TODO: Find out an elegant way to automatically determine the size of the webpage, and use the rest for signature.
                (webpage ? '<div style="height: 50%; min-height: 50%; width: 100%"><object>'+webpage+'</object></div>' : '')+
                '  <div style="position: relative"><canvas style="touch-action: none;width: 100%; min-height: '+(webpage?'50%':'100%')+'" id="signature-pad" touch-action="none"></canvas></div>'+
                '  <div><button style="width: 100%" id="ok">ok</button></div>'+
                '</div>';
            document.body.appendChild(popup);

            document.getElementById('title').appendChild(document.createTextNode(title));
            okButton = document.getElementById('ok');
            okButton.addEventListener('click', okFun);
            cancelButton = document.getElementById('cancel');
            cancelButton.addEventListener('click', cancelFun);

            this.paint  = new Paint({el: document.getElementById('signature-pad')});
 
            this.paint.clear();

            
        }
        
        
    };

   

    window.signature = signature;
