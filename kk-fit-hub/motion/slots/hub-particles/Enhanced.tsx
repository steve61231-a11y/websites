"use client";

import { OrthographicCamera, View } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";
import { particleGlyphOrder, PARTICLE_POINTS } from "@/content/glyphs";
import type { GlyphId } from "@/content/activities";
import { SharedCanvas, setSceneVisible } from "../../SharedCanvas";
import type { EnhancedProps } from "../../types";

/**
 * hub-particles, enhanced (PRD 6.4, 11.5): brand-coloured particles, each a
 * learner, assemble into the active activity's silhouette and scatter from
 * the pointer. Tier A ~12,000 particles, tier B ~4,000. Targets come from
 * public/media/particles.bin, sampled at build time.
 */
export default function HubParticlesEnhanced({ containerRef, tier }: EnhancedProps) {
  const [stage, setStage] = useState<HTMLElement | null>(null);
  const [targets, setTargets] = useState<Uint8Array | null>(null);
  const [glyph, setGlyph] = useState<GlyphId>("karate");

  useEffect(() => {
    const el = containerRef.current?.querySelector<HTMLElement>("[data-hub-stage]") ?? null;
    if (!el) return;
    let cancelled = false;
    void fetch("/media/particles.bin")
      .then((r) => r.arrayBuffer())
      .then((b) => {
        if (cancelled) return;
        setTargets(new Uint8Array(b));
        setStage(el);
      });
    const read = () => setGlyph((el.dataset.activeGlyph as GlyphId) ?? "karate");
    read();
    const mo = new MutationObserver(read);
    mo.observe(el, { attributes: true, attributeFilter: ["data-active-glyph"] });
    const io = new IntersectionObserver(([e]) => setSceneVisible("hub", e.isIntersecting));
    io.observe(el);
    return () => {
      cancelled = true;
      mo.disconnect();
      io.disconnect();
      setSceneVisible("hub", false);
    };
  }, [containerRef]);

  // Hide the default glyph grid once the scene is ready; restore it on unmount.
  useEffect(() => {
    const grid = stage?.querySelector<HTMLElement>("[data-hub-default]");
    if (!grid || !targets) return;
    grid.style.transition = "opacity 450ms";
    grid.style.opacity = "0";
    return () => {
      grid.style.opacity = "";
    };
  }, [stage, targets]);

  if (!stage || !targets) return null;
  const count = tier === "A" ? 12000 : 4000;
  return (
    <>
      <SharedCanvas />
      {/* Outside the canvas, a View tracks its own element: place it over the stage. */}
      {createPortal(
        <View style={{ position: "absolute", inset: 0, pointerEvents: "none" }} data-hub-view="">
          <Particles key={count} count={count} targets={targets} glyph={glyph} stage={stage} />
        </View>,
        stage,
      )}
    </>
  );
}

const palette = ["#277a3d", "#3aa655", "#3aa655", "#1f6332", "#e4572e", "#1d1d1f"].map((c) => new THREE.Color(c));

function Particles({ count, targets, glyph, stage }: { count: number; targets: Uint8Array; glyph: GlyphId; stage: HTMLElement }) {
  const points = useRef<THREE.Points>(null);
  const pointer = useRef({ x: 9999, y: 9999 });

  const { geometry, offsets } = useMemo(() => buildGeometry(count), [count]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      pointer.current = { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -(((e.clientY - r.top) / r.height) * 2 - 1) };
    };
    const leave = () => (pointer.current = { x: 9999, y: 9999 });
    window.addEventListener("pointermove", move, { passive: true });
    stage.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerleave", leave);
    };
  }, [stage]);

  useFrame((state, delta) => {
    stepParticles(geometry, offsets, targets, {
      count,
      glyphIndex: particleGlyphOrder.indexOf(glyph),
      aspect: stage.clientWidth > 0 && stage.clientHeight > 0 ? stage.clientWidth / stage.clientHeight : 1,
      time: state.clock.elapsedTime,
      delta,
      pointer: pointer.current,
    });
  });

  return (
    <>
      <OrthographicCamera makeDefault manual left={-1} right={1} top={1} bottom={-1} near={0.1} far={10} position={[0, 0, 5]} />
      <points ref={points} geometry={geometry}>
        <pointsMaterial size={count > 6000 ? 2 : 2.6} sizeAttenuation={false} vertexColors transparent opacity={0.9} depthWrite={false} />
      </points>
    </>
  );
}


/** Random start positions, brand colours and per-particle jitter. */
function buildGeometry(count: number) {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const off = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 2;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 2;
    const c = palette[i % palette.length];
    col.set([c.r, c.g, c.b], i * 3);
    off[i * 2] = (Math.random() - 0.5) * 0.02;
    off[i * 2 + 1] = (Math.random() - 0.5) * 0.02;
  }
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return { geometry: g, offsets: off };
}

/** Moves every particle toward its target on the active glyph, away from the pointer. */
function stepParticles(
  geometry: THREE.BufferGeometry,
  offsets: Float32Array,
  targets: Uint8Array,
  f: { count: number; glyphIndex: number; aspect: number; time: number; delta: number; pointer: { x: number; y: number } },
) {
  const pos = geometry.attributes.position.array as Float32Array;
  const scale = 0.85; // glyph height as a share of the stage
  const k = Math.min(1, (1 - Math.pow(0.02, f.delta)) * 3); // frame-rate-independent easing
  const { x: mx, y: my } = f.pointer;
  for (let i = 0; i < f.count; i++) {
    const s = (f.glyphIndex * PARTICLE_POINTS + (i % PARTICLE_POINTS)) * 2;
    // Glyph box 0..255 → -1..1, kept square on a wide stage.
    let tx = (((targets[s] / 255) * 2 - 1) * scale) / f.aspect + offsets[i * 2];
    let ty = -((targets[s + 1] / 255) * 2 - 1) * scale + offsets[i * 2 + 1];
    tx += Math.sin(f.time * 0.8 + i) * 0.003;
    ty += Math.cos(f.time * 0.7 + i * 1.3) * 0.003;
    const dx = pos[i * 3] - mx;
    const dy = pos[i * 3 + 1] - my;
    const d2 = dx * dx + dy * dy;
    if (d2 < 0.04) {
      const push = (0.04 - d2) * 14;
      tx += dx * push;
      ty += dy * push;
    }
    pos[i * 3] += (tx - pos[i * 3]) * k;
    pos[i * 3 + 1] += (ty - pos[i * 3 + 1]) * k;
  }
  geometry.attributes.position.needsUpdate = true;
}
