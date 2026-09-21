const palette = [0x2f5bff, 0x04a8c7, 0xf26445, 0xe5a900, 0x2fa673];
const goldenAngle = Math.PI * (3 - Math.sqrt(5));

function hashSlug(value = "portfolio-services") {
  return [...value].reduce((total, character) => total + character.charCodeAt(0), 0);
}

function createMaterials(THREE, track, seed) {
  const offset = seed % palette.length;
  return palette.map((_, index) => track(new THREE.MeshStandardMaterial({
    color: palette[(index + offset) % palette.length],
    roughness: 0.28 + (index * 0.05),
    metalness: 0.14,
  })));
}

function createLine(THREE, track, root, points, color = 0x2f5bff, opacity = 0.22) {
  const material = track(new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
  const geometry = track(new THREE.BufferGeometry().setFromPoints(points));
  const line = new THREE.Line(geometry, material);
  root.add(line);
  return line;
}

function sphericalPoint(THREE, radius, index, count, phase = 0) {
  const y = 1 - ((index / Math.max(count - 1, 1)) * 2);
  const radialScale = Math.sqrt(Math.max(0, 1 - (y * y)));
  const angle = (goldenAngle * index) + phase;
  return new THREE.Vector3(
    Math.cos(angle) * radialScale * radius,
    y * radius,
    Math.sin(angle) * radialScale * radius,
  );
}

function orientOutward(THREE, object, normal) {
  object.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    normal.clone().normalize(),
  );
}

function createGlobeBase(THREE, track, root, materials, seed) {
  const globe = new THREE.Group();
  root.add(globe);

  const accent = palette[seed % palette.length];
  const coreMaterial = track(new THREE.MeshStandardMaterial({
    color: accent,
    roughness: 0.2,
    metalness: 0.08,
    transparent: true,
    opacity: 0.16,
  }));
  const wireMaterial = track(new THREE.MeshBasicMaterial({
    color: accent,
    wireframe: true,
    transparent: true,
    opacity: 0.24,
  }));
  const core = new THREE.Mesh(track(new THREE.SphereGeometry(1.42, 28, 20)), coreMaterial);
  const cage = new THREE.Mesh(track(new THREE.IcosahedronGeometry(1.72, 2)), wireMaterial);
  globe.add(core, cage);

  const pointPositions = [];
  for (let index = 0; index < 180; index += 1) {
    const point = sphericalPoint(THREE, 1.88, index, 180, seed * 0.01);
    pointPositions.push(point.x, point.y, point.z);
  }
  const pointGeometry = track(new THREE.BufferGeometry());
  pointGeometry.setAttribute("position", new THREE.Float32BufferAttribute(pointPositions, 3));
  const pointMaterial = track(new THREE.PointsMaterial({
    color: palette[(seed + 1) % palette.length],
    size: 0.045,
    transparent: true,
    opacity: 0.72,
    sizeAttenuation: true,
  }));
  const pointShell = new THREE.Points(pointGeometry, pointMaterial);
  globe.add(pointShell);

  const ringRotations = [
    [Math.PI / 2, 0, 0],
    [0.32, Math.PI / 2, 0.16],
    [-0.48, Math.PI / 2, -0.3],
    [1.08, 0.54, 0.72],
  ];
  const rings = ringRotations.map((rotation, index) => {
    const ring = new THREE.Mesh(
      track(new THREE.TorusGeometry(2.05 + (index * 0.08), 0.022 + (index * 0.004), 6, 96)),
      materials[(index + 1) % materials.length],
    );
    ring.rotation.set(...rotation);
    ring.userData.baseRotation = rotation;
    globe.add(ring);
    return ring;
  });

  return {
    group: globe,
    update(time, pointer, interaction, speed = 1) {
      globe.rotation.y = (time * 0.13 * speed) + (pointer.x * 0.14);
      globe.rotation.x = (Math.sin(time * 0.16) * 0.08) - (pointer.y * 0.08);
      core.scale.setScalar(1 + (Math.sin(time * 1.2) * 0.025) + (interaction * 0.08));
      cage.rotation.set(time * -0.045, time * 0.075, time * 0.025);
      pointShell.rotation.y = time * -0.06 * speed;
      rings.forEach((ring, index) => {
        const [baseX, baseY, baseZ] = ring.userData.baseRotation;
        ring.rotation.x = baseX + (Math.sin(time * 0.18 + index) * 0.08);
        ring.rotation.y = baseY + (time * (0.025 + (index * 0.008)) * speed);
        ring.rotation.z = baseZ + (interaction * (index % 2 ? 0.18 : -0.14));
      });
    },
  };
}

