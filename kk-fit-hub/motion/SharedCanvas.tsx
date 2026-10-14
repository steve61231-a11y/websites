"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMotion } from "./MotionProvider";

/**
 * One WebGL canvas for the whole page (PRD 11.4, 12.6). Created on first
 * need; every WebGL slot renders into it through drei's <View>, so the page
 * never runs several WebGL contexts. Device pixel ratio is capped (2 on tier
 * A, 1.5 on B); rendering pauses when no scene is visible or the tab is
 * hidden; a frame-rate guard drops one tier if the average stays under
 * 45 fps for 2 seconds.
 */
let owners = 0;
const visible = new Set<string>();
const listeners = new Set<() => void>();
export function setSceneVisible(id: string, on: boolean) {
  if (on) visible.add(id);
  else visible.delete(id);
  listeners.forEach((l) => l());
}

export function SharedCanvas() {
  const [owner, setOwner] = useState(false);
  const { tier } = useMotion();
  const [active, setActive] = useState(false);

  useEffect(() => {
    owners += 1;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- only the first mounted slot hosts the canvas
    if (owners === 1) setOwner(true);
    const update = () => setActive(visible.size > 0 && !document.hidden);
    listeners.add(update);
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      owners -= 1;
      listeners.delete(update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  if (!owner) return null;
  return createPortal(
    <Canvas
      aria-hidden="true"
      eventSource={document.body}
      frameloop={active ? "always" : "never"}
      dpr={[1, tier === "A" ? 2 : 1.5]}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 10 }}
    >
      <View.Port />
      <FrameGuard />
    </Canvas>,
    document.body,
  );
}

function FrameGuard() {
  const { downgrade } = useMotion();
  const samples = useRef<number[]>([]);
  const tripped = useRef(false);
  useFrame((_, delta) => {
    if (tripped.current || delta <= 0 || delta > 0.5) return;
    const s = samples.current;
    s.push(delta);
    let sum = s.reduce((a, b) => a + b, 0);
    while (sum > 2 && s.length > 1) sum -= s.shift()!;
    if (sum >= 1.95 && s.length / sum < 45) {
      tripped.current = true;
      downgrade();
    }
  });
  return null;
}
