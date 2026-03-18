# WS-E2E-009: Fix ESANG Conversation Persistence

**Priority:** P1  
**Estimated Hours:** 6  
**Status:** Not Started

## CONTEXT

The ESANG cognitive assistant maintains conversation history entirely in-memory in `esangCognitive.ts`. When the server restarts, all conversation context is lost. Users must start over with each session. This means:
- Multi-turn conversations cannot be resumed
- No audit trail of ESANG interactions
- No way to retrieve past conversations
- Lost context reduces quality of subsequent interactions

## REQUIREMENTS

1. Create `esang_conversations` table in `drizzle/schema.ts`:
   - `id` (serial, primary key)
   - `userId` (integer, foreign key to users, required)
   - `sessionId` (text, required, UUID for session)
   - `role` (text: 'user', 'assistant', 'system', required)
   - `content` (text, required, message content)
   - `tokenCount` (integer, nullable, tokens used for this message)
   - `summaryContext` (text, nullable, condensed version of earlier messages for context window)
   - `createdAt` (timestamp with time zone, default now())
   - Add indexes: (userId, sessionId, createdAt), (sessionId)

2. Modify `services/esangCognitive.ts`:
   - Replace in-memory conversation array with database queries
   - On conversation start (new sessionId):
     ```typescript
     const sessionId = generateUUID();
     const recentHistory = await db.query.esangConversations.findMany({
       where: and(eq(esangConversations.userId, userId), eq(esangConversations.sessionId, sessionId)),
       orderBy: desc(esangConversations.createdAt),
       limit: 100
     });
     ```
   - On new message from user:
     ```typescript
     await db.insert(esangConversations).values({
       userId,
       sessionId,
       role: 'user',
       content: userMessage,
       tokenCount: countTokens(userMessage),
       createdAt: new Date()
     });
     ```
   - After ESANG responds:
     ```typescript
     await db.insert(esangConversations).values({
       userId,
       sessionId,
       role: 'assistant',
       content: esangResponse,
       tokenCount: countTokens(esangResponse),
       createdAt: new Date()
     });
     ```

3. Implement token window trimming with summarization:
   - Track cumulative token count for conversation
   - When approaching token limit (e.g., 4k tokens for Claude 3 Haiku):
     ```typescript
     const oldMessages = await getOldestMessages(sessionId, keep: 20);
     const summary = await esangCognitive.summarizeMessages(oldMessages);
     await db.insert(esangConversations).values({
       userId,
       sessionId,
       role: 'system',
       content: `[CONTEXT SUMMARY]\n${summary}`,
       summaryContext: summary,
       createdAt: new Date()
     });
     // Delete old messages to save tokens
     await db.delete(esangConversations).where(
       and(
         eq(esangConversations.sessionId, sessionId),
         lt(esangConversations.createdAt, oldMessages[oldMessages.length-1].createdAt)
       )
     );
     ```

4. Add session resumption logic:
   - On session load, retrieve last N messages (e.g., 20) from DB
   - Build context window from these messages
   - If context is truncated, prepend system message with summary
   - Include summary context in prompt to ESANG

5. Add conversation retrieval endpoints:
   - `GET /api/esang/sessions` — list all sessions for user
   - `GET /api/esang/sessions/:sessionId` — retrieve conversation
   - `DELETE /api/esang/sessions/:sessionId` — delete conversation

6. Add conversation metadata table (optional):
   ```typescript
   esangSessions {
     id,
     userId,
     sessionId,
     title (auto-generated from first message),
     topic (classified by ESANG),
     totalMessages,
     totalTokens,
     starredAt,
     createdAt,
     updatedAt
   }
   ```

## FILES TO MODIFY

- `drizzle/schema.ts` (add esang_conversations and esangSessions tables)
- `services/esangCognitive.ts` (replace in-memory storage with DB queries)
- `routers/esang.ts` (add session retrieval endpoints)

## VERIFICATION

1. Create tables:
   ```bash
   npm run db:push
   psql $DATABASE_URL -c "\dt esang"
   ```

2. Test conversation persistence:
   - Start ESANG session as user
   - Send message: "What is the difference between CDL and CLP?"
   - Verify message saved:
     ```bash
     psql $DATABASE_URL -c "SELECT role, content FROM esang_conversations WHERE userId = <userId> ORDER BY createdAt DESC LIMIT 2"
     ```

3. Test session resumption:
   - Send multi-turn conversation (3+ messages)
   - Restart server
   - Resume session with same sessionId
   - Verify previous messages are loaded
   - Send new message: "Can you clarify your previous point?"
   - Verify ESANG has context from previous messages

4. Test token window trimming:
   - Send 50+ messages in single session
   - Monitor esang_conversations table for summarization
   - Verify old messages are replaced with summary
   - Verify context is preserved in new messages

5. Test session retrieval:
   ```bash
   curl http://localhost:3000/api/esang/sessions
   curl http://localhost:3000/api/esang/sessions/<sessionId>
   ```

6. Test session deletion:
   - Delete session
   - Verify messages are removed from DB
   - Verify session no longer appears in list

## DO NOT

- Store conversation in-memory (always persist to DB)
- Forget to calculate and store tokenCount (needed for quota tracking)
- Leave raw conversation content after summarization (delete old messages)
- Summarize after every single message (only when approaching token limit)
- Store full user objects in conversations (only store userId)
- Expose raw ESANG system prompts to users
- Allow users to access other users' conversations (check userId on retrieval)
- Forget to cleanup old sessions (implement TTL or cleanup job)
- Store sensitive information in conversation summaries (filter PII)

