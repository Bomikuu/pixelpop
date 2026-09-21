import { useEffect, useRef } from "react";

const nodePositions = [
  [-2.1, 1.15, 0.3],
  [-0.95, 1.95, -0.6],
  [0.65, 1.55, 0.65],
  [2.05, 0.55, -0.2],
  [1.55, -1.25, 0.75],
  [0.05, -1.9, -0.45],
  [-1.8, -1.05, 0.55],
  [0.1, 0.05, 2.05],
];

export default function SourceMapScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!mount) return undefined;

    let disposed = false;
    let frameId = 0;
    let cleanupScene = () => {};

    const initialize = async () => {
      const THREE = await import("./threeRuntime");
      if (disposed || !mount) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
      camera.position.set(0, 0, 8.4);

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setClearColor(0x000000, 0);
      renderer.domElement.setAttribute("aria-hidden", "true");
      mount.appendChild(renderer.domElement);

      const graph = new THREE.Group();
      scene.add(graph);

      const shellGeometry = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.45, 2));
      const shellMaterial = new THREE.LineBasicMaterial({ color: 0x1746df, transparent: true, opacity: 0.72 });
      const shell = new THREE.LineSegments(shellGeometry, shellMaterial);
      graph.add(shell);

      const innerGeometry = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.55, 1));
      const innerMaterial = new THREE.LineBasicMaterial({ color: 0x315ecf, transparent: true, opacity: 0.34 });
      const innerShell = new THREE.LineSegments(innerGeometry, innerMaterial);
      innerShell.rotation.set(0.4, 0.65, 0.1);
      graph.add(innerShell);

      const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x2f5bff, wireframe: true, transparent: true, opacity: 0.26 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(3.05, 0.012, 8, 128), ringMaterial);
      ring.rotation.set(1.08, 0.32, 0.14);
      graph.add(ring);

      const nodeGeometry = new THREE.SphereGeometry(0.085, 14, 14);
      const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0x2f5bff });
      const coreMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
      nodePositions.forEach(([x, y, z], index) => {
        const node = new THREE.Mesh(nodeGeometry, index === 7 ? coreMaterial : nodeMaterial);
        node.position.set(x, y, z);
        graph.add(node);
      });

      const linkPoints = nodePositions.flatMap((point, index) => {
        const next = nodePositions[(index + 3) % nodePositions.length];
        return [new THREE.Vector3(...point), new THREE.Vector3(...next)];
      });
      const linkGeometry = new THREE.BufferGeometry().setFromPoints(linkPoints);
      const linkMaterial = new THREE.LineBasicMaterial({ color: 0x315ecf, transparent: true, opacity: 0.38 });
      const links = new THREE.LineSegments(linkGeometry, linkMaterial);
      graph.add(links);

      const particlePositions = [];
      for (let index = 0; index < 90; index += 1) {
        particlePositions.push(
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 5,
        );
      }
      const particleGeometry = new THREE.BufferGeometry();
      particleGeometry.setAttribute("position", new THREE.Float32BufferAttribute(particlePositions, 3));
      const particleMaterial = new THREE.PointsMaterial({ color: 0x2f5bff, size: 0.045, transparent: true, opacity: 0.5 });
      const particles = new THREE.Points(particleGeometry, particleMaterial);
      scene.add(particles);

      const pointer = { x: 0, y: 0 };
      const onPointerMove = (event) => {
        pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
        pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
      };
      if (!reducedMotion) window.addEventListener("pointermove", onPointerMove, { passive: true });

      const resize = () => {
        const width = mount.clientWidth;
        const height = mount.clientHeight;
        renderer.setSize(width, height, false);
        camera.aspect = width / Math.max(height, 1);
        camera.updateProjectionMatrix();
        graph.position.x = width >= 1100 ? 2.6 : width >= 760 ? 1.4 : 0.65;
        graph.position.y = height < 520 ? -0.2 : -0.05;
        graph.scale.setScalar(width < 420 ? 0.78 : width < 760 ? 0.92 : width > 1280 ? 1.08 : 1);
        renderer.render(scene, camera);
      };
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(mount);
      resize();

      let active = true;
      const visibilityObserver = new IntersectionObserver(([entry]) => {
        active = entry.isIntersecting;
      });
      visibilityObserver.observe(mount);

      const animate = () => {
        if (disposed) return;
        if (active) {
          graph.rotation.y += 0.0022;
          graph.rotation.x += ((pointer.y * 0.12) - graph.rotation.x) * 0.035;
          graph.rotation.z += ((pointer.x * -0.08) - graph.rotation.z) * 0.035;
          camera.position.x += ((pointer.x * 0.28) - camera.position.x) * 0.025;
          camera.position.y += ((pointer.y * -0.2) - camera.position.y) * 0.025;
          particles.rotation.y -= 0.00045;
          particles.rotation.x = pointer.y * 0.03;
          renderer.render(scene, camera);
        }
        frameId = window.requestAnimationFrame(animate);
      };
      if (reducedMotion) {
        renderer.render(scene, camera);
      } else {
        animate();
      }

      cleanupScene = () => {
        window.cancelAnimationFrame(frameId);
        if (!reducedMotion) window.removeEventListener("pointermove", onPointerMove);
        visibilityObserver.disconnect();
        resizeObserver.disconnect();
        shellGeometry.dispose();
        shellMaterial.dispose();
        innerGeometry.dispose();
        innerMaterial.dispose();
        ring.geometry.dispose();
        ringMaterial.dispose();
        nodeGeometry.dispose();
        nodeMaterial.dispose();
        coreMaterial.dispose();
        linkGeometry.dispose();
        linkMaterial.dispose();
        particleGeometry.dispose();
        particleMaterial.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    };

    const loadObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        loadObserver.disconnect();
        window.requestAnimationFrame(initialize);
      }
    }, { rootMargin: "360px" });
    loadObserver.observe(mount);

    return () => {
      disposed = true;
      loadObserver.disconnect();
      cleanupScene();
    };
  }, []);

  return <div ref={mountRef} className="portfolio-three-field pointer-events-none absolute inset-0 z-0" aria-hidden="true" />;
}
