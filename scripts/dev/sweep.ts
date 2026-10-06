import path from "node:path";
import {
  dropDatabases,
  idFromBranch,
  killPort,
  mainCheckout,
  neonProject,
  prChecks,
  sh,
  text,
  worktrees,
} from "./lib";

type NeonBranch = { id: string; name: string };

function mergedPr(branch: string, root: string): number | undefined {
  const res = sh(
    `gh pr list --head "${branch}" --state merged --json number`,
    root,
  );
  if (!res.ok) return undefined;
  const prs: { number: number }[] = JSON.parse(res.out || "[]");
  return prs[0]?.number;
}

function removeTicket(branch: string, root: string, wt?: string) {
  const id = idFromBranch(branch);
  if (id) killPort(id);
  if (wt) {
    sh(`git worktree unlock "${wt}"`, root);
    sh(`git worktree remove -f -f "${wt}"`, root);
  }
  sh(`git branch -D "${branch}"`, root);
  if (id) dropDatabases(id);
}

function sweepLocal(root: string, notes: string[]) {
  const agentDir = path.join(root, ".claude", "worktrees");
  const trees = worktrees(root);
  for (const { path: wt, branch } of trees) {
    if (!wt.startsWith(agentDir) || !branch.startsWith("ticket/")) continue;
    if (!mergedPr(branch, root)) continue;
    removeTicket(branch, root, wt);
    notes.push(`removed merged worktree ${branch}`);
  }

  const inUse = new Set(worktrees(root).map((w) => w.branch));
  const branches = text(
    "git for-each-ref --format='%(refname:short)' refs/heads/ticket/",
    root,
  )
    .split("\n")
    .map((b) => b.trim())
    .filter((b) => b && !inUse.has(b));
  for (const branch of branches) {
    const empty = !text(`git log main..${branch} --oneline`, root);
    if (!empty && !mergedPr(branch, root)) continue;
    removeTicket(branch, root);
    notes.push(`deleted ${empty ? "empty" : "merged"} branch ${branch}`);
  }
}

function sweepNeon(root: string, notes: string[]) {
  const res = sh(
    `neonctl branches list --project-id ${neonProject} --output json`,
    root,
  );
  if (!res.ok) {
    notes.push("neon: could not list branches (skipped)");
    return;
  }
  const branches: NeonBranch[] = JSON.parse(res.out);
  for (const { id, name } of branches) {
    const gitBranch = name.replace(/^preview\//, "");
    if (!gitBranch.startsWith("ticket/")) continue;
    const pr = mergedPr(gitBranch, root);
    if (!pr) continue;
    if (prChecks(pr, root).some((c) => c.bucket === "pending")) {
      notes.push(`neon: kept ${name} (PR #${pr} checks still running)`);
      continue;
    }
    const del = sh(
      `neonctl branches delete ${id} --project-id ${neonProject}`,
      root,
    );
    notes.push(
      del.ok ? `neon: deleted ${name}` : `neon: failed to delete ${name}`,
    );
  }
}

/** Removes every merged ticket's worktree, branches, databases, dev server and Neon preview branch. */
export function sweep(): string[] {
  const root = mainCheckout();
  const notes: string[] = [];
  sweepLocal(root, notes);
  sweepNeon(root, notes);
  return notes;
}
