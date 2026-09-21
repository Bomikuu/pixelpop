export default function createTeamNetworkScene(THREE, scene, track) {
  const root = new THREE.Group();
  scene.add(root);

  const coreMaterial = track(new THREE.MeshStandardMaterial({
    color: 0x1570ef,
    roughness: 0.28,
    metalness: 0.62,
  }));
  const memberMaterial = track(new THREE.MeshStandardMaterial({
    color: 0x8fc4ff,
    roughness: 0.38,
    metalness: 0.42,
  }));
  const ringMaterial = track(new THREE.MeshStandardMaterial({
    color: 0x0b55c7,
    roughness: 0.34,
    metalness: 0.58,
    transparent: true,
    opacity: 0.78,
  }));
  const lineMaterial = track(new THREE.LineBasicMaterial({
    color: 0x75affc,
    transparent: true,
    opacity: 0.46,
  }));

  const core = new THREE.Mesh(track(new THREE.IcosahedronGeometry(0.82, 1)), coreMaterial);
  root.add(core);

  const orbit = new THREE.Mesh(track(new THREE.TorusGeometry(2.75, 0.025, 8, 96)), ringMaterial);
  orbit.rotation.x = Math.PI / 2.35;
  root.add(orbit);

  const positions = [
    [-2.45, 0.76, 0.2],
    [-0.72, -1.72, 0.55],
    [2.22, -0.9, -0.18],
    [1.34, 1.72, 0.35],
  ];

  const nodes = positions.map((position, index) => {
    const group = new THREE.Group();
    group.position.set(...position);

    const sphere = new THREE.Mesh(track(new THREE.SphereGeometry(0.38, 24, 18)), memberMaterial);
    group.add(sphere);

    const halo = new THREE.Mesh(track(new THREE.TorusGeometry(0.58, 0.035, 8, 48)), ringMaterial);
    halo.rotation.x = index % 2 === 0 ? 0.42 : -0.42;
    group.add(halo);
    root.add(group);

    const geometry = track(new THREE.BufferGeometry());
    geometry.setAttribute("position", new THREE.Float32BufferAttribute([
      0, 0, 0,
      position[0], position[1], position[2],
    ], 3));
    root.add(new THREE.Line(geometry, lineMaterial));

    return { group, sphere, halo, base: position, phase: index * 1.37 };
  });

  const satellites = Array.from({ length: 12 }, (_, index) => {
    const angle = (index / 12) * Math.PI * 2;
    const radius = 3.55 + ((index % 3) * 0.23);
    const satellite = new THREE.Mesh(
      track(new THREE.OctahedronGeometry(index % 4 === 0 ? 0.11 : 0.07, 0)),
      index % 4 === 0 ? coreMaterial : memberMaterial,
    );
    satellite.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.58, (index % 2) * 0.35);
    root.add(satellite);
    return { satellite, angle, radius, phase: index * 0.31 };
  });

  return {
    cameraPosition: [0, 0.4, 9],
    mobileCameraPosition: [0, 0.5, 11.2],
    lookAt: [0, 0, 0],
    resize(compact) {
      root.position.set(compact ? 0.65 : 2.25, compact ? -0.3 : 0, 0);
      root.scale.setScalar(compact ? 0.72 : 1);
    },
    update(elapsed, pointer) {
      root.rotation.y += ((pointer.x * 0.16) - root.rotation.y) * 0.035;
      root.rotation.x += ((pointer.y * -0.08) - root.rotation.x) * 0.035;
      core.rotation.x = elapsed * 0.24;
      core.rotation.y = elapsed * 0.38;
      orbit.rotation.z = elapsed * 0.08;

      nodes.forEach(({ group, sphere, halo, base, phase }) => {
        group.position.y = base[1] + (Math.sin((elapsed * 1.1) + phase) * 0.09);
        sphere.scale.setScalar(1 + (Math.sin((elapsed * 1.5) + phase) * 0.035));
        halo.rotation.z = elapsed * (phase % 2 === 0 ? 0.22 : -0.18);
      });

      satellites.forEach(({ satellite, angle, radius, phase }) => {
        const nextAngle = angle + (elapsed * 0.035);
        satellite.position.x = Math.cos(nextAngle) * radius;
        satellite.position.y = Math.sin(nextAngle) * radius * 0.58;
        satellite.rotation.y = elapsed + phase;
      });
    },
  };
}
