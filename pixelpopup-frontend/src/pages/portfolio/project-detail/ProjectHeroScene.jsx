import { useEffect, useRef } from "react";

function buildDineEaseScene(THREE, scene, track) {
  const root = new THREE.Group();
  scene.add(root);

  const plateMaterial = track(new THREE.MeshStandardMaterial({ color: 0x17365e, metalness: 0.32, roughness: 0.38 }));
  const bunMaterial = track(new THREE.MeshStandardMaterial({ color: 0xd9842f, emissive: 0x542307, emissiveIntensity: 0.28, roughness: 0.62 }));
  const bunHighlightMaterial = track(new THREE.MeshStandardMaterial({ color: 0xf2b35e, emissive: 0x613008, emissiveIntensity: 0.3, roughness: 0.58 }));
  const pattyMaterial = track(new THREE.MeshStandardMaterial({ color: 0x4a2116, roughness: 0.8 }));
  const cheeseMaterial = track(new THREE.MeshStandardMaterial({ color: 0xffc640, emissive: 0x5a3100, emissiveIntensity: 0.26, roughness: 0.48 }));
  const lettuceMaterial = track(new THREE.MeshStandardMaterial({ color: 0x4e9f52, emissive: 0x123817, emissiveIntensity: 0.24, roughness: 0.7 }));
  const tomatoMaterial = track(new THREE.MeshStandardMaterial({ color: 0xd94736, emissive: 0x4a100b, emissiveIntensity: 0.24, roughness: 0.62 }));
  const seedMaterial = track(new THREE.MeshStandardMaterial({ color: 0xffe2a8, roughness: 0.72 }));

  const plate = new THREE.Mesh(track(new THREE.CylinderGeometry(2.62, 2.82, 0.16, 48)), plateMaterial);
  plate.position.y = -1.35;
  root.add(plate);

  const plateInset = new THREE.Mesh(track(new THREE.CylinderGeometry(2.24, 2.36, 0.08, 48)), bunHighlightMaterial);
  plateInset.position.y = -1.24;
  root.add(plateInset);

  const burger = new THREE.Group();
  burger.rotation.y = -0.28;
  root.add(burger);

  const layers = [];
  const addLayer = (mesh, baseY, spreadWeight) => {
    mesh.position.y = baseY;
    burger.add(mesh);
    layers.push({ mesh, baseY, spreadWeight });
    return mesh;
  };

  const bottomBun = addLayer(
    new THREE.Mesh(track(new THREE.SphereGeometry(1.48, 32, 16)), bunMaterial),
    -0.82,
    -2.4,
  );
  bottomBun.scale.set(1, 0.3, 0.88);

  const lowerLettuce = addLayer(
    new THREE.Mesh(track(new THREE.TorusGeometry(1.05, 0.26, 8, 36)), lettuceMaterial),
    -0.5,
    -1.35,
  );
  lowerLettuce.rotation.x = Math.PI / 2;
  lowerLettuce.scale.set(1.12, 0.9, 0.48);

  const patty = addLayer(
    new THREE.Mesh(track(new THREE.CylinderGeometry(1.38, 1.46, 0.34, 36)), pattyMaterial),
    -0.24,
    -0.55,
  );

  const cheese = addLayer(
    new THREE.Mesh(track(new THREE.BoxGeometry(2.18, 0.09, 2.18)), cheeseMaterial),
    0.02,
    0.15,
  );
  cheese.rotation.y = Math.PI / 4;

  const tomato = addLayer(
    new THREE.Mesh(track(new THREE.CylinderGeometry(1.27, 1.27, 0.15, 32)), tomatoMaterial),
    0.25,
    0.85,
  );

  const upperLettuce = addLayer(
    new THREE.Mesh(track(new THREE.TorusGeometry(1.02, 0.24, 8, 36)), lettuceMaterial),
    0.46,
    1.5,
  );
  upperLettuce.rotation.x = Math.PI / 2;
  upperLettuce.scale.set(1.16, 0.92, 0.5);

  const topBun = addLayer(
    new THREE.Mesh(track(new THREE.SphereGeometry(1.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)), bunHighlightMaterial),
    0.62,
    2.5,
  );
  topBun.scale.set(1, 0.72, 0.9);

  const seedGeometry = track(new THREE.SphereGeometry(0.055, 8, 6));
  const seedPositions = [
    [-0.72, 1.14, 0.35], [-0.35, 1.28, 0.62], [0.02, 1.34, 0.7], [0.42, 1.25, 0.58],
    [0.75, 1.08, 0.32], [-0.55, 1.34, -0.05], [-0.18, 1.44, 0.12], [0.25, 1.42, 0.08],
    [0.6, 1.29, -0.06], [-0.2, 1.35, -0.42], [0.25, 1.31, -0.46],
  ];
  const seeds = seedPositions.map(([x, y, z], index) => {
    const seed = new THREE.Mesh(seedGeometry, seedMaterial);
    seed.position.set(x, y, z);
    seed.scale.set(1.8, 0.55, 0.75);
    seed.rotation.z = index % 2 ? 0.55 : -0.55;
    burger.add(seed);
    return { seed, baseY: y };
  });

  const steamWisps = [-0.55, 0, 0.55].map((x, index) => {
    const material = track(new THREE.LineBasicMaterial({ color: 0xb9dcff, transparent: true, opacity: 0.24 }));
    const geometry = track(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, 1.55, 0),
      new THREE.Vector3(x - 0.12, 1.92, 0),
      new THREE.Vector3(x + 0.08, 2.26, 0),
      new THREE.Vector3(x - 0.05, 2.58, 0),
    ]));
    const wisp = new THREE.Line(geometry, material);
    wisp.position.z = -0.2;
    root.add(wisp);
    return { wisp, material, offset: index * 1.7 };
  });

  return {
    cameraPosition: [0, 2.9, 7.4],
    mobileCameraPosition: [0, 3.25, 8.5],
    lookAt: [0, 0, 0],
    resize(compact) {
      root.position.set(compact ? 0.92 : 2.55, compact ? -0.46 : -0.04, 0);
      root.scale.setScalar(compact ? 0.58 : 0.78);
    },
    update(time, pointer) {
      const ingredientSpread = 0.035 + ((Math.sin(time * 0.7) + 1) / 2) * 0.055;
      layers.forEach(({ mesh, baseY, spreadWeight }, index) => {
        mesh.position.y = baseY + (spreadWeight * ingredientSpread) + Math.sin(time * 0.85 + index) * 0.012;
      });
      seeds.forEach(({ seed, baseY }, index) => {
        seed.position.y = baseY + (2.5 * ingredientSpread) + Math.sin(time * 0.85 + index * 0.2) * 0.012;
      });
      steamWisps.forEach(({ wisp, material, offset }) => {
        const cycle = (time * 0.22 + offset) % 1;
        wisp.position.y = cycle * 0.45;
        material.opacity = Math.sin(cycle * Math.PI) * 0.28;
      });
      plate.rotation.y = time * 0.05;
      burger.rotation.y += ((-0.28 + pointer.x * 0.18) - burger.rotation.y) * 0.035;
      burger.rotation.x += ((0.04 - pointer.y * 0.08) - burger.rotation.x) * 0.035;
    },
  };
}

