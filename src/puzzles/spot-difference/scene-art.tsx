import type { ComponentProps } from "react";
import { cn } from "@/utils/cn";
import { sceneImage } from "./scenes";
import type { Payload } from "./schema";

/**
 * One prepared engraving, drawn as a mask over the current text colour: the paper is transparent and
 * the ink is alpha, so the lines take the ink of the surface they sit on in both themes.
 * The aspect ratio reserves the box, so nothing shifts when the image arrives.
 */
export function SceneArt({
  sceneKey,
  width,
  height,
  version,
  className,
  style,
  children,
  ...props
}: Pick<Payload, "sceneKey" | "width" | "height"> & {
  version: "original" | "altered";
} & ComponentProps<"div">) {
  const url = `url(${sceneImage(sceneKey, version)})`;
  return (
    <div
      {...props}
      className={cn("relative w-full", className)}
      style={{ ...style, aspectRatio: `${width} / ${height}` }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-current"
        style={{
          maskImage: url,
          WebkitMaskImage: url,
          maskSize: "100% 100%",
          WebkitMaskSize: "100% 100%",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
        }}
      />
      {children}
    </div>
  );
}