function createOrbitalMarkers(THREE, track, root, materials, count = 8) {
  const geometry = track(new THREE.OctahedronGeometry(0.13, 0));
  return Array.from({ length: count }, (_, index) => {
    const marker = new THREE.Mesh(geometry, materials[(index + 2) % materials.length]);
    marker.userData = {
      angle: (index / count) * Math.PI * 2,
      radius: 2.45 + ((index % 3) * 0.16),
      tilt: ((index % 4) - 1.5) * 0.34,
      speed: 0.16 + ((index % 3) * 0.025),
    };
    root.add(marker);
    return marker;
  });
}

function updateOrbitalMarkers(markers, time, interaction, speed = 1) {
  markers.forEach((marker, index) => {
    const angle = marker.userData.angle + (time * marker.userData.speed * speed);
    const radius = marker.userData.radius + (interaction * 0.28);
    marker.position.set(
      Math.cos(angle) * radius,
      Math.sin(angle * 1.4) * marker.userData.tilt,
      Math.sin(angle) * radius,
    );
    marker.rotation.set(time * 0.4, time * 0.32 + index, 0);
    marker.scale.setScalar(1 + (interaction * 0.38));
  });
}

function createConstellationGlobe(THREE, track, root, materials, seed) {
  const globe = createGlobeBase(THREE, track, root, materials, seed);
  const orbiters = createOrbitalMarkers(THREE, track, globe.group, materials, 10);

  return {
    scale: 1.08,
    update(time, pointer, interaction) {
      globe.update(time, pointer, interaction, 1.1);
      updateOrbitalMarkers(orbiters, time, interaction, 1.2);
    },
  };
}

function createArchitectureGlobe(THREE, track, root, materials, seed) {
  const globe = createGlobeBase(THREE, track, root, materials, seed);
  const towerGeometry = track(new THREE.BoxGeometry(0.24, 1, 0.24));
  const towers = Array.from({ length: 22 }, (_, index) => {
    const height = 0.42 + (((index * 7) % 10) * 0.075);
    const normal = sphericalPoint(THREE, 1, index, 22, 0.45);
    const tower = new THREE.Mesh(towerGeometry, materials[index % materials.length]);
    tower.userData = { normal, height, phase: index * 0.46 };
    tower.position.copy(normal).multiplyScalar(1.72 + (height / 2));
    tower.scale.set(1, height, 1);
    orientOutward(THREE, tower, normal);
    globe.group.add(tower);
    return tower;
  });

  return {
    scale: 1.08,
    update(time, pointer, interaction) {
      globe.update(time, pointer, interaction, 0.82);
      towers.forEach((tower) => {
        const { normal, height, phase } = tower.userData;
        const pulse = Math.sin(time * 1.1 + phase) * 0.035;
        tower.position.copy(normal).multiplyScalar(1.72 + (height / 2) + pulse + (interaction * 0.16));
        tower.scale.y = height * (1 + (interaction * 0.12));
      });
    },
  };
}

