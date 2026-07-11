/**
 * Chat moderation REST client: filing a report about a city chat message.
 * Follows the same raw-fetch-with-bearer-token pattern as lib/friends.ts.
 */
import { absoluteApiUrl, loadToken } from "@/lib/session";

/**
 * Report a player's chat message for admin review.
 * `publicId` is the sender's realtime id, e.g. "u42".
 */
export async function reportChatMessage(
  publicId: string,
  messageText: string,
  messageTs?: number,
): Promise<void> {
  const reportedId = Number(publicId.replace(/^u/, ""));
  if (!Number.isInteger(reportedId) || reportedId <= 0) {
    throw new Error("Can't report this player");
  }
  const token = await loadToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(absoluteApiUrl("/api/chat/reports"), {
    method: "POST",
    headers,
    body: JSON.stringify({
      reportedId,
      messageText: messageText.slice(0, 200),
      messageTs,
    }),
  });
  if (!res.ok) {
    let message = `Report failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }
}
