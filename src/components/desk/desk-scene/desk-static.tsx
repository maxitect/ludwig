import {
  AZIMUTH,
  ELEVATION,
  FRAME,
  project,
  type Screen,
  type Vec3,
} from "@/components/three/iso";
import { PAWN_PATH } from "@/puzzles/_shared/chess-board/piece-paths";
import {
  MAT,
  sheetJitter,
  SHEET,
  stackTop,
  type Stack,
} from "./model";

type Faces = { top: string; left: string; right: string };

const PAPER: Faces = {
  top: "fill-paper",
  left: "fill-paper-shade",
  right: "fill-paper-deep",
};
const SHADE: Faces = {
  top: "fill-paper-shade",
  left: "fill-paper-deep",
  right: "fill-ink-soft",
};
const RED: Faces = {
  top: "fill-ludwig-red",
  left: "fill-blood",
  right: "fill-blood",
};
const BOOK: Faces = {
  top: "fill-book-blue",
  left: "fill-ink-soft",
  right: "fill-ink-soft",
};
const MATERIAL: Faces = {
  top: "fill-muted",
  left: "fill-muted",
  right: "fill-muted",
};

const PAWN = { scale: 0.04, depth: 0.24, centre: [22.5, 24.25] } as const;

const point = ([x, y]: Screen) => `${x.toFixed(3)},${(-y).toFixed(3)}`;
const polygon = (points: Screen[]) => points.map(point).join(" ");

type Prism = {
  x: number;
  z: number;
  y: number;
  width: number;
  depth: number;
  height: number;
  yaw?: number;
};

function corner(
  { x, z, yaw = 0 }: Pick<Prism, "x" | "z" | "yaw">,
  lx: number,
  lz: number,
): readonly [number, number] {
  return [
    x + lx * Math.cos(yaw) + lz * Math.sin(yaw),
    z - lx * Math.sin(yaw) + lz * Math.cos(yaw),
  ];
}

/** The three faces a camera looking from +x +z can see, drawn back to front. */
function PrismShape({
  prism,
  faces,
  line = "stroke-ink",
}: {
  prism: Prism;
  faces: Faces;
  line?: string;
}) {
  const { y, width: w, depth: d, height: h } = prism;
  const at = (lx: number, lz: number, up: number): Screen => {
    const [wx, wz] = corner(prism, lx, lz);
    return project([wx, y + up, wz]);
  };
  const [hw, hd] = [w / 2, d / 2];
  const stroke = `${line} stroke-[1.5]`;
  return (
    <g strokeLinejoin="miter">
      <polygon
        className={`${faces.left} ${stroke}`}
        points={polygon([at(-hw, hd, 0), at(hw, hd, 0), at(hw, hd, h), at(-hw, hd, h)])}
      />
      <polygon
        className={`${faces.right} ${stroke}`}
        points={polygon([at(hw, hd, 0), at(hw, -hd, 0), at(hw, -hd, h), at(hw, hd, h)])}
      />
      <polygon
        className={`${faces.top} ${stroke}`}
        points={polygon([at(-hw, hd, h), at(hw, hd, h), at(hw, -hd, h), at(-hw, -hd, h)])}
      />
    </g>
  );
}

const VIEW: Vec3 = [
  Math.cos(ELEVATION) * Math.sin(AZIMUTH),
  Math.sin(ELEVATION),
  Math.cos(ELEVATION) * Math.cos(AZIMUTH),
];
const minus = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const scale = ([x, y, z]: Vec3, by: number): Vec3 => [x * by, y * by, z * by];
const centroid = (points: Vec3[]): Vec3 =>
  scale(
    points.reduce<Vec3>((sum, p) => [sum[0] + p[0], sum[1] + p[1], sum[2] + p[2]], [0, 0, 0]),
    1 / points.length,
  );

