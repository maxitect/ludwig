import type { ComponentProps, ReactNode } from "react";

export const CAMBRIDGE_NIGHT_SIZE = { width: 1200, height: 800 } as const;

type Kind =
  | "plate"
  | "poster"
  | "board"
  | "label"
  | "receipt"
  | "arrow"
  | "window"
  | "fascia"
  | "banner"
  | "blind"
  | "taxi"
  | "graffiti";

type Sign = {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: Kind;
  lines: string[];
  art?: keyof typeof ART;
};

const BUILDING_WIDTH = 200;
const UPPER = { y: 160, h: 58 };
const MIDDLE = { y: 232, h: 58 };
const FASCIA = { y: 304, h: 40 };
const DISPLAY = { y: 358, h: 88 };

const upper = (b: number, side: 0 | 1, kind: Kind, lines: string[]): Sign => ({
  x: b * BUILDING_WIDTH + 8 + side * 96,
  w: 88,
  ...UPPER,
  kind,
  lines,
});
const middle = (b: number, side: 0 | 1, kind: Kind, lines: string[]): Sign => ({
  x: b * BUILDING_WIDTH + 8 + side * 96,
  w: 88,
  ...MIDDLE,
  kind,
  lines,
});
const fascia = (b: number, lines: string[], art: Sign["art"]): Sign => ({
  x: b * BUILDING_WIDTH + 8,
  w: 184,
  ...FASCIA,
  kind: "fascia",
  lines,
  art,
});
const display = (
  b: number,
  side: 0 | 1,
  lines: string[],
  art: Sign["art"],
): Sign => ({
  x: b * BUILDING_WIDTH + 8 + side * 96,
  w: 88,
  ...DISPLAY,
  kind: "window",
  lines,
  art,
});

/** The hidden signs, in the order of the content file's items. */
const SIGNS: Sign[] = [
  middle(0, 0, "plate", ["LUDWIG", "_PUZZLE SETTERS"]),
  upper(0, 0, "poster", ["FATHER BROWN'S", "BISCUIT SALE", "_SAT 2PM"]),
  upper(0, 1, "arrow", ["GRANTCHESTER", "_2 MILES"]),
  middle(0, 1, "plate", ["UNFORGOTTEN", "UMBRELLAS", "_LOST PROPERTY"]),
  fascia(0, ["ENDEAVOUR", "_CAM BOAT CLUB"], "oar"),
  display(0, 0, ["SILENT", "WITNESS", "_DISCO, 8PM"], "headphones"),
  display(0, 1, ["WAKING THE", "DEAD", "_COFFEE 6:30"], "clock"),

  upper(1, 0, "poster", ["MIDSOMER", "MURDERS", "_DINNER THEATRE"]),
  upper(1, 1, "board", ["THE HAPPY", "VALLEY", "_PUB"]),
  middle(1, 0, "label", ["TAGGART", "3 COATS", "_TICKET 41"]),
  middle(1, 1, "board", ["VERA'S", "VEG", "_FRESH TODAY"]),
  fascia(1, ["PRIME SUSPECT", "_FAMILY BUTCHERS"], "sausage"),
  display(1, 0, ["CRACKER", "_BOX OF 12"], "cracker"),
  display(1, 1, ["A TOUCH", "OF FROST", "_WINTER SALE"], "frost"),

  upper(2, 0, "plate", ["SHERLOCK", "HOLMES & CO", "_OPTICIANS"]),
  upper(2, 1, "label", ["LINE OF DUTY", "FREE", "_KIOSK CLOSED"]),
  middle(2, 0, "board", ["BROAD", "CHURCH", "_SOLD"]),
  middle(2, 1, "receipt", ["COLUMBO", "1 RAINCOAT", "_READY FRI"]),
  fascia(2, ["KOJAK", "_BARBERS: CLOSE SHAVES"], "lollipop"),
  display(2, 0, ["POIROT", "MOUSTACHE", "WAX"], "moustache"),
  display(2, 1, ["CAGNEY", "& LACEY", "_LINGERIE"], "lace"),

  upper(3, 0, "poster", ["PLEASE SPEAK", "SOFTLY,", "SOFTLY"]),
  upper(3, 1, "board", ["JONATHAN", "CREEK MILL", "_FLOUR"]),
  middle(3, 0, "poster", ["FOYLE'S WAR", "SPECIAL", "_BOOKS"]),
  middle(3, 1, "label", ["MURDER, SHE", "WROTE", "_TYPEWRITERS"]),
  fascia(3, ["LAW & ORDER", "_LEGAL AID"], "scales"),
  display(3, 0, ["HEARTBEAT", "APPEAL"], "pulse"),
  display(3, 1, ["SCOTT &", "BAILEY", "_LOCKSMITHS"], "key"),

  upper(4, 0, "board", ["LEWIS'S", "LUNCH", "SPECIALS"]),
  upper(4, 1, "label", ["SHETLAND", "WOOL", "_JUMPERS"]),
  middle(4, 0, "poster", ["JULIET", "BRAVO", "_RADIO REPAIRS"]),
  middle(4, 1, "receipt", ["THE BILL", "14.50", "_THANK YOU"]),
  fascia(4, ["THE PROFESSIONALS", "_PLUMBERS, EST. 1977"], "spanner"),
  display(4, 0, ["SWEENEY", "& SON", "_SWEEPS"], "broom"),
  display(4, 1, ["DIXON OF", "DOCK GREEN", "_FISHMONGER"], "fish"),

  upper(5, 0, "label", ["BERGERAC", "BREAD", "_BAKED NIGHTLY"]),
  middle(5, 0, "plate", ["BODY GUARD", "FITNESS", "_OPEN 24H"]),
  { x: 1104, y: 232, w: 88, h: 58, kind: "graffiti", lines: ["LUTHER"] },
  fascia(5, ["WIRE IN THE BLOOD", "_ORANGES"], "orange"),
  display(5, 0, ["DALZIEL &", "PASCOE", "_SOLICITORS"], "scroll"),
  display(5, 1, ["MISS", "MARPLE'S", "_WOOL"], "wool"),

  { x: 720, y: 44, w: 240, h: 34, kind: "banner", lines: ["DEATH IN PARADISE", "_FLY NOW"] },
  { x: 135, y: 708, w: 70, h: 24, kind: "plate", lines: ["MORSE 1"] },
  { x: 386, y: 632, w: 170, h: 26, kind: "blind", lines: ["25  WHITECHAPEL"] },
  { x: 826, y: 470, w: 88, h: 36, kind: "taxi", lines: ["Z CARS", "_RANK"] },
  { x: 1076, y: 476, w: 100, h: 36, kind: "label", lines: ["THE WIRE", "_LOCKSMITHS"] },
];

