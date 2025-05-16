var anim = 0;
var clock = new THREE.Clock();

var camera;
var helper_camera;
var helper; // camera frustrum helper
var lookat;
var controls; // orbit control
var renderer;
var vwidth;
var vheight;

var scene;
var ball;
var tail;
var vr;

var traj, traj_line;
var clips;
var clip_start;

const config = {
  dirlightRadius: 5,
  dirlightSamples: 16,
  shadow: false,
  showall: true,
  showline: true,
  showun: false,
  showunline: false,
  speed: 1,
  drawtail: 10,
  traj_id: 0,
  ballsize: 0.1,
  tballsize: 0.07,
  animate: true
};

const views = [
  {
    left: 0,
    bottom: 0.2,
    width: 1.0,
    height: 0.8,
    background: new THREE.Color( 0x999999 ),
    eye: [ 0, 300, 1800 ],
    up: [ 0, 1, 0 ],
  },
  {
    left: 0,
    bottom: 0,
    width: 1/3.0,
    height: 0.2,
    background: new THREE.Color( 0.3, 0.3, 0.3),
    wview: w1 * 1.3, 
    eye: [ 0, 2, 20 ],
    lookAt: [0, 1.8, -20], // camera frustrum helper
    up: [ 0, 1, 0 ],
  },
  {
    left: 1/3.0,
    bottom: 0,
    width: 1/3.0,
    height: 0.2,
    wview: h1 * 1.1,
    background: new THREE.Color( 0.35, 0.35, 0.35),
    eye: [ 20, 3.725, 0 ],
    lookAt: [-20, 3.25, 0],
    up: [ 0, 1, 0 ],
  },
  {
    left: 2/3.0,
    bottom: 0,
    width: 1/3.0,
    height: 0.2,
    wview: h1 * 1.1,
    background: new THREE.Color( 0.3, 0.3, 0.3 ),
    eye: [ 0, 40, 0],
    lookAt: [0, 0, 0],
    up: [ -1, 0, 0 ],
  }
];

var dirLight1;

function unColoring(point, simple=false) {
  const int = 0.3;
  const em = 0.7;
  const color = [50 / 255, 147 / 255, 221 / 255];
  //const color = [48 / 255, 143 / 255, 210 / 255];
  
  if (simple) 
    return new THREE.MeshBasicMaterial({color: 0x18acbf});
  return new THREE.MeshPhongMaterial( { 
    color: new THREE.Color(color[0] * int, color[1] * int, color[2] * int), 
    emissive: new THREE.Color(color[0] * em, color[1] * em, color[2] * em), 
    specular: new THREE.Color(0.1, 0.1, 0.1), 
    opacity: 1,
    shininess: 5,
    transparent: true} );
}
function gradientColoring(point) {
  let depth = ((point[2] / (h1 * 1.3) + 1) * 0.5);

  if (depth < 0) depth = 0;
  if (depth > 1) depth = 1;

  let color1 = [255, 0, 0];
  let color2 = [255, 240, 0];

  return new THREE.Color(
    (color1[0] * depth + color2[0] * (1-depth)) / 255, 
    (color1[1] * depth + color2[1] * (1-depth)) / 255, 
    (color1[2] * depth + color2[2] * (1-depth)) / 255);
}
function ballColoring(point) {
  return new THREE.MeshStandardMaterial( { 
    color: gradientColoring(point), 
    opacity: 0.8,
    transparent: true} );
}
function lineColoring(point) {
  return new THREE.LineBasicMaterial( { color: gradientColoring(point)} );
}
function unlineColoring(point) {
  return new THREE.LineBasicMaterial( { color: new THREE.Color(43/255, 185/255, 221/255) } );
}
function sliderOnChange(min, max, key) {
  if (config.showall) {
    for (let i = 0; i < traj.children.length; i++) {
      traj.children[i].visible = (i >= min && i <= max);
    }
  }
  if (config.showline) {
    for (let i = 0; i < traj_line.children.length; i++) {
      traj_line.children[i].visible = (i >= min && i < max);
    }
  }
  if (config.showun) {
    for (let i = 0; i < un_traj.children.length; i++) {
      un_traj.children[i].visible = (i >= min && i < max);
    }
  }
  if (config.showunline) {
    for (let i = 0; i < un_traj_line.children.length; i++) {
      un_traj_line.children[i].visible = (i >= min && i < max);
    }
  }
  ball.position.set(0, 0, 0);
  ball.position.addScaledVector(traj.children[key].position, 1);

  const cd = clipdat[config.traj_id]
  $("#imgclip").attr("src", "./clips/" + cd.g_name + "/" + cd.c_name + "/" + (key + cd.f_start).pad(4) + ".jpg" );
}

