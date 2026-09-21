import { useEffect, useRef } from "react";
import createPortfolioServiceScene from "./createPortfolioServiceScene";

export default function PortfolioServiceHeroScene({ serviceSlug }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disposed = false;
    let frameId = 0;
    let cleanup = () => {};

    async function initialize() {
      const THREE = await import("../components/threeRuntime");
      if (disposed) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setClearColor(0xffffff, 0);
      renderer.domElement.className = "block size-full opacity-0 transition-opacity duration-500";
      renderer.domElement.setAttribute("aria-hidden", "true");
      mount.appendChild(renderer.domElement);

      const resources = new Set();
      const track = (resource) => {
        resources.add(resource);
        return resource;
      };

      scene.add(new THREE.HemisphereLight(0xffffff, 0xdbe7ff, 2.6));
      const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
      keyLight.position.set(5, 7, 6);
      scene.add(keyLight);
      const rimLight = new THREE.DirectionalLight(0x9bb6ff, 2.1);
      rimLight.position.set(-5, 1, -4);
      scene.add(rimLight);

      const controller = createPortfolioServiceScene(THREE, scene, track, serviceSlug);
      const pointer = { x: 0, y: 0, active: false };
      const interactionTarget = mount.parentElement || mount;
      const handlePointerMove = (event) => {
        const bounds = mount.getBoundingClientRect();
        pointer.x = (((event.clientX - bounds.left) / Math.max(bounds.width, 1)) - 0.5) * 2;
        pointer.y = (((event.clientY - bounds.top) / Math.max(bounds.height, 1)) - 0.5) * 2;
      };
      const handlePointerEnter = () => { pointer.active = true; };
      const handlePointerLeave = () => {
        pointer.active = false;
        pointer.x = 0;
        pointer.y = 0;
      };
      if (!reducedMotion) {
        interactionTarget.addEventListener("pointermove", handlePointerMove, { passive: true });
        interactionTarget.addEventListener("pointerenter", handlePointerEnter, { passive: true });
        interactionTarget.addEventListener("pointerleave", handlePointerLeave, { passive: true });
      }

      const resize = () => {
        const width = Math.max(mount.clientWidth, 1);
        const height = Math.max(mount.clientHeight, 1);
        const compact = width < 768;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.position.set(...(compact ? controller.mobileCameraPosition : controller.cameraPosition));
        camera.lookAt(...controller.lookAt);
        camera.updateProjectionMatrix();
        controller.resize?.(compact, width, height);
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
      const handleVisibility = () => {
        pageVisible = document.visibilityState === "visible";
      };
      viewportObserver.observe(mount);
      document.addEventListener("visibilitychange", handleVisibility);

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

      cleanup = () => {
        window.cancelAnimationFrame(frameId);
        if (!reducedMotion) {
          interactionTarget.removeEventListener("pointermove", handlePointerMove);
          interactionTarget.removeEventListener("pointerenter", handlePointerEnter);
          interactionTarget.removeEventListener("pointerleave", handlePointerLeave);
        }
        document.removeEventListener("visibilitychange", handleVisibility);
        viewportObserver.disconnect();
        resizeObserver.disconnect();
        resources.forEach((resource) => resource.dispose());
        renderer.dispose();
        renderer.domElement.remove();
      };
    }

    initialize().catch(() => {
      // The hero content and calls to action remain usable without WebGL.
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [serviceSlug]);

  return <div ref={mountRef} className="pointer-events-auto absolute inset-0 overflow-hidden" aria-hidden="true" />;
}
