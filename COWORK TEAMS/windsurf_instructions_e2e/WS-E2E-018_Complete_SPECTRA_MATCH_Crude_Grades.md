# WS-E2E-018: Complete SPECTRA-MATCH Crude Grades

**Priority:** P2  
**Estimated Hours:** 8  
**Status:** Not Started

## CONTEXT

The system claims 165 crude oil grades but only 130 are in database. Missing 35 grades means:
- Incomplete pricing information
- Cannot match obscure crude types
- Shipper/carrier confusion on rare grades
- Revenue from niche trades lost

## REQUIREMENTS

1. Add remaining 35 crude grades to database:

   **Nigerian Grades (5):**
   - Bonny Light (API 32, light crude)
   - Qua Iboe (API 34.5, light sweet crude)
   - Brass River (API 34, light crude)
   - Escravos (API 35, light crude)
   - Forcados (API 31, medium crude)

   **Libyan Grades (3):**
   - Es Sider (API 41, light sweet crude)
   - Zueitina (API 37, light crude)
   - Sarir (API 42, light sweet crude)

   **North Sea Grades (6):**
   - Ekofisk (API 38, light sweet crude)
   - Oseberg (API 40.6, light sweet crude)
   - Gullfaks (API 34, medium crude)
   - Statfjord (API 36.3, medium crude)
   - Forties (API 39, light sweet crude)
   - Brent Blend (API 38, light sweet crude)

   **Venezuelan Grades (4):**
   - Merey (API 16, extra heavy crude)
   - BCF-17 (API 17, extra heavy crude)
   - Hamaca (API 17.5, extra heavy crude)
   - Cerro Negro (API 8, extra heavy crude)

   **Colombian Grades (2):**
   - Vasconia (API 22, heavy crude)
   - Castilla (API 28, medium-heavy crude)

   **Brazilian Grades (2):**
   - Lula (API 29, medium-heavy crude)
   - Tupi (API 31, medium crude)

   **Angolan Grades (4):**
   - Nemba (API 35, light crude)
   - Dalia (API 37, light crude)
   - Pazflor (API 33, medium-light crude)
   - Saxi (API 38, light crude)

   **Equatorial Guinea (2):**
   - Zafiro (API 31, medium crude)
   - Alba (API 37, light crude)

   **African Others (2):**
   - Chad Doba (API 38, light crude)
   - Cameroon Kole (API 32, light crude)

   **Gabon (2):**
   - Rabi (API 35, light crude)
   - Mandji (API 37, light crude)

2. Create database structure for crude_grades:
   ```typescript
   interface CrudeGrade {
     id: serial
     name: text (unique) // e.g., "Bonny Light"
     country: text // Nigeria, Libya, etc.
     apiGravity: decimal(5,2) // API gravity
     sulfurContent: decimal(4,2) // % sulfur
     regionOfOrigin: text // Geographic region
     classification: text // light/medium/heavy/extra heavy
     typicalDensity: decimal(5,3) // kg/L
     viscosity: decimal(6,2) // centipoise
     basePrice: decimal(12.2) // Reference price per barrel
     volatility: decimal(4,2) // Price volatility %
     transportationMethod: text // Pipeline/Tanker
     storageRequirements: text // Temperature/conditions
     pipelineCompatible: boolean
     tankerCompatible: boolean
     blendingProperties: text // Notes on blending
     marketLiquidity: text // High/Medium/Low
     createdAt: timestamp
     updatedAt: timestamp
   }
   ```

3. Create migration to add missing grades:
   ```sql
   INSERT INTO crude_grades (name, country, apiGravity, sulfurContent, ...)
   VALUES
     ('Bonny Light', 'Nigeria', 32.0, 0.15, ...),
     ('Qua Iboe', 'Nigeria', 34.5, 0.12, ...),
     -- ... all 35 remaining grades
   ```

4. Add validation in schema:
   - API gravity between 6-50 (extra heavy to ultra light)
   - Sulfur content 0-5%
   - Unique constraint on name

5. Create endpoint to fetch all grades:
   ```typescript
   GET /api/crude-grades
   Query: { country?, classification?, minAPI?, maxAPI?, search? }
   Response: CrudeGrade[]
   ```

6. Add pricing integration:
   - Fetch real-time prices from market data
   - Update basePrice weekly
   - Store historical prices for analysis

7. Create matching algorithm:
   ```typescript
   async function matchCrudeGrade(
     apiGravity: number,
     sulfurContent: number,
     country?: string
   ): Promise<CrudeGrade[]> {
     // Find closest match by API and sulfur
     const matches = await db.query.crudeGrades.findMany({
       where: and(
         between(crudeGrades.apiGravity, apiGravity - 2, apiGravity + 2),
         between(crudeGrades.sulfurContent, sulfurContent - 0.5, sulfurContent + 0.5),
         country ? eq(crudeGrades.country, country) : undefined
       ),
       orderBy: [
         asc(abs(sub(crudeGrades.apiGravity, apiGravity))),
         asc(abs(sub(crudeGrades.sulfurContent, sulfurContent)))
       ]
     });
     return matches.slice(0, 5);
   }
   ```

8. Create specifications table for each grade:
   ```typescript
   crudeSpecifications {
     id,
     gradeId,
     viscocityAt40C,
     viscocityAt100C,
     pourPoint,
     flashPoint,
     anilinePoint,
     carbonConradson,
     asphaltenes,
     vanadium,
     nickel,
     sediment,
     water,
     salt,
     reidVaporPressure,
     sulfurTypes: // text describing sulfur composition
   }
   ```

## FILES TO MODIFY

- `drizzle/schema.ts` (add crudeGrades table if missing)
- `drizzle/migrations/` (create migration to add 35 grades)
- `services/spectraMatch.ts` (update matching logic)
- `routers/crude.ts` (new file, add endpoints)

## VERIFICATION

1. Create/update tables:
   ```bash
   npm run db:push
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM crude_grades;"
   # Should show 165+
   ```

2. Verify all grades exist:
   ```bash
   psql $DATABASE_URL -c "SELECT name, country, apiGravity FROM crude_grades WHERE country IN ('Nigeria', 'Libya', 'Venezuela') ORDER BY country, name;"
   # Should show all 35+ new grades
   ```

3. Test matching endpoint:
   ```bash
   curl "http://localhost:3000/api/crude-grades?country=Nigeria&minAPI=30"
   # Should return Nigerian grades with API > 30
   ```

4. Test crude matching:
   ```bash
   curl -X POST http://localhost:3000/api/crude-grades/match \
     -H "Content-Type: application/json" \
     -d '{"apiGravity": 32, "sulfurContent": 0.15, "country": "Nigeria"}'
   # Should return best matches starting with Bonny Light
   ```

5. Verify database integrity:
   ```bash
   psql $DATABASE_URL -c "SELECT MIN(apiGravity), MAX(apiGravity), COUNT(*) FROM crude_grades;"
   # Should show range from 8-42+
   ```

6. Test pricing:
   - Verify each grade has basePrice
   - Check historical price tracking
   - Verify price updates work

## DO NOT

- Duplicate grade names (use unique constraint)
- Leave API gravity outside 6-50 range
- Add grades without sulfur content data
- Forget to include less common grades (specialty products)
- Leave incomplete specifications (add all key properties)
- Add hardcoded prices (fetch from market data)
- Forget storage/transport requirements (critical for logistics)
- Mix up grade names (Bonny Light is not Bonny Medium)
- Skip validation (enforce API/sulfur data quality)
- Leave grades without classification (light/heavy/etc)

