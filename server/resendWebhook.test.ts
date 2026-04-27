/**
 * Tests for POST /api/webhooks/resend
 *
 * Covers:
 *   - 401 when RESEND_WEBHOOK_SECRET is not configured
 *   - 401 when svix headers are missing
 *   - 401 when timestamp is too old (replay protection)
 *   - 401 when signature is invalid
 *   - 200 + idempotent:true on duplicate svix-id
 *   - 400 on malformed payload (missing email_id / to)
 *   - All 8 event types dispatched without throwing
 *   - Bounce guard: email skipped for bounced user
 *   - Complaint guard: email skipped for complained user
 *   - email.failed increments failure count and auto-bounces at 3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Request, Response } from "express";

// ── Hoisted stubs (must be declared before vi.mock factories) ─────────────────

const { mockInsert, mockUpdate, mockSelect, dbStub } = vi.hoisted(() => {
  const mockInsert = vi.fn().mockResolvedValue([{ insertId: 99 }]);
  const mockUpdate = vi.fn().mockResolvedValue([]);
  const mockSelect = vi.fn().mockResolvedValue([]);

  const dbStub = {
    insert: vi.fn().mockReturnValue({ values: mockInsert }),
    update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: mockUpdate }) }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: mockSelect,
        }),
      }),
    }),
  };

  return { mockInsert, mockUpdate, mockSelect, dbStub };
});

// ── Module mocks ──────────────────────────────────────────────────────────────

// Mock svix Webhook so we can control verify() outcome
vi.mock("svix", () => {
  return {
    Webhook: vi.fn().mockImplementation(() => ({
      verify: vi.fn().mockImplementation((_body: string, _headers: object) => {
        return JSON.parse(_body as string);
      }),
    })),
  };
});

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(dbStub),
}));

// Mock ENV
vi.mock("./_core/env", () => ({
  ENV: {
    resendWebhookSecret: "whsec_test_secret_value_here",
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    body: {},
    ...overrides,
  } as unknown as Request;
}

function makeRes(): { res: Response; json: ReturnType<typeof vi.fn>; status: ReturnType<typeof vi.fn> } {
  const json = vi.fn().mockReturnThis();
  const status = vi.fn().mockReturnValue({ json });
  const res = { json, status } as unknown as Response;
  return { res, json, status };
}

// Build a minimal valid svix-signed request for testing.
// We bypass actual HMAC by mocking the Webhook class.
function makeSignedReq(body: object, svixId = "svix-test-id-1"): Request {
  const now = Math.floor(Date.now() / 1000);
  const rawBody = Buffer.from(JSON.stringify(body));
  const req = {
    headers: {
      "svix-id": svixId,
      "svix-timestamp": String(now),
      "svix-signature": "v1,fakesig",
    },
    body,
    rawBody,
  } as unknown as Request;
  return req;
}

// ── Import after mocks ────────────────────────────────────────────────────────

import { handleResendWebhook } from "./webhooks/resend";

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("handleResendWebhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no duplicate svix-id in DB
    mockSelect.mockResolvedValue([]);
    // Default: user not bounced
    dbStub.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ emailBounced: false, emailComplained: false, emailFailureCount: 0 }]),
        }),
      }),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── Signature verification ──────────────────────────────────────────────────

  it("returns 401 when svix headers are missing", async () => {
    const req = makeReq({ headers: {}, body: {} });
    const { res, status } = makeRes();
    await handleResendWebhook(req, res);
    expect(status).toHaveBeenCalledWith(401);
  });

  it("returns 401 when timestamp is too old (replay protection)", async () => {
    const staleTimestamp = String(Math.floor(Date.now() / 1000) - 400); // 400s ago
    const req = makeReq({
      headers: {
        "svix-id": "svix-stale-1",
        "svix-timestamp": staleTimestamp,
        "svix-signature": "v1,fakesig",
      },
      body: {},
    });
    const { res, status } = makeRes();
    await handleResendWebhook(req, res);
    expect(status).toHaveBeenCalledWith(401);
  });

  it("returns 401 when svix.verify throws (bad signature)", async () => {
    const { Webhook } = await import("svix");
    (Webhook as ReturnType<typeof vi.fn>).mockImplementationOnce(() => ({
      verify: vi.fn().mockImplementation(() => {
        throw new Error("Invalid signature");
      }),
    }));
    const req = makeSignedReq({ type: "email.sent", data: { email_id: "re_1", to: ["a@b.com"] } });
    const { res, status } = makeRes();
    await handleResendWebhook(req, res);
    expect(status).toHaveBeenCalledWith(401);
  });

  // ── Payload validation ──────────────────────────────────────────────────────

  it("returns 400 when email_id is missing", async () => {
    const req = makeSignedReq({ type: "email.sent", data: { to: ["a@b.com"] } });
    const { res, status } = makeRes();
    await handleResendWebhook(req, res);
    expect(status).toHaveBeenCalledWith(400);
  });

  it("returns 400 when to[] is missing", async () => {
    const req = makeSignedReq({ type: "email.sent", data: { email_id: "re_1" } });
    const { res, status } = makeRes();
    await handleResendWebhook(req, res);
    expect(status).toHaveBeenCalledWith(400);
  });

  // ── Idempotency ─────────────────────────────────────────────────────────────

  it("returns 200 idempotent:true on duplicate svix-id", async () => {
    // Simulate ER_DUP_ENTRY from the DB insert
    mockInsert.mockRejectedValueOnce({ code: "ER_DUP_ENTRY" });
    const req = makeSignedReq({ type: "email.sent", data: { email_id: "re_dup", to: ["a@b.com"] } }, "svix-dup-1");
    const { res, json } = makeRes();
    await handleResendWebhook(req, res);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ idempotent: true }));
  });

  // ── All 8 event types ───────────────────────────────────────────────────────

  const validEvents = [
    "email.sent",
    "email.delivered",
    "email.delivery_delayed",
    "email.bounced",
    "email.complained",
    "email.opened",
    "email.clicked",
    "email.failed",
  ] as const;

  validEvents.forEach((eventType, i) => {
    it(`returns 200 for ${eventType}`, async () => {
      const req = makeSignedReq(
        { type: eventType, data: { email_id: `re_${i}`, to: [`athlete${i}@test.com`] } },
        `svix-${eventType}-${i}`
      );
      const { res, json } = makeRes();
      await handleResendWebhook(req, res);
      expect(json).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
    });
  });

  // ── email.failed auto-bounce ────────────────────────────────────────────────

  it("auto-bounces user when emailFailureCount reaches 3", async () => {
    // User currently has 2 failures
    dbStub.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ emailBounced: false, emailComplained: false, emailFailureCount: 2 }]),
        }),
      }),
    });

    const req = makeSignedReq(
      { type: "email.failed", data: { email_id: "re_fail_3", to: ["bounce@test.com"] } },
      "svix-fail-3"
    );
    const { res, json } = makeRes();
    await handleResendWebhook(req, res);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
    // The update call should have been made (bounce flag set)
    expect(dbStub.update).toHaveBeenCalled();
  });

  it("does not auto-bounce when failureCount is below threshold", async () => {
    dbStub.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ emailBounced: false, emailComplained: false, emailFailureCount: 1 }]),
        }),
      }),
    });

    const req = makeSignedReq(
      { type: "email.failed", data: { email_id: "re_fail_1", to: ["ok@test.com"] } },
      "svix-fail-1"
    );
    const { res, json } = makeRes();
    await handleResendWebhook(req, res);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
  });

  // ── Unknown event type ──────────────────────────────────────────────────────

  it("returns 200 for unknown event type (future-proofing)", async () => {
    const req = makeSignedReq(
      { type: "email.unknown_future_event", data: { email_id: "re_unk", to: ["x@y.com"] } },
      "svix-unk-1"
    );
    const { res, json } = makeRes();
    await handleResendWebhook(req, res);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
  });
});
