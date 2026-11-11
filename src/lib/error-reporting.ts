export function reportAppError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  console.error("[App Error]", error, context);
}

// Backward-compatibility export
export const reportLovableError = reportAppError;
