import { z } from "zod";
import { randomUUID } from "node:crypto";

const MAX_BODY_BYTES = 16 * 1024;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const requestsByIp = new Map();

const singleLine = (maximum) =>
  z
    .string()
    .trim()
    .min(1)
    .max(maximum)
    .refine((value) => !/[\r\n]/.test(value), "Must be a single line.");

const contactSchema = z.object({
  name: singleLine(100),
  email: z.string().trim().email().max(254),
  projectType: singleLine(80),
  message: z.string().trim().min(10).max(2000),
  companyWebsite: z.string().trim().max(200).optional().default(""),
  turnstileToken: z.string().trim().min(1).max(2048),
});

function isConfigured(value) {
  return Boolean(value && !value.includes("<key here>") && !value.includes("your-domain"));
}

function sendJson(response, status, payload) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  return response.status(status).json(payload);
}

function getClientIp(request) {
  const forwarded = request.headers["x-forwarded-for"];
  const firstForwarded = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const forwardedIp = firstForwarded ? firstForwarded.split(",")[0].trim() : "";
  const socketIp = request.socket ? request.socket.remoteAddress : "";
  return forwardedIp || socketIp || "unknown";
}

function isRateLimited(ip) {
  const now = Date.now();
  const recent = (requestsByIp.get(ip) || []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );

  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    requestsByIp.set(ip, recent);
    return true;
  }

  recent.push(now);
  requestsByIp.set(ip, recent);
  return false;
}

function readBody(request) {
  if (request.body && typeof request.body === "object" && !Buffer.isBuffer(request.body)) {
    return request.body;
  }

  if (typeof request.body === "string" || Buffer.isBuffer(request.body)) {
    return JSON.parse(request.body.toString());
  }

  return {};
}

async function verifyTurnstile(token, ip) {
  const verificationResponse = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: ip,
        idempotency_key: randomUUID(),
      }),
      signal: AbortSignal.timeout(10000),
    },
  );

  if (!verificationResponse.ok) return false;

  const result = await verificationResponse.json();
  return result.success === true && result.action === "portfolio-contact";
}

async function sendContactEmail({ name, email, projectType, message }) {
  const safeName = name.replace(/[\r\n]/g, " ");
  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": randomUUID(),
      "User-Agent": "Mico-Ang-Portfolio/1.0",
    },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM_EMAIL,
      to: [process.env.CONTACT_TO_EMAIL],
      reply_to: email,
      subject: `Portfolio inquiry from ${safeName}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Project type: ${projectType}`,
        "",
        message,
      ].join("\n"),
    }),
    signal: AbortSignal.timeout(10000),
  });

  return emailResponse.ok;
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { error: "METHOD_NOT_ALLOWED" });
  }

  const contentLength = Number(request.headers["content-length"] || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return sendJson(response, 413, { error: "PAYLOAD_TOO_LARGE" });
  }

  const allowedOrigin = process.env.CONTACT_ALLOWED_ORIGIN;
  const requestOrigin = request.headers.origin;
  if (isConfigured(allowedOrigin) && requestOrigin !== allowedOrigin) {
    return sendJson(response, 403, { error: "ORIGIN_NOT_ALLOWED" });
  }

  let body;
  try {
    body = readBody(request);
  } catch {
    return sendJson(response, 400, { error: "INVALID_JSON" });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return sendJson(response, 422, {
      error: "VALIDATION_ERROR",
      fields: parsed.error.flatten().fieldErrors,
    });
  }

  // Silently accept honeypot submissions so bots cannot learn which control caught them.
  if (parsed.data.companyWebsite) {
    return sendJson(response, 200, { ok: true });
  }

  const requiredEnvironment = [
    process.env.TURNSTILE_SECRET_KEY,
    process.env.RESEND_API_KEY,
    process.env.CONTACT_FROM_EMAIL,
    process.env.CONTACT_TO_EMAIL,
  ];
  if (!requiredEnvironment.every(isConfigured)) {
    return sendJson(response, 503, { error: "CONTACT_SERVICE_UNAVAILABLE" });
  }

  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    response.setHeader("Retry-After", String(RATE_LIMIT_WINDOW_MS / 1000));
    return sendJson(response, 429, { error: "RATE_LIMITED" });
  }

  try {
    const isHuman = await verifyTurnstile(parsed.data.turnstileToken, ip);
    if (!isHuman) {
      return sendJson(response, 400, { error: "BOT_VERIFICATION_FAILED" });
    }

    const sent = await sendContactEmail(parsed.data);
    if (!sent) {
      return sendJson(response, 502, { error: "EMAIL_DELIVERY_FAILED" });
    }

    return sendJson(response, 200, { ok: true });
  } catch {
    return sendJson(response, 502, { error: "CONTACT_SERVICE_FAILED" });
  }
}
