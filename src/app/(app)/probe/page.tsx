// probe: removed in T015
import { getProbeTime } from "@/lib/data/probe";

export default async function ProbePage() {
  const now = await getProbeTime();
  return <p data-testid="probe-now">{now}</p>;
}
