import { useEffect, useRef } from "react";

const MODULES = [
  { position: [-1.75, 1.28, 0.1], scale: [1.45, 0.72, 0.55] },
  { position: [1.72, 1.05, -0.18], scale: [1.2, 0.84, 0.62] },
  { position: [-1.42, -1.18, -0.12], scale: [1.25, 0.78, 0.58] },
  { position: [1.62, -1.2, 0.18], scale: [1.48, 0.76, 0.52] },
];

const NODE_POINTS = [
  [-2.15, 1.42, 0.42],
  [-1.35, 1.12, 0.58],
  [0, 0.18, 0.82],
  [1.35, 1.22, 0.45],
  [2.12, 0.86, 0.12],
  [-1.83, -1.08, 0.34],
  [-0.92, -1.34, 0.5],
  [1.12, -1.06, 0.52],
  [2.06, -1.3, 0.24],
  [0.15, -0.42, 0.95],
];

const LINK_PAIRS = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5],
  [5, 6], [6, 9], [9, 7], [7, 8], [2, 9], [3, 7],
];

function createSeededRandom(seed = 29) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

export default function AstaHeroScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disposed = false;
    let frameId = 0;
    let cleanupScene = () => {};

    const initialize = async () => {
      const THREE = await import("../../portfolio/components/threeRuntime");
      if (disposed || !mount) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
      camera.position.set(0, 0, 8.4);

      const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setClearColor(0x061427, 1);
      renderer.domElement.setAttribute("aria-hidden", "true");
      renderer.domElement.className = "block h-full w-full opacity-0 transition-opacity duration-500 ease-out";
      mount.appendChild(renderer.domElement);

      const root = new THREE.Group();
      scene.add(root);

      const disposables = new Set();
      const track = (resource) => {
        disposables.add(resource);
        return resource;
      };

      const moduleLineMaterial = track(new THREE.LineBasicMaterial({
        color: 0x4a9bff,
        transparent: true,
        opacity: 0.42,
      }));
      const moduleFillMaterial = track(new THREE.MeshBasicMaterial({
        color: 0x0d2d54,
        transparent: true,
        opacity: 0.22,
      }));

      MODULES.forEach(({ position, scale }) => {
        const boxGeometry = track(new THREE.BoxGeometry(...scale));
        const fill = new THREE.Mesh(boxGeometry, moduleFillMaterial);
        fill.position.set(...position);
        root.add(fill);

        const edgeGeometry = track(new THREE.EdgesGeometry(boxGeometry));
        const outline = new THREE.LineSegments(edgeGeometry, moduleLineMaterial);
        outline.position.set(...position);
        root.add(outline);
      });

      const coreGeometry = track(new THREE.IcosahedronGeometry(1.12, 1));
      const coreMaterial = track(new THREE.MeshBasicMaterial({
        color: 0x8fc4ff,
        transparent: true,
        opacity: 0.3,
        wireframe: true,
      }));
      const core = new THREE.Mesh(coreGeometry, coreMaterial);
      core.position.set(0.1, 0, 0.25);
      root.add(core);

      const architectureMaterial = track(new THREE.LineBasicMaterial({
        color: 0x2b79dc,
        transparent: true,
        opacity: 0.22,
      }));
      [
        { scale: [2.65, 2.65, 2.65], rotation: [0.22, 0.38, 0.08] },
        { scale: [3.35, 1.95, 2.75], rotation: [-0.28, -0.18, 0.2] },
      ].forEach(({ scale, rotation }) => {
        const frameBox = track(new THREE.BoxGeometry(...scale));
        const frameGeometry = track(new THREE.EdgesGeometry(frameBox));
        const frame = new THREE.LineSegments(frameGeometry, architectureMaterial);
        frame.position.set(0.1, 0, 0.25);
        frame.rotation.set(...rotation);
        root.add(frame);
      });

      const nodeGeometry = track(new THREE.SphereGeometry(0.065, 12, 12));
      const nodeMaterial = track(new THREE.MeshBasicMaterial({ color: 0xd7eaff }));
      NODE_POINTS.forEach((point, index) => {
        const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
        node.position.set(...point);
        node.scale.setScalar(index === 2 || index === 9 ? 1.45 : 1);
        root.add(node);
      });

      const linkVertices = LINK_PAIRS.flatMap(([start, end]) => [
        new THREE.Vector3(...NODE_POINTS[start]),
        new THREE.Vector3(...NODE_POINTS[end]),
      ]);
      const linkGeometry = track(new THREE.BufferGeometry().setFromPoints(linkVertices));
      const linkMaterial = track(new THREE.LineBasicMaterial({
        color: 0x6faaf2,
        transparent: true,
        opacity: 0.32,
      }));
      root.add(new THREE.LineSegments(linkGeometry, linkMaterial));

      const signalGeometry = track(new THREE.SphereGeometry(0.043, 10, 10));
      const signalMaterial = track(new THREE.MeshBasicMaterial({ color: 0x1570ef }));
      const signals = Array.from({ length: 7 }, (_, index) => {
        const pair = LINK_PAIRS[(index * 2) % LINK_PAIRS.length];
        const signal = new THREE.Mesh(signalGeometry, signalMaterial);
        root.add(signal);
        return {
          mesh: signal,
          from: new THREE.Vector3(...NODE_POINTS[pair[0]]),
          to: new THREE.Vector3(...NODE_POINTS[pair[1]]),
          phase: index / 7,
        };
      });

      const random = createSeededRandom();
      const ambientPositions = [];
      for (let index = 0; index < 72; index += 1) {
        ambientPositions.push(
          (random() - 0.5) * 11,
          (random() - 0.5) * 6.8,
          -1.4 - (random() * 2.8),
        );
      }
      const ambientGeometry = track(new THREE.BufferGeometry());
      ambientGeometry.setAttribute("position", new THREE.Float32BufferAttribute(ambientPositions, 3));
      const ambientMaterial = track(new THREE.PointsMaterial({
        color: 0x4a9bff,
        size: 0.025,
        transparent: true,
        opacity: 0.35,
      }));
      scene.add(new THREE.Points(ambientGeometry, ambientMaterial));

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
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        const compact = width < 860;
        root.position.set(compact ? 0.25 : 1.8, compact ? 1.12 : 0, 0);
        root.scale.setScalar(compact ? 0.82 : Math.min(1.18, 0.92 + (width / 4200)));
        renderer.render(scene, camera);
      };
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(mount);
      resize();
      renderer.domElement.classList.replace("opacity-0", "opacity-100");

      let inViewport = true;
      let pageVisible = document.visibilityState === "visible";
      const visibilityObserver = new IntersectionObserver(([entry]) => {
        inViewport = entry.isIntersecting;
      });
      const onVisibilityChange = () => {
        pageVisible = document.visibilityState === "visible";
      };
      visibilityObserver.observe(mount);
      document.addEventListener("visibilitychange", onVisibilityChange);

      const animate = (time) => {
        if (disposed) return;
        if (inViewport && pageVisible) {
          const elapsed = time * 0.001;
          root.rotation.y += ((pointer.x * 0.09) - root.rotation.y) * 0.025;
          root.rotation.x += ((-pointer.y * 0.045) - root.rotation.x) * 0.025;
          core.rotation.x = elapsed * 0.09;
          core.rotation.y = elapsed * 0.13;

          signals.forEach((signal, index) => {
            const progress = (elapsed * (0.105 + (index * 0.004)) + signal.phase) % 1;
            signal.mesh.position.copy(signal.from).lerp(signal.to, progress);
          });
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
        visibilityObserver.disconnect();
        resizeObserver.disconnect();
        disposables.forEach((resource) => resource.dispose());
        renderer.dispose();
        renderer.domElement.remove();
      };
    };

    initialize().catch(() => {
      // The navy hero and semantic content remain usable when WebGL is unavailable.
    });

    return () => {
      disposed = true;
      cleanupScene();
    };
  }, []);

  return <div ref={mountRef} className="pointer-events-auto absolute inset-0 z-0 overflow-hidden" aria-hidden="true" />;
}
