import type { ComponentProps, ReactNode } from "react";

export const CAMBRIDGE_NIGHT_SIZE = { width: 1200, height: 800 } as const;

const GROUND = 540;
const KERB = 610;
const CARD = "var(--card)";
const NIGHT = "url(#cn-night)";
const DARK = "url(#cn-dark)";
const BRICK = "url(#cn-brick)";
const STONE = "url(#cn-stone)";

const FONTS = {
  display: "font-display font-bold",
  band: "font-band font-semibold",
  hand: "font-hand font-bold",
  mono: "font-mono font-bold",
} as const;

type Line = readonly [text: string, size: number];

/** Stacked lines of signwriting; `y` is the first baseline. */
function Lettering({
  x,
  y,
  lines,
  font = "display",
  anchor = "middle",
  fill = "currentColor",
}: {
  x: number;
  y: number;
  lines: readonly Line[];
  font?: keyof typeof FONTS;
  anchor?: "middle" | "start";
  fill?: string;
}) {
  let baseline = y;
  return lines.map(([text, size], i) => {
    if (i > 0) baseline += size * 1.2;
    return (
      <text
        key={`${text}-${i}`}
        x={x}
        y={baseline}
        textAnchor={anchor}
        fill={fill}
        stroke="none"
        fontSize={size}
        className={FONTS[font]}
      >
        {text}
      </text>
    );
  });
}

/** A sheet or board, tilted about its centre, with whatever is written on it. */
function Panel({
  x,
  y,
  w,
  h,
  tilt = 0,
  strokeWidth = 1.5,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  tilt?: number;
  strokeWidth?: number;
  children?: ReactNode;
}) {
  return (
    <g transform={tilt ? `rotate(${tilt} ${x + w / 2} ${y + h / 2})` : undefined}>
      <rect x={x} y={y} width={w} height={h} fill={CARD} strokeWidth={strokeWidth} />
      {children}
    </g>
  );
}

function Wall({
  x,
  y,
  w,
  h,
  fill = BRICK,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: string;
}) {
  return (
    <>
      <rect x={x} y={y} width={w} height={h} fill={CARD} />
      <rect x={x} y={y} width={w} height={h} fill={fill} stroke="none" />
    </>
  );
}

function Sash({
  x,
  y,
  w,
  h,
  lit = false,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  lit?: boolean;
}) {
  return (
    <>
      <rect x={x} y={y} width={w} height={h} fill={lit ? CARD : DARK} strokeWidth={2} />
      <path
        d={`M${x} ${y + h / 2}h${w}M${x + w / 2} ${y}v${h}`}
        strokeWidth={1.2}
      />
      <path d={`M${x - 3} ${y + h + 2}h${w + 6}`} strokeWidth={3} />
    </>
  );
}

const STARS = [
  [172, 34],
  [238, 58],
  [320, 24],
  [404, 46],
  [486, 22],
  [560, 56],
  [640, 30],
  [690, 76],
  [1090, 26],
  [1160, 62],
  [1046, 96],
  [24, 28],
] as const;

function Sky() {
  return (
    <g>
      <rect width={1200} height={GROUND} fill={NIGHT} stroke="none" />
      <circle cx={92} cy={74} r={36} fill={CARD} />
      <path d="M76 42a36 36 0 0 1 0 64a44 44 0 0 0 0-64z" fill={DARK} strokeWidth={1.2} />
      {STARS.map(([x, y]) => (
        <g key={x}>
          <circle cx={x} cy={y} r={5} fill={CARD} stroke="none" />
          <path d={`M${x - 4} ${y}h8M${x} ${y - 4}v8`} strokeWidth={1.2} />
        </g>
      ))}
      <path d="M520 76q12-12 28-6q16-12 30 0h24" strokeWidth={1.5} />
      <path d="M1118 192v-70l12-78 12 78v70z" fill={DARK} strokeWidth={1.5} />
      <path d="M1130 44v-14M1124 34h12" strokeWidth={1.5} />
    </g>
  );
}

function Plane() {
  return (
    <g>
      <path d="M720 32h240l-12 20 12 20H720z" fill={CARD} strokeWidth={1.5} />
      <Lettering
        x={832}
        y={51}
        lines={[
          ["DEATH IN PARADISE", 15],
          ["FLY NOW", 7],
        ]}
      />
      <path d="M960 52l32-3" strokeWidth={1} />
      <path
        d="M992 46q18-6 44-4l14-10v14l6 2-8 6q-30 8-52 2z"
        fill={CARD}
        strokeWidth={1.8}
      />
      <path d="M1012 44l-6-14h12l8 12M1012 54l-8 14h12l10-14M1038 44v8" strokeWidth={1.5} />
    </g>
  );
}

const PIERS = Array.from({ length: 11 }, (_, i) => 196 + i * 28);

