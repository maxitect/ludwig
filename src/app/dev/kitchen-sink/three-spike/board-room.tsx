"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { BasicShadowMap, type PerspectiveCamera } from "three";
import type { Palette } from "@/components/three/palette";
import { Block } from "@/components/three/solid";
import { usePalette } from "@/components/three/use-palette";

const TILES = Array.from({ length: 64 }, (_, index) => ({
  x: (index % 8) - 3.5,
  z: Math.floor(index / 8) - 3.5,
  dark: (index + Math.floor(index / 8)) % 2 === 1,
}));

function Walk({ walk }: { walk: number }) {
  const progress = useRef(walk);
  useFrame((state, delta) => {
    progress.current += (walk - progress.current) * Math.min(1, delta * 6);
    const camera = state.camera as PerspectiveCamera;
    camera.position.set(
      state.pointer.x * 0.6,
      2.6 - progress.current * 1.4 + state.pointer.y * 0.2,
      9 - progress.current * 5.5,
    );
    camera.lookAt(0, 0.9, -2);
    state.invalidate();
  });
  return null;
}

function Room({ palette }: { palette: Palette }) {
  return (
    <>
      <directionalLight
        position={[-5, 9, 4]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-bias={-0.0008}
      />
      <ambientLight intensity={1.1} />
      {TILES.map(({ x, z, dark }) => (
        <Block
          key={`${x}:${z}`}
          size={[1, 0.1, 1]}
          colour={dark ? palette.sheetShade : palette.sheet}
          line={palette.line}
          position={[x, -0.05, z]}
        />
      ))}
      <Block size={[8, 4, 0.2]} colour={palette.sheet} line={palette.line} position={[0, 2, -4.1]} />
      <Block size={[1.4, 1.6, 0.1]} colour={palette.mat} line={palette.line} position={[-2, 2.4, -3.95]} />
      <Block size={[2.4, 0.8, 1.2]} colour={palette.book} line={palette.line} position={[0.5, 0.4, -1]} />
      <Block size={[0.5, 0.5, 0.5]} colour={palette.red} line={palette.line} position={[1.3, 1.05, -1]} />
    </>
  );
}

/** Candidate 2: the landing's chess room as geometry, walked through with true perspective. */
export default function BoardRoom() {
  const palette = usePalette();
  const [walk, setWalk] = useState(0);
  return (
    <div>
      <div className="relative h-72 w-full">
        {palette && (
          <Canvas
            aria-hidden="true"
            frameloop="demand"
            dpr={[1, 2]}
            shadows={{ type: BasicShadowMap }}
            gl={{ alpha: true, antialias: true }}
            camera={{ position: [0, 2.6, 9], fov: 38 }}
          >
            <Walk walk={walk} />
            <Room palette={palette} />
          </Canvas>
        )}
      </div>
      <label className="flex items-center gap-3 text-sm font-semibold">
        Walk in
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={walk}
          onChange={(event) => setWalk(Number(event.target.value))}
        />
      </label>
    </div>
  );
}
