import { VisitRecorder } from "@/components/puzzle/visit-recorder";
import { getCurrentUser } from "@/lib/data/user";

export async function VisitSlot({ typeKey }: { typeKey: string }) {
  if (!(await getCurrentUser())) return null;
  return <VisitRecorder typeKey={typeKey} />;
}
