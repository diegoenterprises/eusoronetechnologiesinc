# WS-E2E-010: Seed Remaining ERG Knowledge Base

**Priority:** P1  
**Estimated Hours:** 12  
**Status:** Not Started

## CONTEXT

The knowledge base claims 100+ ERG materials but only 45 chunks have been seeded. This means:
- Most ERG guide numbers are not in the RAG system
- Drivers cannot get accurate hazmat information via ESANG
- Safety recommendations are incomplete
- 49 CFR regulatory guidance is missing
- OSHA SDS references not available

## REQUIREMENTS

1. Add all 2024 ERG guide numbers for common hazmat:
   - Class 1 Explosives: Guides 101-109
   - Class 2 Compressed Gases: Guides 119-120, 122-126
   - Class 3 Flammable Liquids: Guides 127-129
   - Class 4 Flammable Solids: Guides 130-135
   - Class 5 Oxidizers: Guides 136-140
   - Class 6 Toxic/Poison: Guides 141-145
   - Class 7 Radioactive: Guide 163
   - Class 8 Corrosives: Guides 153-154
   - Class 9 Miscellaneous: Guides 146-147
   - Total: 35+ guides

2. Create `data/erg_materials/` directory with JSON seed files:
   - File: `erg_guides.json`
   - Structure:
     ```json
     [
       {
         "guideNumber": 101,
         "className": "Explosives",
         "title": "Explosives (including articles)",
         "hazards": "Explosion hazard",
         "initialEmergencyActions": "Isolate immediate hazard area 800 meters",
         "fireEmergencyActions": "Do not fight fire unless leak can be stopped",
         "spillOrLeakActions": "Keep combustibles away, sweep up, place in container",
         "firstAidMeasures": "Remove contaminated clothing, rinse with water",
         "storageRequirements": "Keep away from heat, sparks, friction",
         "regulatoryNotes": "49 CFR 173.50-173.56"
       },
       // ... more guides
     ]
     ```

3. Add 49 CFR sections 171-180 regulatory summaries:
   - Create `data/erg_materials/cfr_sections.json`:
     ```json
     [
       {
         "section": "49 CFR 171.1",
         "title": "Applicability and General Requirements",
         "summary": "Establishes DOT requirements for hazmat transportation",
         "keyPoints": [
           "Applies to persons offering hazmat for transport",
           "Requires DOT authorization for certain materials",
           "Compliance required for interstate commerce"
         ]
       },
       {
         "section": "49 CFR 172",
         "title": "Hazardous Materials Table, Special Provisions, Hazard Classes, Index, and Compatibility Group Definitions",
         "summary": "Lists all hazardous materials and transportation requirements",
         "materials": 1000  // approximate count
       },
       // ... through CFR 180
     ]
     ```

4. Add all OSHA SDS references:
   - Create `data/erg_materials/osha_sds.json`:
     ```json
     [
       {
         "materialName": "Ammonia",
         "casNumber": "7664-41-7",
         "physicalForm": "Gas",
         "hazardSummary": "Corrosive, respiratory irritant",
         "sdsSection1": "Identification",
         "sdsSection2": "Hazard Identification",
         "sdsSection3": "Composition/Information on Ingredients",
         // ... sections 4-16
         "emergencyContact": "CHEMTREC: 1-800-424-9300",
         "ppeRequired": "Respiratory protection, chemical goggles, gloves",
         "storageConditions": "Cool, well-ventilated area, away from acids"
       },
       // ... more materials
     ]
     ```

5. Create additional knowledge bases:
   - `hazmat_common_carriers.json` — common hazmat by carrier type
   - `hazmat_driver_tips.json` — driver safety tips for common loads
   - `hazmat_equipment.json` — equipment requirements for transporting hazmat
   - `hazmat_emergencies.json` — emergency response procedures

6. Modify `services/ragRetriever.ts`:
   - Add seed function that loads all JSON files:
     ```typescript
     async function seedKnowledgeBase() {
       const ergGuides = await loadJson('data/erg_materials/erg_guides.json');
       const cfrSections = await loadJson('data/erg_materials/cfr_sections.json');
       const osdhaSds = await loadJson('data/erg_materials/osha_sds.json');

       for (const guide of ergGuides) {
         await addChunk({
           id: `erg_${guide.guideNumber}`,
           content: formatGuideContent(guide),
           category: 'erg_guide',
           metadata: { guideNumber: guide.guideNumber, className: guide.className }
         });
       }
       // ... similarly for CFR and OSHA
     }
     ```

7. Add chunk metadata for better RAG retrieval:
   - Each chunk should have: id, content, category, metadata, source, importance
   - Importance weights: erg_guides (high), cfr (high), osha (medium), tips (low)

8. Target 150+ total chunks:
   - 40 ERG guides
   - 30 CFR section summaries
   - 40 OSHA SDS materials
   - 20 equipment/procedures
   - 20 driver tips/best practices

9. Add chunking strategy for large documents:
   - Split long content into 1000-token chunks
   - Add section references to maintain context
   - Add cross-references between related chunks

## FILES TO MODIFY

- `data/erg_materials/erg_guides.json` (new, all ERG guides)
- `data/erg_materials/cfr_sections.json` (new, CFR 171-180)
- `data/erg_materials/osha_sds.json` (new, common SDS materials)
- `data/erg_materials/equipment.json` (new, equipment requirements)
- `data/erg_materials/procedures.json` (new, emergency procedures)
- `services/ragRetriever.ts` (add seed loading logic)

## VERIFICATION

1. Count chunks in knowledge base:
   ```bash
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM rag_chunks WHERE category LIKE 'erg%' OR category LIKE 'cfr%'"
   ```
   Should show 150+

2. Test ERG guide retrieval:
   ```bash
   curl -X POST http://localhost:3000/api/esang/query \
     -d '{"query": "What is ERG guide 101?"}' \
     -H "Content-Type: application/json"
   ```
   Should return ERG 101 details

3. Test CFR section retrieval:
   ```bash
   curl -X POST http://localhost:3000/api/esang/query \
     -d '{"query": "What does 49 CFR 172 cover?"}' \
     -H "Content-Type: application/json"
   ```
   Should return CFR 172 summary

4. Test OSHA SDS retrieval:
   ```bash
   curl -X POST http://localhost:3000/api/esang/query \
     -d '{"query": "What are the hazards of ammonia?"}' \
     -H "Content-Type: application/json"
   ```
   Should return OSHA ammonia SDS details

5. Test cross-references:
   - Query should reference multiple sources
   - Verify metadata includes source document

6. Verify JSON files are valid:
   ```bash
   for f in data/erg_materials/*.json; do
     python -m json.tool "$f" > /dev/null && echo "$f OK" || echo "$f INVALID"
   done
   ```

## DO NOT

- Hard-code chunks in source code (load from JSON files)
- Forget to include source/regulatory references
- Leave outdated 2023 ERG guides (must use 2024 version)
- Add incomplete OSHA SDS information (all 16 sections required)
- Duplicate chunks (de-duplicate by guideNumber/cfrSection/casNumber)
- Forget metadata (needed for RAG relevance scoring)
- Make chunks too large (chunk at 1000-token boundaries)
- Lose context when chunking (add cross-references)
- Skip CFR 180 (construction specifications are critical for compliance)

