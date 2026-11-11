import "server-only";
import {
  markFavouritesDigestRun,
  markStreakNudgeSent,
  selectFavouriteDigests,
  selectStreakNudges,
} from "@/lib/data/notifications";
import { dailySlug } from "@/lib/data/daily-puzzles";
import { favouriteDigest } from "@/lib/email/templates/favourite-digest";
import { streakNudge } from "@/lib/email/templates/streak-nudge";
import { sendEmail } from "@/lib/email/send";
import { unsubscribeUrl } from "@/lib/email/unsubscribe";
import { londonDate } from "@/utils/london-time";

export type DispatchSummary = {
  eligible: number;
  sent: number;
  failed: number;
};

const puzzleUrl = (baseUrl: string, typeKey: string, slug: string) =>
  `${baseUrl}/puzzles/${typeKey}/${slug}`;

/** Sends each due user one digest, then records the run so a repeat call the same London day selects nobody. A failed send is left unrecorded and retried by the next call. */
export async function runFavouriteDigest(
  baseUrl: string,
  now = new Date(),
): Promise<DispatchSummary> {
  const due = await selectFavouriteDigests(now);
  const summary = { eligible: due.length, sent: 0, failed: 0 };
  for (const user of due) {
    try {
      if (user.puzzles.length > 0 || user.milestoneDays !== null) {
        await sendEmail({
          to: user.email,
          ...favouriteDigest({
            name: user.name,
            milestoneDays: user.milestoneDays,
            puzzles: user.puzzles.map((puzzle) => ({
              title: puzzle.title,
              typeName: puzzle.typeName,
              url: puzzleUrl(baseUrl, puzzle.typeKey, puzzle.slug),
            })),
            url: `${baseUrl}/puzzles`,
            unsubscribeUrl: unsubscribeUrl(baseUrl, user.userId, "favourites"),
          }),
        });
        summary.sent += 1;
      }
      await markFavouritesDigestRun(user.userId, now);
    } catch (error) {
      console.error("[email] favourite digest failed", error);
      summary.failed += 1;
    }
  }
  return summary;
}

export async function runStreakNudge(
  baseUrl: string,
  now = new Date(),
): Promise<DispatchSummary> {
  const due = await selectStreakNudges(now);
  const summary = { eligible: due.length, sent: 0, failed: 0 };
  const daily = dailySlug("troix", londonDate(now));
  for (const user of due) {
    try {
      await sendEmail({
        to: user.email,
        ...streakNudge({
          name: user.name,
          streak: user.streak,
          url: puzzleUrl(baseUrl, "troix", daily),
          unsubscribeUrl: unsubscribeUrl(baseUrl, user.userId, "streak"),
        }),
      });
      await markStreakNudgeSent(user.userId, now);
      summary.sent += 1;
    } catch (error) {
      console.error("[email] streak nudge failed", error);
      summary.failed += 1;
    }
  }
  return summary;
}