/** The scene's spatial wedge: a three-sided prism lying along its length, drawn face by face from the camera's side. */
function WedgeShape({ x, z, y, yaw }: { x: number; z: number; y: number; yaw: number }) {
  const section = [0, 1, 2].map((side) => {
    const angle = (side * 2 * Math.PI) / 3;
    return [0.4 * Math.sin(angle), 0.4 * Math.cos(angle)] as const;
  });
  const corners = [-0.45, 0.45].flatMap((along) =>
    section.map(([up, out]): Vec3 => {
      const [wx, wz] = corner({ x, z, yaw }, along, out);
      return [wx, y + up, wz];
    }),
  );
  const middle = centroid(corners);
  const faces = [[0, 1, 2], [3, 4, 5], [0, 1, 4, 3], [1, 2, 5, 4], [2, 0, 3, 5]];
  return (
    <g strokeLinejoin="miter">
      {faces.map((face) => {
        const points = face.map((index) => corners[index]);
        const normal = cross(minus(points[1], points[0]), minus(points[2], points[0]));
        const facing = scale(normal, Math.sign(dot(normal, minus(centroid(points), middle))));
        if (dot(facing, VIEW) <= 0) return null;
        const fill =
          facing[1] > Math.abs(facing[0]) && facing[1] > Math.abs(facing[2])
            ? SHADE.top
            : facing[2] > facing[0]
              ? SHADE.left
              : SHADE.right;
        return (
          <polygon
            key={face.join()}
            className={`${fill} stroke-ink stroke-[1.5]`}
            points={polygon(points.map((point) => project(point)))}
          />
        );
      })}
    </g>
  );
}

const LIGHT_SLOPE: readonly [number, number] = [5 / 9, 2.5 / 9];

function hull(points: Screen[]): Screen[] {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Screen, a: Screen, b: Screen) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const build = (input: Screen[]) => {
    const out: Screen[] = [];
    for (const p of input) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], p) <= 0) out.pop();
      out.push(p);
    }
    out.pop();
    return out;
  };
  return [...build(sorted), ...build([...sorted].reverse())];
}

/** The footprint swept along the light's ground direction: a hard parallelogram, never a fade. */
function ShadowShape({ prism }: { prism: Prism }) {
  const reach = prism.y + prism.height;
  const [hw, hd] = [prism.width / 2, prism.depth / 2];
  const points = ([-1, 1] as const).flatMap((sx) =>
    ([-1, 1] as const).flatMap((sz) => {
      const [wx, wz] = corner(prism, sx * hw, sz * hd);
      return [0, 1].map((swept) =>
        project([
          wx + swept * reach * LIGHT_SLOPE[0],
          0,
          wz + swept * reach * LIGHT_SLOPE[1],
        ] as Vec3),
      );
    }),
  );
  return <polygon className="fill-cast" points={polygon(hull(points))} />;
}

/** The pawn's silhouette laid flat, through the same ground-plane maths as the scene. */
function Pawn({
  x,
  z,
  y,
  yaw,
}: {
  x: number;
  z: number;
  y: number;
  yaw: number;
}) {
  const at = (px: number, py: number, up: number): Screen => {
    const u = (px - PAWN.centre[0]) * PAWN.scale;
    const v = (py - PAWN.centre[1]) * PAWN.scale;
    const rx = u * Math.cos(yaw) - v * Math.sin(yaw);
    const ry = u * Math.sin(yaw) + v * Math.cos(yaw);
    return project([x + rx, y + up, z - ry]);
  };
  const matrix = (up: number) => {
    const [cx, cy] = at(0, 0, up);
    const [ax, ay] = at(1, 0, up);
    const [bx, by] = at(0, 1, up);
    const [a, b, c, d] = [ax - cx, -(ay - cy), bx - cx, -(by - cy)];
    return `matrix(${a} ${b} ${c} ${d} ${cx} ${-cy})`;
  };
  return (
    <>
      {[0, 0.4, 0.8, 1].map((layer) => (
        <path
          key={layer}
          d={PAWN_PATH}
          transform={matrix(layer * PAWN.depth)}
          className={`stroke-ink stroke-[1.5] ${layer === 1 ? "fill-paper" : "fill-paper-shade"}`}
        />
      ))}
    </>
  );
}