const ART = {
  oar: "M2 32L28 6M24 2l10 10-5 5-10-10z",
  headphones: "M6 26v-8a12 12 0 0 1 24 0v8M4 22h7v10H4zM25 22h7v10h-7z",
  clock:
    "M18 12a11 11 0 1 0 .1 0zM18 22v-6M18 22l5 3M8 8l5 4M28 8l-5 4",
  sausage: "M3 24q-2-9 7-9h14q9 0 7 9q-2 9-7 9H10q-9 0-7-9zM28 8a5 5 0 1 0 .1 0zM31 12l4 5",
  cracker: "M10 14h16v10H10zM10 14l-7 5 7 5M26 14l7 5-7 5",
  frost: "M18 3v30M5 10l26 16M31 10L5 26M13 6l5 5 5-5M13 30l5-5 5 5",
  lollipop: "M22 4a9 9 0 1 0 .1 0zM22 13h4a4 4 0 0 0-8 0M16 21L6 34",
  moustache: "M18 18q-6-8-15-2q2 11 15 4q13 7 15-4q-9-6-15 2z",
  lace: "M2 12h32M2 12a4.5 4.5 0 0 0 9 0a4.5 4.5 0 0 0 9 0a4.5 4.5 0 0 0 9 0a4.5 4.5 0 0 0 7 0M2 24a4.5 4.5 0 0 0 9 0a4.5 4.5 0 0 0 9 0a4.5 4.5 0 0 0 9 0",
  scales:
    "M18 4v26M8 30h20M5 10h26M5 10l-4 11h8zM31 10l-4 11h8zM1 21a4 3 0 0 0 8 0zM27 21a4 3 0 0 0 8 0z",
  pulse: "M2 20h8l3-12 5 24 4-16 3 4h9",
  key: "M10 8a6 6 0 1 0 .1 0zM15 18l17 14M25 26l5-5M30 31l4-4",
  spanner: "M6 32L22 16M22 16a7 7 0 1 1 11-9l-5 5 3 3 5-5a7 7 0 0 1-9 11",
  broom: "M20 2v22M9 24h22l4 10H5z",
  fish: "M4 18q11-13 23 0q-12 13-23 0zM27 18l8-7v14zM11 16h2",
  orange: "M18 9a11 11 0 1 0 .1 0zM18 9q2-6 9-6M18 9q-4-5-9-3M18 20l8 4M18 20l-8 4M18 20v8",
  scroll: "M8 4h22v26H8zM8 4a4 4 0 0 0 0 8M12 12h14M12 18h14M12 24h9",
  wool: "M18 5a13 13 0 1 0 .1 0zM7 13q11 6 22 0M5 22q13 6 26 0M14 6q-5 13 4 24",
} as const;

