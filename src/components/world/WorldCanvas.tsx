// WorldCanvas — Three.js scene: twinkling dust field (shader), nebula depth
// layers, shooting stars, landmark glow, pointer parallax.
// Lazy chunk; degrades to CSS stars on WebGL failure / reduced motion.

import { useEffect, useRef, useState } from "react";
import type * as ThreeNS from "three";
import type { Points, BufferAttribute, PointsMaterial } from "three";

const TWINKLE_VERT = `
attribute float aScale;
attribute float aSpeed;
attribute float aOffset;
uniform float uTime;
uniform float uPixelRatio;
varying float vTwinkle;
void main() {
  vTwinkle = 0.35 + 0.65 * abs(sin(uTime * aSpeed + aOffset));
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aScale * uPixelRatio * (1.0 + vTwinkle * 0.6);
  gl_Position = projectionMatrix * mv;
}
`;

const TWINKLE_FRAG = `
uniform vec3 uColorA;
uniform vec3 uColorB;
varying float vTwinkle;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float core = smoothstep(0.5, 0.0, d);
  core = pow(core, 1.8);
  vec3 col = mix(uColorA, uColorB, vTwinkle);
  gl_FragColor = vec4(col, core * vTwinkle);
}
`;

export default function WorldCanvas({ intensity = 1 }: { intensity?: number }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setFailed(true);
      return;
    }

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    import("three")
      .then((THREE) => {
        if (cancelled || !el) return;

        const mobile = window.innerWidth < 640;
        const COUNT = Math.floor((mobile ? 400 : 1000) * intensity);
        const dpr = Math.min(window.devicePixelRatio, mobile ? 1.5 : 2);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(62, el.clientWidth / el.clientHeight, 0.1, 120);
        camera.position.z = 13;

        const renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: false,
          powerPreference: "low-power",
        });
        renderer.setSize(el.clientWidth, el.clientHeight);
        renderer.setPixelRatio(dpr);
        el.appendChild(renderer.domElement);

        // ---- Dust field with twinkle shader ----
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(COUNT * 3);
        const scale = new Float32Array(COUNT);
        const speed = new Float32Array(COUNT);
        const offset = new Float32Array(COUNT);
        for (let i = 0; i < COUNT; i++) {
          pos[i * 3] = (Math.random() - 0.5) * 44;
          pos[i * 3 + 1] = (Math.random() - 0.5) * 28;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 24 - 3;
          scale[i] = 6 + Math.random() * 14;
          speed[i] = 0.4 + Math.random() * 1.8;
          offset[i] = Math.random() * Math.PI * 2;
        }
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        geo.setAttribute("aScale", new THREE.BufferAttribute(scale, 1));
        geo.setAttribute("aSpeed", new THREE.BufferAttribute(speed, 1));
        geo.setAttribute("aOffset", new THREE.BufferAttribute(offset, 1));

        const mat = new THREE.ShaderMaterial({
          vertexShader: TWINKLE_VERT,
          fragmentShader: TWINKLE_FRAG,
          uniforms: {
            uTime: { value: 0 },
            uPixelRatio: { value: dpr },
            uColorA: { value: new THREE.Color(0x4f8cff) }, // electric blue
            uColorB: { value: new THREE.Color(0xc4b5fd) }, // soft violet
          },
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        const dust = new THREE.Points(geo, mat);
        scene.add(dust);

        // ---- Nebula depth layers: large soft sprites far back ----
        const nebulaTex = makeGlowTexture(THREE);
        const nebulaColors = [0x2e1065, 0x1e3a8a, 0x4c1d95];
        const nebulas: ThreeNS.Sprite[] = [];
        for (let i = 0; i < (mobile ? 2 : 4); i++) {
          const smat = new THREE.SpriteMaterial({
            map: nebulaTex,
            color: nebulaColors[i % nebulaColors.length],
            transparent: true,
            opacity: 0.16,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          });
          const sprite = new THREE.Sprite(smat);
          sprite.scale.setScalar(16 + Math.random() * 14);
          sprite.position.set(
            (Math.random() - 0.5) * 26,
            (Math.random() - 0.5) * 14,
            -22 - Math.random() * 8
          );
          nebulas.push(sprite);
          scene.add(sprite);
        }

        // ---- Landmark glow ----
        const glowMat = new THREE.SpriteMaterial({
          map: nebulaTex,
          color: 0x8b5cf6,
          transparent: true,
          opacity: 0.22,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        const glow = new THREE.Sprite(glowMat);
        glow.scale.setScalar(11);
        glow.position.set(0, -3, -16);
        scene.add(glow);

        // ---- Shooting stars ----
        interface Star {
          mesh: Points;
          life: number;
          vx: number;
          vy: number;
          active: boolean;
        }
        const starGeo = new THREE.BufferGeometry();
        const starPos = new Float32Array(3);
        starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
        const stars: Star[] = [];
        for (let i = 0; i < 3; i++) {
          const m = new THREE.Points(
            starGeo.clone(),
            new THREE.PointsMaterial({
              color: 0xf4f4f0,
              size: 0.12,
              transparent: true,
              opacity: 0,
              depthWrite: false,
              blending: THREE.AdditiveBlending,
            })
          );
          m.visible = false;
          scene.add(m);
          stars.push({ mesh: m, life: 0, vx: 0, vy: 0, active: false });
        }

        function launchStar(s: Star) {
          s.active = true;
          s.life = 1;
          s.vx = -(2.2 + Math.random() * 1.6);
          s.vy = -(0.6 + Math.random() * 0.8);
          s.mesh.visible = true;
          const p = s.mesh.geometry.attributes.position as BufferAttribute;
          p.setXYZ(0, 16 + Math.random() * 8, 6 + Math.random() * 6, -8 - Math.random() * 4);
          p.needsUpdate = true;
          (s.mesh.material as PointsMaterial).opacity = 0;
        }

        // ---- Motion ----
        let tx = 0, ty = 0, cx = 0, cy = 0;
        const onMove = (e: PointerEvent) => {
          tx = (e.clientX / window.innerWidth - 0.5) * 2;
          ty = (e.clientY / window.innerHeight - 0.5) * 2;
        };
        window.addEventListener("pointermove", onMove, { passive: true });

        let raf = 0;
        let running = true;
        let lastStarAt = 0;

        const onVis = () => {
          running = document.visibilityState === "visible";
          if (running) tick(performance.now());
        };
        document.addEventListener("visibilitychange", onVis);

        const tick = (now: number) => {
          if (!running) return;
          raf = requestAnimationFrame(tick);
          const t = now * 0.001;

          mat.uniforms.uTime.value = t;
          dust.rotation.y = cx * 0.07 + t * 0.008;
          dust.rotation.x = cy * 0.04;
          dust.position.y = Math.sin(t * 0.3) * 0.5;

          cx += (tx - cx) * 0.035;
          cy += (ty - cy) * 0.035;
          camera.position.x = cx * 0.5;
          camera.position.y = -cy * 0.3;
          camera.lookAt(0, 0, -6);

          glowMat.opacity = 0.18 + Math.sin(t * 0.8) * 0.06;
          nebulas.forEach((n, i) => {
            n.material.opacity = 0.12 + Math.sin(t * 0.25 + i * 2) * 0.05;
          });

          // Spawn + animate shooting stars
          if (now - lastStarAt > 3800 + Math.random() * 3000) {
            const idle = stars.find((s) => !s.active);
            if (idle) {
              launchStar(idle);
              lastStarAt = now;
            }
          }
          stars.forEach((s) => {
            if (!s.active) return;
            s.life -= 0.016;
            const p = s.mesh.geometry.attributes.position as BufferAttribute;
            const arr = p.array as Float32Array;
            arr[0] += s.vx * 0.016;
            arr[1] += s.vy * 0.016;
            p.needsUpdate = true;
            const m = s.mesh.material as PointsMaterial;
            m.opacity = Math.max(0, Math.min(1, s.life * 1.4));
            if (s.life <= 0 || arr[0] < -20) {
              s.active = false;
              s.mesh.visible = false;
            }
          });

          renderer.render(scene, camera);
        };
        raf = requestAnimationFrame(tick);

        const onResize = () => {
          if (!el) return;
          camera.aspect = el.clientWidth / el.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(el.clientWidth, el.clientHeight);
        };
        window.addEventListener("resize", onResize);

        cleanup = () => {
          cancelAnimationFrame(raf);
          running = false;
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("resize", onResize);
          document.removeEventListener("visibilitychange", onVis);
          geo.dispose();
          mat.dispose();
          nebulaTex.dispose();
          nebulas.forEach((n) => {
            n.material.dispose();
          });
          glowMat.dispose();
          stars.forEach((s) => {
            s.mesh.geometry.dispose();
            (s.mesh.material as PointsMaterial).dispose();
          });
          renderer.dispose();
          renderer.domElement.remove();
        };
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [intensity]);

  return (
    <>
      <div ref={mountRef} aria-hidden="true" className="pointer-events-none absolute inset-0" />
      {failed && <CssStars />}
    </>
  );
}

// Radial-gradient glow texture generated on a canvas — no asset files.
function makeGlowTexture(THREE: typeof ThreeNS) {
  const size = 128;
  const cnv = document.createElement("canvas");
  cnv.width = cnv.height = size;
  const ctx = cnv.getContext("2d")!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.35, "rgba(255,255,255,0.35)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(cnv);
  return tex;
}

// CSS fallback starfield — no WebGL required.
function CssStars() {
  const stars = Array.from({ length: 60 }, (_, i) => ({
    left: `${(i * 37) % 100}%`,
    top: `${(i * 53) % 100}%`,
    size: `${1 + ((i * 7) % 3)}px`,
    opacity: 0.15 + ((i * 13) % 40) / 100,
  }));
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
