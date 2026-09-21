export default function createServicesCapabilityScene(THREE, scene, track) {
  const root = new THREE.Group();
  scene.add(root);

  const platformMaterial = track(new THREE.MeshStandardMaterial({ color: 0x0a2443, roughness: 0.72, metalness: 0.28 }));
  const moduleMaterial = track(new THREE.MeshStandardMaterial({ color: 0x0f3f76, roughness: 0.42, metalness: 0.48 }));
  const accentMaterial = track(new THREE.MeshStandardMaterial({ color: 0x1570ef, roughness: 0.3, metalness: 0.58 }));
  const edgeMaterial = track(new THREE.LineBasicMaterial({ color: 0x8fc4ff, transparent: true, opacity: 0.38 }));

  const platform = new THREE.Mesh(track(new THREE.BoxGeometry(6.8, 0.18, 4.5)), platformMaterial);
  platform.position.y = -1.7;
  root.add(platform);

  const modules = Array.from({ length: 9 }, (_, index) => {
    const angle = (index / 9) * Math.PI * 2;
    const height = 0.9 + ((index % 4) * 0.42);
    const width = 0.62 + ((index % 3) * 0.14);
    const geometry = track(new THREE.BoxGeometry(width, height, 0.72));
    const module = new THREE.Mesh(geometry, index === 2 || index === 6 ? accentMaterial : moduleMaterial);
    const radiusX = 2.7;
    const radiusZ = 1.55;
    module.position.set(Math.cos(angle) * radiusX, -1.55 + (height / 2), Math.sin(angle) * radiusZ);
    module.rotation.y = -angle;
    root.add(module);

    const outline = new THREE.LineSegments(track(new THREE.EdgesGeometry(geometry)), edgeMaterial);
    outline.position.copy(module.position);
    outline.rotation.copy(module.rotation);
    root.add(outline);

    return { module, outline, baseY: module.position.y, phase: index * 0.7 };
  });

  const crossBeamGeometry = track(new THREE.BoxGeometry(5.5, 0.08, 0.12));
  [-0.72, 0.72].forEach((z) => {
    const beam = new THREE.Mesh(crossBeamGeometry, accentMaterial);
    beam.position.set(0, -1.5, z);
    root.add(beam);
  });

  return {
    cameraPosition: [0, 2.1, 9.4],
    mobileCameraPosition: [0, 2.8, 10.8],
    lookAt: [0, -0.2, 0],
    resize(compact) {
      root.position.set(compact ? 0.6 : 2.15, compact ? 1.2 : 0.2, 0);
      root.scale.setScalar(compact ? 0.8 : 1);
    },
    update(elapsed, pointer) {
      root.rotation.y = (elapsed * 0.08) + (pointer.x * 0.16);
      root.rotation.x += ((-0.12 - (pointer.y * 0.06)) - root.rotation.x) * 0.035;
      modules.forEach(({ module, outline, baseY, phase }) => {
        const nextY = baseY + (Math.sin((elapsed * 1.25) + phase) * 0.06);
        module.position.y = nextY;
        outline.position.y = nextY;
      });
    },
  };
}
