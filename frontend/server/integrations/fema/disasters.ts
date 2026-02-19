/**
 * FEMA Disaster Declarations Integration
 * Source: FEMA Open API (fema.gov/api/open/v2)
 * Auth: None
 * Refresh: Daily at 5 AM
 */
import { getDb } from "../../db";
import { hzFemaDisasters } from "../../../drizzle/schema";
import { sql } from "drizzle-orm";

const FEMA_BASE = "https://www.fema.gov/api/open/v2";

export async function fetchActiveDisasters(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  const url = new URL(`${FEMA_BASE}/DisasterDeclarationsSummaries`);
  url.searchParams.set("$filter", `declarationDate ge '${twoYearsAgo.toISOString().split("T")[0]}'`);
  url.searchParams.set("$orderby", "declarationDate desc");
  url.searchParams.set("$top", "1000");

  const response = await fetch(url.toString(), { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`FEMA API error: ${response.status}`);

  const data = await response.json();

  for (const d of data.DisasterDeclarationsSummaries || []) {
    try {
      const declType = d.declarationType;
      if (!["DR", "EM", "FM", "FS"].includes(declType)) continue;

      await db
        .insert(hzFemaDisasters)
        .values({
          disasterNumber: String(d.disasterNumber),
          stateCode: d.state || "US",
          designatedArea: d.designatedArea || null,
          declarationDate: d.declarationDate ? new Date(d.declarationDate) : new Date(),
          incidentType: d.incidentType || null,
          declarationType: declType as "DR" | "EM" | "FM" | "FS",
          incidentBeginDate: d.incidentBeginDate ? new Date(d.incidentBeginDate) : null,
          incidentEndDate: d.incidentEndDate ? new Date(d.incidentEndDate) : null,
          closeoutDate: d.disasterCloseoutDate ? new Date(d.disasterCloseoutDate) : null,
          ihProgramDeclared: d.ihProgramDeclared || false,
          iaProgramDeclared: d.iaProgramDeclared || false,
          paProgramDeclared: d.paProgramDeclared || false,
          hmProgramDeclared: d.hmProgramDeclared || false,
        })
        .onDuplicateKeyUpdate({
          set: {
            incidentEndDate: d.incidentEndDate ? new Date(d.incidentEndDate) : null,
            closeoutDate: d.disasterCloseoutDate ? new Date(d.disasterCloseoutDate) : null,
            fetchedAt: new Date(),
          },
        });
    } catch {
      // Skip individual disaster errors
    }
  }
}
