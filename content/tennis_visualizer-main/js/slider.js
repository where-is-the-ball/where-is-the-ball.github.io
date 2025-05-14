var drag = false;
var ox;
var opx;
var dragobj;
var slider_n = 10;

var _slider_width;
var minframe = 0, maxframe = 0;
var callback;

function setKeyframe(a) {
  $("#slider_key").css({left: a / (slider_n - 1) * _slider_width});
  $("#slider_key .tip").text(a);
}

function setupSlider(n, cb) {
  callback = cb;
  slider_n = n;
  _slider_width = $("#slider").width() - $("#slider_right").width();
  $("#slider_right").css({left: _slider_width});
  $("#slider_left").css({left: 0});
  $("#slider_key").css({left: 0});
  $("#slider_band").css({left: 0, width: _slider_width});
  $("#slider_left .tip").text("0");
  $("#slider_key .tip").text("0");
  $("#slider_right .tip").text(slider_n - 1);
  minframe = 0;
  maxframe = slider_n - 1;

  $("#slider").mousemove(function() {
    $(".tip").show();
  });
  $("#slider").mouseout(function() {
    //if (!drag)
      //$(".tip").hide();
  });
  /*
  $(".knob, #slider_band").mousemove(function() {
    $(this).children(".tip").html("yes");
    if ($("#slider_left").position().left < $("#slider_right").position().left) {
      $("#slider_left").children(".tip").html(minframe);
      $("#slider_right").children(".tip").html(maxframe);
    } else {
      $("#slider_left").children(".tip").html(maxframe);
      $("#slider_right").children(".tip").html(minframe);
    }
  });*/

  $(".knob, #slider_band").mousedown(function(e){
    drag = true;
    ox = e.pageX;
    oy = e.pageY;
    opx = $(this).position().left;
    opy = $(this).position().top;
    dragobj = $(this);
    e.preventDefault();
  });
  $(document).mouseup(function(){
    drag = false;
    over = false;
    //$(".tip").hide();
  });
  $(document).mousemove(function(e){
    if (drag) {
      $(".tip").show();
      let newx = opx + (e.pageX - ox);
      if (newx < 0) newx = 0;
      if (newx > _slider_width) newx = _slider_width;

      const lv = $("#slider_left").position().left;
      const rv = $("#slider_right").position().left;
      const diff = Math.abs(lv - rv);
      const discrete = Math.round(newx / _slider_width * (slider_n-1));
      newx = discrete / (slider_n - 1) * _slider_width;
      if (dragobj.attr("id") == "slider_band") {
        if (newx + diff > _slider_width) newx = _slider_width - diff;

        let leftbar, rightbar;
        if ($("#slider_left").position().left < $("#slider_right").position().left) {
          leftbar = $("#slider_left");
          rightbar = $("#slider_right");
        } else {
          leftbar = $("#slider_right");
          rightbar = $("#slider_left");
        }
        leftbar.css({left: newx});
        dragobj.css({left: newx});
        rightbar.css({left: newx + diff});

      } else {
        dragobj.css({left: newx});
        $("#slider_band").css({
          left: Math.min(lv, rv), 
          width: diff
        });
      }
      minframe = Math.round(Math.min(lv, rv) / _slider_width * (slider_n-1)); 
      maxframe = Math.round(Math.max(lv, rv) / _slider_width * (slider_n-1));  
      if ($("#slider_left").position().left < $("#slider_right").position().left) {
        $("#slider_left").children(".tip").text(minframe);
        $("#slider_right").children(".tip").text(maxframe);
      } else {
        $("#slider_left").children(".tip").text(maxframe);
        $("#slider_right").children(".tip").text(minframe);
      }
    } 

    const keyframe = Math.round($("#slider_key").position().left / _slider_width * (slider_n-1));
    $("#slider_key .tip").text(keyframe);
    callback(minframe, maxframe, keyframe);
  });


}