const sceneBuilders = {
  dineease: buildDineEaseScene,
};

export default function ProjectHeroScene({ variant, className = "" }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    const buildScene = sceneBuilders[variant];
    if (!mount || !buildScene) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disposed = false;
    let frameId = 0;
    let cleanupScene = () => {};

    async function initialize() {
      const THREE = await import("../components/threeRuntime");
      if (disposed) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.4));
      renderer.setClearColor(0x071a33, 0);
      renderer.domElement.className = "block size-full opacity-0 transition-opacity duration-500 ease-out";
      renderer.domElement.setAttribute("aria-hidden", "true");
      mount.appendChild(renderer.domElement);

      const resources = new Set();
      const track = (resource) => {
        resources.add(resource);
        return resource;
      };

      scene.add(new THREE.HemisphereLight(0xbddcff, 0x07101f, 2.35));
      const keyLight = new THREE.DirectionalLight(0xffffff, 2.7);
      keyLight.position.set(5, 8, 6);
      scene.add(keyLight);
      const rimLight = new THREE.DirectionalLight(0x2f5bff, 2.4);
      rimLight.position.set(-4, 2, -5);
      scene.add(rimLight);

      const controller = buildScene(THREE, scene, track);
      const pointer = { x: 0, y: 0 };
      const onPointerMove = (event) => {
        const bounds = mount.getBoundingClientRect();
        pointer.x = (((event.clientX - bounds.left) / Math.max(bounds.width, 1)) - 0.5) * 2;
        pointer.y = (((event.clientY - bounds.top) / Math.max(bounds.height, 1)) - 0.5) * 2;
      };
      if (!reducedMotion) mount.addEventListener("pointermove", onPointerMove, { passive: true });

      const resize = () => {
        const width = Math.max(mount.clientWidth, 1);
        const height = Math.max(mount.clientHeight, 1);
        const compact = width < 768;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.position.set(...(compact ? controller.mobileCameraPosition : controller.cameraPosition));
        camera.lookAt(...controller.lookAt);
        camera.updateProjectionMatrix();
        controller.resize(compact, width, height);
        renderer.render(scene, camera);
      };
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(mount);
      resize();
      renderer.domElement.classList.replace("opacity-0", "opacity-100");

      let inViewport = true;
      let pageVisible = document.visibilityState === "visible";
      const viewportObserver = new IntersectionObserver(([entry]) => { inViewport = entry.isIntersecting; }, { threshold: 0.05 });
      const onVisibilityChange = () => { pageVisible = document.visibilityState === "visible"; };
      viewportObserver.observe(mount);
      document.addEventListener("visibilitychange", onVisibilityChange);

      const animate = (time) => {
        if (disposed) return;
        if (inViewport && pageVisible) {
          controller.update(time * 0.001, pointer);
          renderer.render(scene, camera);
        }
        frameId = window.requestAnimationFrame(animate);
      };
      if (reducedMotion) renderer.render(scene, camera);
      else frameId = window.requestAnimationFrame(animate);

      cleanupScene = () => {
        window.cancelAnimationFrame(frameId);
        if (!reducedMotion) mount.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("visibilitychange", onVisibilityChange);
        viewportObserver.disconnect();
        resizeObserver.disconnect();
        resources.forEach((resource) => resource.dispose());
        renderer.dispose();
        renderer.domElement.remove();
      };
    }

    initialize().catch(() => {
      // The semantic project hero remains usable when WebGL is unavailable.
    });
    return () => {
      disposed = true;
      cleanupScene();
    };
  }, [variant]);

  return <div ref={mountRef} className={`absolute inset-0 overflow-hidden ${className}`.trim()} aria-hidden="true" />;
}
