import { MiniGrid } from "../_shared/preview/mini-grid";
import { RegionBorders } from "../_shared/preview/region-borders";
import { layoutOf } from "./engine";
import type { Payload } from "./schema";

export function Preview({ payload }: { payload: Payload }) {
  const { rows, cols, regionOf } = layoutOf(payload);
  return (
    <MiniGrid rows={rows} cols={cols}>
      <RegionBorders
        regionOf={(row, col) => regionOf[row * cols + col]}
        rows={rows}
        cols={cols}
      />
    </MiniGrid>
  );
}
