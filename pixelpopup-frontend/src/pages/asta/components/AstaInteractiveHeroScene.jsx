import { useEffect, useRef } from "react";
import createAiAutomationHeroScene from "./scenes/createAiAutomationHeroScene";
import createServiceBannerScene from "./scenes/createServiceBannerScene";
import createServicesCapabilityScene from "./scenes/createServicesCapabilityScene";
import createTeamNetworkScene from "./scenes/createTeamNetworkScene";
import createThreeDevelopmentHeroScene from "./scenes/createThreeDevelopmentHeroScene";

const serviceBannerSlugs = [
  "website-design",
  "website-development",
  "cms-solutions",
  "bug-fixing-responsiveness",
  "website-maintenance-security",
  "speed-optimization-seo",
  "ai-automation",
  "threejs-development",
];

const sceneBuilders = {
  ai: createAiAutomationHeroScene,
  services: createServicesCapabilityScene,
  team: createTeamNetworkScene,
  threejs: createThreeDevelopmentHeroScene,
  ...Object.fromEntries(serviceBannerSlugs.map((slug) => [
    `service-banner-${slug}`,
    (THREE, scene, track) => createServiceBannerScene(THREE, scene, track, slug),
  ])),
};

export default function AstaInteractiveHeroScene({ variant, className = "" }) {
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
      const THREE = await import("../../portfolio/components/threeRuntime");
      if (disposed) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setClearColor(0x061427, 0);
      renderer.domElement.className = "block h-full w-full opacity-0 transition-opacity duration-500 ease-out";
      renderer.domElement.setAttribute("aria-hidden", "true");
      mount.appendChild(renderer.domElement);

      const resources = new Set();
      const track = (resource) => {
        resources.add(resource);
        return resource;
      };

      scene.add(new THREE.HemisphereLight(0xb9d9ff, 0x031020, 2.25));
      const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
      keyLight.position.set(5, 7, 6);
      scene.add(keyLight);
      const rimLight = new THREE.DirectionalLight(0x2f86ed, 2.3);
      rimLight.position.set(-5, 1, -4);
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
      const onVisibilityChange = () => {
        pageVisible = document.visibilityState === "visible";
      };
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
      // The semantic hero and CTA remain available when WebGL cannot initialize.
    });

    return () => {
      disposed = true;
      cleanupScene();
    };
  }, [variant]);

  return <div ref={mountRef} className={`absolute inset-0 overflow-hidden ${className}`.trim()} aria-hidden="true" />;
}
