import { useEffect, useRef, useState } from "react";

const MODEL_URL = "/portfolio/models/asta-product-shoe.glb";

export default function AstaThreeShoeScene() {
  const mountRef = useRef(null);
  const [status, setStatus] = useState("waiting");

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    let disposed = false;
    let initialized = false;
    let frameId = 0;
    let cleanupScene = () => {};

    async function initialize() {
      if (initialized || disposed) return;
      initialized = true;
      setStatus("loading");

      try {
        const [THREE, loaderModule, decoderModule] = await Promise.all([
          import("three"),
          import("three/addons/loaders/GLTFLoader.js"),
          import("three/addons/libs/meshopt_decoder.module.js"),
        ]);
        if (disposed) return;

        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const compactViewport = window.matchMedia("(max-width: 640px)").matches;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
        camera.position.set(5.4, 3.1, 7.8);
        camera.lookAt(0, 0.25, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: !compactViewport, alpha: true, powerPreference: "low-power" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, compactViewport ? 1 : 1.5));
        renderer.setClearColor(0x07172c, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.08;
        renderer.domElement.className = "block h-full w-full touch-none opacity-0 transition-opacity duration-500 ease-out";
        renderer.domElement.setAttribute("aria-hidden", "true");
        mount.appendChild(renderer.domElement);

        scene.add(new THREE.HemisphereLight(0xe6f2ff, 0x07111f, 2.35));
        const keyLight = new THREE.DirectionalLight(0xffffff, 4.4);
        keyLight.position.set(4.5, 7, 6);
        scene.add(keyLight);
        const rimLight = new THREE.DirectionalLight(0x318cff, 3.2);
        rimLight.position.set(-5, 2.5, -4);
        scene.add(rimLight);
        const fillLight = new THREE.DirectionalLight(0xffa9b3, 1.25);
        fillLight.position.set(1, 1.5, -5);
        scene.add(fillLight);

        const shadowCanvas = document.createElement("canvas");
        shadowCanvas.width = 256;
        shadowCanvas.height = 256;
        const context = shadowCanvas.getContext("2d");
        const gradient = context.createRadialGradient(128, 128, 12, 128, 128, 120);
        gradient.addColorStop(0, "rgba(0, 0, 0, 0.54)");
        gradient.addColorStop(0.5, "rgba(0, 0, 0, 0.25)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        context.fillStyle = gradient;
        context.fillRect(0, 0, 256, 256);
        const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
        const shadow = new THREE.Mesh(
          new THREE.PlaneGeometry(5.8, 3.5),
          new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false }),
        );
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.set(0, -1.03, 0.15);
        scene.add(shadow);

        const loader = new loaderModule.GLTFLoader();
        loader.setMeshoptDecoder(decoderModule.MeshoptDecoder);
        const gltf = await loader.loadAsync(MODEL_URL);
        if (disposed) {
          gltf.scene.traverse((child) => {
            child.geometry?.dispose();
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.filter(Boolean).forEach((material) => material.dispose());
          });
          return;
        }

        const shoe = new THREE.Group();
        const model = gltf.scene;
        shoe.add(model);
        scene.add(shoe);

        const originalBox = new THREE.Box3().setFromObject(model);
        const originalSize = originalBox.getSize(new THREE.Vector3());
        const scale = 4.75 / Math.max(originalSize.x, originalSize.y, originalSize.z);
        model.scale.setScalar(scale);
        const scaledBox = new THREE.Box3().setFromObject(model);
        const center = scaledBox.getCenter(new THREE.Vector3());
        model.position.sub(center);
        model.position.y += 0.1;
        // Start on the product's clearest lateral three-quarter angle while
        // leaving every other view available through direct manipulation.
        shoe.rotation.set(-0.04, 0.62, -0.03);

        model.traverse((child) => {
          if (!child.isMesh) return;
          child.frustumCulled = true;
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.filter(Boolean).forEach((material) => {
            material.envMapIntensity = 0.72;
            material.needsUpdate = true;
          });
        });

        const pointer = { active: false, startX: 0, startY: 0, rotationY: shoe.rotation.y, rotationX: shoe.rotation.x };
        let targetRotationY = shoe.rotation.y;
        let targetRotationX = shoe.rotation.x;
        let lastInteraction = performance.now();

        const onPointerDown = (event) => {
          pointer.active = true;
          pointer.startX = event.clientX;
          pointer.startY = event.clientY;
          pointer.rotationY = targetRotationY;
          pointer.rotationX = targetRotationX;
          lastInteraction = performance.now();
          renderer.domElement.setPointerCapture?.(event.pointerId);
        };
        const onPointerMove = (event) => {
          if (!pointer.active) return;
          targetRotationY = pointer.rotationY + ((event.clientX - pointer.startX) * 0.008);
          targetRotationX = THREE.MathUtils.clamp(pointer.rotationX + ((event.clientY - pointer.startY) * 0.004), -0.35, 0.28);
          lastInteraction = performance.now();
        };
        const onPointerUp = (event) => {
          pointer.active = false;
          lastInteraction = performance.now();
          renderer.domElement.releasePointerCapture?.(event.pointerId);
        };
        if (!reducedMotion) {
          renderer.domElement.addEventListener("pointerdown", onPointerDown);
          renderer.domElement.addEventListener("pointermove", onPointerMove, { passive: true });
          renderer.domElement.addEventListener("pointerup", onPointerUp);
          renderer.domElement.addEventListener("pointercancel", onPointerUp);
        }

        const resize = () => {
          const width = Math.max(mount.clientWidth, 1);
          const height = Math.max(mount.clientHeight, 1);
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.position.set(width < 620 ? 6.5 : 5.4, width < 620 ? 3.65 : 3.1, width < 620 ? 9.25 : 7.8);
          camera.lookAt(0, 0.2, 0);
          camera.updateProjectionMatrix();
          renderer.render(scene, camera);
        };
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(mount);
        resize();
        renderer.domElement.classList.replace("opacity-0", "opacity-100");
        setStatus("ready");

        let inViewport = true;
        let pageVisible = document.visibilityState === "visible";
        const viewportObserver = new IntersectionObserver(([entry]) => {
          inViewport = entry.isIntersecting;
        }, { threshold: 0.02 });
        const onVisibilityChange = () => {
          pageVisible = document.visibilityState === "visible";
        };
        viewportObserver.observe(mount);
        document.addEventListener("visibilitychange", onVisibilityChange);

        const animate = (time) => {
          if (disposed) return;
          if (inViewport && pageVisible) {
            if (!pointer.active && (time - lastInteraction) > 2400) targetRotationY += 0.0014;
            shoe.rotation.y += (targetRotationY - shoe.rotation.y) * 0.075;
            shoe.rotation.x += (targetRotationX - shoe.rotation.x) * 0.075;
            if (!reducedMotion) shoe.position.y = Math.sin(time * 0.0008) * 0.025;
            renderer.render(scene, camera);
          }
          frameId = window.requestAnimationFrame(animate);
        };

        if (reducedMotion) renderer.render(scene, camera);
        else frameId = window.requestAnimationFrame(animate);

        cleanupScene = () => {
          window.cancelAnimationFrame(frameId);
          if (!reducedMotion) {
            renderer.domElement.removeEventListener("pointerdown", onPointerDown);
            renderer.domElement.removeEventListener("pointermove", onPointerMove);
            renderer.domElement.removeEventListener("pointerup", onPointerUp);
            renderer.domElement.removeEventListener("pointercancel", onPointerUp);
          }
          document.removeEventListener("visibilitychange", onVisibilityChange);
          viewportObserver.disconnect();
          resizeObserver.disconnect();
          model.traverse((child) => {
            child.geometry?.dispose();
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.filter(Boolean).forEach((material) => {
              Object.values(material).forEach((value) => value?.isTexture && value.dispose());
              material.dispose();
            });
          });
          shadow.geometry.dispose();
          shadow.material.dispose();
          shadowTexture.dispose();
          renderer.dispose();
          renderer.domElement.remove();
        };
      } catch {
        if (!disposed) setStatus("error");
      }
    }

    const loadObserver = new IntersectionObserver(([entry], observer) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      initialize();
    }, { rootMargin: "320px 0px", threshold: 0.01 });
    loadObserver.observe(mount);

    return () => {
      disposed = true;
      loadObserver.disconnect();
      cleanupScene();
    };
  }, []);

  return (
    <div className="relative h-full min-h-[25rem] overflow-hidden bg-[#07172c] sm:min-h-[31rem]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_54%_42%,rgba(32,91,154,0.25),transparent_46%)]" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-[#2e6fb5]" aria-hidden="true" />
      <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" aria-hidden="true" />
      {status !== "ready" ? (
        <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden="true">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#6485a8]">{status === "error" ? "Product preview unavailable" : "Preparing product model"}</span>
        </div>
      ) : null}
      <span className="absolute bottom-5 left-5 border-l border-[#5da5f6] pl-3 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#8fc4ff]">Drag to inspect</span>
      <a className="absolute bottom-5 right-5 text-[0.62rem] text-[#7892ad] underline decoration-[#3d5f83] underline-offset-4 transition-colors hover:text-[#bed2e7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8fc4ff]" href="https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/MaterialsVariantsShoe" target="_blank" rel="noreferrer">Model by Shopify, CC BY 4.0</a>
    </div>
  );
}
