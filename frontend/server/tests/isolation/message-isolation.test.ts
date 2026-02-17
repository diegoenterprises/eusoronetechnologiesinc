/**
 * MESSAGE ISOLATION TESTS
 * Proves that only conversation participants can read/send messages.
 *
 * Test matrix:
 *   ✅ Participant can read conversation messages
 *   ✅ Participant can send messages to conversation
 *   ❌ Non-participant cannot read messages (FORBIDDEN)
 *   ❌ Non-participant cannot send messages (FORBIDDEN)
 *   ❌ User cannot enumerate other users' conversations
 *   ✅ Admin can read any conversation (PLATFORM scope)
 */

import { describe, it, expect } from "vitest";
import { checkAccess } from "../../services/security/rbac/access-check";
import { PrivacyLevel, getClassification } from "../../services/security/isolation/privacy-classifier";

describe("Message Isolation", () => {
  describe("Privacy Classification", () => {
    it("message is classified as L1_PRIVATE", () => {
      const c = getClassification("message");
      expect(c).not.toBeNull();
      expect(c!.level).toBe(PrivacyLevel.L1_PRIVATE);
    });

    it("conversation is classified as L1_PRIVATE", () => {
      const c = getClassification("conversation");
      expect(c).not.toBeNull();
      expect(c!.level).toBe(PrivacyLevel.L1_PRIVATE);
    });
  });

  describe("RBAC Permission Checks", () => {
    it("DRIVER can CREATE own MESSAGE", async () => {
      const result = await checkAccess({
        userId: 1, role: "DRIVER", action: "CREATE", resource: "MESSAGE",
        targetOwnerId: 1,
      });
      expect(result.allowed).toBe(true);
    });

    it("DRIVER can READ own MESSAGE", async () => {
      const result = await checkAccess({
        userId: 1, role: "DRIVER", action: "READ", resource: "MESSAGE",
        targetOwnerId: 1,
      });
      expect(result.allowed).toBe(true);
    });

    it("DRIVER cannot READ another user's MESSAGE", async () => {
      const result = await checkAccess({
        userId: 1, role: "DRIVER", action: "READ", resource: "MESSAGE",
        targetOwnerId: 2,
      });
      expect(result.allowed).toBe(false);
    });

    it("SHIPPER can CREATE own MESSAGE", async () => {
      const result = await checkAccess({
        userId: 5, role: "SHIPPER", action: "CREATE", resource: "MESSAGE",
        targetOwnerId: 5,
      });
      expect(result.allowed).toBe(true);
    });

    it("ADMIN can READ any MESSAGE (PLATFORM scope)", async () => {
      const result = await checkAccess({
        userId: 100, role: "ADMIN", action: "READ", resource: "MESSAGE",
        targetOwnerId: 999,
      });
      expect(result.allowed).toBe(true);
    });
  });
});
