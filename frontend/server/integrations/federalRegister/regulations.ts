/**
 * Federal Register Regulations Integration
 * Source: Federal Register API (federalregister.gov)
 * Auth: None (free public API)
 * Refresh: Daily at 7 AM
 * Data: New DOT, PHMSA, FMCSA rules, notices, and proposed rules
 */
import { getDb } from "../../db";
import { sql } from "drizzle-orm";

const FR_API = "https://www.federalregister.gov/api/v1/documents.json";

const AGENCIES = [
  "pipeline-and-hazardous-materials-safety-administration",
  "federal-motor-carrier-safety-administration",
  "transportation-department",
  "environmental-protection-agency",
];

interface FRDocument {
  documentNumber: string;
  title: string;
  type: string;
  abstractText: string | null;
  publicationDate: string;
  agencies: { name: string }[];
  htmlUrl: string;
  pdfUrl: string | null;
}

export async function fetchNewRegulations(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let totalDocs = 0;

  for (const agency of AGENCIES) {
    try {
      const url = new URL(FR_API);
      url.searchParams.set("conditions[agencies][]", agency);
      url.searchParams.set("conditions[type][]", "RULE");
      url.searchParams.append("conditions[type][]", "PRORULE");
      url.searchParams.append("conditions[type][]", "NOTICE");
      url.searchParams.set("per_page", "20");
      url.searchParams.set("order", "newest");
      url.searchParams.set("fields[]", "document_number,title,type,abstract,publication_date,agencies,html_url,pdf_url");

      const response = await fetch(url.toString(), {
        signal: AbortSignal.timeout(15000),
        headers: { Accept: "application/json" },
      });
      if (!response.ok) continue;

      const data = await response.json();
      const results: FRDocument[] = data.results || [];

      for (const doc of results) {
        const id = `fr-${doc.documentNumber || Date.now()}`;
        const agencyName = doc.agencies?.[0]?.name || agency;
        const summary = [doc.title, doc.abstractText].filter(Boolean).join(" | ").substring(0, 500);

        await db.execute(
          sql`INSERT INTO hz_rate_indices
              (id, origin, destination, equipment_type, rate_per_mile, load_to_truck_ratio, source, report_date)
              VALUES (${id.substring(0, 36)}, ${agencyName.substring(0, 100)}, ${doc.title?.substring(0, 100) || 'Untitled'},
                      ${"REGULATION"}, ${doc.type || "RULE"}, ${summary}, 'FEDERAL_REGISTER', ${doc.publicationDate || new Date().toISOString().slice(0, 10)})
              ON DUPLICATE KEY UPDATE fetched_at = NOW()`
        );
        totalDocs++;
      }

      await new Promise((r) => setTimeout(r, 500));
    } catch (e) {
      console.error(`[FedRegister] Failed for ${agency}:`, e);
    }
  }

  console.log(`[FedRegister] Processed ${totalDocs} regulatory documents`);
}