function Chapel() {
  return (
    <g strokeWidth={1.5}>
      <rect x={172} y={100} width={320} height={100} fill={DARK} />
      {[160, 478].map((x) => (
        <g key={x}>
          <rect x={x} y={66} width={24} height={134} fill={DARK} />
          <path d={`M${x + 2} 66l10-18 10 18`} fill={CARD} />
        </g>
      ))}
      {PIERS.map((x) => (
        <g key={x}>
          <path d={`M${x} 100v-14l3-10 3 10v14`} fill={CARD} />
          <path d={`M${x + 9} 170v-44q8-14 16 0v44z`} fill={CARD} strokeWidth={1} />
          <path d={`M${x + 17} 170v-54`} strokeWidth={0.8} />
        </g>
      ))}
    </g>
  );
}

const MERLONS = Array.from({ length: 9 }, (_, i) => i * 20);

function Gatehouse() {
  return (
    <g>
      <Wall x={0} y={150} w={170} h={GROUND - 150} fill={STONE} />
      {MERLONS.map((x) => (
        <rect key={x} x={x} y={136} width={12} height={14} fill={CARD} strokeWidth={2} />
      ))}
      <path d="M26 212v-30q6-12 12 0v30zM132 212v-30q6-12 12 0v30z" fill={DARK} strokeWidth={1.5} />
      <path d="M85 208l-20-8v-20h40v20z" fill={CARD} strokeWidth={1.5} />
      <path d="M85 180v28M65 192h40" strokeWidth={1} />

      <rect x={10} y={224} width={150} height={134} fill={DARK} strokeWidth={2.5} />
      <path d="M4 224h162" strokeWidth={4} />
      <Panel x={18} y={232} w={70} h={50} tilt={-2}>
        <path d="M53 234v4" strokeWidth={3} />
        <Lettering
          x={53}
          y={252}
          lines={[
            ["ENDEAVOUR", 9.5],
            ["BOAT CLUB", 7],
            ["BUMPS, FRIDAY", 6.5],
          ]}
          font="band"
        />
      </Panel>
      <Panel x={96} y={236} w={58} h={60} tilt={3}>
        <path d="M125 238v4" strokeWidth={3} />
        <Lettering
          x={125}
          y={254}
          lines={[
            ["FATHER", 10],
            ["BROWN", 10],
            ["BISCUIT SALE", 6.5],
            ["SAT 2PM", 6.5],
          ]}
        />
      </Panel>
      <Panel x={20} y={291} w={68} h={58} tilt={1.5}>
        <Lettering
          x={54}
          y={306}
          lines={[
            ["UNFORGOTTEN", 8.5],
            ["UMBRELLAS", 8.5],
            ["ASK THE", 6.5],
            ["PORTER", 6.5],
          ]}
          font="band"
        />
      </Panel>
      <Panel x={98} y={304} w={54} h={46} tilt={-3}>
        <Lettering
          x={125}
          y={319}
          lines={[
            ["SOFTLY,", 9],
            ["SOFTLY", 9],
            ["EXAMS ON", 6.5],
          ]}
        />
      </Panel>

      <path d="M60 540V432a34 34 0 0 1 68 0v108z" fill={DARK} strokeWidth={3} />
      <path d="M94 398v142M60 470h68" strokeWidth={1.5} />
      <path d="M72 500h6v10h-6zM110 500h6v10h-6z" strokeWidth={1.2} />
      <Panel x={66} y={436} w={56} h={26}>
        <Lettering
          x={94}
          y={447}
          lines={[
            ["NO PUNTING", 6.5],
            ["AFTER DARK", 6.5],
          ]}
          font="band"
        />
      </Panel>

      <Panel x={4} y={400} w={52} h={72} strokeWidth={2}>
        <Lettering
          x={30}
          y={413}
          lines={[
            ["STAIRCASE B", 6],
            ["DR WREN", 7.5],
            ["PROF HALL", 7.5],
            ["MISS OKE", 7.5],
            ["LUDWIG", 8.5],
          ]}
          font="band"
        />
      </Panel>
    </g>
  );
}