const ARTIFACT_SIZE = 36;
const LINE_HEIGHT = 1.2;
const CAPTION_SCALE = 0.72;
const CHAR_WIDTH = 0.72;

/** Text size that fits the longest line in the width and all lines in the height. */
function fontSize(lines: string[], width: number, height: number) {
  const weights = lines.map((line) => (line.startsWith("_") ? CAPTION_SCALE : 1));
  const widest = Math.max(
    ...lines.map(
      (line, i) => (line.replace(/^_/, "").length * weights[i]) / 1,
    ),
  );
  const tall = weights.reduce((sum, weight) => sum + weight * LINE_HEIGHT, 0);
  return Math.min(17, (width - 8) / (widest * CHAR_WIDTH), (height - 6) / tall);
}

function SignText({
  lines,
  x,
  y,
  w,
  h,
  fill = "currentColor",
  anchor = "middle",
}: {
  lines: string[];
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: string;
  anchor?: "middle" | "start";
}) {
  const size = fontSize(lines, w, h);
  const heights = lines.map(
    (line) => size * LINE_HEIGHT * (line.startsWith("_") ? CAPTION_SCALE : 1),
  );
  const total = heights.reduce((sum, height) => sum + height, 0);
  let cursor = y + (h - total) / 2;
  return lines.map((line, i) => {
    const caption = line.startsWith("_");
    const base = cursor + heights[i] * 0.82;
    cursor += heights[i];
    return (
      <text
        key={line}
        x={anchor === "middle" ? x + w / 2 : x}
        y={base}
        textAnchor={anchor}
        fill={fill}
        stroke="none"
        fontSize={size * (caption ? CAPTION_SCALE : 1)}
        className="font-display font-bold"
      >
        {caption ? line.slice(1) : line}
      </text>
    );
  });
}

function Frame({ sign: { x, y, w, h, kind } }: { sign: Sign }): ReactNode {
  const body = (extra?: ReactNode) => (
    <>
      <rect x={x} y={y} width={w} height={h} fill="var(--card)" />
      {extra}
    </>
  );
  switch (kind) {
    case "plate":
      return body(
        <>
          <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} strokeWidth={1.5} />
          <path d={`M${x + 6} ${y + 6}h.1M${x + w - 6} ${y + 6}h.1M${x + 6} ${y + h - 6}h.1M${x + w - 6} ${y + h - 6}h.1`} strokeWidth={3} />
        </>,
      );
    case "poster":
      return body(
        <>
          <path d={`M${x + w - 12} ${y}v12h12`} strokeWidth={1.5} />
          <path d={`M${x + w / 2 - 8} ${y - 3}h16`} strokeWidth={4} />
        </>,
      );
    case "board":
      return body(
        <>
          <path d={`M${x + 14} ${y}v-6M${x + w - 14} ${y}v-6`} strokeWidth={1.5} />
          <path d={`M${x + 3} ${y + h - 4}h${w - 6}`} strokeWidth={1.5} />
        </>,
      );
    case "label":
      return body(
        <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} strokeWidth={1.5} strokeDasharray="4 3" />,
      );
    case "receipt":
      return (
        <path
          d={`M${x} ${y}h${w}v${h}${Array.from({ length: 11 }, (_, i) => `l${-w / 11} ${i % 2 ? 4 : -4}`).join("")}z`}
          fill="var(--card)"
        />
      );
    case "arrow":
      return (
        <path
          d={`M${x} ${y}h${w - 14}l14 ${h / 2}l-14 ${h / 2}h${-(w - 14)}z`}
          fill="var(--card)"
        />
      );
    case "window":
      return body(<rect x={x - 3} y={y - 3} width={w + 6} height={h + 6} />);
    case "fascia":
      return body(
        <>
          <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} strokeWidth={1.5} />
          <path d={`M${x + 24} ${y}v-8h10M${x + w - 24} ${y}v-8h-10`} strokeWidth={1.5} />
        </>,
      );
    case "banner":
      return (
        <>
          <path
            d={`M${x} ${y}h${w}l-14 ${h / 2}l14 ${h / 2}h${-w}z`}
            fill="var(--card)"
          />
          <path d={`M${x + w + 2} ${y + h / 2}l36 -2M${x + w + 38} ${y + h / 2 - 2}`} strokeWidth={1.5} />
          <path
            d={`M${x + w + 38} ${y + h / 2 - 2}l-6 -6h-24l-4 6l4 6h24zM${x + w + 40} ${y + h / 2 - 2}l16 -14M${x + w + 40} ${y + h / 2 - 2}l16 14M${x + w + 28} ${y + h / 2 + 4}l6 14`}
            strokeWidth={2}
          />
        </>
      );
    case "blind":
      return <rect x={x} y={y} width={w} height={h} fill="currentColor" />;
    case "taxi":
      return body(
        <path d={`M${x + w / 2} ${y + h}V590`} strokeWidth={4} />,
      );
    case "graffiti":
      return null;
  }
}

