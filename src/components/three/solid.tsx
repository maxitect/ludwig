"use client";

import { useMemo, type ComponentProps } from "react";
import {
  BoxGeometry,
  DataTexture,
  NearestFilter,
  RedFormat,
  type BufferGeometry,
  type Color,
} from "three";

let gradient: DataTexture | null = null;

/** Three hard light bands, no interpolation between them: this is what makes the shading flat. */
function toonGradient() {
  if (!gradient) {
    gradient = new DataTexture(new Uint8Array([110, 185, 255]), 3, 1, RedFormat);
    gradient.minFilter = NearestFilter;
    gradient.magFilter = NearestFilter;
    gradient.needsUpdate = true;
  }
  return gradient;
}

type SolidProps = Omit<ComponentProps<"group">, "ref"> & {
  geometry: BufferGeometry;
  colour: Color;
  line: Color;
  receive?: boolean;
};

/** A toon-shaded mesh with an ink outline along its sharp edges and a hard cast shadow. */
export function Solid({
  geometry,
  colour,
  line,
  receive = true,
  ...group
}: SolidProps) {
  return (
    <group {...group}>
      <mesh geometry={geometry} castShadow receiveShadow={receive}>
        <meshToonMaterial color={colour} gradientMap={toonGradient()} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[geometry, 25]} />
        <lineBasicMaterial color={line} />
      </lineSegments>
    </group>
  );
}

export function Block({
  size,
  ...props
}: Omit<SolidProps, "geometry"> & { size: readonly [number, number, number] }) {
  const [w, h, d] = size;
  const geometry = useMemo(() => new BoxGeometry(w, h, d), [w, h, d]);
  return <Solid geometry={geometry} {...props} />;
}