function Pub() {
  return (
    <g>
      <path d="M170 190l90-60 90 60z" fill={CARD} />
      <path d="M170 190l90-60 90 60z" fill={DARK} stroke="none" />
      <rect x={300} y={136} width={18} height={34} fill={CARD} />
      <path d="M296 136h26" strokeWidth={4} />
      <Wall x={170} y={190} w={180} h={GROUND - 190} />
      <Sash x={186} y={208} w={46} h={56} lit />
      <Sash x={290} y={208} w={46} h={56} />
      <path d="M198 236q4-14 12 0v18h-12z" fill="currentColor" stroke="none" />

      <path d="M214 268h92" strokeWidth={4} />
      <path d="M226 268v8M294 268v8" strokeWidth={1.5} />
      <Panel x={220} y={276} w={80} h={66} strokeWidth={2}>
        <path d="M226 312q18-22 34-6q16-18 34 6" strokeWidth={1.5} />
        <circle cx={260} cy={288} r={5} strokeWidth={1.2} />
        <Lettering
          x={260}
          y={324}
          lines={[
            ["THE HAPPY", 10],
            ["VALLEY", 10],
          ]}
        />
      </Panel>

      <rect x={176} y={352} width={168} height={22} fill="currentColor" />
      <Lettering x={260} y={368} lines={[["FREE HOUSE", 13]]} fill={CARD} />

      <rect x={180} y={386} width={54} height={90} fill={CARD} strokeWidth={2} />
      <rect x={290} y={386} width={54} height={90} fill={CARD} strokeWidth={2} />
      <path d="M180 432h54M207 386v90M290 432h54M317 386v90" strokeWidth={1.2} />
      <Lettering x={207} y={426} lines={[["PUBLIC", 7]]} font="band" />
      <Lettering x={317} y={426} lines={[["SNUG", 7]]} font="band" />
      <rect x={238} y={386} width={46} height={154} fill={DARK} strokeWidth={2.5} />
      <path d="M261 386v154M250 470v12M272 470v12" strokeWidth={1.5} />
    </g>
  );
}

function Bookshop() {
  return (
    <g>
      <Wall x={350} y={170} w={160} h={GROUND - 170} />
      <path d="M350 170v-10h160v10" strokeWidth={3} />

      <rect x={368} y={190} width={126} height={126} fill={CARD} strokeWidth={2.5} />
      <path d="M368 300h126" strokeWidth={1.5} />
      <Lettering x={431} y={312} lines={[["OPTICIAN", 9]]} font="band" />
      <circle cx={386} cy={272} r={9} strokeWidth={1.5} />
      <circle cx={386} cy={272} r={3.5} fill="currentColor" stroke="none" />
      <path d="M377 272l-5-4M395 272l5-4" strokeWidth={1.2} />
      <Panel x={402} y={198} w={62} h={96} strokeWidth={2}>
        <Lettering
          x={433}
          y={222}
          lines={[
            ["S", 22],
            ["HE", 17],
            ["RLO", 13],
            ["CK", 10],
          ]}
        />
      </Panel>

      <rect x={354} y={330} width={152} height={26} fill={CARD} strokeWidth={2} />
      <Lettering x={430} y={348} lines={[["SECOND-HAND BOOKS", 12]]} font="band" />

      <rect x={358} y={366} width={148} height={140} fill={CARD} strokeWidth={2.5} />
      <path d="M358 482h148" strokeWidth={2} />
      <Panel x={362} y={392} w={46} h={72} tilt={-3} strokeWidth={2}>
        <Lettering
          x={385}
          y={414}
          lines={[
            ["FOYLE'S", 8.5],
            ["WAR", 12],
            ["VOL. II", 6.5],
          ]}
        />
      </Panel>
      <g>
        <Panel x={416} y={386} w={42} h={62}>
          <Lettering
            x={437}
            y={404}
            lines={[
              ["MURDER,", 8.5],
              ["SHE", 8.5],
              ["WROTE", 8.5],
            ]}
            font="mono"
          />
        </Panel>
        <path d="M410 448h54l6 32h-66z" fill={CARD} strokeWidth={2} />
        <path d="M414 458h46M412 466h50" strokeWidth={2} strokeDasharray="1 5" />
      </g>
      <Panel x={464} y={394} w={38} h={66} tilt={2} strokeWidth={2}>
        <Lettering
          x={483}
          y={412}
          lines={[
            ["WIRE IN", 8],
            ["THE", 8],
            ["BLOOD", 8],
          ]}
          font="band"
        />
        <path d="M470 446q12-8 26 0" strokeWidth={1.2} />
      </Panel>
      <g strokeWidth={1.5}>
        <rect x={366} y={484} width={120} height={8} fill={CARD} />
        <rect x={372} y={492} width={124} height={9} fill={DARK} />
      </g>
      <path d="M358 530h148" strokeWidth={1.5} />

      <path d="M430 128v40" strokeWidth={3} />
      <Panel x={428} y={130} w={72} h={36} strokeWidth={2}>
        <Lettering
          x={464}
          y={145}
          lines={[
            ["BROADCHURCH", 8],
            ["ESTATES", 6.5],
            ["SOLD", 7],
          ]}
          font="band"
        />
      </Panel>
    </g>
  );
}

const ARCHES = [534, 594, 654];

