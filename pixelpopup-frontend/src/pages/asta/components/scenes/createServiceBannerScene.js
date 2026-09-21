const serviceSceneKinds = {
  "website-design": "design",
  "website-development": "development",
  "cms-solutions": "content",
  "bug-fixing-responsiveness": "repair",
  "website-maintenance-security": "security",
  "speed-optimization-seo": "performance",
  "ai-automation": "automation",
  "threejs-development": "spatial",
};

function addMesh(root, geometry, material, position = [0, 0, 0]) {
  const mesh = new root.userData.THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  root.add(mesh);
  return mesh;
}

function buildDesignScene(THREE, root, track, materials) {
  const panelGeometry = track(new THREE.BoxGeometry(1.55, 0.08, 0.94));
  const panelEdges = track(new THREE.EdgesGeometry(panelGeometry));
  const panels = Array.from({ length: 6 }, (_, index) => {
    const panel = new THREE.Group();
    const surface = new THREE.Mesh(panelGeometry, index % 2 ? materials.blue : materials.navy);
    const outline = new THREE.LineSegments(panelEdges, materials.line);
    panel.add(surface, outline);
    panel.position.set((index - 2.5) * 0.72, index % 2 ? 0.5 : -0.48, (index - 2.5) * -0.28);
    panel.rotation.set(-0.2, -0.28, index % 2 ? 0.08 : -0.08);
    root.add(panel);
    return { panel, baseY: panel.position.y, phase: index * 0.7 };
  });

  return (time) => {
    panels.forEach(({ panel, baseY, phase }) => {
      panel.position.y = baseY + Math.sin(time * 0.7 + phase) * 0.09;
    });
  };
}

function buildDevelopmentScene(THREE, root, track, materials) {
  const railGeometry = track(new THREE.BoxGeometry(5.6, 0.035, 0.035));
  [-0.72, 0, 0.72].forEach((y) => addMesh(root, railGeometry, materials.lineMesh, [0, y, -0.45]));

  const moduleGeometry = track(new THREE.BoxGeometry(0.34, 0.34, 0.34));
  const modules = Array.from({ length: 12 }, (_, index) => {
    const lane = index % 3;
    const module = addMesh(root, moduleGeometry, index % 4 === 0 ? materials.bright : materials.blue, [-2.8 + index * 0.5, -0.72 + lane * 0.72, 0]);
    module.rotation.set(index * 0.08, index * 0.12, 0);
    return { module, lane, offset: index / 12 };
  });

  const outputGeometry = track(new THREE.BoxGeometry(0.56, 0.56, 0.56));
  [-0.62, 0, 0.62].forEach((y, index) => {
    const output = addMesh(root, outputGeometry, materials.navy, [2.65, y, 0.05]);
    output.rotation.y = index * 0.22;
  });

  return (time) => {
    modules.forEach(({ module, lane, offset }) => {
      const progress = (time * 0.13 + offset) % 1;
      module.position.x = -2.75 + progress * 4.75;
      module.position.y = -0.72 + lane * 0.72 + Math.sin(time * 1.6 + offset * 8) * 0.04;
      module.rotation.x += 0.006;
      module.rotation.y += 0.009;
    });
  };
}

function buildContentScene(THREE, root, track, materials) {
  const columnGeometry = track(new THREE.BoxGeometry(1.32, 2.45, 0.12));
  const columnEdges = track(new THREE.EdgesGeometry(columnGeometry));
  [-1.55, 0, 1.55].forEach((x) => {
    const column = new THREE.LineSegments(columnEdges, materials.line);
    column.position.set(x, 0, -0.45);
    root.add(column);
  });

  const cardGeometry = track(new THREE.BoxGeometry(0.96, 0.38, 0.12));
  const cards = Array.from({ length: 12 }, (_, index) => {
    const column = index % 3;
    const row = Math.floor(index / 3);
    const card = addMesh(root, cardGeometry, index % 4 === 0 ? materials.bright : materials.blue, [-1.55 + column * 1.55, 0.82 - row * 0.55, 0]);
    return { card, phase: index * 0.52, baseZ: card.position.z };
  });

  return (time) => {
    cards.forEach(({ card, phase, baseZ }) => {
      card.position.z = baseZ + (Math.sin(time * 0.9 + phase) + 1) * 0.11;
      card.scale.x = 0.92 + (Math.sin(time * 0.7 + phase) + 1) * 0.04;
    });
  };
}

