import { MiniGrid } from "../_shared/preview/mini-grid";
import { RegionBorders } from "../_shared/preview/region-borders";
import { layoutOf } from "./engine";
import type { Payload } from "./schema";

export function Preview({ payload }: { payload: Payload }) {
  const { size, regionOf } = layoutOf(payload);
  return (
    <MiniGrid rows={size} cols={size}>
      <RegionBorders
        regionOf={(row, col) => regionOf[row * size + col]}
        rows={size}
        cols={size}
      />
    </MiniGrid>
  );
}
