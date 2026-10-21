import type { ComponentProps } from "react";

export const FIXTURE_STREET_SIZE = { width: 1200, height: 800 } as const;

const WINDOW_ROWS = [220, 320, 420] as const;

function Windows({ x, y, columns }: { x: number; y: number; columns: number }) {
  return Array.from({ length: columns }, (_, column) => (
    <g key={column}>
      <rect x={x + column * 90} y={y} width={50} height={64} />
      <path d={`M${x + column * 90 + 25} ${y}v64M${x + column * 90} ${y + 32}h50`} />
    </g>
  ));
}

/**
 * A night street in ink line, drawn in the current text colour so it reads in both themes. The
 * three signs are the hidden titles, so their text is part of the picture.
 */
export function FixtureStreet(props: ComponentProps<"svg">) {
  return (
    <svg
      viewBox={`0 0 ${FIXTURE_STREET_SIZE.width} ${FIXTURE_STREET_SIZE.height}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx={1060} cy={96} r={44} />
      <path d="M1040 70a34 34 0 0 1 0 52" />
      <path d="M120 150l8 10M190 90l10 8M600 70l8 10M760 110l10 8M930 160l8 10M330 60l10 8" />

      <path d="M40 640V200h360v440M40 200l180-70 180 70" />
      <path d="M300 130V86h36v60" />
      {WINDOW_ROWS.slice(0, 2).map((y) => (
        <Windows key={y} x={70} y={y} columns={3} />
      ))}
      <path d="M100 440h300M100 530h300M100 440v200M400 440v200" />
      <rect x={120} y={470} width={260} height={60} />
      <text
        x={250}
        y={512}
        textAnchor="middle"
        fill="currentColor"
        stroke="none"
        fontSize={34}
        className="font-display font-bold"
      >
        THE SWEENEY
      </text>
      <rect x={150} y={560} width={80} height={80} />
      <rect x={260} y={560} width={110} height={52} />

      <path d="M440 640V140h360v500M440 140l180-60 180 60" />
      <path d="M700 80V40h34v60M520 100h60v-30h-60z" />
      {[180, 400].map((y) => (
        <Windows key={y} x={470} y={y} columns={1} />
      ))}
      <Windows x={660} y={180} columns={2} />
      <Windows x={660} y={400} columns={2} />
      <rect x={520} y={260} width={170} height={120} />
      <path d="M528 268h154v104H528z" />
      <text
        x={605}
        y={308}
        textAnchor="middle"
        fill="currentColor"
        stroke="none"
        fontSize={26}
        className="font-display font-bold"
      >
        STARSKY
      </text>
      <text
        x={605}
        y={336}
        textAnchor="middle"
        fill="currentColor"
        stroke="none"
        fontSize={22}
        className="font-display font-bold"
      >
        &amp;
      </text>
      <text
        x={605}
        y={362}
        textAnchor="middle"
        fill="currentColor"
        stroke="none"
        fontSize={26}
        className="font-display font-bold"
      >
        HUTCH
      </text>
      <rect x={560} y={520} width={100} height={120} />
      <path d="M610 520v120M600 580h8M612 580h8" />

      <path d="M820 640V300M820 300q0-34 34-34M800 300h40" />
      <path d="M848 266h20v30h-20z" />
      <path d="M810 640h20" />

      <path d="M840 640V260h340v380M840 260h340" />
      <Windows x={880} y={440} columns={3} />
      <Windows x={880} y={540} columns={3} />
      <path d="M845 340h55M872 340v-30" />
      <rect x={900} y={330} width={220} height={70} />
      <text
        x={1010}
        y={374}
        textAnchor="middle"
        fill="currentColor"
        stroke="none"
        fontSize={24}
        className="font-display font-bold"
      >
        INSPECTOR MORSE
      </text>
      <path d="M910 330v-24M1110 330v-24" />

      <path d="M0 640h1200M0 700h1200M0 760h1200" />
      <path d="M80 730h110M330 730h110M580 730h110M830 730h110M1080 730h110" />
      <path d="M690 676q30-14 60 0M702 686q18-8 36 0" />
      <path d="M380 660q8-30 26-30t26 30z M424 636l6-14 6 12" />
    </svg>
  );
}