function Theatre() {
  return (
    <g>
      <path d="M510 130l105-40 105 40z" fill={CARD} strokeWidth={3} />
      <circle cx={615} cy={114} r={9} strokeWidth={1.5} />
      <Wall x={510} y={130} w={210} h={GROUND - 130} fill={STONE} />
      {ARCHES.map((x, i) => (
        <path
          key={x}
          d={`M${x} 262v-84a16 16 0 0 1 32 0v84z`}
          fill={i === 1 ? CARD : DARK}
          strokeWidth={2}
        />
      ))}
      <path d="M516 130v410M714 130v410M516 278h198" strokeWidth={2} />

      <path d="M508 290h214l-10 66H518z" fill={CARD} strokeWidth={3} />
      <path d="M522 300h186" strokeWidth={1.2} strokeDasharray="2 7" />
      <Lettering
        x={615}
        y={318}
        lines={[
          ["TONIGHT", 8],
          ["MIDSOMER MURDERS", 15],
          ["DINNER THEATRE", 7.5],
        ]}
      />

      <rect x={578} y={372} width={74} height={168} fill={DARK} strokeWidth={2.5} />
      <path d="M615 372v168M590 450h14M626 450h14" strokeWidth={2} />

      <Panel x={520} y={366} w={54} h={80} strokeWidth={2.5}>
        <circle cx={547} cy={380} r={6} strokeWidth={1.2} />
        <path d="M547 386v18M535 398l12-8 12 8M547 404l-7 8M547 404l7 8" strokeWidth={1.2} />
        <Lettering
          x={547}
          y={424}
          lines={[
            ["SILENT", 8],
            ["WITNESS", 8],
            ["A MIME", 6],
          ]}
        />
      </Panel>
      <Panel x={520} y={456} w={54} h={32} strokeWidth={2}>
        <Lettering
          x={547}
          y={470}
          lines={[
            ["BOX", 7.5],
            ["OFFICE", 7.5],
          ]}
          font="band"
        />
      </Panel>
      <Panel x={656} y={366} w={58} h={80} strokeWidth={2.5}>
        <path d="M660 392h12l4-14 6 26 4-16 3 4h20" strokeWidth={1.5} />
        <Lettering
          x={685}
          y={420}
          lines={[
            ["HEARTBEAT", 8],
            ["APPEAL", 8],
          ]}
        />
      </Panel>
      <Panel x={656} y={456} w={58} h={36} strokeWidth={2}>
        <Lettering
          x={685}
          y={470}
          lines={[
            ["BODYGUARD", 8],
            ["NIGHT DOOR", 6.5],
          ]}
          font="band"
        />
      </Panel>
    </g>
  );
}

function Barber() {
  return (
    <g>
      <path d="M720 200v-8h110v8" strokeWidth={3} />
      <Wall x={720} y={200} w={110} h={GROUND - 200} />
      <rect x={736} y={216} width={78} height={68} fill={CARD} strokeWidth={2.5} />
      <path d="M775 216v10M736 276h78" strokeWidth={1.2} />
      <Lettering
        x={775}
        y={246}
        lines={[
          ["LAW & ORDER", 9.5],
          ["SOLICITORS", 7],
        ]}
      />

      <Panel x={734} y={294} w={84} h={30} strokeWidth={2}>
        <Lettering
          x={776}
          y={307}
          lines={[
            ["JONATHAN CREEK", 8],
            ["CB3", 6.5],
          ]}
          font="band"
        />
      </Panel>

      <rect x={724} y={332} width={102} height={34} fill={CARD} strokeWidth={2.5} />
      <Lettering
        x={775}
        y={349}
        lines={[
          ["KOJAK", 15],
          ["CLOSE SHAVES", 7],
        ]}
      />
      <rect x={728} y={374} width={86} height={126} fill={CARD} strokeWidth={2.5} />
      <path d="M730 470h82" strokeWidth={2} />
      <circle cx={771} cy={392} r={14} fill={DARK} strokeWidth={1.5} />
      <rect x={736} y={424} width={70} height={44} fill={CARD} strokeWidth={2} />
      <path d="M736 432h70" strokeWidth={1} />
      <Lettering
        x={771}
        y={446}
        lines={[
          ["POIROT", 11],
          ["MOUSTACHE WAX", 6.5],
        ]}
      />
      <path d="M746 480h8v14h-8zM762 476h6v18h-6zM782 482h20v12h-20z" strokeWidth={1.2} />
      <rect x={820} y={374} width={9} height={60} fill={CARD} strokeWidth={1.5} />
      <path d="M820 386l9-8M820 400l9-8M820 414l9-8M820 428l9-8" strokeWidth={2} />
    </g>
  );
}