function SignView({ sign }: { sign: Sign }) {
  const { x, y, w, h, kind, lines, art } = sign;
  if (kind === "graffiti") {
    return (
      <g transform={`rotate(-6 ${x + w / 2} ${y + h / 2})`}>
        <SignText lines={lines} x={x} y={y} w={w} h={h * 0.7} />
        <path d={`M${x + 12} ${y + 30}v18M${x + 30} ${y + 32}v10M${x + 56} ${y + 31}v22M${x + 76} ${y + 30}v8`} strokeWidth={2} />
        <path d={`M${x + 4} ${y + 52}q4-14 12-14M${x + 20} ${y + 52}l-4-14M${x + 40} ${y + 52}l-6-16`} strokeWidth={1.2} />
      </g>
    );
  }
  const inverted = kind === "blind";
  if (art) {
    const vertical = kind === "window";
    const artBox = vertical
      ? { x: x + w / 2 - ARTIFACT_SIZE / 2, y: y + h - ARTIFACT_SIZE - 4 }
      : { x: x + w - ARTIFACT_SIZE - 6, y: y + (h - ARTIFACT_SIZE) / 2 };
    const textArea = vertical
      ? { x, y: y + 2, w, h: h - ARTIFACT_SIZE - 8 }
      : { x: x + 4, y, w: w - ARTIFACT_SIZE - 14, h };
    return (
      <g>
        <Frame sign={sign} />
        <path
          d={ART[art]}
          transform={`translate(${artBox.x} ${artBox.y})`}
          strokeWidth={2}
        />
        <SignText lines={lines} {...textArea} />
      </g>
    );
  }
  return (
    <g>
      <Frame sign={sign} />
      <SignText
        lines={lines}
        x={x}
        y={y}
        w={w}
        h={h}
        fill={inverted ? "var(--card)" : "currentColor"}
      />
    </g>
  );
}

type Roof = "gable" | "flat" | "hip" | "step" | "mansard" | "gambrel";
const BUILDINGS: { roof: Roof; chimneys: number[]; door: number; lit: boolean }[] = [
  { roof: "gable", chimneys: [40, 150], door: 80, lit: true },
  { roof: "flat", chimneys: [100], door: 24, lit: false },
  { roof: "hip", chimneys: [60, 140], door: 130, lit: true },
  { roof: "step", chimneys: [100], door: 28, lit: false },
  { roof: "mansard", chimneys: [50, 150], door: 70, lit: true },
  { roof: "gambrel", chimneys: [100], door: 120, lit: false },
];

const BODY_TOP = 150;
const GROUND = 540;

