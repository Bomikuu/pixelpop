export default function createThreeDevelopmentHeroScene(THREE, scene, track) {
  const root = new THREE.Group();
  scene.add(root);

  const segmentGeometry = track(new THREE.BoxGeometry(0.18, 0.58, 0.32));
  const segmentMaterial = track(new THREE.MeshStandardMaterial({ color: 0x1570ef, roughness: 0.28, metalness: 0.64 }));
  const brightMaterial = track(new THREE.MeshStandardMaterial({ color: 0x8fc4ff, roughness: 0.2, metalness: 0.7 }));
  const frameMaterial = track(new THREE.LineBasicMaterial({ color: 0x5da5f6, transparent: true, opacity: 0.26 }));

  const segments = Array.from({ length: 40 }, (_, index) => {
    const progress = index / 39;
    const phase = index * 0.48;
    const segment = new THREE.Mesh(segmentGeometry, index % 7 === 0 ? brightMaterial : segmentMaterial);
    segment.position.set((progress - 0.5) * 6.7, Math.sin(phase) * 1.12, Math.cos(phase) * 1.02);
    segment.rotation.set(phase * 0.18, phase * 0.22, phase);
    segment.scale.y = 0.7 + ((index % 5) * 0.12);
    root.add(segment);
    return { mesh: segment, progress, phase, baseX: segment.position.x };
  });

  const ribbonPoints = segments.map(({ mesh }) => mesh.position.clone());
  const ribbonGeometry = track(new THREE.BufferGeometry().setFromPoints(ribbonPoints));
  const ribbonMaterial = track(new THREE.LineBasicMaterial({ color: 0x5da5f6, transparent: true, opacity: 0.46 }));
  root.add(new THREE.Line(ribbonGeometry, ribbonMaterial));

  [
    { size: [3.2, 3.2, 3.2], rotation: [0.25, 0.5, 0.12] },
    { size: [4.5, 2.25, 2.8], rotation: [-0.18, -0.32, 0.24] },
  ].forEach(({ size, rotation }) => {
    const geometry = track(new THREE.BoxGeometry(...size));
    const frame = new THREE.LineSegments(track(new THREE.EdgesGeometry(geometry)), frameMaterial);
    frame.rotation.set(...rotation);
    root.add(frame);
  });

  return {
    cameraPosition: [0, 0.35, 9.1],
    mobileCameraPosition: [0, 0.8, 10.8],
    lookAt: [0, 0, 0],
    resize(compact) {
      root.position.set(compact ? 0.65 : 1.9, compact ? 1.5 : 0, 0);
      root.scale.setScalar(compact ? 0.74 : 1);
    },
    update(elapsed, pointer) {
      root.rotation.y += (((pointer.x * 0.2) + (Math.sin(elapsed * 0.22) * 0.08)) - root.rotation.y) * 0.025;
      root.rotation.x += ((pointer.y * -0.08) - root.rotation.x) * 0.025;
      segments.forEach(({ mesh, phase, baseX }) => {
        mesh.position.x = baseX + (Math.sin((elapsed * 0.7) + phase) * 0.08);
        mesh.position.y = Math.sin(phase + (elapsed * 0.75)) * 1.12;
        mesh.rotation.z = phase + (elapsed * 0.16);
      });
    },
  };
}
