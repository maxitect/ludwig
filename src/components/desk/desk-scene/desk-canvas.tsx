"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import {
  BasicShadowMap,
  CylinderGeometry,
  ExtrudeGeometry,
  type BufferGeometry,
  type Camera,
} from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { PAWN_PATH } from "@/puzzles/_shared/chess-board/piece-paths";
import {
  AZIMUTH,
  ELEVATION,
  FRAME,
  type Vec3,
} from "@/components/three/iso";
import { type Palette } from "@/components/three/palette";
import { usePalette } from "@/components/three/use-palette";
import { Block, Solid } from "@/components/three/solid";
import {
  MAT,
  sheetJitter,
  SHEET,
  stackTop,
  type Stack,
} from "./model";

export type Orbit = { target: number };

const PAWN_SCALE = 0.04;
const PAWN_DEPTH = 6;
const LIGHT: Vec3 = [-5, 9, -2.5];

/** The cburnett pawn, extruded from the same path the SVG pieces use. */
function pawnGeometry() {
  const { paths } = new SVGLoader().parse(
    `<svg xmlns="http://www.w3.org/2000/svg"><path d="${PAWN_PATH}"/></svg>`,
  );
  const geometry = new ExtrudeGeometry(
    paths.flatMap((path) => path.toShapes()),
    { depth: PAWN_DEPTH, bevelEnabled: false },
  );
  geometry.translate(-22.5, -24.25, 0);
  geometry.scale(PAWN_SCALE, PAWN_SCALE, PAWN_SCALE);
  return geometry;
}

const lying = (geometry: BufferGeometry) => geometry.rotateZ(Math.PI / 2);

function place(camera: Camera, angle: number) {
  camera.position.set(
    30 * Math.cos(ELEVATION) * Math.sin(angle),
    30 * Math.sin(ELEVATION),
    30 * Math.cos(ELEVATION) * Math.cos(angle),
  );
  camera.lookAt(0, FRAME.targetY, 0);
}

function Markers({ stack, palette, pawn }: { stack: Stack; palette: Palette; pawn: BufferGeometry }) {
  const top = stackTop(stack);
  const common = { line: palette.line };
  const prisms = useMemo(
    () => ({
      pencil: lying(new CylinderGeometry(0.07, 0.07, 1.3, 6)),
      wedge: lying(new CylinderGeometry(0.4, 0.4, 0.9, 3)),
    }),
    [],
  );
  switch (stack.marker) {
    case "flagship":
      return (
        <>
          <Solid
            {...common}
            geometry={pawn}
            colour={palette.sheet}
            position={[0, top, 0]}
            rotation={[-Math.PI / 2, 0, 0.5]}
          />
          <Solid
            {...common}
            geometry={pawn}
            colour={palette.sheet}
            position={[0.35, 0, 0.95]}
            rotation={[-Math.PI / 2, 0, -1.1]}
          />
        </>
      );
    case "cipher":
      return (
        <Block
          {...common}
          size={[0.9, 0.22, 0.7]}
          colour={palette.book}
          position={[0, top + 0.11, 0]}
          rotation={[0, 0.3, 0]}
        />
      );
    case "logic":
      return (
        <Block
          {...common}
          size={[0.4, 0.4, 0.4]}
          colour={palette.sheet}
          position={[0, top + 0.2, 0]}
          rotation={[0, 0.5, 0]}
        />
      );
    case "numbers":
      return (
        <Solid
          {...common}
          geometry={prisms.pencil}
          colour={palette.red}
          position={[0, top + 0.07, 0]}
          rotation={[0, 0.4, 0]}
        />
      );
    case "spatial":
      return (
        <Solid
          {...common}
          geometry={prisms.wedge}
          colour={palette.sheetShade}
          position={[0, top + 0.3, 0]}
          rotation={[0, 0.2, 0]}
        />
      );
    case "word":
      return (
        <>
          <Block
            {...common}
            size={[0.35, 0.1, 0.35]}
            colour={palette.sheet}
            position={[-0.25, top + 0.05, 0.05]}
            rotation={[0, 0.2, 0]}
          />
          <Block
            {...common}
            size={[0.35, 0.1, 0.35]}
            colour={palette.sheet}
            position={[0.2, top + 0.05, -0.1]}
            rotation={[0, -0.35, 0]}
          />
        </>
      );
    default:
      return null;
  }
}

