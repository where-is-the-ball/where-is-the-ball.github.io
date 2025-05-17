const w1 = 5.4868;
const h1 = 11.8872;

function drawFlatLine(scene, a, b, w, stand=0, color=0xffffff, castShadow=false) {
  if (Array.isArray(a)) 
    a = new THREE.Vector3(a[0], a[1], a[2]);
  if (Array.isArray(b)) 
    b = new THREE.Vector3(b[0], b[1], b[2]);

  if (stand)
    var up = new THREE.Vector3 (0, 0, 1);
  else
    var up = new THREE.Vector3 (0, 1, 0);

  let diff = b.clone(); diff.sub(a);
  let diff_u = diff.clone();
  diff_u.normalize();

  let orth = diff.clone();
  orth.cross(up);
  orth.normalize();

  let p = new Array(4);
  p[0] = b.clone();
  p[0].addScaledVector(orth, w / 2);
  p[0].addScaledVector(diff_u, w / 2); 
  p[1] = p[0].clone();
  p[1].addScaledVector(orth, -w);

  p[3] = a.clone();
  p[3].addScaledVector(orth, w / 2);
  p[3].addScaledVector(diff_u, -w / 2); 
  p[2] = p[3].clone();
  p[2].addScaledVector(orth, -w);

  //const material = new THREE.MeshNormalMaterial();
  const material = new THREE.MeshStandardMaterial( { color: color, side: THREE.DoubleSide} );
  let geometry = new THREE.BufferGeometry()
  const points = [p[0], p[1], p[2], p[0], p[2], p[3]];
  geometry.setFromPoints(points);
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = castShadow;
  scene.add(mesh);
}

function drawCenteredRect(scene, w, h, y, color) {
  const material = new THREE.MeshStandardMaterial( { color: color, side: THREE.DoubleSide} );
  let geometry = new THREE.BufferGeometry()

  let p = [new THREE.Vector3 (-w/2, y, -h/2),
    new THREE.Vector3 (-w/2, y, h/2), 
    new THREE.Vector3 (w/2, y, h/2), 
    new THREE.Vector3 (w/2, y, -h/2)];
  const points = [p[0], p[1], p[2], p[0], p[2], p[3]];
  geometry.setFromPoints(points);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  scene.add(mesh);
}


function drawCourt(scene) {
  // let court = [[w1, 0, -h1],
  //   [w1, 0, h1],
  //   [-w1, 0, h1], 
  //   [-w1, 0, -h1], 
  //   [4.1148, 0, -h1], 
  //   [4.1148, 0, h1], 
  //   [-4.1148, 0, h1],
  //   [-4.1148, 0, -h1], 
  //   [4.1148, 0, -6.4008],
  //   [-4.1148, 0, -6.4008], 
  //   [4.1148, 0, 6.4008],
  //   [-4.1148, 0, 6.4008],
  //   [0, 0, -6.4008], 
  //   [0, 0, 6.4008],
  //   [w1, 0, 0],
  //   [-w1, 0, 0],
  //   [0, 0, h1],
  //   [0, 0, h1-0.1],
  //   [0, 0, -h1],
  //   [0, 0, -h1+0.1],
  //   ];
  let y = 0;
  let court = [[w1, y, -h1],
    [w1, y, h1],
    [-w1, y, h1], 
    [-w1, y, -h1], 
    [4.1148, y, -h1], 
    [4.1148, y, h1], 
    [-4.1148, y, h1],
    [-4.1148, y, -h1], 
    [4.1148, y, -6.4008],
    [-4.1148, y, -6.4008], 
    [4.1148, y, 6.4008],
    [-4.1148, y, 6.4008],
    [0, y, -6.4008], 
    [0, y, 6.4008],
    [w1, y, 0],
    [-w1, y, 0],
    [0, y, h1],
    [0, y, h1-0.1],
    [0, y, -h1],
    [0, y, -h1+0.1],
    ];
  let lines = [
    [0,1],[1,2],[2,3],[3,0],
    [4,5],[7,6],
    [8,9],[10,11],
    [12,13],
    [16,17],
    [18,19],
  ];
  const poleH = 1.0668;
  const poleHM = 0.9144;
  const polex = 0.9144+w1;

  for (let i = 0; i < court.length; i++) 
    court[i] = new THREE.Vector3(court[i][0], court[i][1], court[i][2]);
  for (let i = 0; i < lines.length; i++) 
    drawFlatLine(scene, court[lines[i][0]], court[lines[i][1]], 0.07); 
0.9144
  const pole = new THREE.CylinderGeometry( 0.05, 0.05, poleH, 16);
  const material = new THREE.MeshBasicMaterial( {color: 0x162f0d} );
  let cylinder = new THREE.Mesh( pole, material );
  cylinder.castShadow = true;
  cylinder.translateX(polex);
  cylinder.translateY(poleH/2);
  scene.add( cylinder );
  cylinder = cylinder.clone();
  cylinder.position.x *= -1;
  scene.add( cylinder );

  const nws = [0.05, 0.07];
  for (let stand = 0; stand < 2; stand++) {
    const netwidth = nws[stand];
    drawFlatLine(scene, [polex, poleH, 0], [w1, poleH, 0], netwidth, stand, 0xffffff, true); 
    drawFlatLine(scene, [-polex, poleH, 0], [-w1, poleH, 0], netwidth, stand, 0xffffff, true); 

    drawFlatLine(scene, [0, poleHM, 0], [w1, poleH, 0], netwidth, stand, 0xffffff, true); 
    drawFlatLine(scene, [0, poleHM, 0], [-w1, poleH, 0], netwidth, stand, 0xffffff, true); 
  }

  drawFlatLine(scene, [0, poleHM, 0], [0, 0, 0], 0.05, 1, 0xffffff, true); 

  drawFlatLine(scene, [-polex, 0, 0], [polex, 0, 0], 0.05, 1, 0x333333, true); 

  drawCenteredRect(scene, 30, 40, -0.011, 0x9ab389);
  drawCenteredRect(scene, w1*2, h1*2, -0.01, 0x706b8a);

  const netv = 20, neth = 60;
  for (let i = 0; i < netv; i++) 
    for (let j = -1; j <= 1; j+= 2) 
      drawFlatLine(scene, [polex * j, (poleH - 0.07) * i / (netv-1), 0], [0, (poleHM - 0.07) * i / (netv-1), 0], 0.005, 1, 0x000000, true); 

  for (let i = 0; i < neth; i++) 
    for (let j = -1; j <= 1; j+= 2) {
      drawFlatLine(scene, [j * polex * i / (neth - 1), 0, 0], [j * polex * i / (neth - 1), poleHM + (poleH - poleHM) * i / (neth-1) - 0.07, 0], 0.005, 1, 0x000000, true); 
    }

}