function roofPath(roof: Roof, x: number) {
  const right = x + BUILDING_WIDTH;
  switch (roof) {
    case "gable":
      return `M${x} ${BODY_TOP}L${x + 100} 108L${right} ${BODY_TOP}`;
    case "flat":
      return `M${x} ${BODY_TOP}v-12h${BUILDING_WIDTH}v12M${x + 8} ${BODY_TOP - 12}v-6h${BUILDING_WIDTH - 16}v6`;
    case "hip":
      return `M${x} ${BODY_TOP}L${x + 36} 116H${right - 36}L${right} ${BODY_TOP}`;
    case "step":
      return `M${x} ${BODY_TOP}v-10h30v-12h30v-12h80v12h30v12h30v10`;
    case "mansard":
      return `M${x} ${BODY_TOP}L${x + 20} 118H${right - 20}L${right} ${BODY_TOP}M${x + 20} 118L${x + 40} 104H${right - 40}L${right - 20} 118`;
    case "gambrel":
      return `M${x} ${BODY_TOP}L${x + 34} 120L${x + 100} 102L${right - 34} 120L${right} ${BODY_TOP}`;
  }
}

function Building({
  index,
  roof,
  chimneys,
  door,
  lit,
}: (typeof BUILDINGS)[number] & { index: number }) {
  const x = index * BUILDING_WIDTH;
  return (
    <g>
      <rect
        x={x}
        y={BODY_TOP}
        width={BUILDING_WIDTH}
        height={GROUND - BODY_TOP}
        fill="url(#cambridge-wall)"
      />
      <path d={roofPath(roof, x)} />
      <path d={`M${x} ${BODY_TOP}h${BUILDING_WIDTH}`} />
      {chimneys.map((c) => (
        <g key={c}>
          <rect x={x + c - 7} y={BODY_TOP - 40} width={14} height={30} fill="var(--card)" />
          <path d={`M${x + c - 9} ${BODY_TOP - 40}h18M${x + c - 4} ${BODY_TOP - 40}v-8M${x + c + 4} ${BODY_TOP - 40}v-8`} />
        </g>
      ))}
      <rect x={x + door} y={452} width={46} height={88} fill="var(--card)" />
      <path d={`M${x + door + 23} 452v88M${x + door + 6} 466h12M${x + door + 28} 466h12M${x + door + 6} 480h12M${x + door + 28} 480h12`} />
      <path d={`M${x + door - 6} 452h58`} />
      {lit && (
        <path d={`M${x + door + 8} 530l8 6M${x + door + 30} 530l8 6`} strokeWidth={1.5} />
      )}
      <path d={`M${x} ${GROUND}v-${GROUND - BODY_TOP}`} />
    </g>
  );
}

function Car({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path d={`M${x + 12} ${y}q16-32 52-32h58q36 0 52 32`} fill="var(--card)" />
      <path d={`M${x + 28} ${y - 2}q12-22 38-22h54q26 0 38 22z`} />
      <rect x={x} y={y} width={186} height={52} fill="var(--card)" />
      <path d={`M${x + 4} ${y + 38}h178`} />
      <circle cx={x + 18} cy={y + 14} r={7} />
      <circle cx={x + 168} cy={y + 14} r={7} />
      <rect x={x} y={y + 52} width={32} height={18} />
      <rect x={x + 154} y={y + 52} width={32} height={18} />
    </g>
  );
}

function Bus() {
  const windows = Array.from({ length: 7 }, (_, i) => 384 + i * 55);
  return (
    <g>
      <rect x={360} y={625} width={420} height={140} fill="var(--card)" />
      <path d="M360 658h420M360 712h420" />
      {windows.map((x) => (
        <rect key={x} x={x} y={668} width={44} height={34} />
      ))}
      <path d="M376 718h388" strokeDasharray="12 6" />
      <circle cx={444} cy={766} r={18} fill="var(--card)" />
      <circle cx={444} cy={766} r={6} />
      <circle cx={696} cy={766} r={18} fill="var(--card)" />
      <circle cx={696} cy={766} r={6} />
      <path d="M778 640v80M760 640h20" />
    </g>
  );
}

function Pavement() {
  return (
    <g>
      <path d={`M0 ${GROUND}h1200M0 590h1200M0 598h1200`} />
      <path d="M40 565h60M160 565h50M300 565h70M420 565h40M520 565h80M660 565h50M780 565h60M900 565h40M1000 565h80M1120 565h50" strokeWidth={1.5} />
      <path d="M0 790h1200" strokeWidth={1.5} />
      <path d="M0 770h60M120 770h60M240 770h60M360 770h60M480 770h60M600 770h60M720 770h60M840 770h60M960 770h60M1080 770h60" strokeWidth={4} />
    </g>
  );
}

