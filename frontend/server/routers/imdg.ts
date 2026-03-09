// GAP-448: IMDG Code Integration — tRPC Router
import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { IMDGService } from "../services/IMDGService";

export const imdgRouter = router({
  createCompliance: protectedProcedure
    .input(z.object({ loadId: z.number(), dotClass: z.string(), properShippingName: z.string(), packingGroup: z.string().optional() }))
    .mutation(async ({ input }) => {
      return await IMDGService.createCompliance(input.loadId, input.dotClass, input.properShippingName, input.packingGroup);
    }),

  getCompliance: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .query(async ({ input }) => {
      return await IMDGService.getCompliance(input.loadId);
    }),

  setPackingCertUrl: protectedProcedure
    .input(z.object({ loadId: z.number(), url: z.string() }))
    .mutation(async ({ input }) => {
      await IMDGService.setPackingCertUrl(input.loadId, input.url);
      return { success: true };
    }),

  setDGDeclarationUrl: protectedProcedure
    .input(z.object({ loadId: z.number(), url: z.string() }))
    .mutation(async ({ input }) => {
      await IMDGService.setDGDeclarationUrl(input.loadId, input.url);
      return { success: true };
    }),

  markVesselManifest: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .mutation(async ({ input }) => {
      await IMDGService.markVesselManifestSubmitted(input.loadId);
      return { success: true };
    }),

  getClassMappings: protectedProcedure.query(() => {
    return IMDGService.getClassMappings();
  }),

  getPackingGroups: protectedProcedure.query(() => {
    return Object.entries(IMDGService.PACKING_GROUPS).map(([code, description]) => ({ code, description }));
  }),
});
