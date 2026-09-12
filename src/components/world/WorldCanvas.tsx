// WorldCanvas — Three.js star/dust particle field with mouse parallax.
// Lazy-loads the heavy chunk; falls back to CSS stars if WebGL fails.

import { useEffect, useRef, useState } from "react";

export default function WorldCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setFailed(true); // static CSS fallback
      return;
    }

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    import("three")
      .then((THREE) => {
        if (cancelled || !el) return;

        const mobile = window.innerWidth < 640;
        const COUNT = mobile ? 350 : 800;
        const dpr = Math.min(window.devicePixelRatio, mobile ? 1.5 : 2);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.1, 100);
        camera.position.z = 12;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
        renderer.setSize(el.clientWidth, el.clientHeight);
        renderer.setPixelRatio(dpr);
        el.appendChild(renderer.domElement);

        // Dust particles
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(COUNT * 3);
        const colors = new Float32Array(COUNT * 3);
        for (let i = 0; i < COUNT; i++) {
          positions[i * 3] = (Math.random() - 0.5) * 40;
          positions[i * 3 + 1] = (Math.random() - 0.5) * 26;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 2;
          const violet = Math.random() > 0.5;
          colors[i * 3] = violet ? 0.545 : 0.31; // R
          colors[i * 3 + 1] = violet ? 0.36 : 0.55; // G
          colors[i * 3 + 2] = violet ? 0.965 : 1.0; // B
        }
        geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

        const mat = new THREE.PointsMaterial({
          size: 0.06,
          vertexColors: true,
          transparent: true,
          opacity: 0.75,
          sizeAttenuation: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        const points = new THREE.Points(geo, mat);
        scene.add(points);

        // Soft landmark glow
        const glowGeo = new THREE.SphereGeometry(2.2, 16, 16);
        const glowMat = new THREE.MeshBasicMaterial({ color: 0x6d28d9, transparent: true, opacity: 0.12 });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.set(0, -2, -14);
        scene.add(glow);

        // Parallax
        let tx = 0, ty = 0, cx = 0, cy = 0;
        const onMove = (e: PointerEvent) => {
          tx = (e.clientX / window.innerWidth - 0.5) * 2;
          ty = (e.clientY / window.innerHeight - 0.5) * 2;
        };
        window.addEventListener("pointermove", onMove, { passive: true });

        // Pause on hidden tab
        let raf = 0;
        let running = true;
        const onVis = () => {
          running = document.visibilityState === "visible";
          if (running) tick();
        };
        document.addEventListener("visibilitychange", onVis);

        const tick = () => {
          if (!running) return;
          raf = requestAnimationFrame(tick);
          cx += (tx - cx) * 0.04;
          cy += (ty - cy) * 0.04;
          points.rotation.y = cx * 0.08;
          points.rotation.x = cy * 0.05;
          const t = performance.now() * 0.00025;
          points.position.y = Math.sin(t * 2) * 0.4;
          glowMat.opacity = 0.09 + Math.sin(t * 3) * 0.04;
          renderer.render(scene, camera);
        };
        tick();

        const onResize = () => {
          if (!el) return;
          camera.aspect = el.clientWidth / el.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(el.clientWidth, el.clientHeight);
        };
        window.addEventListener("resize", onResize);

        cleanup = () => {
          running = false;
          cancelAnimationFrame(raf);
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("resize", onResize);
          document.removeEventListener("visibilitychange", onVis);
          geo.dispose();
          mat.dispose();
          glowGeo.dispose();
          glowMat.dispose();
          renderer.dispose();
          renderer.domElement.remove();
        };
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <>
      <div ref={mountRef} aria-hidden="true" className="pointer-events-none absolute inset-0" />
      {failed && <CssStars />}
    </>
  );
}

// CSS fallback starfield — no WebGL required.
function CssStars() {
  const stars = Array.from({ length: 60 }, (_, i) => {
    const size = 1 + ((i * 7) % 3);
    return {
      left: `${(i * 37) % 100}%`,
      top: `${(i * 53) % 100}%`,
      size: `${size}px`,
      opacity: 0.15 + ((i * 13) % 40) / 100,
    };
  });
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-violet/70"
          style={{ left: s.left, top: s.top, width: s.size, height: s.size, opacity: s.opacity }}
        />
      ))}
    </div>
  );
}
