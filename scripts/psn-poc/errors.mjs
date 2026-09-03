function readHttpStatus(error) {
  const candidates = [
    error?.status,
    error?.statusCode,
    error?.response?.status,
  ];

  for (const candidate of candidates) {
    const status = Number(candidate);
    if (Number.isInteger(status) && status >= 100 && status <= 599) {
      return status;
    }
  }

  return null;
}

export class PsnPocError extends Error {
  constructor(stage, { code = null, status = null } = {}) {
    super("The PSN Trophy PoC could not complete.");
    this.name = "PsnPocError";
    this.stage = stage;
    this.code = code;
    this.status = status;
  }
}

export async function runPsnStage(stage, operation) {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof PsnPocError) throw error;
    throw new PsnPocError(stage, {
      status: readHttpStatus(error),
    });
  }
}

export function formatSafeError(error) {
  if (error instanceof PsnPocError) {
    const details = [
      error.status === null ? null : `HTTP ${error.status}`,
      error.code === null ? null : `code ${error.code}`,
    ].filter(Boolean);
    const suffix = details.length ? ` (${details.join(", ")})` : "";
    return `PSN PoC failed during ${error.stage}${suffix}.`;
  }

  return "PSN PoC failed unexpectedly. No authentication details were printed.";
}
