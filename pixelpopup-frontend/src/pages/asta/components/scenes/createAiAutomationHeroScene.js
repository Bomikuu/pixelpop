export default function createAiAutomationHeroScene(THREE, scene, track) {
  const root = new THREE.Group();
  scene.add(root);

  const gateMaterial = track(new THREE.LineBasicMaterial({ color: 0x8fc4ff, transparent: true, opacity: 0.42 }));
  const tokenMaterials = [
    track(new THREE.MeshStandardMaterial({ color: 0x8fc4ff, roughness: 0.34, metalness: 0.4 })),
    track(new THREE.MeshStandardMaterial({ color: 0x1570ef, roughness: 0.3, metalness: 0.52 })),
    track(new THREE.MeshStandardMaterial({ color: 0x0f4f9d, roughness: 0.38, metalness: 0.46 })),
  ];
  const tokenGeometry = track(new THREE.BoxGeometry(0.24, 0.24, 0.24));

  [-1.7, 0, 1.7].forEach((x, index) => {
    const geometry = track(new THREE.BoxGeometry(index === 1 ? 0.9 : 0.72, 3.9, 3.1));
    const gate = new THREE.LineSegments(track(new THREE.EdgesGeometry(geometry)), gateMaterial);
    gate.position.x = x;
    gate.rotation.y = index === 1 ? 0.2 : -0.12;
    root.add(gate);
  });

  const coreGeometry = track(new THREE.IcosahedronGeometry(0.72, 1));
  const coreMaterial = track(new THREE.MeshStandardMaterial({ color: 0x1570ef, roughness: 0.22, metalness: 0.66, wireframe: true }));
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  root.add(core);

  const tokens = Array.from({ length: 26 }, (_, index) => {
    const token = new THREE.Mesh(tokenGeometry, tokenMaterials[index % tokenMaterials.length]);
    root.add(token);
    return { mesh: token, phase: index / 26, lane: (index % 3) - 1 };
  });

  const outputBars = [-1, 0, 1].map((lane) => {
    const bar = new THREE.Mesh(track(new THREE.BoxGeometry(1.5, 0.08, 0.08)), tokenMaterials[lane + 1]);
    bar.position.set(3.15, lane * 0.7, lane * 0.52);
    root.add(bar);
    return bar;
  });

  return {
    cameraPosition: [0, 0.5, 9.8],
    mobileCameraPosition: [0, 1.1, 11.2],
    lookAt: [0, 0, 0],
    resize(compact) {
      root.position.set(compact ? 0.7 : 2.15, compact ? 1.5 : 0, 0);
      root.scale.setScalar(compact ? 0.76 : 1);
    },
    update(elapsed, pointer) {
      root.rotation.y += ((pointer.x * 0.12) - root.rotation.y) * 0.035;
      root.rotation.x += ((pointer.y * -0.06) - root.rotation.x) * 0.035;
      core.rotation.x = elapsed * 0.32;
      core.rotation.y = elapsed * 0.48;
      const pulse = 1 + (Math.sin(elapsed * 2.1) * 0.08);
      core.scale.setScalar(pulse);

      tokens.forEach(({ mesh, phase, lane }) => {
        const progress = ((elapsed * 0.105) + phase) % 1;
        mesh.position.x = -4.25 + (progress * 8.5);
        const shaping = Math.max(0, (progress - 0.52) / 0.48);
        mesh.position.y = (lane * 0.62 * shaping) + (Math.sin((progress * Math.PI * 4) + lane) * 0.08);
        mesh.position.z = lane * 0.48 * shaping;
        mesh.rotation.x = elapsed + (phase * Math.PI);
        mesh.rotation.y = elapsed * 0.7;
      });
      outputBars.forEach((bar, index) => {
        bar.scale.x = 0.82 + (Math.sin((elapsed * 1.6) + index) * 0.12);
      });
    },
  };
}