function Rig({
  orbit,
  onReady,
  onWake,
}: {
  orbit: RefObject<Orbit>;
  onReady: () => void;
  onWake: (wake: () => void) => void;
}) {
  const get = useThree((state) => state.get);
  const size = useThree((state) => state.size);
  const invalidate = useThree((state) => state.invalidate);
  const azimuth = useRef(AZIMUTH);

  useEffect(() => {
    const { camera } = get();
    camera.zoom = Math.min(size.width / FRAME.width, size.height / FRAME.height);
    camera.near = 0.1;
    camera.far = 80;
    camera.updateProjectionMatrix();
    place(camera, azimuth.current);
    invalidate();
  }, [get, invalidate, size.width, size.height]);

  useEffect(() => {
    onWake(invalidate);
  }, [onWake, invalidate]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => requestAnimationFrame(onReady));
    return () => cancelAnimationFrame(frame);
  }, [onReady]);

  useFrame((state, delta) => {
    const goal = AZIMUTH + (orbit.current?.target ?? 0);
    const gap = goal - azimuth.current;
    if (Math.abs(gap) < 0.0005) return;
    azimuth.current += gap * Math.min(1, delta * 12);
    place(state.camera, azimuth.current);
    state.invalidate();
  });
  return null;
}

function Scene({ stacks, palette }: { stacks: Stack[]; palette: Palette }) {
  const pawn = useMemo(() => pawnGeometry(), []);
  return (
    <>
      <directionalLight
        position={LIGHT}
        intensity={2.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-camera-near={1}
        shadow-camera-far={30}
        shadow-bias={-0.0008}
      />
      <ambientLight intensity={1.1} />
      <Block
        size={[MAT.width, MAT.thickness, MAT.depth]}
        colour={palette.mat}
        line={palette.edge}
        receive={false}
        position={[0, -MAT.thickness / 2, 0]}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]} receiveShadow>
        <planeGeometry args={[MAT.width, MAT.depth]} />
        <shadowMaterial color={palette.cast} opacity={palette.castOpacity} />
      </mesh>
      {stacks.map((stack, stackIndex) => (
        <group key={stack.key} position={[stack.x, 0, stack.z]}>
          {Array.from({ length: stack.sheets }, (_, sheet) => {
            const { yaw, dx, dz } = sheetJitter(stackIndex, sheet);
            return (
              <Block
                key={sheet}
                size={[SHEET.width, SHEET.thickness, SHEET.depth]}
                colour={sheet % 2 ? palette.sheet : palette.sheetShade}
                line={palette.line}
                position={[dx, (sheet + 0.5) * SHEET.thickness, dz]}
                rotation={[0, yaw, 0]}
              />
            );
          })}
          <Markers stack={stack} palette={palette} pawn={pawn} />
        </group>
      ))}
    </>
  );
}

export default function DeskCanvas({
  stacks,
  orbit,
  onReady,
  onWake,
}: {
  stacks: Stack[];
  orbit: RefObject<Orbit>;
  onReady: () => void;
  /** Hands the hero the function that renders a frame, since the scene renders only on demand. */
  onWake: (wake: () => void) => void;
}) {
  const palette = usePalette();
  if (!palette) return null;
  return (
    <Canvas
      aria-hidden="true"
      orthographic
      frameloop="demand"
      dpr={[1, 2]}
      shadows={{ type: BasicShadowMap }}
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [10, 10, 10], zoom: 60 }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Rig orbit={orbit} onReady={onReady} onWake={onWake} />
      <Scene stacks={stacks} palette={palette} />
    </Canvas>
  );
}