function buildRepairScene(THREE, root, track, materials) {
  const segmentGeometry = track(new THREE.TorusGeometry(1.42, 0.12, 8, 22, 0.58));
  const segments = Array.from({ length: 9 }, (_, index) => {
    const segment = addMesh(root, segmentGeometry, index === 2 ? materials.bright : materials.blue);
    segment.rotation.z = index * ((Math.PI * 2) / 9);
    segment.userData.baseRotation = segment.rotation.z;
    return segment;
  });
  const core = addMesh(root, track(new THREE.OctahedronGeometry(0.54, 0)), materials.navy);

  return (time) => {
    const repair = (Math.sin(time * 0.75) + 1) * 0.5;
    segments.forEach((segment, index) => {
      const brokenOffset = index === 2 ? 0.42 * (1 - repair) : 0;
      segment.rotation.z = segment.userData.baseRotation + brokenOffset;
      segment.position.x = index === 2 ? brokenOffset * 0.65 : 0;
    });
    core.rotation.x = time * 0.35;
    core.rotation.y = time * 0.48;
  };
}

function buildSecurityScene(THREE, root, track, materials) {
  const rings = [
    { radius: 0.9, rotation: [1.2, 0.2, 0] },
    { radius: 1.45, rotation: [0.35, 1.1, 0.3] },
    { radius: 2, rotation: [0.8, 0.1, 1.05] },
  ].map(({ radius, rotation }, index) => {
    const ring = addMesh(root, track(new THREE.TorusGeometry(radius, 0.045, 7, 72)), index === 1 ? materials.bright : materials.blue);
    ring.rotation.set(...rotation);
    return ring;
  });
  const core = addMesh(root, track(new THREE.OctahedronGeometry(0.66, 1)), materials.navy);
  const nodeGeometry = track(new THREE.SphereGeometry(0.11, 12, 12));
  const nodes = Array.from({ length: 7 }, (_, index) => addMesh(root, nodeGeometry, materials.bright, [0, 0, 0]));

  return (time) => {
    rings.forEach((ring, index) => {
      ring.rotation.z += 0.0018 * (index + 1);
      ring.rotation.y += 0.0012 * (3 - index);
    });
    nodes.forEach((node, index) => {
      const angle = time * (0.34 + index * 0.018) + index * ((Math.PI * 2) / nodes.length);
      const radius = 1.72 + (index % 2) * 0.34;
      node.position.set(Math.cos(angle) * radius, Math.sin(angle * 1.3) * 0.72, Math.sin(angle) * radius * 0.36);
    });
    core.rotation.y = time * 0.25;
  };
}

function buildPerformanceScene(THREE, root, track, materials) {
  const barGeometry = track(new THREE.BoxGeometry(1.25, 0.09, 0.09));
  const bars = Array.from({ length: 16 }, (_, index) => {
    const bar = addMesh(root, barGeometry, index % 5 === 0 ? materials.bright : materials.blue);
    bar.scale.x = 0.35 + (index % 4) * 0.18;
    return { bar, lane: index % 5, offset: index / 16 };
  });
  const target = addMesh(root, track(new THREE.TorusGeometry(0.72, 0.07, 8, 48)), materials.navy, [2.15, 0, 0]);
  target.rotation.x = Math.PI / 2;

  return (time) => {
    bars.forEach(({ bar, lane, offset }) => {
      const progress = (time * 0.22 + offset) % 1;
      bar.position.set(-3.2 + progress * 4.5, -0.9 + lane * 0.45, Math.sin(progress * Math.PI) * 0.32);
    });
    target.scale.setScalar(1 + Math.sin(time * 1.2) * 0.035);
    target.rotation.z = time * 0.16;
  };
}