function createNeuralGlobe(THREE, track, root, materials, seed) {
  const globe = createGlobeBase(THREE, track, root, materials, seed);
  const nodeGeometry = track(new THREE.SphereGeometry(0.13, 12, 10));
  const nodes = Array.from({ length: 18 }, (_, index) => {
    const node = new THREE.Mesh(nodeGeometry, materials[(index + 1) % materials.length]);
    const position = sphericalPoint(THREE, 2.08, index, 18, 0.2);
    node.position.copy(position);
    node.userData = { phase: index * 0.62 };
    globe.group.add(node);
    return node;
  });
  const connections = [[0, 5], [1, 8], [2, 11], [3, 15], [4, 12], [6, 16], [7, 13], [9, 17], [10, 14]];
  connections.forEach(([from, to], index) => {
    createLine(
      THREE,
      track,
      globe.group,
      [nodes[from].position.clone(), nodes[to].position.clone()],
      palette[(seed + index) % palette.length],
      0.24,
    );
  });

  return {
    scale: 1.08,
    update(time, pointer, interaction) {
      globe.update(time, pointer, interaction, 0.78);
      nodes.forEach((node) => {
        const pulse = 1 + (Math.sin(time * 2.1 + node.userData.phase) * 0.16) + (interaction * 0.28);
        node.scale.setScalar(pulse);
      });
    },
  };
}

function createDesignGlobe(THREE, track, root, materials, seed) {
  const globe = createGlobeBase(THREE, track, root, materials, seed);
  const panelGeometry = track(new THREE.BoxGeometry(0.68, 0.46, 0.07));
  const panels = Array.from({ length: 12 }, (_, index) => {
    const normal = sphericalPoint(THREE, 1, index, 12, 1.1);
    const panel = new THREE.Mesh(panelGeometry, materials[index % materials.length]);
    panel.userData = { normal, baseRotation: 0.08 * (index - 5.5), phase: index * 0.5 };
    panel.position.copy(normal).multiplyScalar(2.18);
    panel.lookAt(0, 0, 0);
    panel.rotateZ(panel.userData.baseRotation);
    globe.group.add(panel);
    return panel;
  });

  return {
    scale: 1.08,
    update(time, pointer, interaction) {
      globe.update(time, pointer, interaction, 0.68);
      panels.forEach((panel, index) => {
        const distance = 2.18 + (interaction * (0.18 + ((index % 3) * 0.08)));
        panel.position.copy(panel.userData.normal).multiplyScalar(distance);
        panel.lookAt(0, 0, 0);
        panel.rotateZ(panel.userData.baseRotation + (Math.sin(time + panel.userData.phase) * 0.05));
      });
    },
  };
}

function createDevelopmentGlobe(THREE, track, root, materials, seed) {
  const globe = createGlobeBase(THREE, track, root, materials, seed);
  const blockGeometry = track(new THREE.BoxGeometry(0.28, 0.28, 0.28));
  const blocks = Array.from({ length: 30 }, (_, index) => {
    const normal = sphericalPoint(THREE, 1, index, 30, 0.72);
    const block = new THREE.Mesh(blockGeometry, materials[(index + 2) % materials.length]);
    block.position.copy(normal).multiplyScalar(1.92 + ((index % 3) * 0.08));
    block.userData = { normal, phase: index * 0.33, layer: index % 3 };
    globe.group.add(block);
    return block;
  });

  return {
    scale: 1.08,
    update(time, pointer, interaction) {
      globe.update(time, pointer, interaction, 0.92);
      blocks.forEach((block) => {
        const { normal, phase, layer } = block.userData;
        const distance = 1.92 + (layer * 0.08) + (Math.sin(time * 1.3 + phase) * 0.035) + (interaction * 0.2);
        block.position.copy(normal).multiplyScalar(distance);
        block.rotation.set(time * 0.18 + phase, time * 0.22, interaction * 0.2);
        block.scale.setScalar(1 + (interaction * 0.18));
      });
    },
  };
}

