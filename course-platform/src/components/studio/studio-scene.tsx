"use client";

import { ContactShadows, Environment, Lightformer, MeshReflectorMaterial, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

// A tiny product studio: one perfume bottle under softboxes on a glossy table.
// The bottle's material blends between the four surfaces taught on Day 1, so
// the same object can be matte, reflective, transparent or translucent.

export type Surface = "matte" | "reflective" | "transparent" | "translucent";

type Look = {
  color: string;
  metalness: number;
  roughness: number;
  transmission: number;
  thickness: number;
  clearcoat: number;
  liquid: number; // visibility of the amber liquid inside
};

const LOOKS: Record<Surface, Look> = {
  matte: { color: "#d8d2c8", metalness: 0, roughness: 0.92, transmission: 0, thickness: 0, clearcoat: 0, liquid: 0 },
  reflective: { color: "#f2f2f2", metalness: 1, roughness: 0.09, transmission: 0, thickness: 0, clearcoat: 1, liquid: 0 },
  transparent: { color: "#ffffff", metalness: 0, roughness: 0.02, transmission: 1, thickness: 0.6, clearcoat: 1, liquid: 1 },
  translucent: { color: "#fff6ea", metalness: 0, roughness: 0.55, transmission: 1, thickness: 1.4, clearcoat: 0.2, liquid: 0.55 },
};

// Light setups per surface, echoing the lessons: one soft key for matte,
// strip lights for reflective, back light for transparent and translucent.
const RIGS: Record<Surface, { key: [number, number, number]; rim: number; back: number; strips: number }> = {
  matte: { key: [-3, 2.5, 3], rim: 0.6, back: 0.2, strips: 0.2 },
  reflective: { key: [-4, 1.5, 1], rim: 1.2, back: 0.3, strips: 2.2 },
  transparent: { key: [-3, 2, 2], rim: 0.8, back: 3, strips: 1 },
  translucent: { key: [-2.5, 2, 2.5], rim: 0.6, back: 2.2, strips: 0.6 },
};

function damp(current: number, target: number, dt: number, speed = 4) {
  return THREE.MathUtils.damp(current, target, speed, dt);
}

function Bottle({ surface, spin, angle, offsetX }: { surface: Surface; spin: boolean; angle: number; offsetX: number }) {
  const group = useRef<THREE.Group>(null);
  const glass = useRef<THREE.MeshPhysicalMaterial>(null);
  const liquid = useRef<THREE.MeshPhysicalMaterial>(null);
  const target = useMemo(() => new THREE.Color(), []);

  useFrame((state, dt) => {
    const look = LOOKS[surface];
    const g = glass.current;
    if (g) {
      g.metalness = damp(g.metalness, look.metalness, dt);
      g.roughness = damp(g.roughness, look.roughness, dt);
      g.transmission = damp(g.transmission, look.transmission, dt);
      g.thickness = damp(g.thickness, look.thickness, dt);
      g.clearcoat = damp(g.clearcoat, look.clearcoat, dt);
      target.set(look.color);
      g.color.lerp(target, 1 - Math.exp(-4 * dt));
    }
    if (liquid.current) {
      const o = damp(liquid.current.opacity, look.liquid, dt);
      liquid.current.opacity = o;
      liquid.current.visible = o > 0.02;
    }
    if (group.current) {
      const t = state.clock.elapsedTime;
      const pointer = state.pointer;
      const base = spin ? angle + t * 0.25 : angle;
      group.current.rotation.y = damp(group.current.rotation.y, base + pointer.x * 0.35, dt, 3);
      group.current.rotation.x = damp(group.current.rotation.x, -pointer.y * 0.06, dt, 3);
      group.current.position.y = Math.sin(t * 0.8) * 0.02;
      group.current.position.x = damp(group.current.position.x, offsetX, dt, 2.2);
    }
  });

  return (
    <group ref={group}>
      {/* Body */}
      <RoundedBox args={[1.25, 1.45, 0.62]} radius={0.12} smoothness={6} position={[0, 0.73, 0]} castShadow>
        <meshPhysicalMaterial
          ref={glass}
          color={LOOKS[surface].color}
          metalness={LOOKS[surface].metalness}
          roughness={LOOKS[surface].roughness}
          transmission={LOOKS[surface].transmission}
          thickness={LOOKS[surface].thickness}
          clearcoat={LOOKS[surface].clearcoat}
          clearcoatRoughness={0.08}
          ior={1.5}
          envMapIntensity={1.2}
          attenuationColor="#ffd9a8"
          attenuationDistance={2.5}
        />
      </RoundedBox>
      {/* Liquid */}
      <RoundedBox args={[1.02, 1.08, 0.42]} radius={0.08} smoothness={4} position={[0, 0.62, 0]}>
        <meshPhysicalMaterial
          ref={liquid}
          color="#e08a1e"
          roughness={0.15}
          transmission={0.75}
          thickness={0.8}
          transparent
          opacity={LOOKS[surface].liquid}
          attenuationColor="#b35a00"
          attenuationDistance={0.6}
        />
      </RoundedBox>
      {/* Neck */}
      <mesh position={[0, 1.52, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.14, 0.18, 48]} />
        <meshStandardMaterial color="#b8955a" metalness={1} roughness={0.25} />
      </mesh>
      {/* Cap */}
      <RoundedBox args={[0.62, 0.52, 0.62]} radius={0.06} smoothness={4} position={[0, 1.86, 0]} castShadow>
        <meshPhysicalMaterial color="#0d0d0d" roughness={0.35} clearcoat={1} clearcoatRoughness={0.15} />
      </RoundedBox>
    </group>
  );
}

function Rig({ surface }: { surface: Surface }) {
  const key = useRef<THREE.Group>(null);
  const strips = useRef<THREE.Mesh[]>([]);
  const back = useRef<THREE.Mesh>(null);
  const rig = RIGS[surface];

  useFrame((_, dt) => {
    if (key.current) {
      key.current.position.x = damp(key.current.position.x, rig.key[0], dt, 2.5);
      key.current.position.y = damp(key.current.position.y, rig.key[1], dt, 2.5);
      key.current.position.z = damp(key.current.position.z, rig.key[2], dt, 2.5);
      key.current.lookAt(0, 0.8, 0);
    }
    strips.current.forEach((m) => {
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.color.setScalar(damp(mat.color.r, rig.strips, dt, 3));
    });
    if (back.current) {
      const mat = back.current.material as THREE.MeshBasicMaterial;
      mat.color.setScalar(damp(mat.color.r, rig.back, dt, 3));
    }
  });

  return (
    <Environment resolution={256} frames={Infinity}>
      <color attach="background" args={["#050505"]} />
      {/* Key softbox */}
      <group ref={key} position={rig.key}>
        <Lightformer form="rect" intensity={3.2} scale={[2.4, 3.2, 1]} color="#fff4e6" />
      </group>
      {/* Strip lights either side */}
      {[-1, 1].map((s, i) => (
        <mesh
          key={s}
          ref={(m) => {
            if (m) strips.current[i] = m;
          }}
          position={[s * 3.2, 1, -0.5]}
          rotation={[0, (-s * Math.PI) / 2, 0]}
          scale={[0.5, 4, 1]}
        >
          <planeGeometry />
          <meshBasicMaterial color={new THREE.Color().setScalar(rig.strips)} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* Front strips: these are what chrome and glass reflect back at the camera */}
      {[-75, -45, -15, 15, 45, 75].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return (
          <Lightformer
            key={`f${deg}`}
            form="rect"
            intensity={rig.strips * (Math.abs(deg) < 30 ? 1.2 : 1.8)}
            position={[Math.sin(a) * 5, 1.2, Math.cos(a) * 5]}
            rotation={[0, Math.PI + a, 0]}
            scale={[0.5, 6, 1]}
            color="#fff3e2"
          />
        );
      })}
      {/* Back light */}
      <mesh ref={back} position={[0, 1, -4]} scale={[3, 3, 1]}>
        <circleGeometry args={[1, 48]} />
        <meshBasicMaterial color={new THREE.Color().setScalar(rig.back)} toneMapped={false} />
      </mesh>
      {/* Overhead fill */}
      <Lightformer form="rect" intensity={rig.rim} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[4, 2, 1]} />
    </Environment>
  );
}