function customAddTrajectory() {
  window.location.hash = config.traj_id;
  const unline = unlineColoring;
  addTrajectory(data[config.traj_id], ballColoring, lineColoring, null, null, unColoring, unline);
  setupSlider(data[config.traj_id]["pred_refined"].length, sliderOnChange);
}

function setupGUI() {
  const gui = new dat.GUI({width: 350});
  
  gui.useLocalStorage = true;
  const folder_traj = gui.addFolder( 'Trajectory' );
  folder_traj.add(config, 'traj_id', Object.keys(data)).name('Trajectory ID').listen().onChange(function(value) {
    console.log("Showing trajectory ", config.traj_id);
    customAddTrajectory();
  });

  folder_traj.add(config, 'showall').name('Show Prediction Points').listen().onChange( function(value) { 
    for (let i = 0; i < traj.children.length; i++) {
      traj.children[i].visible = value && (i >= min && i <= max);
    }
  });
  folder_traj.add(config, 'showline').name('Show Lines').listen().onChange( function(value) { 
    for (let i = 0; i < traj_line.children.length; i++) {
      traj_line.children[i].visible = value && (i >= min && i <= max);
    }
  });

  folder_traj.add(config, 'showun').name('Show Unrefined').listen().onChange( function(value) { 
    for (let i = 0; i < un_traj.children.length; i++) {
      un_traj.children[i].visible = value && (i >= min && i <= max);
    }
  });
  folder_traj.add(config, 'showunline').name('Show Unrefined Lines').listen().onChange( function(value) { 
    for (let i = 0; i < un_traj_line.children.length; i++) {
      un_traj_line.children[i].visible = value && (i >= min && i <= max);
    }
  });

  const folder_animation = gui.addFolder( 'Animation' );
  folder_animation.add(config, 'animate').name('Animate').listen().onChange( function(value) { 
    if (!config.animate) {
      scene.remove(tail);
      tail.geometry.dispose();
    }
    //ball.visible = config.animate;

  });

  folder_animation.add(config, 'drawtail', 0, 30, 1).name('Draw Tail').listen().onChange(function(value) {
    if (value == 0 && typeof tail !== "undefined") {
      scene.remove(tail);
      for (let i = 0; i < tail.children.length; i++) {
        tail.children[i].geometry.dispose();
        tail.children[i].material.dispose();
      }
    }
  });;

  folder_animation.add(config, 'speed', 0, 2, 0.05).name('Speed');

  const folder_render = gui.addFolder( 'Rendering' );
  folder_render.add(config, 'shadow').name('Shadow').listen().onChange( function(value) {
    renderer.shadowMap.enabled = value;
    scene.traverse(function (child) {
      if (child.material) {
        child.material.needsUpdate = true
      }
    })
  });

  folder_render.add( config, 'dirlightRadius', 0, 25, 0.1).name( 'Shadow Radius' ).onChange( function ( value ) {
    dirLight1.shadow.radius = value;
  } );

  folder_render.add( config, 'dirlightSamples', 1, 64, 1).name( 'Shadow Samples' ).onChange( function ( value ) {
    dirLight1.shadow.blurSamples = value;
  } );

  folder_traj.open();

  var cam_tools = {
    courtview: function() {
      camera.position.set(helper_camera.position.x, helper_camera.position.y, helper_camera.position.z);
      controls.target.set(lookat.x, lookat.y, lookat.z);
      controls.update();
    },
    copycam: function() {
      console.log(controls.target.x);
      console.log("[#] Cam pos: " + camera.position.x);

      let str = "camera=" + camera.position.x + "," + camera.position.y + "," + camera.position.z + "," + controls.target.x + "," + controls.target.y + "," + controls.target.z;
      console.log(str);
      navigator.clipboard.writeText(str);
    }
  };
  const folder_debug = gui.addFolder('Developer Tools');
  folder_debug.add(cam_tools,'copycam').name('Copy camera params');
  folder_debug.add(cam_tools,'courtview').name('Reset camera view');

}

