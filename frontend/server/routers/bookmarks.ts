/**
 * BOOKMARKS ROUTER
 * tRPC procedures for bookmark management
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const bookmarksRouter = router({
  list: protectedProcedure.input(z.object({ folderId: z.string().optional() })).query(async () => [
    { id: "b1", title: "Load LOAD-45920", url: "/loads/45920", folderId: "f1", createdAt: "2025-01-22" },
  ]),

  getFolders: protectedProcedure.query(async () => [
    { id: "f1", name: "Important Loads", count: 5 },
    { id: "f2", name: "Favorite Carriers", count: 8 },
  ]),

  delete: protectedProcedure.input(z.object({ bookmarkId: z.string() })).mutation(async ({ input }) => ({
    success: true, bookmarkId: input.bookmarkId,
  })),
});