function Cleaners() {
  return (
    <g>
      <path d="M830 196l57-30 58 30z" fill={DARK} strokeWidth={2.5} />
      <Wall x={830} y={196} w={115} h={GROUND - 196} />
      <rect x={846} y={210} width={84} height={82} fill={CARD} strokeWidth={2.5} />
      <Lettering
        x={888}
        y={236}
        lines={[
          ["DALZIEL &", 9.5],
          ["PASCOE", 9.5],
          ["ACCOUNTANTS", 7],
        ]}
        font="band"
      />
      <rect x={834} y={304} width={108} height={22} fill="currentColor" />
      <Lettering x={888} y={319} lines={[["SPOTLESS CLEANERS", 8.5]]} fill={CARD} />
      <rect x={836} y={334} width={104} height={160} fill={CARD} strokeWidth={2.5} />
      <path d="M842 348h92" strokeWidth={2.5} />
      <path
        d="M870 348v6l-22 12-4 28 8 2 2-14v62h44v-62l2 14 8-2-4-28-22-12v-6z"
        fill={CARD}
        strokeWidth={1.5}
      />
      <path d="M866 356l10 14 10-14M876 370v76M854 398h44" strokeWidth={1.2} />
      <Panel x={882} y={434} w={52} h={40} tilt={-4}>
        <Lettering
          x={908}
          y={450}
          lines={[
            ["COLUMBO", 9],
            ["1 RAINCOAT", 6.5],
            ["READY FRI", 6.5],
          ]}
          font="mono"
        />
      </Panel>
    </g>
  );
}

function Bakery() {
  return (
    <g>
      <path d="M945 200v-8h120v8" strokeWidth={3} />
      <Wall x={945} y={200} w={120} h={GROUND - 200} />
      <rect x={965} y={246} width={82} height={72} fill={CARD} strokeWidth={2.5} />
      <path
        d="M965 256q5 7 10 0t10 0t10 0t10 0t10 0t10 0t10 0t12 0"
        strokeWidth={1.2}
      />
      <Lettering
        x={1006}
        y={278}
        lines={[
          ["CAGNEY &", 9],
          ["LACEY", 9],
          ["CURTAINS", 6.5],
        ]}
      />
      <rect x={950} y={326} width={110} height={30} fill={CARD} strokeWidth={2.5} />
      <Lettering x={1005} y={346} lines={[["LUNCH BY LEWIS", 11]]} font="band" />
      <rect x={952} y={364} width={106} height={136} fill={CARD} strokeWidth={2.5} />
      <path
        d="M968 462v-44q37-14 74 0v44zM968 418q6 14 12 0q6 14 12 0q6 14 12 0q6 14 12 0q6 14 12 0q6 14 12 0"
        strokeWidth={1.5}
      />
      <path d="M960 462h90M990 462l-6 18h42l-6-18" strokeWidth={1.5} />
      <Lettering
        x={1005}
        y={440}
        lines={[
          ["A TOUCH", 12],
          ["OF FROST", 12],
        ]}
        font="hand"
      />
      <Lettering x={1005} y={382} lines={[["ICED BUNS 40P", 7]]} font="band" />
      <path d="M956 490h98" strokeWidth={2} />
    </g>
  );
}

function Washing() {
  return (
    <g>
      <path d="M916 180Q1000 196 1078 172" strokeWidth={1.2} />
      <path
        d="M972 184l14 2 12 6 12-6 16-2 16 16-8 12-8-6v30h-52v-30l-8 6-8-12z"
        fill={CARD}
        strokeWidth={1.5}
      />
      <Lettering
        x={998}
        y={216}
        lines={[
          ["SHETLAND", 7.5],
          ["HAND WASH", 6],
        ]}
        font="band"
      />
    </g>
  );
}

function Fishmonger() {
  return (
    <g>
      <Wall x={1065} y={186} w={135} h={GROUND - 186} />
      <path d="M1065 186h135" strokeWidth={3} />
      <path d="M1074 150v190M1192 150v190M1070 196h126M1070 250h126" strokeWidth={2} />
      <Panel x={1078} y={200} w={112} h={46} strokeWidth={2}>
        <Lettering
          x={1134}
          y={220}
          lines={[
            ["THE PROFESSIONALS", 9.5],
            ["SCAFFOLD HIRE", 7],
            ["EST. 1977", 6.5],
          ]}
          font="band"
        />
      </Panel>
      <rect x={1092} y={262} width={86} height={58} fill={CARD} strokeWidth={2.5} />
      <Lettering
        x={1135}
        y={282}
        lines={[
          ["JULIET BRAVO", 9],
          ["RADIO REPAIRS", 7],
        ]}
      />
      <path d="M1112 312v-14h46v14zM1118 305h12M1146 305h6" strokeWidth={1.2} />
      <rect x={1070} y={330} width={126} height={36} fill={CARD} strokeWidth={2.5} />
      <Lettering
        x={1133}
        y={346}
        lines={[
          ["DIXON OF DOCK GREEN", 9],
          ["FISHMONGER", 7],
        ]}
      />
      <rect x={1072} y={374} width={122} height={124} fill={DARK} strokeWidth={2.5} />
      <path d="M1076 474h114l-8 22h-98z" fill={CARD} strokeWidth={2} />
      {[1092, 1124, 1156].map((x) => (
        <path
          key={x}
          d={`M${x - 12} 464q12-11 24 0q-12 11-24 0zM${x + 12} 464l6-5v10z`}
          fill={CARD}
          strokeWidth={1.2}
        />
      ))}
      <Panel x={1104} y={394} w={58} h={24} tilt={2}>
        <Lettering x={1133} y={410} lines={[["COD 90P", 10]]} font="hand" />
      </Panel>
      <Lettering x={1132} y={526} lines={[["LUTHER WOZ ERE", 15]]} font="hand" />
      <path d="M1088 528v8M1120 529v5M1166 528v9" strokeWidth={1.2} />
    </g>
  );
}