function setupScene(scene, f, center) {
  //let f = 1828.391959798995 * 2 / 1280; 
  let fov = Math.atan2(1, f) * 2 * 180 / Math.PI;

  camera = new THREE.PerspectiveCamera(fov, window.innerWidth / (window.innerHeight * 0.8), 0.1, 1000 );
  //camera.position.set(0, 8.6, 25.84);
  camera.position.set(center.x, center.y, center.z);
  camera.lookAt(lookat.x, lookat.y, lookat.z);

  helper_camera = new THREE.PerspectiveCamera(fov, 1280 / 720 , 2, 2.0001 );
  //helper_camera.position.set(0, 8.6, 25.84);
  helper_camera.position.set(center.x, center.y, center.z);
  helper_camera.lookAt(lookat.x, lookat.y, lookat.z);

  scene.add(helper_camera);

  views[0].camera = camera;
  for ( let ii = 1; ii < views.length; ++ ii ) {
    const view = views[ ii ];
    let c = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000 );
    c.position.fromArray( view.eye );
    c.up.fromArray( view.up );
    c.lookAt(view.lookAt[0], view.lookAt[1], view.lookAt[2]);
    view.camera = c;
  }

  helper = new THREE.CameraHelper(helper_camera);
  helper.update();
  //scene.add( helper );

  const t = 15;
  dirLight1 = new THREE.DirectionalLight( 0xffffff, 0.4);
  dirLight1.position.set( 10, 8, 12 );
  dirLight1.castShadow = true;
  dirLight1.shadow.radius = config.dirlightRadius;
  dirLight1.shadow.blurSamples = config.dirlightSamples;
  dirLight1.shadow.bias = -0.002;
  dirLight1.shadow.mapSize.width = 2048;
  dirLight1.shadow.mapSize.height = 2048;
  dirLight1.shadow.camera.left = -t;
  dirLight1.shadow.camera.right = t;
  dirLight1.shadow.camera.top = t;
  dirLight1.shadow.camera.bottom = -t;
  dirLight1.shadow.camera.near = 0.5; 
  dirLight1.shadow.camera.far = 50; 
  scene.add( dirLight1 );

  const ambientLight = new THREE.AmbientLight( 0xffffff, 0.85 );
  scene.add( ambientLight );

  drawCourt(scene);
  customAddTrajectory();

  clip_start = clipdat[config.traj_id]["f_start"];
}

Number.prototype.pad = function(size) {
  var s = String(this);
  while (s.length < (size || 2)) {s = "0" + s;}
  return s;
}