function updateCourtColorSynthetic(scene) {
    drawCenteredRect(scene, 30, 40, -0.011, 0x844743); // Outer court
    drawCenteredRect(scene, w1*2, h1*2, -0.01, 0x2f634c);  // Inner court
}

function updateCourtColor(scene, tid) {
  if  (tid > 0 && tid < 6) {
    console.log("TID (1-5)");
    drawCenteredRect(scene, 30, 40, -0.011, 0x9ab389); // Outer court
    drawCenteredRect(scene, w1*2, h1*2, -0.01, 0x706b8a);  // Inner court
  }
  else if (tid >= 6 && tid <= 7 ) {
    // TID (6-7)
    console.log("TID (6-7)");
    drawCenteredRect(scene, 30, 40, -0.011, 0x6B8845); // Outer court
    drawCenteredRect(scene, w1*2, h1*2, -0.01, 0x7D9A57);  // Inner court
  }
  else if (tid >= 8 && tid <= 10) {
    // TID (8-10)
    console.log("TID (8-10)");
    drawCenteredRect(scene, 30, 40, -0.011, 0x86AA5C); // Outer court
    drawCenteredRect(scene, w1*2, h1*2, -0.01, 0x755DAC);  // Inner court
  }
  else if (tid >= 11 && tid <= 12) {
    // TID (11-12)
    console.log("TID (11-12)");
    drawCenteredRect(scene, 30, 40, -0.011, 0x5EA375); // Outer court
    drawCenteredRect(scene, w1*2, h1*2, -0.01, 0x538471);  // Inner court
  }
  else if (tid >= 13 && tid <= 14) {
    // TID (13-14)
    console.log("TID (13-14)");
    drawCenteredRect(scene, 30, 40, -0.011, 0xB47254);
    drawCenteredRect(scene, w1*2, h1*2, -0.01, 0xB47254);
  }
  else if (tid == 15) {
    // TID (15)
    console.log("TID (15)");
    drawCenteredRect(scene, 30, 40, -0.011, 0x6B8F6A);
    drawCenteredRect(scene, w1*2, h1*2, -0.01, 0x485890);
  }
  else if (tid >= 16 && tid <= 20) {
    // TR (16-20)
    console.log("TR (16-20)");
    drawCenteredRect(scene, 30, 40, -0.011, 0x66B1F2);
    drawCenteredRect(scene, w1*2, h1*2, -0.01, 0x4166AB);
  }

}
