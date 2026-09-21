import { useEffect, useRef } from "react";

const pageLayouts = [
  { color: 0xf8fafc, position: [-1.25, 0.3, 0.25], rotation: [-0.08, 0.28, -0.14], scale: 1 },
  { color: 0x2f5bff, position: [1.15, 0.15, -0.45], rotation: [0.1, -0.34, 0.12], scale: 0.82 },
  { color: 0x0b1733, position: [0.2, -0.85, 0.7], rotation: [-0.18, -0.08, 0.04], scale: 0.68 },
];

function createEditorialPage(THREE, track, layout, index) {
  const page = new THREE.Group();
  const geometry = track(new THREE.BoxGeometry(2.3, 3.05, 0.06));
  const material = track(new THREE.MeshStandardMaterial({
    color: layout.color,
    metalness: index === 0 ? 0.04 : 0.12,
    roughness: index === 0 ? 0.76 : 0.58,
  }));
  const sheet = new THREE.Mesh(geometry, material);
  page.add(sheet);

  const edgeMaterial = track(new THREE.LineBasicMaterial({
    color: index === 0 ? 0x2f5bff : 0xb8c7ff,
    transparent: true,
    opacity: index === 0 ? 0.72 : 0.56,
  }));
  const edges = new THREE.LineSegments(track(new THREE.EdgesGeometry(geometry)), edgeMaterial);
  page.add(edges);

  const ink = index === 0 ? 0x173a9d : 0xe8edff;
  const lineMaterial = track(new THREE.LineBasicMaterial({ color: ink, transparent: true, opacity: 0.62 }));
  const linePoints = [];
  const widths = [1.45, 1.72, 1.22, 1.58, 0.92];
  widths.forEach((width, lineIndex) => {
    const y = 0.72 - lineIndex * 0.34;
    linePoints.push(
      new THREE.Vector3(-0.82, y, 0.041),
      new THREE.Vector3(-0.82 + width, y, 0.041),
    );
  });
  const lines = new THREE.LineSegments(track(new THREE.BufferGeometry().setFromPoints(linePoints)), lineMaterial);
  page.add(lines);

  const marker = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.09, 12, 12)),
    track(new THREE.MeshBasicMaterial({ color: index === 0 ? 0x2f5bff : 0xffffff })),
  );
  marker.position.set(-0.82, 1.12, 0.08);
  page.add(marker);

  page.position.set(...layout.position);
  page.rotation.set(...layout.rotation);
  page.scale.setScalar(layout.scale);
  page.userData = { baseY: layout.position[1], phase: index * 1.85 };
  return page;
}