readData(function () {
  $(document).ready(function() {
    const f = 5.07886648178100;
    const t = new THREE.Vector4(0.06362732851167613, 8.594541269434785, 32.8437588435118, 1);
 
    lookat = new THREE.Vector3(0, 0, 0);

    if (camInit != 0 && camInit != null) {
      const sp = camInit.split(",");
      if (sp.length == 6) {
        t.x = parseFloat(sp[0]);
        t.y = parseFloat(sp[1]);
        t.z = parseFloat(sp[2]);
        lookat.x = parseFloat(sp[3]);
        lookat.y = parseFloat(sp[4]);
        lookat.z = parseFloat(sp[5]);
        console.log("here");
        console.log(sp);
        console.log(camInit);
      }
    }

    scene = new THREE.Scene();
    setupGUI();

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    vr = (urlParams.get('vr') !== null);

    renderer = new THREE.WebGLRenderer({antialias: true});
    document.body.appendChild( renderer.domElement );
    renderer.shadowMap.enabled = false;
    renderer.shadowMap.type = THREE.VSMShadowMap;

    if (vr) {
      document.body.appendChild( VRButton.createButton( renderer ) );
      renderer.xr.enabled = true;
    }

    setupScene(scene, f, t);

    setSize();
    controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.target.set(lookat.x, lookat.y, lookat.z);
    controls.update();

    $(document).keydown(function(e) {
      if (e.which == 40) { // Down key
        config.traj_id ++;  
      } else if (e.which == 38) { // Up key
        config.traj_id --;  
      }
      config.traj_id = Math.min(Object.keys(data).length-1, Math.max(0, config.traj_id));

      if (e.which == 40 || e.which == 38) {
        console.log("Showing trajectory ", config.traj_id);
        customAddTrajectory();
        updateCourtColor(scene, config.traj_id);
      }
    });

    renderer.setAnimationLoop( function () {
      const material = new THREE.MeshStandardMaterial( { color: 0xff0000} );

      if (config.animate) { 
        anim += clock.getDelta() * config.speed;

        const FPS = 30.0;
        const duration = (maxframe - minframe) / FPS;
        if (duration > 0) 
          while (anim >= duration) 
            anim -= duration;
        else
          anim = 0;

        let id = anim * FPS + minframe;
        let id0 = Math.floor(id);
        let id1 = id0 + 1;
        
        setKeyframe(id0);
        const cd = clipdat[config.traj_id]
        $("#imgclip").attr("src", "./clips/" + cd.g_name + "/" + cd.c_name + "/" + (id0 + cd.f_start).pad(4) + ".jpg" );

        ball.position.set(0, 0, 0);
        ball.position.addScaledVector(traj.children[id0].position, id1 - id);
        ball.position.addScaledVector(traj.children[id1].position, id - id0);

        if (config.drawtail > 0) {
          addTail2(id1, ball, id - id0);
        }
      }

      if (vr)
        renderer.render( scene, camera );
      else 
        render();

    } );
  });
});


function render() {
  for ( let ii = 0; ii < views.length; ++ ii ) {
    const view = views[ ii ];
    const c = view.camera;

    const left = Math.floor( vwidth * view.left );
    const bottom = Math.floor( vheight * view.bottom );
    const width = Math.floor( vwidth * view.width );
    const height = Math.floor( vheight * view.height );

    renderer.setViewport( left, bottom, width, height );
    renderer.setScissor( left, bottom, width, height );
    renderer.setScissorTest( true );
    renderer.setClearColor( view.background );

    if (ii == 0) {
      c.aspect = width / height;
    } else if (ii == 3) {
      c.left = -view.wview;
      c.right = -c.left;
      c.top = c.right * height / width;
      c.bottom = -c.top;
      if (c.top < w1 * 1.1) {
        c.top = w1 * 1.1;
        c.bottom = -c.top;
        c.right = c.top * width / height;
        c.left = -c.right;
      }
    } else {
      c.left = -view.wview;
      c.right = -c.left;
      c.top = c.right * height / width;
      c.bottom = -c.top;
    }
    c.updateProjectionMatrix();

    renderer.render( scene, c );
  }
}
window.addEventListener( 'resize', setSize, false );

function setSize() {
  console.log($("#control").width());
  vwidth = window.innerWidth;// - $("#control").outerWidth();
  vheight = window.innerHeight;

  camera.aspect = vwidth / vheight;
  camera.updateProjectionMatrix();
  renderer.setSize(vwidth, vheight);
}