function StreetFurniture() {
  return (
    <g>
      <g>
        <circle cx={34} cy={570} r={14} />
        <circle cx={84} cy={570} r={14} />
        <path d="M34 570l20-30h22M84 570l-14-30h-16M62 540v-10h12" />
      </g>
      <g>
        <rect x={304} y={502} width={34} height={84} fill="var(--card)" />
        <path d="M304 518h34M321 502v84M310 526h8v14h-8zM324 526h8v14h-8z" />
        <path d="M302 502h38" strokeWidth={5} />
      </g>
      <g>
        <path d="M500 454v132" strokeWidth={4} />
        <path d="M488 454h24l-4 10h-16z" fill="var(--card)" />
        <path d="M478 470a30 30 0 0 0 44 0M470 482a44 44 0 0 0 60 0" strokeWidth={1.2} strokeDasharray="3 5" />
      </g>
      <g>
        <rect x={602} y={548} width={26} height={38} fill="var(--card)" />
        <path d="M602 556h26M608 566h14M602 548a13 8 0 0 1 26 0" />
      </g>
      <g>
        <path d="M700 564h30l-3 22h-24zM698 564h34" fill="var(--card)" />
      </g>
      <g>
        <path d="M936 586q-6-22 10-24q4-14 14-4q6 4 4 12q8 0 12 16z" fill="var(--card)" />
        <path d="M954 558l2-10l6 6M962 566h8M934 586q-12-4-10-16" />
      </g>
      <path d="M870 506V590M870 590h-8M870 590h8" strokeWidth={4} />
      <path d="M1196 100V590" strokeWidth={5} />
      <path d="M1184 100h16M1184 112h16" strokeWidth={3} />
      <path d="M1196 510V490" />
    </g>
  );
}

function Wires() {
  return (
    <g strokeWidth={1.5}>
      <path d="M1184 100Q600 160 0 106" />
      <path d="M1184 112Q600 172 0 120" />
      <path d="" />
    </g>
  );
}

function Sky() {
  return (
    <g>
      <circle cx={90} cy={72} r={34} />
      <path d="M70 52a28 28 0 0 1 0 40" />
      <path d="M200 40l8 8M300 70l10 8M430 30l8 10M520 80l8 6M620 40l8 8M1040 30l8 8M1100 70l8 8" strokeWidth={4} />
      <path d="M980 56h30l-6 10h-24zM1008 54l10-8M1010 66l12 6" />
      <path d="M958 61l22 0" strokeWidth={1.5} />
    </g>
  );
}

/**
 * A night street in ink line, drawn in the current text colour so it reads in both themes. The
 * signs are the hidden titles, so their lettering is part of the picture.
 */
export function CambridgeNight(props: ComponentProps<"svg">) {
  return (
    <svg
      viewBox={`0 0 ${CAMBRIDGE_NIGHT_SIZE.width} ${CAMBRIDGE_NIGHT_SIZE.height}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <defs>
        <pattern id="cambridge-wall" width={10} height={10} patternUnits="userSpaceOnUse">
          <path d="M0 5h10M5 0v5M0 10v-5" strokeWidth={0.6} opacity={0.35} />
        </pattern>
      </defs>
      <Sky />
      <Wires />
      {BUILDINGS.map((building, index) => (
        <Building key={index} index={index} {...building} />
      ))}
      <g>
        {[0, 1, 2, 3, 4, 5].flatMap((b) =>
          [UPPER, MIDDLE].flatMap((row) =>
            [0, 1].map((side) => (
              <g key={`${b}-${row.y}-${side}`}>
                <rect
                  x={b * BUILDING_WIDTH + 5 + side * 96}
                  y={row.y - 3}
                  width={94}
                  height={row.h + 6}
                  strokeWidth={1.2}
                />
                <path
                  d={`M${b * BUILDING_WIDTH + 2 + side * 96} ${row.y + row.h + 6}h100`}
                  strokeWidth={2}
                />
              </g>
            )),
          ),
        )}
        <g transform="translate(1104 160)">
          <circle cx={44} cy={29} r={22} fill="var(--card)" />
          <path d="M44 29v-15M44 29l10 6M44 9v2M44 49v2M24 29h2M64 29h2" />
        </g>
      </g>
      <Pavement />
      <StreetFurniture />
      <Car x={80} y={690} />
      <Bus />
      {SIGNS.map((sign) => (
        <SignView key={`${sign.x}-${sign.y}`} sign={sign} />
      ))}
    </svg>
  );
}
