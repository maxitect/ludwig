"use client";

import { Canvas } from "@react-three/fiber";
import { useMemo, useRef, useState, type PointerEvent } from "react";
import { BasicShadowMap, ExtrudeGeometry, Path, Shape } from "three";
import type { Palette } from "@/components/three/palette";
import { Solid } from "@/components/three/solid";
import { usePalette } from "@/components/three/use-palette";

const GEARS = [
  { teeth: 12, x: -3.0 },
  { teeth: 18, x: 0 },
  { teeth: 12, x: 3.0 },
] as const;
const MODULE = 0.2;

function gearGeometry(teeth: number) {
  const pitch = (teeth * MODULE) / 2;
  const shape = new Shape();
  const step = (Math.PI * 2) / teeth;
  for (let tooth = 0; tooth < teeth; tooth++) {
    const a = tooth * step;
    for (const [offset, radius] of [
      [0, pitch - MODULE * 0.6],
      [0.25, pitch + MODULE * 0.6],
      [0.5, pitch + MODULE * 0.6],
      [0.75, pitch - MODULE * 0.6],
    ] as const) {
      const angle = a + offset * step;
      const [x, y] = [Math.cos(angle) * radius, Math.sin(angle) * radius];
      if (tooth === 0 && offset === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
  }
  shape.closePath();
  const hole = new Path();
  hole.absarc(0, 0, pitch * 0.25, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  return new ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: false });
}

function Gears({ tick, palette }: { tick: number; palette: Palette }) {
  const geometries = useMemo(
    () => GEARS.map(({ teeth }) => gearGeometry(teeth)),
    [],
  );
  return (
    <>
      <directionalLight position={[-4, 8, 6]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0008} />
      <ambientLight intensity={1.1} />
      {GEARS.map(({ teeth, x }, index) => {
        const direction = index % 2 === 0 ? 1 : -1;
        const meshOffset = index === 1 ? Math.PI / teeth : 0;
        return (
          <Solid
            key={x}
            geometry={geometries[index]}
            colour={index === 0 ? palette.red : palette.sheet}
            line={palette.line}
            position={[x, 0, 0]}
            rotation={[0, 0, direction * ((tick * Math.PI * 2) / teeth) + meshOffset]}
          />
        );
      })}
    </>
  );
}

/** Candidate 3: the day's gear train as 3D gears. The pointer cranks an integer tick, as the engine's state would. */
export default function GearDaily() {
  const palette = usePalette();
  const [tick, setTick] = useState(0);
  const origin = useRef<{ angle: number; tick: number } | null>(null);
  const angleOf = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    return Math.atan2(
      event.clientY - (box.top + box.height / 2),
      event.clientX - (box.left + box.width / 2),
    );
  };
  return (
    <div>
      <div
        className="relative h-72 w-full touch-none"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          origin.current = { angle: angleOf(event), tick };
        }}
        onPointerMove={(event) => {
          if (!origin.current) return;
          const turned = -(angleOf(event) - origin.current.angle);
          setTick(origin.current.tick + Math.round((turned / (Math.PI * 2)) * GEARS[0].teeth));
        }}
        onPointerUp={() => {
          origin.current = null;
        }}
      >
        {palette && (
          <Canvas
            aria-hidden="true"
            orthographic
            frameloop="demand"
            dpr={[1, 2]}
            shadows={{ type: BasicShadowMap }}
            gl={{ alpha: true, antialias: true }}
            camera={{ position: [0, 0, 20], zoom: 48 }}
          >
            <Gears tick={tick} palette={palette} />
          </Canvas>
        )}
      </div>
      <p className="text-sm font-semibold">Crank tick: {tick}. Drag around the red gear.</p>
    </div>
  );
}