function buildAutomationScene(THREE, root, track, materials) {
  const nodeGeometry = track(new THREE.SphereGeometry(0.16, 12, 12));
  const nodePositions = [
    [-2.4, 0.9, 0], [-2.4, -0.9, 0], [-0.9, 0.55, 0], [-0.9, -0.55, 0],
    [0.7, 0.95, 0], [0.7, 0, 0], [0.7, -0.95, 0], [2.25, 0.55, 0], [2.25, -0.55, 0],
  ];
  const nodes = nodePositions.map((position, index) => addMesh(root, nodeGeometry, index % 3 === 0 ? materials.bright : materials.blue, position));
  const connections = [[0, 2], [1, 3], [2, 4], [2, 5], [3, 5], [3, 6], [4, 7], [5, 7], [5, 8], [6, 8]];
  connections.forEach(([start, end]) => {
    const geometry = track(new THREE.BufferGeometry().setFromPoints([nodes[start].position, nodes[end].position]));
    root.add(new THREE.Line(geometry, materials.line));
  });
  const tokenGeometry = track(new THREE.BoxGeometry(0.2, 0.2, 0.2));
  const tokens = connections.slice(0, 6).map((connection, index) => ({
    mesh: addMesh(root, tokenGeometry, materials.bright),
    connection,
    offset: index / 6,
  }));

  return (time) => {
    tokens.forEach(({ mesh, connection, offset }) => {
      const progress = (time * 0.18 + offset) % 1;
      mesh.position.lerpVectors(nodes[connection[0]].position, nodes[connection[1]].position, progress);
      mesh.rotation.x += 0.01;
      mesh.rotation.y += 0.014;
    });
    nodes.forEach((node, index) => node.scale.setScalar(0.92 + (Math.sin(time * 1.4 + index) + 1) * 0.08));
  };
}

function buildSpatialScene(THREE, root, track, materials) {
  const solid = addMesh(root, track(new THREE.IcosahedronGeometry(1.28, 1)), materials.navy);
  const wire = addMesh(root, track(new THREE.IcosahedronGeometry(1.65, 1)), materials.wire);
  const satelliteGeometry = track(new THREE.TetrahedronGeometry(0.24, 0));
  const satellites = Array.from({ length: 8 }, (_, index) => addMesh(root, satelliteGeometry, index % 2 ? materials.blue : materials.bright));

  return (time) => {
    solid.rotation.x = time * 0.18;
    solid.rotation.y = time * 0.28;
    wire.rotation.x = -time * 0.14;
    wire.rotation.y = time * 0.2;
    satellites.forEach((satellite, index) => {
      const angle = time * 0.42 + index * ((Math.PI * 2) / satellites.length);
      satellite.position.set(Math.cos(angle) * 2.18, Math.sin(angle * 1.4) * 0.72, Math.sin(angle) * 0.72);
      satellite.rotation.x = time + index;
      satellite.rotation.y = time * 0.7 + index;
    });
  };
}

const builders = {
  design: buildDesignScene,
  development: buildDevelopmentScene,
  content: buildContentScene,
  repair: buildRepairScene,
  security: buildSecurityScene,
  performance: buildPerformanceScene,
  automation: buildAutomationScene,
  spatial: buildSpatialScene,
};

export default function createServiceBannerScene(THREE, scene, track, serviceSlug) {
  const root = new THREE.Group();
  root.userData.THREE = THREE;
  scene.add(root);

  const materials = {
    blue: track(new THREE.MeshStandardMaterial({ color: 0x1570ef, metalness: 0.12, roughness: 0.44 })),
    bright: track(new THREE.MeshStandardMaterial({ color: 0x8fc4ff, emissive: 0x0b3d73, emissiveIntensity: 0.35, roughness: 0.38 })),
    navy: track(new THREE.MeshStandardMaterial({ color: 0x0b315b, metalness: 0.25, roughness: 0.36 })),
    line: track(new THREE.LineBasicMaterial({ color: 0x8fc4ff, transparent: true, opacity: 0.58 })),
    lineMesh: track(new THREE.MeshBasicMaterial({ color: 0x5da5f6, transparent: true, opacity: 0.42 })),
    wire: track(new THREE.MeshBasicMaterial({ color: 0x8fc4ff, wireframe: true, transparent: true, opacity: 0.48 })),
  };

  const sceneKind = serviceSceneKinds[serviceSlug] || "spatial";
  const updateScene = builders[sceneKind](THREE, root, track, materials);

  return {
    cameraPosition: [0, 0.15, 8.6],
    mobileCameraPosition: [0, 0.1, 9.8],
    lookAt: [0, 0, 0],
    resize(compact, width, height) {
      const desktopScale = Math.min(Math.max(height / 720, 1.05), 1.38);
      const horizontalOffset = Math.min(Math.max((width - 1100) / 520, 0), 1.25);
      root.position.set(compact ? 0.7 : 2.35 + horizontalOffset, compact ? -0.8 : 0.05, 0);
      root.scale.setScalar(compact ? 0.78 : desktopScale);
    },
    update(time, pointer) {
      updateScene(time);
      root.rotation.y += (pointer.x * 0.1 - root.rotation.y) * 0.035;
      root.rotation.x += (-pointer.y * 0.055 - root.rotation.x) * 0.035;
    },
  };
}