function Pavement() {
  return (
    <g>
      <rect y={GROUND} width={1200} height={KERB - GROUND} fill={CARD} />
      <path d={`M0 ${GROUND}h1200M0 ${KERB}h1200M0 ${KERB + 6}h1200`} />
      <path
        d="M60 540l-14 70M180 540l-10 70M300 540l-6 70M420 540l-3 70M540 540v70M660 540l3 70M780 540l6 70M900 540l10 70M1020 540l14 70M1140 540l18 70"
        strokeWidth={0.8}
      />
    </g>
  );
}

function Lamp({ x }: { x: number }) {
  return (
    <g>
      <path d={`M${x} 380v226`} strokeWidth={4} />
      <path d={`M${x - 8} 606h16`} strokeWidth={3} />
      <path d={`M${x - 10} 380h20l-5-16h-10z`} fill={CARD} strokeWidth={2} />
      <path
        d={`M${x - 26} 400q26 16 52 0M${x - 38} 414q38 22 76 0`}
        strokeWidth={1.2}
        strokeDasharray="3 5"
      />
    </g>
  );
}

function PavementLife() {
  return (
    <g>
      <Lamp x={148} />
      <Panel x={118} y={472} w={60} h={68} tilt={2}>
        <Lettering
          x={148}
          y={487}
          lines={[
            ["LOST CAT", 8.5],
            ["ASK", 6.5],
            ["MISS", 9],
            ["MARPLE", 9],
          ]}
        />
      </Panel>

      <g>
        <path d="M22 556l-10-44M30 556l-2-52M98 556l10-40" strokeWidth={2} />
        <path d="M6 512l12-4M22 504l12 2M104 516l10 4" strokeWidth={3.5} />
        <rect x={14} y={556} width={94} height={38} fill={CARD} strokeWidth={2} />
        <circle cx={34} cy={598} r={10} fill={CARD} strokeWidth={2} />
        <circle cx={88} cy={598} r={10} fill={CARD} strokeWidth={2} />
        <Lettering
          x={61}
          y={572}
          lines={[
            ["SWEENEY & SON", 9],
            ["SWEEPS", 7],
          ]}
        />
      </g>

      <g>
        <path d="M200 572l6-74h40l6 74M206 572l-4 34M246 572l4 34" strokeWidth={2} />
        <rect x={203} y={504} width={46} height={62} fill={DARK} strokeWidth={2} />
        <Panel x={205} y={506} w={42} h={58} strokeWidth={0.8}>
          <Lettering
            x={226}
            y={521}
            lines={[
              ["TONIGHT", 8.5],
              ["QUIZ", 8.5],
              ["PRIZE:", 8.5],
              ["CRACKER", 10],
            ]}
            font="hand"
          />
        </Panel>
      </g>

      <g>
        <path
          d="M292 526q-6 38 0 76h52q6-38 0-76z"
          fill={CARD}
          strokeWidth={2.5}
        />
        <path d="M288 544h60M288 584h60" strokeWidth={2} />
        <Lettering
          x={318}
          y={562}
          lines={[
            ["TAGGART", 9],
            ["BITTER", 7],
          ]}
          font="band"
        />
      </g>

      <g>
        <path
          d="M362 568v-16h4v-8h4v8h4v16M384 568v-16h4v-8h4v8h4v16M404 568v-16h4v-8h4v8h4v16"
          fill={CARD}
          strokeWidth={1.5}
        />
        <rect x={352} y={566} width={68} height={40} fill={CARD} strokeWidth={2} />
        <path d="M352 576h68M352 596h68" strokeWidth={1} />
        <Lettering x={386} y={590} lines={[["BERGERAC", 11]]} font="band" />
      </g>

      <g>
        <path d="M432 550h40l-4 56h-32z" fill={CARD} strokeWidth={2} />
        <path d="M428 550h48" strokeWidth={3.5} />
        <path d="M444 562v34M452 562v34M460 562v34" strokeWidth={1} />
        <g transform="rotate(7 452 520)">
          <path
            d="M432 548v-56h40v56l-7-4-6 4-6-4-7 4-7-4z"
            fill={CARD}
            strokeWidth={1.2}
          />
          <Lettering
            x={452}
            y={505}
            lines={[
              ["THE BILL", 8],
              ["14.50", 8],
              ["THANKS", 6],
            ]}
            font="mono"
          />
        </g>
      </g>

      <g>
        <path d="M492 532v74M552 532v74" strokeWidth={2.5} />
        <rect x={492} y={530} width={60} height={62} fill={CARD} strokeWidth={2.5} />
        <Lettering
          x={522}
          y={546}
          lines={[
            ["CAMBRIDGE NEWS", 5.5],
            ["PRIME", 12],
            ["SUSPECT", 12],
            ["HELD", 12],
          ]}
          font="band"
        />
      </g>

      <g>
        <rect x={602} y={560} width={26} height={46} fill={CARD} strokeWidth={2} />
        <path d="M600 560q15-16 30 0zM600 572h30M608 582h14" strokeWidth={2} />
      </g>

      <g>
        <path d="M724 524v82M828 524v82" strokeWidth={2.5} />
        <path
          d="M716 506h120l6 20h-132zM736 506l-4 20M756 506l-2 20M776 506v20M796 506l2 20M816 506l4 20"
          fill={CARD}
          strokeWidth={1.5}
        />
        <path d="M730 554q5-16 12-8q6-12 14 0q8-10 14 0q8-8 12 0q8-10 14 0q6-8 10 0q6-6 10 8z" fill={CARD} strokeWidth={1.2} />
        <rect x={722} y={554} width={108} height={50} fill={CARD} strokeWidth={2} />
        <Lettering
          x={776}
          y={576}
          lines={[
            ["VERA", 17],
            ["FRUIT & VEG", 9.5],
          ]}
          font="hand"
        />
      </g>

      <g>
        <path d="M848 606v-98h92v98" strokeWidth={2.5} />
        <path d="M842 508h104" strokeWidth={4} />
        <Panel x={856} y={516} w={62} h={68} strokeWidth={2}>
          <Lettering
            x={887}
            y={534}
            lines={[
              ["LINE OF", 10],
              ["DUTY", 10],
              ["FREE", 10],
              ["FLY CAM AIR", 6],
            ]}
            font="band"
          />
        </Panel>
        <path d="M924 590h14" strokeWidth={3} />
      </g>

      <g transform="translate(-14 0)">
        <path
          d="M966 606q-12-26 6-34q-2-12 4-14l6 6h6l6-6q6 4 2 16q14 10 6 32z"
          fill={DARK}
          strokeWidth={1.8}
        />
        <path d="M1000 604q14 0 10-16" strokeWidth={1.8} />
      </g>

      <g>
        <circle cx={1021} cy={577} r={29} fill={CARD} strokeWidth={2.5} />
        <circle cx={1021} cy={577} r={24} strokeWidth={0.8} strokeDasharray="1 3" />
        <Lettering
          x={1021}
          y={575}
          lines={[
            ["THE WIRE", 9.5],
            ["50 METRES", 6],
          ]}
          font="band"
        />
      </g>

      <Lamp x={1058} />

      <g strokeWidth={1.8}>
        <circle cx={1102} cy={588} r={18} />
        <circle cx={1168} cy={588} r={18} />
        <path d="M1102 588l22-32h34l10 32M1124 556l12 32h-34M1158 556l-3-12h-10M1120 548h12" />
        <path d="M1150 538h20l-3 12h-14z" fill={CARD} />
      </g>
    </g>
  );
}

