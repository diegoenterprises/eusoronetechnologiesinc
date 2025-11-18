import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../routers";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";

describe("Users Router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let testUser: any;

  beforeAll(async () => {
    // Create a test user context
    testUser = {
      id: 1,
      openId: "test_user_123",
      name: "Test User",
      email: "test@example.com",
      role: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    // Create caller with test context
    caller = appRouter.createCaller({
      user: testUser,
      req: {} as any,
      res: {} as any,
    });
  });

  it("should get user profile", async () => {
    const profile = await caller.users.getProfile();
    expect(profile).toEqual(testUser);
    expect(profile.email).toBe("test@example.com");
  });

  it("should update user profile", async () => {
    const result = await caller.users.updateProfile({
      name: "Updated Name",
      email: "updated@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("should update notification preferences", async () => {
    const result = await caller.users.updateNotifications({
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
    });
    expect(result.success).toBe(true);
    expect(result.preferences).toHaveProperty("emailNotifications", true);
  });

  it("should update security settings", async () => {
    const result = await caller.users.updateSecurity({
      twoFactorEnabled: true,
    });
    expect(result.success).toBe(true);
  });
});
