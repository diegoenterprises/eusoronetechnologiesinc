# WS-E2E-011: Remove/Fix aiTurbocharge Dead Import

**Priority:** P1  
**Estimated Hours:** 4  
**Status:** Not Started

## CONTEXT

The file `services/ragRetriever.ts` imports a module `aiTurbocharge` that does not exist in the codebase:

```typescript
import { aiTurbocharge } from './aiTurbocharge';
```

This causes either:
1. A runtime import error that crashes the RAG service, OR
2. A dead code path that never executes

The import must be resolved by either creating the module or removing the dead code.

## REQUIREMENTS

**Option A: Create aiTurbocharge module (Recommended)**

1. Create `services/aiTurbocharge.ts` with turbocharge features:
   - **Parallel query execution**: Execute multiple RAG queries in parallel
   - **Result fusion**: Combine and rank results from multiple queries
   - **Confidence boosting**: Increase relevance scores for strong matches

2. Implement parallel query feature:
   ```typescript
   async function parallelSearch(
     queries: string[],
     options: { limit?: number, threshold?: number }
   ): Promise<SearchResult[]> {
     // Execute all queries in parallel
     const results = await Promise.all(
       queries.map(q => ragRetriever.search(q, { limit: options.limit }))
     );
     
     // Fuse results (combine and deduplicate)
     return fuseResults(results);
   }
   ```

3. Implement result fusion:
   ```typescript
   function fuseResults(resultSets: SearchResult[][]): SearchResult[] {
     const fused = new Map<string, SearchResult>();
     
     for (const results of resultSets) {
       for (const result of results) {
         if (fused.has(result.id)) {
           // Increase score for duplicate results
           fused.get(result.id).relevanceScore += 0.1;
         } else {
           fused.set(result.id, result);
         }
       }
     }
     
     // Sort by relevance and return
     return Array.from(fused.values())
       .sort((a, b) => b.relevanceScore - a.relevanceScore)
       .slice(0, 10);
   }
   ```

4. Implement confidence boosting:
   ```typescript
   function boostConfidence(
     results: SearchResult[],
     boostFactor: number = 1.2
   ): SearchResult[] {
     return results.map(result => ({
       ...result,
       relevanceScore: Math.min(1.0, result.relevanceScore * boostFactor)
     }));
   }
   ```

5. Export all functions:
   ```typescript
   export { parallelSearch, fuseResults, boostConfidence };
   ```

6. Update `services/ragRetriever.ts` to use aiTurbocharge:
   ```typescript
   import { parallelSearch, fuseResults, boostConfidence } from './aiTurbocharge';
   
   // In RAG search, use turbocharge for multi-query scenarios
   export async function enhancedSearch(userQuery: string) {
     // Generate related queries automatically
     const relatedQueries = await generateRelatedQueries(userQuery);
     
     // Execute in parallel
     const results = await parallelSearch([userQuery, ...relatedQueries]);
     
     // Boost confidence for high-relevance results
     return boostConfidence(results, 1.15);
   }
   ```

**Option B: Remove dead import (If not used)**

1. If `aiTurbocharge` is never called in `ragRetriever.ts`:
   - Remove the import statement
   - Remove any unused code that references it
   - Delete any placeholder function that calls it

2. Search codebase for all references:
   ```bash
   grep -r "aiTurbocharge" --include="*.ts"
   ```
   If only in ragRetriever import, safe to remove.

3. Clean up ragRetriever.ts:
   - Remove import
   - Remove unused parameters/logic
   - Verify RAG search still works

## FILES TO MODIFY

**Option A:**
- `services/aiTurbocharge.ts` (new file with turbocharge functions)
- `services/ragRetriever.ts` (update to use new functions)

**Option B:**
- `services/ragRetriever.ts` (remove import and dead code)

## VERIFICATION

**Option A:**

1. Verify module creates without errors:
   ```bash
   npm run build 2>&1 | grep -i "aiTurbocharge"
   ```
   Should show no errors

2. Test parallel search:
   ```bash
   npm run dev
   ```
   In REPL or test, call:
   ```typescript
   const results = await parallelSearch(
     ['ERG guide 101', 'Class 1 explosives'],
     { limit: 5 }
   );
   console.log(results);
   ```
   Should return fused results from both queries

3. Test in RAG retriever:
   ```bash
   curl -X POST http://localhost:3000/api/esang/query \
     -d '{"query": "Tell me about explosives and Class 1 materials"}' \
     -H "Content-Type: application/json"
   ```
   Should return enhanced results using turbocharge

**Option B:**

1. Verify import removed:
   ```bash
   grep -n "aiTurbocharge" services/ragRetriever.ts
   ```
   Should return nothing

2. Build succeeds:
   ```bash
   npm run build 2>&1 | tail -20
   ```
   Should show "Build successful" with no errors

3. RAG still works:
   ```bash
   curl -X POST http://localhost:3000/api/esang/query \
     -d '{"query": "What is ERG guide 101?"}' \
     -H "Content-Type: application/json"
   ```
   Should return results

## DO NOT

**Option A:**
- Leave turbocharge functions untested
- Forget to export functions
- Make parallel search synchronous (must be async)
- Hardcode query generation (should be configurable)
- Leave duplicate results in fused output (de-duplicate by ID)
- Increase confidence scores beyond 1.0 (cap at 1.0)

**Option B:**
- Remove import but leave code that uses it
- Delete turbocharge module if ragRetriever still calls it
- Forget to test RAG still works after removal
- Leave commented-out code referencing aiTurbocharge