export default function ArticleHeroScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    const host = mount?.parentElement;
    if (!mount || !host) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disposed = false;
    let frameId = 0;
    let cleanupScene = () => {};

    async function initialize() {
      const THREE = await import("../components/threeRuntime");
      if (disposed) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.4));
      renderer.setClearColor(0x000000, 0);
      renderer.domElement.className = "block size-full opacity-0 transition-opacity duration-500 ease-out";
      renderer.domElement.setAttribute("aria-hidden", "true");
      mount.appendChild(renderer.domElement);

      const resources = new Set();
      const track = (resource) => {
        resources.add(resource);
        return resource;
      };

      scene.add(new THREE.HemisphereLight(0xffffff, 0xb9c8ec, 2.45));
      const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
      keyLight.position.set(3, 5, 7);
      scene.add(keyLight);
      const rimLight = new THREE.DirectionalLight(0x2f5bff, 2.1);
      rimLight.position.set(-5, 1, -4);
      scene.add(rimLight);

      const root = new THREE.Group();
      scene.add(root);

      const pages = pageLayouts.map((layout, index) => {
        const page = createEditorialPage(THREE, track, layout, index);
        root.add(page);
        return page;
      });

      const orbit = new THREE.Mesh(
        track(new THREE.TorusGeometry(3.05, 0.014, 8, 128)),
        track(new THREE.MeshBasicMaterial({ color: 0x2f5bff, wireframe: true, transparent: true, opacity: 0.3 })),
      );
      orbit.rotation.set(1.04, 0.2, -0.18);
      root.add(orbit);

      const pointGeometry = track(new THREE.SphereGeometry(0.055, 10, 10));
      const pointMaterial = track(new THREE.MeshBasicMaterial({ color: 0x2f5bff }));
      const points = [
        [-2.75, 1.72, -0.6],
        [2.65, 1.2, 0.4],
        [2.15, -2.05, -0.2],
        [-2.42, -1.78, 0.55],
      ].map((position) => {
        const point = new THREE.Mesh(pointGeometry, pointMaterial);
        point.position.set(...position);
        root.add(point);
        return point;
      });

      const pointer = { x: 0, y: 0 };
      const onPointerMove = (event) => {
        const bounds = host.getBoundingClientRect();
        pointer.x = (((event.clientX - bounds.left) / Math.max(bounds.width, 1)) - 0.5) * 2;
        pointer.y = (((event.clientY - bounds.top) / Math.max(bounds.height, 1)) - 0.5) * 2;
      };
      if (!reducedMotion) host.addEventListener("pointermove", onPointerMove, { passive: true });

      const resize = () => {
        const width = Math.max(mount.clientWidth, 1);
        const height = Math.max(mount.clientHeight, 1);
        const compact = width < 768;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.position.set(0, 0, compact ? 9.4 : 8.6);
        camera.updateProjectionMatrix();
        root.position.set(compact ? 0.72 : 2.5, compact ? -2.1 : -0.1, 0);
        root.scale.setScalar(compact ? 0.62 : width > 1400 ? 1.06 : 0.92);
        renderer.render(scene, camera);
      };
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(mount);
      resize();
      renderer.domElement.classList.replace("opacity-0", "opacity-100");

      let inViewport = true;
      let pageVisible = document.visibilityState === "visible";
      const viewportObserver = new IntersectionObserver(([entry]) => {
        inViewport = entry.isIntersecting;
      }, { threshold: 0.05 });
      const onVisibilityChange = () => {
        pageVisible = document.visibilityState === "visible";
      };
      viewportObserver.observe(mount);
      document.addEventListener("visibilitychange", onVisibilityChange);

      const animate = (time) => {
        if (disposed) return;
        if (inViewport && pageVisible) {
          const seconds = time * 0.001;
          root.rotation.y += ((pointer.x * 0.12) - root.rotation.y) * 0.032;
          root.rotation.x += ((pointer.y * -0.08) - root.rotation.x) * 0.032;
          pages.forEach((page) => {
            page.position.y = page.userData.baseY + Math.sin(seconds * 0.65 + page.userData.phase) * 0.09;
          });
          points.forEach((point, index) => {
            point.scale.setScalar(0.82 + Math.sin(seconds * 1.1 + index) * 0.18);
          });
          orbit.rotation.z = -0.18 + seconds * 0.035;
          renderer.render(scene, camera);
        }
        frameId = window.requestAnimationFrame(animate);
      };

      if (reducedMotion) renderer.render(scene, camera);
      else frameId = window.requestAnimationFrame(animate);

      cleanupScene = () => {
        window.cancelAnimationFrame(frameId);
        if (!reducedMotion) host.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("visibilitychange", onVisibilityChange);
        viewportObserver.disconnect();
        resizeObserver.disconnect();
        resources.forEach((resource) => resource.dispose());
        renderer.dispose();
        renderer.domElement.remove();
      };
    }

    const loadObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        loadObserver.disconnect();
        window.requestAnimationFrame(() => {
          initialize().catch(() => {
            // The semantic hero remains complete when WebGL is unavailable.
          });
        });
      }
    }, { rootMargin: "160px" });
    loadObserver.observe(mount);

    return () => {
      disposed = true;
      loadObserver.disconnect();
      cleanupScene();
    };
  }, []);

  return <div ref={mountRef} className="pointer-events-none absolute inset-0" aria-hidden="true" />;
}