function createContentGlobe(THREE, track, root, materials, seed) {
  const globe = createGlobeBase(THREE, track, root, materials, seed);
  const pageGeometry = track(new THREE.BoxGeometry(0.58, 0.78, 0.08));
  const barGeometry = track(new THREE.BoxGeometry(0.34, 0.035, 0.025));
  const pages = Array.from({ length: 10 }, (_, index) => {
    const pageGroup = new THREE.Group();
    const page = new THREE.Mesh(pageGeometry, materials[(index + 1) % materials.length]);
    pageGroup.add(page);
    [-0.18, -0.04, 0.1].forEach((y, barIndex) => {
      const bar = new THREE.Mesh(barGeometry, materials[(index + barIndex + 2) % materials.length]);
      bar.position.set(0, y, 0.065);
      bar.scale.x = 1 - (barIndex * 0.16);
      pageGroup.add(bar);
    });
    pageGroup.userData = {
      angle: (index / 10) * Math.PI * 2,
      band: index % 2 ? 0.62 : -0.62,
      phase: index * 0.54,
    };
    globe.group.add(pageGroup);
    return pageGroup;
  });

  return {
    scale: 1.05,
    update(time, pointer, interaction) {
      globe.update(time, pointer, interaction, 0.62);
      pages.forEach((page, index) => {
        const angle = page.userData.angle + (time * (0.12 + ((index % 2) * 0.025)));
        const radius = 2.25 + (interaction * 0.24);
        page.position.set(Math.cos(angle) * radius, page.userData.band + (Math.sin(time + page.userData.phase) * 0.12), Math.sin(angle) * radius);
        page.lookAt(0, page.userData.band, 0);
        page.rotateZ(Math.sin(time * 0.7 + index) * 0.035);
      });
    },
  };
}

function createRepairGlobe(THREE, track, root, materials, seed) {
  const globe = createGlobeBase(THREE, track, root, materials, seed);
  const scanRing = new THREE.Mesh(track(new THREE.TorusGeometry(1.98, 0.065, 8, 96)), materials[0]);
  scanRing.rotation.x = Math.PI / 2;
  globe.group.add(scanRing);
  const shardGeometry = track(new THREE.TetrahedronGeometry(0.22, 0));
  const shards = Array.from({ length: 12 }, (_, index) => {
    const normal = sphericalPoint(THREE, 1, index, 12, -0.35);
    normal.x = Math.abs(normal.x);
    normal.normalize();
    const shard = new THREE.Mesh(shardGeometry, materials[(index + 1) % materials.length]);
    shard.userData = { normal, phase: index * 0.58, scatter: 0.36 + ((index % 4) * 0.08) };
    shard.position.copy(normal).multiplyScalar(2.18 + shard.userData.scatter);
    globe.group.add(shard);
    return shard;
  });

  return {
    scale: 1.08,
    update(time, pointer, interaction) {
      globe.update(time, pointer, interaction, 0.76);
      scanRing.position.y = Math.sin(time * 0.7) * 1.25;
      scanRing.scale.setScalar(0.72 + (Math.cos(time * 0.7) * 0.14));
      scanRing.rotation.z = time * 0.18;
      shards.forEach((shard, index) => {
        const { normal, phase, scatter } = shard.userData;
        const distance = 2.18 + (scatter * (1 - (interaction * 0.78))) + (Math.sin(time + phase) * 0.05);
        shard.position.copy(normal).multiplyScalar(distance);
        shard.rotation.set(time * 0.35 + index, time * 0.28, phase);
      });
    },
  };
}

function createShieldGlobe(THREE, track, root, materials, seed) {
  const globe = createGlobeBase(THREE, track, root, materials, seed);
  const shieldMaterial = track(new THREE.MeshBasicMaterial({
    color: palette[(seed + 2) % palette.length],
    wireframe: true,
    transparent: true,
    opacity: 0.28,
  }));
  const shields = [2.15, 2.42, 2.7].map((radius, index) => {
    const shield = new THREE.Mesh(track(new THREE.OctahedronGeometry(radius, 1)), shieldMaterial);
    shield.scale.set(1, 1.12, 0.62);
    shield.userData = { index, radius };
    globe.group.add(shield);
    return shield;
  });
  const guards = createOrbitalMarkers(THREE, track, globe.group, materials, 7);

  return {
    scale: 0.98,
    update(time, pointer, interaction) {
      globe.update(time, pointer, interaction, 0.58);
      shields.forEach((shield, index) => {
        shield.rotation.set(time * (0.035 + (index * 0.01)), time * (index % 2 ? -0.08 : 0.08), index * 0.52);
        shield.scale.set(
          1 + (interaction * index * 0.045),
          1.12 + (interaction * index * 0.055),
          0.62 + (interaction * 0.05),
        );
      });
      updateOrbitalMarkers(guards, time, interaction, 0.68);
    },
  };
}

