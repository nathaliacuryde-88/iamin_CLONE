/**
 * Translate raw Postgres/Supabase errors into user-friendly copy with a
 * short "what to try" line. Use everywhere we surface an error toast.
 */
export type FriendlyError = { title: string; description: string };

export function toFriendlyError(err: unknown, context?: string): FriendlyError {
  const anyErr = err as any;
  const raw =
    anyErr && typeof anyErr === "object"
      ? String(anyErr.message || anyErr.error_description || anyErr.error || anyErr.hint || anyErr.details || "")
      : err instanceof Error
      ? err.message
      : typeof err === "string"
      ? err
      : "";
  const msg = raw.toLowerCase();

  // Organizer-only public events trigger
  if (msg.includes("only organizer accounts")) {
    return {
      title: "Public events need an organizer account",
      description:
        "Switch to organizer mode in Profile → Mode, or change this event's privacy to Circle, Ghost or List.",
    };
  }

  // RLS — events specifically
  if (msg.includes("row-level security") && msg.includes("\"events\"")) {
    return {
      title: "Couldn't save the event",
      description:
        "Your account isn't allowed to create this type of event. Try Circle visibility, or sign out and back in.",
    };
  }
  // RLS — generic
  if (msg.includes("row-level security")) {
    return {
      title: "Not allowed",
      description:
        "Your account doesn't have permission for this action. If this seems wrong, sign out and back in.",
    };
  }

  // Unique violation
  if (msg.includes("duplicate key") || msg.includes("unique constraint")) {
    return {
      title: "Already exists",
      description: "That item is already saved — try refreshing.",
    };
  }

  // FK violation
  if (msg.includes("foreign key")) {
    return {
      title: "Missing reference",
      description: "Something this depends on was deleted. Refresh and try again.",
    };
  }

  // Network
  if (msg.includes("failed to fetch") || msg.includes("network")) {
    return {
      title: "Network error",
      description: "Check your connection and try again.",
    };
  }

  // JWT / auth
  if (msg.includes("jwt") || msg.includes("not authenticated")) {
    return {
      title: "Session expired",
      description: "Sign out and sign back in to continue.",
    };
  }

  // Storage
  if (msg.includes("payload too large") || msg.includes("exceeded the maximum")) {
    return {
      title: "File too large",
      description: "Pick a smaller image (under 5 MB).",
    };
  }

  return {
    title: context ? `${context} failed` : "Something went wrong",
    description: raw || "Please try again. If it keeps failing, sign out and back in.",
  };
}
