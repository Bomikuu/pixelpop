import React, { useEffect, useRef } from "react";

const COLORS = {
  ink: 0x111827,
  cyan: 0x67e8f9,
  pink: 0xff4fd8,
  yellow: 0xfde047,
  purple: 0x7c3aed,
  white: 0xffffff,
};

export default function ComponentsHeroScene() {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    let disposed = false;
    let frameId = 0;
    let renderer;
    let scene;
    let toybox;
    let resizeObserver;
    const pointer = { x: 0, y: 0 };
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onPointerMove = (event) => {
      const rect = host.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    host.addEventListener("pointermove", onPointerMove);

    import("three").then((THREE) => {
      if (disposed) return;

      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x4c1d95, 0.045);

      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
      camera.position.set(0, 0.25, 11);

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setClearColor(0x000000, 0);
      renderer.domElement.setAttribute("aria-hidden", "true");
      Object.assign(renderer.domElement.style, { width: "100%", height: "100%", pointerEvents: "none" });
      host.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(COLORS.white, 1.8));
      const cyanLight = new THREE.PointLight(COLORS.cyan, 30, 30);
      cyanLight.position.set(4, 4, 6);
      scene.add(cyanLight);
      const pinkLight = new THREE.PointLight(COLORS.pink, 22, 28);
      pinkLight.position.set(-4, -1, 4);
      scene.add(pinkLight);

      toybox = new THREE.Group();
      toybox.rotation.set(-0.09, -0.08, 0.01);
      scene.add(toybox);

      const addEdges = (mesh, opacity = 0.86) => {
        const edges = new THREE.LineSegments(
          new THREE.EdgesGeometry(mesh.geometry),
          new THREE.LineBasicMaterial({ color: COLORS.ink, transparent: true, opacity })
        );
        mesh.add(edges);
      };

      const makeBox = (width, height, depth, color, opacity = 1) => {
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(width, height, depth),
          new THREE.MeshStandardMaterial({
            color,
            roughness: 0.36,
            metalness: 0.08,
            transparent: opacity < 1,
            opacity,
          })
        );
        addEdges(mesh);
        return mesh;
      };

      const windowGroup = new THREE.Group();
      windowGroup.position.set(0.7, 0.05, 0.3);
      windowGroup.userData = { baseY: 0.05, phase: 0 };
      toybox.add(windowGroup);

      const windowBody = makeBox(5.25, 3.45, 0.22, COLORS.white, 0.96);
      windowGroup.add(windowBody);

      const titlebar = makeBox(5.25, 0.68, 0.3, COLORS.pink);
      titlebar.position.set(0, 1.39, 0.1);
      windowGroup.add(titlebar);

      [COLORS.yellow, COLORS.cyan, 0x34d399].forEach((color, index) => {
        const control = new THREE.Mesh(
          new THREE.SphereGeometry(0.14, 18, 18),
          new THREE.MeshStandardMaterial({ color, roughness: 0.3 })
        );
        control.position.set(-2.18 + index * 0.42, 1.4, 0.31);
        windowGroup.add(control);
      });

      const sidebar = makeBox(1.05, 2.12, 0.22, COLORS.purple);
      sidebar.position.set(-1.88, -0.33, 0.18);
      windowGroup.add(sidebar);

      [COLORS.cyan, COLORS.yellow, COLORS.pink].forEach((color, index) => {
        const card = makeBox(0.92, 0.78, 0.24, color);
        card.position.set(-0.55 + index * 1.18, 0.42, 0.2);
        windowGroup.add(card);
      });

      const textLine = makeBox(2.85, 0.18, 0.2, COLORS.ink);
      textLine.position.set(0.47, -0.5, 0.2);
      windowGroup.add(textLine);
      const shortLine = makeBox(1.95, 0.16, 0.2, COLORS.ink, 0.75);
      shortLine.position.set(0.02, -0.92, 0.2);
      windowGroup.add(shortLine);
      const button = makeBox(1.32, 0.48, 0.3, COLORS.cyan);
      button.position.set(1.24, -1.23, 0.22);
      windowGroup.add(button);

      const satelliteData = [
        [-3.35, 1.72, -0.45, 1.55, 1.08, COLORS.yellow, -0.15],
        [3.75, 1.45, -0.55, 1.42, 0.98, COLORS.cyan, 0.12],
        [-3.42, -1.55, -0.22, 1.75, 1.22, COLORS.cyan, 0.12],
        [3.55, -1.58, -0.32, 1.62, 1.12, COLORS.yellow, -0.1],
      ];

      satelliteData.forEach(([x, y, z, width, height, color, rotation], index) => {
        const panel = makeBox(width, height, 0.22, color, 0.96);
        panel.position.set(x, y, z);
        panel.rotation.z = rotation;
        panel.userData = { baseY: y, phase: 0.8 + index * 1.25 };
        toybox.add(panel);

        const inset = makeBox(width * 0.62, 0.15, 0.18, COLORS.white);
        inset.position.set(0, height * 0.12, 0.19);
        panel.add(inset);
        const insetShort = makeBox(width * 0.42, 0.13, 0.18, COLORS.ink, 0.75);
        insetShort.position.set(-width * 0.1, -height * 0.2, 0.19);
        panel.add(insetShort);
      });

      [
        [-4.35, 0.2, 0.4, COLORS.pink],
        [4.45, 0.15, -0.1, COLORS.yellow],
        [-2.25, 2.75, -0.6, COLORS.cyan],
        [2.65, -2.7, 0, COLORS.pink],
      ].forEach(([x, y, z, color], index) => {
        const sparkle = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.26, 0),
          new THREE.MeshStandardMaterial({ color, roughness: 0.2, metalness: 0.2 })
        );
        sparkle.position.set(x, y, z);
        sparkle.userData = { baseY: y, phase: index * 1.4, spin: true };
        toybox.add(sparkle);
      });

      [
        [-2.45, -0.15, 0.15, COLORS.pink, 0.62],
        [2.75, 0.1, -0.3, COLORS.cyan, 0.48],
      ].forEach(([x, y, z, color, size], index) => {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(size, 0.1, 12, 40),
          new THREE.MeshStandardMaterial({ color, roughness: 0.25, metalness: 0.2 })
        );
        ring.position.set(x, y, z);
        ring.rotation.set(0.7, 0.3, index ? -0.35 : 0.35);
        ring.userData = { baseY: y, phase: 2 + index, spin: true };
        toybox.add(ring);
      });

      const grid = new THREE.GridHelper(14, 20, COLORS.white, COLORS.white);
      grid.position.set(0.35, -3.25, -1.3);
      grid.material.transparent = true;
      grid.material.opacity = 0.14;
      toybox.add(grid);

      const resize = () => {
        if (!renderer || !host.clientWidth || !host.clientHeight) return;
        const width = host.clientWidth;
        const height = host.clientHeight;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        toybox.scale.setScalar(width < 640 ? 0.62 : width < 1024 ? 0.82 : 1.06);
        toybox.position.x = width < 640 ? 1.3 : width < 1024 ? 1.15 : 1.05;
      };

      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);
      resize();

      const render = (time = 0) => {
        if (disposed) return;
        const seconds = time * 0.001;

        if (!reducedMotion) {
          toybox.rotation.y += (pointer.x * 0.12 - 0.08 - toybox.rotation.y) * 0.028;
          toybox.rotation.x += (-pointer.y * 0.055 - 0.09 - toybox.rotation.x) * 0.028;
          toybox.children.forEach((child) => {
            if (typeof child.userData.baseY === "number") {
              child.position.y = child.userData.baseY + Math.sin(seconds * 0.72 + child.userData.phase) * 0.11;
            }
            if (child.userData.spin) {
              child.rotation.x += 0.004;
              child.rotation.y += 0.006;
            }
          });
        }

        renderer.render(scene, camera);
        if (!reducedMotion) frameId = window.requestAnimationFrame(render);
      };

      render();
    });

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      host.removeEventListener("pointermove", onPointerMove);
      resizeObserver?.disconnect();
      scene?.traverse((object) => {
        object.geometry?.dispose?.();
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose?.());
        else object.material?.dispose?.();
      });
      renderer?.dispose?.();
      renderer?.domElement?.remove?.();
    };
  }, []);

  return <div ref={hostRef} className="absolute inset-0" aria-hidden="true" />;
}