function glowTexture(color: string, light: boolean) {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  if (light) {
    ctx.fillStyle = "#cfcfcf";
    ctx.fillRect(0, 0, 512, 512);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.55, "#f1f1f1");
    g.addColorStop(1, "#cfcfcf");
  } else {
    g.addColorStop(0, color);
    g.addColorStop(0.35, "rgba(70,36,6,0.85)");
    g.addColorStop(0.7, "rgba(10,6,2,0.6)");
    g.addColorStop(1, "rgba(0,0,0,0)");
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** The warm backdrop glow, inside the scene so glass can refract it. */
function Backdrop({ glow, light, offsetX }: { glow: string; light: boolean; offsetX: number }) {
  const tex = useMemo(() => glowTexture(glow, light), [glow, light]);
  const mesh = useRef<THREE.Mesh>(null);
  // The glow follows the product, as if the light moved with it.
  useFrame((_, dt) => {
    if (mesh.current) mesh.current.position.x = damp(mesh.current.position.x, offsetX * 1.3, dt, 2.2);
  });
  return (
    <>
      <mesh ref={mesh} position={[0, 1.3, -3.5]} scale={[11, 11, 1]}>
        <planeGeometry />
        <meshBasicMaterial map={tex} toneMapped={false} fog={false} />
      </mesh>
    </>
  );
}

function Lights({ surface, light }: { surface: Surface; light: boolean }) {
  const spot = useRef<THREE.SpotLight>(null);
  const intensity = surface === "matte" ? 60 : surface === "translucent" ? 25 : 12;
  useFrame((_, dt) => {
    if (spot.current) spot.current.intensity = damp(spot.current.intensity, intensity, dt, 3);
  });
  return (
    <>
      <ambientLight intensity={light ? 1.4 : 0.15} />
      {light && <hemisphereLight args={["#ffffff", "#e8e8e8", 1.2]} />}
      <spotLight ref={spot} position={[-3.5, 4, 3.5]} angle={0.5} penumbra={1} intensity={intensity} color="#fff1dc" castShadow={false} />
      <pointLight position={[0, 1.4, -2.2]} intensity={6} color="#ffb35c" distance={6} />
    </>
  );
}

/**
 * Eases the camera to its framing. `lift` works like a shift lens: the image
 * slides up without changing the viewing angle, so glass still reflects the
 * studio rather than the floor.
 */
function CameraRig({ z, lift }: { z: number; lift: number }) {
  const shift = useRef(lift);
  useFrame(({ camera, size }, dt) => {
    camera.position.z = damp(camera.position.z, z, dt, 3);
    shift.current = damp(shift.current, lift, dt, 3);
    const cam = camera as THREE.PerspectiveCamera;
    const offset = shift.current * size.height * 0.22;
    if (Math.abs(offset) < 0.5) {
      if (cam.view?.enabled) cam.clearViewOffset();
    } else {
      cam.setViewOffset(size.width, size.height, 0, offset, size.width, size.height);
    }
  });
  return null;
}

function Floor({ reflective, light }: { reflective: boolean; light: boolean }) {
  if (light) {
    return (
      <>
        <mesh rotation-x={-Math.PI / 2} position={[0, -0.002, 0]}>
          <planeGeometry args={[30, 30]} />
          <meshStandardMaterial color="#ffffff" roughness={0.75} />
        </mesh>
        <ContactShadows position={[0, 0.001, 0]} opacity={0.45} scale={6} blur={2.6} far={2} resolution={512} />
      </>
    );
  }
  if (!reflective) {
    return <ContactShadows position={[0, -0.001, 0]} opacity={0.75} scale={6} blur={2.4} far={2} resolution={512} />;
  }
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.002, 0]}>
        <planeGeometry args={[30, 30]} />
        <MeshReflectorMaterial
          blur={[300, 80]}
          resolution={512}
          mixBlur={1}
          mixStrength={4}
          roughness={0.9}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#050505"
          metalness={0.2}
          mirror={0.35}
        />
      </mesh>
      <ContactShadows position={[0, 0.001, 0]} opacity={0.6} scale={5} blur={2} far={1.5} />
    </>
  );
}