function createVelocityGlobe(THREE, track, root, materials, seed) {
  const globe = createGlobeBase(THREE, track, root, materials, seed);
  const velocityRings = Array.from({ length: 7 }, (_, index) => {
    const ring = new THREE.Mesh(
      track(new THREE.TorusGeometry(2.26 + (index * 0.1), 0.028, 5, 96)),
      materials[index % materials.length],
    );
    ring.rotation.set(index * 0.43, (index % 3) * 0.62, index * 0.26);
    ring.userData = { index, baseX: ring.rotation.x, baseY: ring.rotation.y, baseZ: ring.rotation.z };
    globe.group.add(ring);
    return ring;
  });
  const streakGeometry = track(new THREE.BoxGeometry(0.08, 0.08, 0.72));
  const streaks = Array.from({ length: 16 }, (_, index) => {
    const streak = new THREE.Mesh(streakGeometry, materials[(index + 2) % materials.length]);
    streak.userData = { angle: (index / 16) * Math.PI * 2, band: ((index % 4) - 1.5) * 0.42, phase: index * 0.42 };
    globe.group.add(streak);
    return streak;
  });

  return {
    scale: 1,
    update(time, pointer, interaction) {
      const speed = 1.18 + (interaction * 1.65);
      globe.update(time, pointer, interaction, speed);
      velocityRings.forEach((ring) => {
        ring.rotation.x = ring.userData.baseX + (time * 0.035 * speed);
        ring.rotation.y = ring.userData.baseY + (time * 0.055 * speed);
        ring.rotation.z = ring.userData.baseZ + (time * 0.08 * speed);
      });
      streaks.forEach((streak, index) => {
        const angle = streak.userData.angle + (time * (0.34 + ((index % 3) * 0.04)) * speed);
        const radius = 2.34 + (interaction * 0.26);
        streak.position.set(Math.cos(angle) * radius, streak.userData.band, Math.sin(angle) * radius);
        streak.rotation.set(0, -angle, Math.sin(time + streak.userData.phase) * 0.2);
        streak.scale.z = 1 + (interaction * 1.2);
      });
    },
  };
}

const sceneFactories = {
  "threejs-development": createArchitectureGlobe,
  "ai-automation": createNeuralGlobe,
  "website-design": createDesignGlobe,
  "website-development": createDevelopmentGlobe,
  "cms-solutions": createContentGlobe,
  "bug-fixing-responsiveness": createRepairGlobe,
  "website-maintenance-security": createShieldGlobe,
  "speed-optimization-seo": createVelocityGlobe,
};

export default function createPortfolioServiceScene(THREE, scene, track, serviceSlug) {
  const seed = hashSlug(serviceSlug);
  const materials = createMaterials(THREE, track, seed);
  const root = new THREE.Group();
  scene.add(root);
  const factory = sceneFactories[serviceSlug] || createConstellationGlobe;
  const controller = factory(THREE, track, root, materials, seed);
  let interaction = 0;

  controller.update(0, { x: 0, y: 0 }, 0);

  return {
    cameraPosition: [0, 0.2, 9.2],
    mobileCameraPosition: [0, 0.55, 10.6],
    lookAt: [0, 0, 0],
    resize(compact, width, height) {
      const horizontalOffset = Math.min(Math.max((width - 1050) / 560, 0), 1.2);
      const responsiveScale = Math.min(Math.max(height / 760, 0.94), 1.2);
      root.position.set(compact ? 0.45 : 2.2 + horizontalOffset, compact ? -1.05 : 0, 0);
      root.scale.setScalar((compact ? 0.68 : responsiveScale) * (controller.scale || 1));
    },
    update(time, pointer) {
      interaction += ((pointer.active ? 1 : 0) - interaction) * 0.07;
      const pointerX = pointer.x || 0;
      const pointerY = pointer.y || 0;
      root.rotation.y += (((pointerX * 0.12) + (Math.sin(time * 0.14) * 0.025)) - root.rotation.y) * 0.04;
      root.rotation.x += (((-0.035 - (pointerY * 0.08))) - root.rotation.x) * 0.04;
      controller.update(time, { x: pointerX, y: pointerY }, interaction);
    },
  };
}