function Road() {
  return (
    <g>
      <rect y={KERB + 6} width={1200} height={800 - KERB - 6} fill={NIGHT} stroke="none" />
      <path
        d="M0 786h60M120 786h60M240 786h60M360 786h60M480 786h60M600 786h60M720 786h60M840 786h60M960 786h60M1080 786h60"
        strokeWidth={4}
      />
    </g>
  );
}

function Car() {
  return (
    <g>
      <path d="M58 690q14-40 50-40h60q36 0 50 40z" fill={CARD} />
      <path d="M74 688q10-28 38-28h52q28 0 38 28z" fill={DARK} strokeWidth={1.5} />
      <rect x={44} y={690} width={188} height={60} fill={CARD} />
      <path d="M50 712h176M50 742h176" strokeWidth={1.5} />
      <circle cx={64} cy={704} r={7} fill={CARD} />
      <circle cx={212} cy={704} r={7} fill={CARD} />
      <rect x={100} y={716} width={76} height={30} fill={CARD} strokeWidth={2} />
      <Lettering x={138} y={737} lines={[["MORSE 1", 15]]} font="mono" />
      <rect x={46} y={750} width={32} height={18} fill={DARK} />
      <rect x={198} y={750} width={32} height={18} fill={DARK} />
    </g>
  );
}

