const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

export function newSubmissionId() {
  return crypto.randomUUID();
}

export async function submitInquiry(payload) {
  const response = await fetch(`${API_ORIGIN}/api/v1/inquiries/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(result.error || "INQUIRY_REQUEST_FAILED");
    error.code = result.error || "INQUIRY_REQUEST_FAILED";
    error.fields = result.fields || {};
    error.status = response.status;
    throw error;
  }

  return result;
}
