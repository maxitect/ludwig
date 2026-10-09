import { CipherStrip } from "../_shared/preview/cipher-strip";
import type { Payload } from "./schema";

export function Preview({ payload: { ciphertext } }: { payload: Payload }) {
  return <CipherStrip text={ciphertext} />;
}
