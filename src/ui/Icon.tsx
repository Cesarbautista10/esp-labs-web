// The interface's line icons: small drawings on a 24-unit grid in currentColor, so an icon takes
// the colour and size of the text around it (controls, section headings, navigation). The
// colourful parts of the bench (boards, LEDs, readers, mics) are in the parts library,
// src/ui/parts. Decorative by default: the label next to an icon carries the meaning.

/** A circle as path data, so every icon stays one <path>. */
const o = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

const PATHS = {
  // Interface
  arrow: "M5 12h14M13 6l6 6-6 6",
  back: "M19 12H5M11 6l-6 6 6 6",
  up: "M12 19V5M6 11l6-6 6 6",
  grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  sliders: "M4 6h9M17 6h3M15 4v4M4 12h3M11 12h9M9 10v4M4 18h11M19 18h1M17 16v4",
  log: "M6 3h9l3 3v15H6zM9 9h6M9 13h6M9 17h4",
  code: "M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16",
  rotateLeft: "M4 4v5h5M4.6 13a8 8 0 1 0 1.8-7.4L4 9",
  rotateRight: "M20 4v5h-5M19.4 13a8 8 0 1 1-1.8-7.4L20 9",
  zoomIn: `${o(11, 11, 7)}M21 21l-5-5M8 11h6M11 8v6`,
  zoomOut: `${o(11, 11, 7)}M21 21l-5-5M8 11h6`,
  recenter: `${o(12, 12, 3)}M12 2v4M12 18v4M2 12h4M18 12h4`,

  // Sections of a lesson
  flag: "M5 21V4M5 4h11l-2.5 4L16 12H5",
  bulb: "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3",
  wire: "M3 3h4v5H3zM5 8c0 7 14 1 14 8M17 16h4v5h-4z",
  terminal: "M3 5h18v14H3zM7 10l3 2-3 2M12 15h5",
  steps: "M4 6l1.5 1.5L8 5M4 12l1.5 1.5L8 11M4 18l1.5 1.5L8 17M11 6h9M11 12h9M11 18h9",
  scope: "M3 4h18v14H3zM6 13c1.5-6 3-6 4.5 0s3 6 4.5 0c.8-3 2-3.5 3-2",

  // The board, in the navigation
  board:
    "M7 2h10v20H7zM9.5 4h5v6h-5zM4 6h3M4 9h3M4 12h3M4 15h3M4 18h3M17 6h3M17 9h3M17 12h3M17 15h3M17 18h3M10 19h4",
  chip: "M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 18,
  label,
  stroke = 1.8,
}: {
  name: IconName;
  size?: number;
  label?: string;
  /** Line weight in grid units; big tiles read better a little lighter. */
  stroke?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
