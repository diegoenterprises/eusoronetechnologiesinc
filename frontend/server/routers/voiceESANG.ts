/**
 * VOICE-FIRST ESANG INTERACTION ROUTER (GAP-360)
 * tRPC procedures for voice commands, transcription, and TTS-optimized responses.
 */

import { z } from "zod";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import {
  classifyVoiceIntent,
  buildVoiceResponse,
  getVoiceCommandHelp,
  formatForTTS,
} from "../services/VoiceFirstESANG";

export const voiceESANGRouter = router({
  /**
   * Process a voice command (text already transcribed on client via Web Speech API)
   */
  processVoiceCommand: protectedProcedure
    .input(z.object({
      text: z.string().min(1).max(2000),
      context: z.object({
        currentPage: z.string().optional(),
        loadId: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // 1. Classify voice intent
        const intent = classifyVoiceIntent(input.text);

        // 2. For conversational intents, route through ESANG AI
        let fullText = intent.suggestedResponse;
        if (intent.intent === "conversational" || intent.confidence < 0.7) {
          try {
            const { esangAI } = await import("../_core/esangAI");
            const userId = String(ctx.user?.id || "0");
            const numericUserId = typeof ctx.user?.id === "number" ? ctx.user.id : parseInt(String(ctx.user?.id), 10) || 0;
            const esangResponse = await esangAI.chat(
              userId,
              input.text,
              {
                role: ctx.user?.role,
                currentPage: input.context?.currentPage,
                loadId: input.context?.loadId,
                latitude: input.context?.latitude,
                longitude: input.context?.longitude,
              },
              {
                userId: numericUserId,
                userEmail: ctx.user?.email || "",
                userName: ctx.user?.name || "User",
                role: ctx.user?.role || "SHIPPER",
              },
            );
            fullText = esangResponse.message;
            // Update intent confidence if ESANG handled it
            if (intent.intent === "conversational") intent.confidence = 0.8;
          } catch {
            fullText = "I'm having trouble connecting to my AI systems. Please try again.";
          }
        }

        // 3. Build voice-optimized response
        const response = buildVoiceResponse(fullText, intent);
        return response;
      } catch (e) {
        console.error("[VoiceESANG] processVoiceCommand error:", e);
        return {
          text: "Sorry, I didn't catch that. Could you try again?",
          spokenText: "Sorry, I didn't catch that. Could you try again?",
          intent: "conversational" as const,
          confidence: 0,
          actions: [],
          suggestions: ["Try again", "Show help"],
          shouldListen: true,
        };
      }
    }),

  /**
   * Transcribe audio via server-side Whisper (for uploaded audio)
   */
  transcribeAudio: protectedProcedure
    .input(z.object({
      audioUrl: z.string(),
      language: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const { transcribeAudio } = await import("../_core/voiceTranscription");
        const result = await transcribeAudio({
          audioUrl: input.audioUrl,
          language: input.language,
          prompt: "Transcribe logistics and trucking voice commands",
        });
        if ("error" in result) {
          return { success: false, text: "", error: result.error };
        }
        return { success: true, text: result.text, language: result.language, duration: result.duration };
      } catch (e) {
        return { success: false, text: "", error: "Transcription service unavailable" };
      }
    }),

  /**
   * Get available voice commands organized by category
   */
  getCommandHelp: protectedProcedure.query(async () => {
    return getVoiceCommandHelp();
  }),

  /**
   * Convert text to TTS-optimized format
   */
  formatForSpeech: protectedProcedure
    .input(z.object({ text: z.string() }))
    .mutation(async ({ input }) => {
      return { spokenText: formatForTTS(input.text) };
    }),
});
