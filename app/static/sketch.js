function saveImage() {
    var canvas = document.getElementById("simple_sketch");
    //window.open(canvas.toDataURL("png"));
    var ctx=canvas.getContext("2d");
    ctx.globalCompositeOperation="destination-over";
    ctx.fillStyle="#FFFFFF";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    dataURL = canvas.toDataURL("image/png");
    $.ajax({
        type: "POST",
        url: "/save",
        data: {
            imgBase64: dataURL,
            json_string: JSON.stringify(all_lines)
        }
    }).done(function(o) {
        console.log('saved');
        // If you want the file to be visible in the browser
        // - please modify the callback in javascript. All you
        // need is to return the url to the file, you just saved
        // and than put the image in your browser.
    });
    window.open(dataURL);
}

document.getElementById('saveButton').addEventListener('click', saveImage, false);
var triangle_start_x;
var triangle_start_y;
var triangle_end_x;
var triangle_end_y;
var should_draw_triangle = false;
var _sketch;
var all_lines = [];

var __slice = Array.prototype.slice;
(function($) {
  var Sketch;
  $.fn.sketch = function() {
    var args, key, sketch;
    key = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    if (this.length > 1) {
      $.error('Sketch.js can only be called on one element at a time.');
    }
    sketch = this.data('sketch');
    if (typeof key === 'string' && sketch) {
      if (sketch[key]) {
        if (typeof sketch[key] === 'function') {
          return sketch[key].apply(sketch, args);
        } else if (args.length === 0) {
          return sketch[key];
        } else if (args.length === 1) {
          return sketch[key] = args[0];
        }
      } else {
        return $.error('Sketch.js did not recognize the given command.');
      }
    } else if (sketch) {
      return sketch;
    } else {
      this.data('sketch', new Sketch(this.get(0), key));
      return this;
    }
  };

  Sketch = (function() {
    function Sketch(el, opts) {
      this.el = el;
      this.canvas = $(el);
      this.context = el.getContext('2d');
      this.options = $.extend({
        toolLinks: true,
        defaultTool: 'marker',
        defaultColor: '#000000',
        defaultSize: 5
      }, opts);
      this.painting = false;
      this.color = this.options.defaultColor;
      this.size = this.options.defaultSize;
      this.tool = this.options.defaultTool;
      this.actions = [];
      this.action = [];
      this.triangles = [];
      this.canvas.bind('click mousedown mouseup mousemove mouseleave mouseout touchstart touchmove touchend touchcancel', this.onEvent);
      if (this.options.toolLinks) {
        $('body').delegate("a[href=\"#" + (this.canvas.attr('id')) + "\"]", 'click', function(e) {
          var $canvas, $this, key, sketch, _i, _len, _ref;
          $this = $(this);
          $canvas = $($this.attr('href'));
          sketch = $canvas.data('sketch');
          _ref = ['color', 'size', 'tool'];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            key = _ref[_i];
            if ($this.attr("data-" + key)) {
              sketch.set(key, $(this).attr("data-" + key));
            }
          }
          if ($(this).attr('data-download')) {
            sketch.download($(this).attr('data-download'));
          }
          return false;
        });
      }
    }
    Sketch.prototype.download = function(format) {
      var mime;
      format || (format = "png");
      if (format === "jpg") {
        format = "jpeg";
      }
      mime = "image/" + format;
      return window.open(this.el.toDataURL(mime));
    };
    Sketch.prototype.set = function(key, value) {
      this[key] = value;
      return this.canvas.trigger("sketch.change" + key, value);
    };
    Sketch.prototype.startPainting = function() {
      this.painting = true;
      return this.action = {
        tool: this.tool,
        color: this.color,
        size: parseFloat(this.size),
        events: []
      };
    };
    Sketch.prototype.stopPainting = function() {
      if (this.action) {
        this.actions.push(this.action);
      }
      this.painting = false;
      this.action = null;
      var n;
      all_lines = []
      for (var i = 0; i < this.actions.length; i++) {
        x1 = this.actions[i].events[0].x;
        y1 = this.actions[i].events[0].y;
        n = this.actions[i].events.length;
        x2 = this.actions[i].events[n - 1].x;
        y2 = this.actions[i].events[n - 1].y;
        all_lines.push([[x1, y1], [x2, y2]]);
      }
      return this.redraw();
    };
    Sketch.prototype.onEvent = function(e) {
      if (e.originalEvent && e.originalEvent.targetTouches) {
        e.pageX = e.originalEvent.targetTouches[0].pageX;
        e.pageY = e.originalEvent.targetTouches[0].pageY;
      }
      $.sketch.tools[$(this).data('sketch').tool].onEvent.call($(this).data('sketch'), e);
      e.preventDefault();
      return false;
    };
    Sketch.prototype.redraw = function() {
      var sketch;
      this.el.width = this.canvas.width();
      this.context = this.el.getContext('2d');
      sketch = this;
      $.each(this.actions, function() {
        if (this.tool) {
          return $.sketch.tools[this.tool].draw.call(sketch, this);
        }
      });
      if (this.painting && this.action) {
        return $.sketch.tools[this.action.tool].draw.call(sketch, this.action);
      }
    };
    return Sketch;
  })();
  $.sketch = {
    tools: {}
  };
  $.sketch.tools.marker = {
    onEvent: function(e) {
      switch (e.type) {
        case 'mousedown':
        case 'touchstart':
            triangle_start_x = e.pageX - this.canvas.offset().left;
            triangle_start_y = e.pageY - this.canvas.offset().top;
            this.startPainting();
            break;
        case 'mouseup':
        case 'mouseout':
        case 'mouseleave':
        case 'touchend':
        case 'touchcancel':
            triangle_end_x = e.pageX - this.canvas.offset().left;
            triangle_end_y = e.pageY - this.canvas.offset().top;
            should_draw_triangle = this.painting;
            this.stopPainting();
            should_draw_triangle = false;
      }
      if (this.painting) {
        this.action.events.push({
          x: e.pageX - this.canvas.offset().left,
          y: e.pageY - this.canvas.offset().top,
          event: e.type
        });
        return this.redraw();
      }
    },
    draw: function(action) {
      var event, previous, _i, _len, _ref;
      this.context.lineWidth = action.size;
      this.context.lineJoin = "round";
      this.context.lineCap = "round";
      this.context.beginPath();
      this.context.moveTo(action.events[0].x, action.events[0].y);

      _ref = action.events;
      _len = _ref.length;
      event = _ref[_len - 1];
      this.context.lineTo(event.x, event.y);
      previous = event;

      this.context.closePath();

      this.context.stroke();

      for (_i = 0, _len = this.triangles.length; _i < _len; _i++) {
        triangle = this.triangles[_i];

        this.context.beginPath();
        this.context.moveTo(triangle.p1x, triangle.p1y);

        this.context.moveTo(triangle.p2x, triangle.p2y);
        this.context.lineTo(triangle.l1x, triangle.l1y);

        this.context.moveTo(triangle.p3x, triangle.p3y);
        this.context.lineTo(triangle.l2x, triangle.l2y);

        this.context.lineTo(triangle.l3x, triangle.l3y);

        this.context.closePath();
        this.context.fill();
        this.context.stroke();

        previous = event;
      }

      if (should_draw_triangle) {
          this.context.beginPath();
          this.context.moveTo(triangle_start_x, triangle_start_y);

          var vecX = triangle_end_x - triangle_start_x;
          var vecY = triangle_end_y - triangle_start_y;

          if (vecY === 0) {
              vecY = 5;
          }

          var perpVecX = 1;
          var perpVecY = - (vecX / vecY);

          console.log(perpVecY);
            var perpVecLen = Math.sqrt(perpVecX*perpVecX + perpVecY*perpVecY);

            this.context.moveTo(triangle_start_x + (perpVecX / perpVecLen) * 5, triangle_start_y + (perpVecY / perpVecLen) * 5);
            this.context.lineTo(triangle_start_x + (triangle_end_x - triangle_start_x) / 3, triangle_start_y + (triangle_end_y - triangle_start_y) / 3);

            this.context.moveTo(triangle_start_x - (perpVecX / perpVecLen) * 5, triangle_start_y - (perpVecY / perpVecLen) * 5);
            this.context.lineTo(triangle_start_x + (triangle_end_x - triangle_start_x) / 3, triangle_start_y + (triangle_end_y - triangle_start_y) / 3);

            this.context.lineTo(triangle_start_x + (perpVecX / perpVecLen) * 5, triangle_start_y + (perpVecY / perpVecLen) * 5);

            this.context.closePath();

          this.context.fill();

          this.triangles.push({
            p1x: triangle_start_x,
            p1y: triangle_start_y,
            p2x: triangle_start_x + (perpVecX / perpVecLen) * 5,
            p2y: triangle_start_y + (perpVecY / perpVecLen) * 5,
            p3x: triangle_start_x - (perpVecX / perpVecLen) * 5,
            p3y: triangle_start_y - (perpVecY / perpVecLen) * 5,
            p4x: triangle_start_x + (perpVecX / perpVecLen) * 5,
            p4y: triangle_start_y + (perpVecY / perpVecLen) * 5,
            l1x: triangle_start_x + (triangle_end_x - triangle_start_x) / 3,
            l1y: triangle_start_y + (triangle_end_y - triangle_start_y) / 3,
            l2x: triangle_start_x + (triangle_end_x - triangle_start_x) / 3,
            l2y: triangle_start_y + (triangle_end_y - triangle_start_y) / 3,
            l3x: triangle_start_x + (perpVecX / perpVecLen) * 5,
            l3y: triangle_start_y + (perpVecY / perpVecLen) * 5
          });
      }

      this.context.strokeStyle = action.color;
      return this.context.stroke();
    }
  };
  return $.sketch.tools.eraser = {
    onEvent: function(e) {
      return $.sketch.tools.marker.onEvent.call(this, e);
    },
    draw: function(action) {
      var oldcomposite;
      oldcomposite = this.context.globalCompositeOperation;
      this.context.globalCompositeOperation = "copy";
      action.color = "rgba(0,0,0,0)";
      $.sketch.tools.marker.draw.call(this, action);
      return this.context.globalCompositeOperation = oldcomposite;
    }
  };
  _sketch = Sketch;
})(jQuery);