function MarkerShapes({ stack }: { stack: Stack }) {
  const top = stackTop(stack);
  const { x, z } = stack;
  const box = (
    prism: Omit<Prism, "x" | "z"> & { dx?: number; dz?: number },
    faces: Faces,
    key?: string,
  ) => {
    const full = { ...prism, x: x + (prism.dx ?? 0), z: z + (prism.dz ?? 0) };
    return (
      <g key={key}>
        <PrismShape prism={full} faces={faces} />
      </g>
    );
  };
  switch (stack.marker) {
    case "flagship":
      return (
        <>
          <Pawn x={x} z={z} y={top} yaw={0.5} />
          <Pawn x={x + 0.35} z={z + 0.95} y={0} yaw={-1.1} />
        </>
      );
    case "cipher":
      return box({ y: top, width: 0.9, depth: 0.7, height: 0.22, yaw: 0.3 }, BOOK);
    case "logic":
      return box({ y: top, width: 0.4, depth: 0.4, height: 0.4, yaw: 0.5 }, PAPER);
    case "numbers":
      return box({ y: top, width: 1.3, depth: 0.14, height: 0.14, yaw: 0.4 }, RED);
    case "spatial":
      return <WedgeShape x={x} z={z} y={top + 0.3} yaw={0.2} />;
    case "word":
      return (
        <>
          {box({ y: top, width: 0.35, depth: 0.35, height: 0.1, yaw: 0.2, dx: -0.25, dz: 0.05 }, PAPER, "a")}
          {box({ y: top, width: 0.35, depth: 0.35, height: 0.1, yaw: -0.35, dx: 0.2, dz: -0.1 }, PAPER, "b")}
        </>
      );
    default:
      return null;
  }
}

/** The Desk hero without WebGL: the same stacks and markers, drawn flat. Also the scene's fallback. */
export function DeskStatic({
  stacks,
  className = "",
}: {
  stacks: Stack[];
  className?: string;
}) {
  const ordered = stacks
    .map((stack, index) => ({ stack, index }))
    .sort((a, b) => a.stack.x + a.stack.z - (b.stack.x + b.stack.z));
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`${-FRAME.width / 2} ${-FRAME.height / 2} ${FRAME.width} ${FRAME.height}`}
      preserveAspectRatio="xMidYMid meet"
      className={`size-full stroke-ink [&_*]:[vector-effect:non-scaling-stroke] ${className}`}
    >
      <PrismShape
        prism={{
          x: 0,
          z: 0,
          y: -MAT.thickness,
          width: MAT.width,
          depth: MAT.depth,
          height: MAT.thickness,
        }}
        faces={MATERIAL}
        line="stroke-border"
      />
      {ordered.map(({ stack }) => (
        <ShadowShape
          key={stack.key}
          prism={{
            x: stack.x,
            z: stack.z,
            y: 0,
            width: SHEET.width,
            depth: SHEET.depth,
            height: stackTop(stack),
          }}
        />
      ))}
      {ordered.map(({ stack, index }) => (
        <g key={stack.key}>
          {Array.from({ length: stack.sheets }, (_, sheet) => {
            const { yaw, dx, dz } = sheetJitter(index, sheet);
            return (
              <PrismShape
                key={sheet}
                prism={{
                  x: stack.x + dx,
                  z: stack.z + dz,
                  y: sheet * SHEET.thickness,
                  width: SHEET.width,
                  depth: SHEET.depth,
                  height: SHEET.thickness,
                  yaw,
                }}
                faces={sheet % 2 ? PAPER : SHADE}
              />
            );
          })}
          <MarkerShapes stack={stack} />
        </g>
      ))}
    </svg>
  );
}