export type StudioProps = {
  surface?: Surface;
  spin?: boolean;
  /** Glossy reflective table. Off on small screens to save battery. */
  reflections?: boolean;
  /** Called once the first frame has rendered, so a poster can fade out. */
  onReady?: () => void;
  className?: string;
  cameraZ?: number;
  glow?: string;
  /** "light" is a white seamless studio, as on Day 6. */
  stage?: "dark" | "light";
  /** Bottle angle in radians when not spinning. */
  angle?: number;
  /** Keep the drawing buffer so stills can be captured. */
  preserve?: boolean;
  /** Slide the product sideways (scene units), e.g. to make room for text. */
  offsetX?: number;
  /** Place the product higher in frame by aiming the camera lower (scene
   *  units), e.g. to sit above text on phones. The product stays on the table. */
  liftY?: number;
};

export default function StudioScene({ surface = "transparent", spin = true, reflections = true, onReady, className, cameraZ = 6.2, glow = "#c26a12", stage = "dark", angle = 0.35, preserve = false, offsetX = 0, liftY = 0 }: StudioProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const light = stage === "light";

  // Stop rendering when the studio scrolls out of view.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    // Hidden while off-screen so the idle canvas isn't composited either.
    <div ref={wrap} className={className} style={{ visibility: visible ? "visible" : "hidden" }}>
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: false, preserveDrawingBuffer: preserve, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
        camera={{ position: [0, 1.1, cameraZ], fov: 28 }}
        onCreated={({ camera }) => {
          camera.lookAt(0, 0.95, 0);
          requestAnimationFrame(() => onReady?.());
        }}
      >
        <color attach="background" args={[light ? "#d4d4d4" : "#000000"]} />
        {/* Fog starts just behind the product, so the table edge fades at any camera distance */}
        <fog attach="fog" args={[light ? "#e9e9e9" : "#000000", cameraZ - 0.2, cameraZ + 3.3]} />
        <Backdrop glow={glow} light={light} offsetX={offsetX} />
        <Lights surface={surface} light={light} />
        <Bottle surface={surface} spin={spin} angle={angle} offsetX={offsetX} />
        <CameraRig z={cameraZ} lift={liftY} />
        <Rig surface={surface} />
        <Floor reflective={reflections} light={light} />
      </Canvas>
    </div>
  );
}
