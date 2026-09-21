import { useEffect, useRef } from "react";

const ROAD_MARKERS = [-6, -3, 0, 3, 6];

export default function AstaThreeCarScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disposed = false;
    let frameId = 0;
    let cleanupScene = () => {};

    async function initialize() {
      const THREE = await import("../../portfolio/components/threeRuntime");
      if (disposed) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
      camera.position.set(5.8, 3.5, 7.8);
      camera.lookAt(0, 0.55, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setClearColor(0x07172c, 0);
      renderer.domElement.className = "block h-full w-full opacity-0 transition-opacity duration-500 ease-out";
      renderer.domElement.setAttribute("aria-hidden", "true");
      mount.appendChild(renderer.domElement);

      const resources = new Set();
      const track = (resource) => {
        resources.add(resource);
        return resource;
      };

      scene.add(new THREE.HemisphereLight(0xbad9ff, 0x07111f, 2.4));
      const keyLight = new THREE.DirectionalLight(0xffffff, 3.1);
      keyLight.position.set(4, 7, 5);
      scene.add(keyLight);
      const blueLight = new THREE.DirectionalLight(0x2f8cff, 2.2);
      blueLight.position.set(-4, 2, -3);
      scene.add(blueLight);

      const roadMaterial = track(new THREE.MeshStandardMaterial({ color: 0x0a1d36, roughness: 0.86, metalness: 0.14 }));
      const road = new THREE.Mesh(track(new THREE.BoxGeometry(15, 0.16, 4.4)), roadMaterial);
      road.position.y = -0.1;
      scene.add(road);

      const markerGeometry = track(new THREE.BoxGeometry(1.45, 0.025, 0.08));
      const markerMaterial = track(new THREE.MeshBasicMaterial({ color: 0x75b7ff, transparent: true, opacity: 0.62 }));
      const roadMarkers = ROAD_MARKERS.map((position) => {
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.set(position, 0.005, 1.36);
        scene.add(marker);
        return marker;
      });

      const car = new THREE.Group();
      car.position.set(0, 0.18, 0);
      scene.add(car);

      const bodyMaterial = track(new THREE.MeshStandardMaterial({ color: 0x1570ef, roughness: 0.28, metalness: 0.56 }));
      const darkMaterial = track(new THREE.MeshStandardMaterial({ color: 0x071427, roughness: 0.3, metalness: 0.58 }));
      const glassMaterial = track(new THREE.MeshStandardMaterial({ color: 0x9ed1ff, roughness: 0.12, metalness: 0.38, transparent: true, opacity: 0.76 }));
      const lightMaterial = track(new THREE.MeshBasicMaterial({ color: 0xd9efff }));
      const tailMaterial = track(new THREE.MeshBasicMaterial({ color: 0xff4d5f }));

      const lowerBody = new THREE.Mesh(track(new THREE.BoxGeometry(3.25, 0.62, 1.45)), bodyMaterial);
      lowerBody.position.y = 0.62;
      car.add(lowerBody);

      const hood = new THREE.Mesh(track(new THREE.BoxGeometry(1.02, 0.32, 1.34)), bodyMaterial);
      hood.position.set(1.55, 0.87, 0);
      car.add(hood);

      const cabin = new THREE.Mesh(track(new THREE.BoxGeometry(1.55, 0.7, 1.25)), glassMaterial);
      cabin.position.set(-0.25, 1.12, 0);
      cabin.rotation.z = -0.06;
      car.add(cabin);

      const bumper = new THREE.Mesh(track(new THREE.BoxGeometry(0.16, 0.22, 1.24)), darkMaterial);
      bumper.position.set(1.72, 0.43, 0);
      car.add(bumper);

      const headlights = [-0.43, 0.43].map((z) => {
        const light = new THREE.Mesh(track(new THREE.BoxGeometry(0.045, 0.18, 0.26)), lightMaterial);
        light.position.set(1.815, 0.72, z);
        car.add(light);
        return light;
      });
      const tailLights = [-0.43, 0.43].map((z) => {
        const light = new THREE.Mesh(track(new THREE.BoxGeometry(0.045, 0.16, 0.24)), tailMaterial);
        light.position.set(-1.655, 0.68, z);
        car.add(light);
        return light;
      });

      const wheelGeometry = track(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 24));
      const hubGeometry = track(new THREE.CylinderGeometry(0.17, 0.17, 0.315, 18));
      const wheelMaterial = track(new THREE.MeshStandardMaterial({ color: 0x02070d, roughness: 0.82, metalness: 0.12 }));
      const hubMaterial = track(new THREE.MeshStandardMaterial({ color: 0x8fc4ff, roughness: 0.22, metalness: 0.76 }));
      const wheels = [];
      [-1.08, 1.12].forEach((x) => {
        [-0.77, 0.77].forEach((z) => {
          const wheelAssembly = new THREE.Group();
          const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
          wheel.rotation.x = Math.PI / 2;
          wheelAssembly.add(wheel);
          const hub = new THREE.Mesh(hubGeometry, hubMaterial);
          hub.rotation.x = Math.PI / 2;
          wheelAssembly.add(hub);
          wheelAssembly.position.set(x, 0.42, z);
          car.add(wheelAssembly);
          wheels.push(wheelAssembly);
        });
      });

      const pointer = { x: 0, y: 0 };
      const onPointerMove = (event) => {
        const bounds = mount.getBoundingClientRect();
        pointer.x = ((event.clientX - bounds.left) / Math.max(bounds.width, 1)) - 0.5;
        pointer.y = ((event.clientY - bounds.top) / Math.max(bounds.height, 1)) - 0.5;
      };
      if (!reducedMotion) mount.addEventListener("pointermove", onPointerMove, { passive: true });

      const resize = () => {
        const width = Math.max(mount.clientWidth, 1);
        const height = Math.max(mount.clientHeight, 1);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.position.set(width < 620 ? 6.8 : 5.8, width < 620 ? 4.1 : 3.5, width < 620 ? 9.2 : 7.8);
        camera.lookAt(0, 0.55, 0);
        camera.updateProjectionMatrix();
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
          const elapsed = time * 0.001;
          car.position.y = 0.18 + Math.sin(elapsed * 2.4) * 0.018;
          car.rotation.y += ((pointer.x * 0.1) - car.rotation.y) * 0.035;
          car.rotation.z += (((-pointer.y * 0.025) + (Math.sin(elapsed * 1.7) * 0.008)) - car.rotation.z) * 0.04;
          wheels.forEach((wheel) => { wheel.rotation.z = -elapsed * 2.8; });
          roadMarkers.forEach((marker, index) => {
            const wrappedPosition = (((ROAD_MARKERS[index] - (elapsed * 2.15) + 7.5) % 15) + 15) % 15;
            marker.position.x = wrappedPosition - 7.5;
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
        viewportObserver.disconnect();
        resizeObserver.disconnect();
        resources.forEach((resource) => resource.dispose());
        renderer.dispose();
        renderer.domElement.remove();
      };
    }

    initialize().catch(() => {
      // The explanatory content remains available when WebGL is unavailable.
    });

    return () => {
      disposed = true;
      cleanupScene();
    };
  }, []);

  return (
    <div className="relative min-h-[25rem] overflow-hidden bg-[#07172c] sm:min-h-[31rem]">
      <div className="absolute inset-x-0 bottom-0 h-px bg-[#2e6fb5]" aria-hidden="true" />
      <div ref={mountRef} className="absolute inset-0 cursor-crosshair" aria-hidden="true" />
      <span className="absolute bottom-5 left-5 border-l border-[#5da5f6] pl-3 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#8fc4ff]">Interactive browser scene</span>
    </div>
  );
}