function Fingerpost() {
  return (
    <g>
      <path d="M288 640v136" strokeWidth={4} />
      <path d="M278 776h20" strokeWidth={3} />
      <path d="M236 650h96l10 12-10 12h-96z" fill={CARD} strokeWidth={1.8} />
      <Lettering x={284} y={666} lines={[["GRANTCHESTER 2", 9]]} font="band" />
      <path d="M340 680h-96l-10 11 10 11h96z" fill={CARD} strokeWidth={1.8} />
      <Lettering x={288} y={695} lines={[["TRUMPINGTON 1", 8.5]]} font="band" />
    </g>
  );
}

const BUS_WINDOWS = Array.from({ length: 7 }, (_, i) => 384 + i * 55);

function Bus() {
  return (
    <g>
      <rect x={360} y={625} width={420} height={140} fill={CARD} />
      <path d="M360 662h420" />
      {BUS_WINDOWS.map((x) => (
        <rect key={x} x={x} y={668} width={44} height={36} fill={x % 2 ? DARK : CARD} strokeWidth={2} />
      ))}
      <path d="M778 640v80M762 640h18" />
      <rect x={386} y={631} width={170} height={28} fill="currentColor" />
      <Lettering x={471} y={651} lines={[["25  WHITECHAPEL", 17]]} fill={CARD} />
      <Panel x={474} y={710} w={194} h={42} strokeWidth={2}>
        <Lettering
          x={571}
          y={729}
          lines={[
            ["WAKING THE DEAD?", 15],
            ["STRONG COFFEE, 6:30AM", 8],
          ]}
          font="band"
        />
      </Panel>
      <circle cx={428} cy={766} r={19} fill={CARD} />
      <circle cx={428} cy={766} r={6} />
      <circle cx={716} cy={766} r={19} fill={CARD} />
      <circle cx={716} cy={766} r={6} />
    </g>
  );
}

function Taxi() {
  return (
    <g>
      <path d="M800 758v-52l16-6 26-38h96l34 38 22 6v52z" fill={CARD} />
      <path d="M848 668h40v30h-62zM896 668h40l26 30h-66z" fill={DARK} strokeWidth={1.8} />
      <rect x={870} y={702} width={84} height={46} fill={CARD} strokeWidth={2} />
      <Lettering
        x={912}
        y={723}
        lines={[
          ["Z CARS", 14],
          ["TAXIS", 8],
        ]}
      />
      <circle cx={836} cy={760} r={17} fill={CARD} />
      <circle cx={836} cy={760} r={5} />
      <circle cx={966} cy={760} r={17} fill={CARD} />
      <circle cx={966} cy={760} r={5} />
    </g>
  );
}

function Van() {
  return (
    <g>
      <rect x={1020} y={640} width={132} height={116} fill={CARD} />
      <path d="M1152 666h22l22 40v50h-44z" fill={CARD} />
      <path d="M1160 674h12l14 30h-26z" fill={DARK} strokeWidth={1.8} />
      <Lettering
        x={1086}
        y={674}
        lines={[
          ["SCOTT & BAILEY", 12],
          ["LOCKSMITHS", 9],
        ]}
      />
      <circle cx={1070} cy={710} r={8} strokeWidth={2} />
      <path d="M1078 710h34M1100 710v8M1108 710v6" strokeWidth={2} />
      <circle cx={1052} cy={760} r={17} fill={CARD} />
      <circle cx={1052} cy={760} r={5} />
      <circle cx={1164} cy={760} r={17} fill={CARD} />
      <circle cx={1164} cy={760} r={5} />
    </g>
  );
}

/**
 * A night street in ink line, drawn in the current text colour so it reads in both themes: night
 * is hatching, and light is the clean card fill. Lettering is part of the picture, and not all of
 * it is a title.
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
        <pattern id="cn-night" width={7} height={7} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 3.5h7" strokeWidth={0.7} opacity={0.4} />
        </pattern>
        <pattern id="cn-dark" width={4} height={4} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 2h4" strokeWidth={1.1} opacity={0.8} />
        </pattern>
        <pattern id="cn-brick" width={20} height={12} patternUnits="userSpaceOnUse">
          <path d="M0 6h20M0 12h20M6 0v6M16 6v6" strokeWidth={0.5} opacity={0.4} />
        </pattern>
        <pattern id="cn-stone" width={36} height={18} patternUnits="userSpaceOnUse">
          <path d="M0 9h36M0 18h36M12 0v9M30 9v9" strokeWidth={0.6} opacity={0.35} />
        </pattern>
      </defs>
      <Sky />
      <Chapel />
      <Plane />
      <Gatehouse />
      <Pub />
      <Bookshop />
      <Theatre />
      <Barber />
      <Cleaners />
      <Bakery />
      <Fishmonger />
      <Washing />
      <Pavement />
      <PavementLife />
      <Road />
      <Fingerpost />
      <Car />
      <Bus />
      <Taxi />
      <Van />
    </svg>
  );
}
