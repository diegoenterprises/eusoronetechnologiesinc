# WINDSURF INSTRUCTION: Product Profiles ("My Products")

> **Priority:** P0 — Customer-facing UX blocker
> **Motivation:** Ryan (prospect) found the 8-step wizard overwhelming. Shippers like AMJ Energy ship the same 3-4 products weekly. Every load creation re-enters 47+ identical fields. This feature lets users save products once, then select them for 2-minute load creation.
> **Scope:** 14 files modified/created, ~1,900 lines, 16 hours estimated

---

## PHASE 1: Database Schema

### File: `frontend/drizzle/schema.ts`
**Insert after `dispatchTemplates` table (~line 7330)**

```typescript
// ============================================================================
// PRODUCT PROFILES — Saved product configurations for fast load creation
// ============================================================================

export const productProfiles = mysqlTable(
  "product_profiles",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    companyId: int("companyId").notNull(),

    // ── Identity ──
    nickname: varchar("nickname", { length: 100 }).notNull(),
    description: text("description"),
    isCompanyShared: boolean("isCompanyShared").default(false),

    // ── Trailer & Equipment (Wizard Step 0) ──
    trailerType: varchar("trailerType", { length: 50 }).notNull(),
    equipment: varchar("equipment", { length: 50 }).notNull(),

    // ── Product Classification (Wizard Steps 1-2) ──
    productName: varchar("productName", { length: 255 }).notNull(),
    cargoType: mysqlEnum("cargoType", [
      "general", "hazmat", "refrigerated", "oversized", "liquid", "gas",
      "chemicals", "petroleum", "livestock", "vehicles", "timber", "grain",
      "dry_bulk", "food_grade", "water", "intermodal", "cryogenic",
    ]),
    hazmatClass: varchar("hazmatClass", { length: 10 }),
    unNumber: varchar("unNumber", { length: 10 }),
    ergGuide: int("ergGuide"),
    isTIH: boolean("isTIH").default(false),
    isWR: boolean("isWR").default(false),
    placardName: varchar("placardName", { length: 100 }),

    // ── DOT 49 CFR 172.200-204 ──
    properShippingName: varchar("properShippingName", { length: 255 }),
    packingGroup: mysqlEnum("packingGroup", ["I", "II", "III"]),
    technicalName: varchar("technicalName", { length: 255 }),
    emergencyResponseNumber: varchar("emergencyResponseNumber", { length: 50 }),
    emergencyPhone: varchar("emergencyPhone", { length: 20 }),
    hazardClassNumber: varchar("hazardClassNumber", { length: 10 }),
    subsidiaryHazards: json("subsidiaryHazards").$type<string[]>(),
    specialPermit: varchar("specialPermit", { length: 100 }),

    // ── Quantity & Weight Defaults (Wizard Step 3) ──
    defaultQuantity: decimal("defaultQuantity", { precision: 12, scale: 2 }),
    quantityUnit: varchar("quantityUnit", { length: 30 }),
    weightUnit: varchar("weightUnit", { length: 30 }),
    volumeUnit: varchar("volumeUnit", { length: 30 }),

    // ── Tanker-Specific Equipment ──
    hoseType: varchar("hoseType", { length: 50 }),
    hoseLength: varchar("hoseLength", { length: 50 }),
    fittingType: varchar("fittingType", { length: 50 }),
    pumpRequired: boolean("pumpRequired").default(false),
    compressorRequired: boolean("compressorRequired").default(false),
    bottomLoadRequired: boolean("bottomLoadRequired").default(false),
    vaporRecoveryRequired: boolean("vaporRecoveryRequired").default(false),

    // ── Crude Oil & Specialty Properties ──
    apiGravity: decimal("apiGravity", { precision: 5, scale: 2 }),
    bsw: decimal("bsw", { precision: 5, scale: 2 }),
    sulfurContent: decimal("sulfurContent", { precision: 5, scale: 2 }),
    flashPoint: int("flashPoint"),
    viscosity: decimal("viscosity", { precision: 8, scale: 2 }),
    pourPoint: int("pourPoint"),
    reidVaporPressure: decimal("reidVaporPressure", { precision: 8, scale: 2 }),
    appearance: varchar("appearance", { length: 100 }),

    // ── Usage Tracking ──
    usageCount: int("usageCount").default(0),
    lastUsedAt: timestamp("lastUsedAt"),

    // ── Metadata ──
    tags: json("tags").$type<string[]>(),
    customNotes: text("customNotes"),

    // ── Audit ──
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp("deletedAt"),
  },
  (table) => ({
    userIdx: index("pp_user_idx").on(table.userId),
    companyIdx: index("pp_company_idx").on(table.companyId),
    userCompanyIdx: index("pp_user_company_idx").on(table.userId, table.companyId),
    hazmatIdx: index("pp_hazmat_idx").on(table.hazmatClass),
    usageIdx: index("pp_usage_idx").on(table.usageCount),
  })
);

export type ProductProfile = typeof productProfiles.$inferSelect;
export type InsertProductProfile = typeof productProfiles.$inferInsert;
```

### File: `frontend/server/db.ts`
**In `runSchemaSync()`, add after the `ensureTable('platform_fees', ...)` block:**

```typescript
await ensureTable('product_profiles', `
  CREATE TABLE IF NOT EXISTS product_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    companyId INT NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    description TEXT,
    isCompanyShared BOOLEAN DEFAULT false,
    trailerType VARCHAR(50) NOT NULL,
    equipment VARCHAR(50) NOT NULL,
    productName VARCHAR(255) NOT NULL,
    cargoType ENUM('general','hazmat','refrigerated','oversized','liquid','gas','chemicals','petroleum','livestock','vehicles','timber','grain','dry_bulk','food_grade','water','intermodal','cryogenic'),
    hazmatClass VARCHAR(10),
    unNumber VARCHAR(10),
    ergGuide INT,
    isTIH BOOLEAN DEFAULT false,
    isWR BOOLEAN DEFAULT false,
    placardName VARCHAR(100),
    properShippingName VARCHAR(255),
    packingGroup ENUM('I','II','III'),
    technicalName VARCHAR(255),
    emergencyResponseNumber VARCHAR(50),
    emergencyPhone VARCHAR(20),
    hazardClassNumber VARCHAR(10),
    subsidiaryHazards JSON,
    specialPermit VARCHAR(100),
    defaultQuantity DECIMAL(12,2),
    quantityUnit VARCHAR(30),
    weightUnit VARCHAR(30),
    volumeUnit VARCHAR(30),
    hoseType VARCHAR(50),
    hoseLength VARCHAR(50),
    fittingType VARCHAR(50),
    pumpRequired BOOLEAN DEFAULT false,
    compressorRequired BOOLEAN DEFAULT false,
    bottomLoadRequired BOOLEAN DEFAULT false,
    vaporRecoveryRequired BOOLEAN DEFAULT false,
    apiGravity DECIMAL(5,2),
    bsw DECIMAL(5,2),
    sulfurContent DECIMAL(5,2),
    flashPoint INT,
    viscosity DECIMAL(8,2),
    pourPoint INT,
    reidVaporPressure DECIMAL(8,2),
    appearance VARCHAR(100),
    usageCount INT DEFAULT 0,
    lastUsedAt TIMESTAMP NULL,
    tags JSON,
    customNotes TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP NULL,
    INDEX pp_user_idx (userId),
    INDEX pp_company_idx (companyId),
    INDEX pp_user_company_idx (userId, companyId),
    INDEX pp_hazmat_idx (hazmatClass),
    INDEX pp_usage_idx (usageCount)
  )
`);
```

---

## PHASE 2: tRPC Router

### File: `frontend/server/routers/productProfiles.ts` (NEW — ~450 lines)

Create this file with the following procedures:

```typescript
import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { getDb } from "../db";
import { productProfiles } from "../../drizzle/schema";
import { eq, and, or, desc, asc, isNull, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Helper: resolve user ID from context
function resolveUserId(user: any): number {
  return user?.id || user?.userId || 0;
}

// Roles that can create/manage product profiles
const ALLOWED_ROLES = ["SHIPPER", "BROKER", "DISPATCH", "CATALYST", "TERMINAL_MANAGER", "DRIVER", "ADMIN", "SUPER_ADMIN"];

// Product field schema (reused across create + update)
const productFieldsSchema = z.object({
  nickname: z.string().min(1).max(100),
  description: z.string().optional(),
  isCompanyShared: z.boolean().default(false),
  trailerType: z.string().min(1),
  equipment: z.string().min(1),
  productName: z.string().min(1),
  cargoType: z.string().optional(),
  hazmatClass: z.string().optional(),
  unNumber: z.string().optional(),
  ergGuide: z.number().optional(),
  isTIH: z.boolean().default(false),
  isWR: z.boolean().default(false),
  placardName: z.string().optional(),
  properShippingName: z.string().optional(),
  packingGroup: z.enum(["I", "II", "III"]).optional(),
  technicalName: z.string().optional(),
  emergencyResponseNumber: z.string().optional(),
  emergencyPhone: z.string().optional(),
  hazardClassNumber: z.string().optional(),
  subsidiaryHazards: z.array(z.string()).optional(),
  specialPermit: z.string().optional(),
  defaultQuantity: z.number().optional(),
  quantityUnit: z.string().optional(),
  weightUnit: z.string().optional(),
  volumeUnit: z.string().optional(),
  hoseType: z.string().optional(),
  hoseLength: z.string().optional(),
  fittingType: z.string().optional(),
  pumpRequired: z.boolean().default(false),
  compressorRequired: z.boolean().default(false),
  bottomLoadRequired: z.boolean().default(false),
  vaporRecoveryRequired: z.boolean().default(false),
  apiGravity: z.number().optional(),
  bsw: z.number().optional(),
  sulfurContent: z.number().optional(),
  flashPoint: z.number().optional(),
  viscosity: z.number().optional(),
  pourPoint: z.number().optional(),
  reidVaporPressure: z.number().optional(),
  appearance: z.string().optional(),
  tags: z.array(z.string()).optional(),
  customNotes: z.string().optional(),
});

export const productProfilesRouter = router({
  // ── CREATE ──
  create: protectedProcedure
    .input(productFieldsSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = resolveUserId(ctx.user);
      const companyId = (ctx.user as any)?.companyId || 0;
      if (!ALLOWED_ROLES.includes((ctx.user as any)?.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Your role cannot create product profiles" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [result] = await db.insert(productProfiles).values({
        ...input,
        userId,
        companyId,
        defaultQuantity: input.defaultQuantity?.toString(),
        apiGravity: input.apiGravity?.toString(),
        bsw: input.bsw?.toString(),
        sulfurContent: input.sulfurContent?.toString(),
        viscosity: input.viscosity?.toString(),
        reidVaporPressure: input.reidVaporPressure?.toString(),
      });

      return { id: (result as any).insertId, nickname: input.nickname };
    }),

  // ── LIST (user's own + company shared) ──
  list: protectedProcedure
    .input(z.object({
      includeCompanyShared: z.boolean().default(true),
      search: z.string().optional(),
      hazmatOnly: z.boolean().default(false),
      sortBy: z.enum(["lastUsed", "name", "usageCount", "created"]).default("lastUsed"),
    }).optional())
    .query(async ({ ctx, input }) => {
      const userId = resolveUserId(ctx.user);
      const companyId = (ctx.user as any)?.companyId || 0;
      const opts = input || { includeCompanyShared: true, sortBy: "lastUsed" as const };
      const db = await getDb();
      if (!db) return [];

      // Build WHERE: (my products OR company-shared) AND not deleted
      const conditions = [
        isNull(productProfiles.deletedAt),
        or(
          eq(productProfiles.userId, userId),
          opts.includeCompanyShared
            ? and(eq(productProfiles.companyId, companyId), eq(productProfiles.isCompanyShared, true))
            : undefined
        ),
      ];

      if (opts.hazmatOnly) {
        conditions.push(sql`${productProfiles.hazmatClass} IS NOT NULL`);
      }

      let query = db.select().from(productProfiles).where(and(...conditions.filter(Boolean)));

      // Sort
      const orderMap = {
        lastUsed: desc(sql`COALESCE(${productProfiles.lastUsedAt}, ${productProfiles.createdAt})`),
        name: asc(productProfiles.nickname),
        usageCount: desc(productProfiles.usageCount),
        created: desc(productProfiles.createdAt),
      };
      query = query.orderBy(orderMap[opts.sortBy] || orderMap.lastUsed);

      const results = await query.limit(100);

      // Client-side search filter (simple, avoids complex SQL)
      if (opts.search) {
        const q = opts.search.toLowerCase();
        return results.filter((r: any) =>
          r.nickname?.toLowerCase().includes(q) ||
          r.productName?.toLowerCase().includes(q) ||
          (r.tags as string[])?.some(t => t.toLowerCase().includes(q))
        );
      }

      return results;
    }),

  // ── GET single ──
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const userId = resolveUserId(ctx.user);
      const companyId = (ctx.user as any)?.companyId || 0;
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [profile] = await db.select().from(productProfiles).where(
        and(
          eq(productProfiles.id, input.id),
          isNull(productProfiles.deletedAt),
          or(
            eq(productProfiles.userId, userId),
            and(eq(productProfiles.companyId, companyId), eq(productProfiles.isCompanyShared, true))
          )
        )
      ).limit(1);

      if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Product profile not found" });
      return profile;
    }),

  // ── UPDATE (partial) ──
  update: protectedProcedure
    .input(z.object({ id: z.number() }).merge(productFieldsSchema.partial()))
    .mutation(async ({ ctx, input }) => {
      const userId = resolveUserId(ctx.user);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [existing] = await db.select().from(productProfiles)
        .where(and(eq(productProfiles.id, input.id), eq(productProfiles.userId, userId))).limit(1);
      if (!existing) throw new TRPCError({ code: "FORBIDDEN", message: "Cannot modify this product" });

      const { id, ...updates } = input;
      await db.update(productProfiles).set({
        ...updates,
        defaultQuantity: updates.defaultQuantity?.toString(),
        apiGravity: updates.apiGravity?.toString(),
        bsw: updates.bsw?.toString(),
        sulfurContent: updates.sulfurContent?.toString(),
        viscosity: updates.viscosity?.toString(),
        reidVaporPressure: updates.reidVaporPressure?.toString(),
      }).where(eq(productProfiles.id, id));

      return { success: true };
    }),

  // ── DELETE (soft) ──
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const userId = resolveUserId(ctx.user);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [existing] = await db.select().from(productProfiles)
        .where(and(eq(productProfiles.id, input.id), eq(productProfiles.userId, userId))).limit(1);
      if (!existing) throw new TRPCError({ code: "FORBIDDEN" });

      await db.update(productProfiles).set({ deletedAt: new Date() })
        .where(eq(productProfiles.id, input.id));
      return { success: true };
    }),

  // ── INCREMENT USAGE (called when product selected in wizard) ──
  incrementUsage: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      await db.update(productProfiles).set({
        usageCount: sql`${productProfiles.usageCount} + 1`,
        lastUsedAt: new Date(),
      }).where(eq(productProfiles.id, input.id));
      return { success: true };
    }),

  // ── CREATE FROM WIZARD (extract product fields from full wizard formData) ──
  createFromWizard: protectedProcedure
    .input(z.object({
      nickname: z.string().min(1).max(100),
      wizardData: z.record(z.any()),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = resolveUserId(ctx.user);
      const companyId = (ctx.user as any)?.companyId || 0;
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const w = input.wizardData;
      await db.insert(productProfiles).values({
        userId,
        companyId,
        nickname: input.nickname,
        trailerType: w.trailerType || "",
        equipment: w.equipment || "",
        productName: w.productName || "",
        cargoType: w.cargoType || undefined,
        hazmatClass: w.hazmatClass || undefined,
        unNumber: w.unNumber || undefined,
        ergGuide: w.ergGuide ? Number(w.ergGuide) : undefined,
        isTIH: !!w.isTIH,
        isWR: !!w.isWR,
        placardName: w.placardName || undefined,
        properShippingName: w.properShippingName || undefined,
        packingGroup: w.packingGroup || undefined,
        technicalName: w.technicalName || undefined,
        emergencyResponseNumber: w.emergencyResponseNumber || undefined,
        emergencyPhone: w.emergencyPhone || undefined,
        hazardClassNumber: w.hazardClassNumber || undefined,
        subsidiaryHazards: w.subsidiaryHazards || undefined,
        specialPermit: w.specialPermit || undefined,
        defaultQuantity: w.quantity?.toString() || undefined,
        quantityUnit: w.quantityUnit || undefined,
        weightUnit: w.weightUnit || undefined,
        volumeUnit: w.volumeUnit || undefined,
        hoseType: w.hoseType || undefined,
        hoseLength: w.hoseLength || undefined,
        fittingType: w.fittingType || undefined,
        pumpRequired: !!w.pumpRequired,
        compressorRequired: !!w.compressorRequired,
        bottomLoadRequired: !!w.bottomLoadRequired,
        vaporRecoveryRequired: !!w.vaporRecoveryRequired,
        apiGravity: w.apiGravity?.toString() || undefined,
        bsw: w.bsw?.toString() || undefined,
        sulfurContent: w.sulfurContent?.toString() || undefined,
        flashPoint: w.flashPoint ? Number(w.flashPoint) : undefined,
        viscosity: w.viscosity?.toString() || undefined,
        pourPoint: w.pourPoint ? Number(w.pourPoint) : undefined,
        reidVaporPressure: w.reidVaporPressure?.toString() || undefined,
        appearance: w.appearance || undefined,
        tags: w.hazmatClass ? ["hazmat", w.trailerType] : [w.trailerType],
      });

      return { success: true, nickname: input.nickname };
    }),
});
```

### File: `frontend/server/routers.ts`
**Add import and registration:**

```typescript
// Add near the top with other imports:
import { productProfilesRouter } from "./routers/productProfiles";

// Add to the appRouter definition:
productProfiles: productProfilesRouter,
```

---

## PHASE 3: Wizard Integration

### File: `frontend/client/src/pages/LoadCreationWizard.tsx`

#### 3a. Update ALL_STEPS (line 41):

```typescript
const ALL_STEPS = [
  "My Products",              // NEW: Step 0
  "Trailer Type",             // Was Step 0, now Step 1
  "Product Classification",   // Was Step 1, now Step 2
  "SPECTRA-MATCH Verification", // Was Step 2, now Step 3
  "Quantity & Weight",        // Was Step 3, now Step 4
  "Origin & Destination",     // Was Step 4, now Step 5
  "Catalyst Requirements",    // Was Step 5, now Step 6
  "Pricing",                  // Was Step 6, now Step 7
  "Review",                   // Was Step 7, now Step 8
];
```

#### 3b. Update WIZARD_CONFIG quickSteps (line 225-234):

All `quickSteps` indices shift +1 to account for new Step 0. Add Step 0 to all roles.

```typescript
const WIZARD_CONFIG: Record<string, { steps: number; showTerminalFields: boolean; showBidFields: boolean; showTASInventory: boolean; quickMode?: boolean; quickSteps?: number[] }> = {
  SHIPPER: { steps: 9, showTerminalFields: false, showBidFields: false, showTASInventory: false },
  BROKER: { steps: 9, showTerminalFields: false, showBidFields: true, showTASInventory: false },
  DISPATCH: { steps: 6, showTerminalFields: false, showBidFields: false, showTASInventory: false, quickMode: true, quickSteps: [0, 1, 2, 6, 8, 9] },
  TERMINAL_MANAGER: { steps: 7, showTerminalFields: true, showBidFields: false, showTASInventory: true },
  CATALYST: { steps: 8, showTerminalFields: false, showBidFields: false, showTASInventory: false },
  DRIVER: { steps: 8, showTerminalFields: false, showBidFields: false, showTASInventory: false },
  ADMIN: { steps: 9, showTerminalFields: true, showBidFields: true, showTASInventory: true },
  SUPER_ADMIN: { steps: 9, showTerminalFields: true, showBidFields: true, showTASInventory: true },
};
```

#### 3c. Add tRPC query for user's products (near line 635):

```typescript
// My Products query — for Step 0
const myProductsQuery = (trpc as any).productProfiles?.list?.useQuery?.(
  { sortBy: "lastUsed", includeCompanyShared: true },
  { staleTime: 30_000 }
) || { data: [], isLoading: false };
const myProducts: any[] = myProductsQuery.data || [];

// Track whether user selected a saved product (for skip logic)
const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
const [productSearch, setProductSearch] = useState("");

// Increment usage mutation
const incrementUsageMutation = (trpc as any).productProfiles?.incrementUsage?.useMutation?.() || { mutate: () => {} };
```

#### 3d. Product selection handler (auto-fill + skip):

```typescript
const handleSelectProduct = useCallback((product: any) => {
  // Auto-fill ALL product fields from saved profile
  setFormData((prev: any) => ({
    ...prev,
    trailerType: product.trailerType,
    equipment: product.equipment,
    productName: product.productName,
    hazmatClass: product.hazmatClass || undefined,
    unNumber: product.unNumber || undefined,
    ergGuide: product.ergGuide || undefined,
    isTIH: product.isTIH || false,
    isWR: product.isWR || false,
    placardName: product.placardName || undefined,
    properShippingName: product.properShippingName || undefined,
    packingGroup: product.packingGroup || undefined,
    technicalName: product.technicalName || undefined,
    emergencyResponseNumber: product.emergencyResponseNumber || undefined,
    emergencyPhone: product.emergencyPhone || undefined,
    hazardClassNumber: product.hazardClassNumber || undefined,
    subsidiaryHazards: product.subsidiaryHazards || undefined,
    specialPermit: product.specialPermit || undefined,
    quantity: product.defaultQuantity || undefined,
    quantityUnit: product.quantityUnit || undefined,
    weightUnit: product.weightUnit || undefined,
    volumeUnit: product.volumeUnit || undefined,
    hoseType: product.hoseType || undefined,
    hoseLength: product.hoseLength || undefined,
    fittingType: product.fittingType || undefined,
    pumpRequired: product.pumpRequired || false,
    compressorRequired: product.compressorRequired || false,
    bottomLoadRequired: product.bottomLoadRequired || false,
    vaporRecoveryRequired: product.vaporRecoveryRequired || false,
    apiGravity: product.apiGravity || undefined,
    bsw: product.bsw || undefined,
    sulfurContent: product.sulfurContent || undefined,
    flashPoint: product.flashPoint || undefined,
    viscosity: product.viscosity || undefined,
    pourPoint: product.pourPoint || undefined,
    reidVaporPressure: product.reidVaporPressure || undefined,
    appearance: product.appearance || undefined,
    // Also set COMMODITY_UNITS-derived fields
    compartments: 1,
  }));

  setSelectedProductId(product.id);
  incrementUsageMutation.mutate({ id: product.id });

  // Find the "Origin & Destination" step index and skip to it
  const originStepIdx = activeStepIndices.findIndex(i => ALL_STEPS[i] === "Origin & Destination");
  if (originStepIdx >= 0) {
    setStep(originStepIdx);
  }

  toast.success(`${product.nickname} loaded`, {
    description: `${product.productName} — ${product.trailerType}${product.hazmatClass ? ` (Class ${product.hazmatClass})` : ''}`,
  });
}, [activeStepIndices, setStep, incrementUsageMutation]);
```

#### 3e. Step 0 JSX ("My Products") — insert BEFORE the existing Step 0 (Trailer Type):

```jsx
{/* STEP 0: My Products — Select saved product or create new */}
{rs === 0 && (
  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-slate-900 dark:text-white font-bold text-lg">My Products</p>
        <p className="text-slate-400 text-sm">Select a saved product for instant setup, or create a new one</p>
      </div>
      {myProducts.length > 0 && (
        <Button variant="outline" size="sm" onClick={() => setStep(step + 1)} className="text-cyan-400 border-cyan-400/30 hover:bg-cyan-400/10">
          <Plus className="w-4 h-4 mr-1" /> New Product
        </Button>
      )}
    </div>

    {myProducts.length === 0 ? (
      <div className="text-center py-12 space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 flex items-center justify-center">
          <Package className="w-8 h-8 text-cyan-400" />
        </div>
        <div>
          <p className="text-slate-300 font-medium">No saved products yet</p>
          <p className="text-slate-500 text-sm mt-1">Create your first load and save the product for next time</p>
        </div>
        <Button onClick={() => setStep(step + 1)} className="bg-gradient-to-r from-cyan-500 to-emerald-500">
          Create New Product <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    ) : (
      <>
        {myProducts.length > 4 && (
          <Input
            placeholder="Search products..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-600/30"
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
          {myProducts
            .filter(p => !productSearch || p.nickname?.toLowerCase().includes(productSearch.toLowerCase()) || p.productName?.toLowerCase().includes(productSearch.toLowerCase()))
            .map((product: any) => (
              <button
                key={product.id}
                onClick={() => handleSelectProduct(product)}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all duration-200 hover:scale-[1.01] group",
                  "bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-600/30",
                  "hover:border-cyan-400 dark:hover:border-cyan-500/50 hover:bg-cyan-50 dark:hover:bg-cyan-500/5"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:from-cyan-500/30 group-hover:to-emerald-500/30">
                    {TRAILER_ICON[TRAILER_TYPES.find(t => t.id === product.trailerType)?.icon || "package"] || <Package className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-900 dark:text-white font-bold text-sm truncate">{product.nickname}</p>
                    <p className="text-slate-500 text-xs mt-0.5 truncate">{product.productName}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-600/50 text-slate-600 dark:text-slate-300">
                        {TRAILER_TYPES.find(t => t.id === product.trailerType)?.name || product.trailerType}
                      </span>
                      {product.hazmatClass && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-medium">
                          Class {product.hazmatClass}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-slate-500">{product.usageCount || 0}x used</p>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 mt-1 ml-auto transition-colors" />
                  </div>
                </div>
              </button>
            ))}
        </div>
      </>
    )}
  </div>
)}
```

#### 3f. Update ALL `rs === N` references:

Since ALL_STEPS now has 9 items instead of 8, every `rs === N` check in the wizard JSX shifts by +1:
- Old `rs === 0` (Trailer Type) → New `rs === 1`
- Old `rs === 1` (Product Classification) → New `rs === 2`
- Old `rs === 2` (SPECTRA-MATCH) → New `rs === 3`
- Old `rs === 3` (Quantity & Weight) → New `rs === 4`
- Old `rs === 4` (Origin & Dest) → New `rs === 5`
- Old `rs === 5` (Catalyst Requirements) → New `rs === 6`
- Old `rs === 6` (Pricing) → New `rs === 7`
- Old `rs === 7` (Review) → New `rs === 8`

**CRITICAL:** Update `canProceed()` function (line 986) and all `rs >= N` checks for query enabling (lines 768, 779, 813, 841, 845, 849).

#### 3g. Update `canProceed()`:

```typescript
const canProceed = () => {
  switch (rs) {
    case 0: return true; // My Products — always can proceed (skip or select)
    case 1: return !!formData.trailerType;
    case 2: return formData.productName && (isHazmat ? (formData.hazmatClass && formData.properShippingName && formData.emergencyPhone) : true);
    case 3: return true;
    case 4: return formData.weight && formData.quantity;
    case 5: return formData.origin && formData.destination;
    case 6: return true;
    case 7: return formData.rate || formData.ratePerMile;
    default: return true;
  }
};
```

#### 3h. "Save as Product" modal on Review step (rs === 8):

Add before the submit button in the Review step:

```jsx
{/* Save as Product — shown on Review step when product was NOT loaded from profile */}
{rs === 8 && !selectedProductId && formData.productName && (
  <div className="flex gap-3 mt-4">
    <Button
      variant="outline"
      onClick={() => setShowSaveProductDialog(true)}
      className="flex-1 border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10"
    >
      <Package className="w-4 h-4 mr-2" /> Save as Product
    </Button>
  </div>
)}
```

Add state and dialog:

```typescript
const [showSaveProductDialog, setShowSaveProductDialog] = useState(false);
const [saveProductNickname, setSaveProductNickname] = useState("");

const saveFromWizardMutation = (trpc as any).productProfiles?.createFromWizard?.useMutation?.({
  onSuccess: () => {
    toast.success("Product saved!", { description: "Available in My Products next time you create a load" });
    setShowSaveProductDialog(false);
    myProductsQuery.refetch?.();
  },
  onError: (err: any) => toast.error("Failed to save product", { description: err?.message }),
}) || { mutate: () => {} };
```

Dialog JSX (place at bottom of component, before closing `</div>`):

```jsx
{showSaveProductDialog && (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
      <div>
        <p className="text-slate-900 dark:text-white font-bold text-lg">Save as Product</p>
        <p className="text-slate-400 text-sm mt-1">Give this product a name so you can reuse it</p>
      </div>
      <Input
        placeholder="e.g., West Texas Intermediate, Regular Diesel, Corn Load"
        value={saveProductNickname}
        onChange={(e) => setSaveProductNickname(e.target.value)}
        autoFocus
        className="bg-slate-50 dark:bg-slate-700/30"
      />
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={() => setShowSaveProductDialog(false)} className="flex-1">Cancel</Button>
        <Button
          onClick={() => saveFromWizardMutation.mutate({ nickname: saveProductNickname, wizardData: formData })}
          disabled={!saveProductNickname.trim() || saveFromWizardMutation.isPending}
          className="flex-1 bg-gradient-to-r from-cyan-500 to-emerald-500"
        >
          Save Product
        </Button>
      </div>
    </div>
  </div>
)}
```

---

## PHASE 4: Settings — My Products Tab

### File: `frontend/client/src/components/MyProductsTab.tsx` (NEW — ~450 lines)

Create a standalone component with:
- Product card grid (sortable: Last Used, Name, Usage Count)
- Search input for filtering by nickname/productName
- Create New Product form (modal or inline — uses same fields as wizard Steps 0-3)
- Edit product modal (pre-filled form)
- Duplicate button (clones with "(Copy)" suffix)
- Delete with confirmation (soft delete)
- "Share with Company" toggle
- Empty state with CTA

**Use existing components from the codebase:**
- `Card`, `CardContent`, `CardHeader`, `CardTitle` from `@/components/ui/card`
- `Button` from `@/components/ui/button`
- `Input` from `@/components/ui/input`
- `Select` from `@/components/ui/select`
- `Badge` from `@/components/ui/badge`
- `toast` from `sonner`
- `trpc` from `@/lib/trpc`
- `TRAILER_TYPES`, `HAZMAT_CLASSES`, `TRAILER_ICON` imported from LoadCreationWizard or extracted to shared constants

**IMPORTANT:** Consider extracting `TRAILER_TYPES`, `HAZMAT_CLASSES`, `TRAILER_ICON`, `COMMODITY_UNITS`, `TRAILER_COMMODITY_MAP` from LoadCreationWizard.tsx into a shared constants file `frontend/client/src/lib/loadConstants.ts` so both the wizard AND MyProductsTab can import them without duplication.

### File: `frontend/client/src/pages/Settings.tsx`

Add the 5th tab:

```tsx
// Import at top:
import MyProductsTab from "@/components/MyProductsTab";
import { Package } from "lucide-react";

// In TabsList (after Billing tab, line ~321):
<TabsTrigger value="products" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm rounded-lg text-slate-600 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">
  <Package className="w-4 h-4 mr-2" />My Products
</TabsTrigger>

// After the billing TabsContent:
<TabsContent value="products" className="mt-6">
  <MyProductsTab />
</TabsContent>
```

---

## PHASE 5: Shared Constants Extraction (Optional but Recommended)

### File: `frontend/client/src/lib/loadConstants.ts` (NEW — ~120 lines)

Move from LoadCreationWizard.tsx:
- `TRAILER_TYPES` array (lines 43-75)
- `TRAILER_ICON` map (lines 77-95)
- `HAZMAT_CLASSES` array (lines 97-113)
- `COMMODITY_UNITS` map (lines 237-255)
- `TRAILER_COMMODITY_MAP` map (lines 328-335)

Then import in both LoadCreationWizard.tsx and MyProductsTab.tsx:
```typescript
import { TRAILER_TYPES, TRAILER_ICON, HAZMAT_CLASSES, COMMODITY_UNITS, TRAILER_COMMODITY_MAP } from "@/lib/loadConstants";
```

---

## PHASE 6: Registration Onboarding Integration

### Context
The registration system already uses a shared `RegistrationWizard` component and features role-specific flows. This phase extends Catalyst, Shipper, Broker, Terminal, and Dispatch registration to collect product information during signup, then auto-creates `product_profiles` for those products upon successful registration.

**Current state:**
- **Catalyst** (RegisterCatalyst.tsx, 1064 lines): Already has `ProductPicker` + `CompliancePreview` in Step 2 ("Operating Authority"). Products stored as string array but NOT auto-creating profiles.
- **Shipper** (RegisterShipper.tsx, 800 lines): No product picker. Has `hazmatTypes[]` checkboxes only.
- **Broker** (RegisterBroker.tsx, 735 lines): No product picker. Only `brokersHazmat: boolean`.
- **Terminal** (RegisterTerminal.tsx, 738 lines): Has hardcoded 14-item PRODUCTS list, NOT using shared ProductPicker.
- **Dispatch** (RegisterDispatch.tsx, 608 lines): Individual registration, no product awareness.

### 6a. Shipper Registration — Add "Products You Ship" Step

**File:** `frontend/client/src/pages/RegisterShipper.tsx`

Insert new step AFTER "Regulatory Registration" (Step 4) and BEFORE "Insurance" (Step 5):

- Import `ProductPicker` and `CompliancePreview` from `@/components/registration/CompliancePreview`
- Shippers don't select trailers → show ALL products via ProductPicker with a comprehensive trailer type list
- Add `products: string[]` and `operatingStates: string[]` to `ShipperFormData` interface and initialFormData
- Update total steps from 9 to 10
- Step 5 content becomes "Products You Ship" with ProductPicker + CompliancePreview
- Submit: send `products` array to `registerShipper` mutation
- **Estimate:** +80 lines

### 6b. Broker Registration — Add "Products You Broker" Step

**File:** `frontend/client/src/pages/RegisterBroker.tsx`

Insert new step AFTER "Authority & Bond" (Step 4) and BEFORE "Insurance" (Step 5):

- Import `ProductPicker` and `CompliancePreview`
- Brokers handle all product types → show full catalog
- Add `products: string[]` and `equipmentTypes: string[]` to `BrokerFormData`
- Add equipment type checkboxes (same EQUIPMENT_TYPES from RegisterCatalyst) + ProductPicker filtered by selected equipment
- Update total steps from 9 to 10
- Step 5 content becomes "Products You Broker"
- Submit: send `products` array to `registerBroker` mutation
- **Estimate:** +80 lines

### 6c. Terminal Registration — Upgrade to Shared ProductPicker

**File:** `frontend/client/src/pages/RegisterTerminal.tsx`

In Step 4 ("Operations"):

- Replace the hardcoded PRODUCTS checkbox list with the shared `ProductPicker` component
- Terminal already has `productsHandled: string[]` → just swap the UI component
- Add `CompliancePreview` below ProductPicker
- Add `operatingStates: string[]` to form data
- No step addition needed — just a component upgrade
- **Estimate:** +30 lines

### 6d. Dispatch Registration — Add "Products You Dispatch" Step

**File:** `frontend/client/src/pages/RegisterDispatch.tsx`

Insert new step AFTER "Experience & Training" (Step 3) and BEFORE "Certifications" (Step 4):

- Dispatchers are individuals, not companies — lighter integration
- Show simplified product awareness picker: "What commodities do you dispatch?"
- Use ProductPicker with common equipment types pre-selected
- Add `commodityExperience: string[]` to `DispatchFormData`
- Update total steps from 8 to 9
- **Estimate:** +50 lines

### 6e. Catalyst Registration — Already Has ProductPicker, Just Needs Server Auto-Creation

**File:** `frontend/client/src/pages/RegisterCatalyst.tsx`

No UI changes needed — Catalyst already collects equipment types and products in Step 2. The auto-creation happens server-side (6f).

### 6f. Server-Side: Auto-Create product_profiles on Registration

**File:** `frontend/server/routers/registration.ts` (or wherever registration mutations live)

In EACH registration mutation handler (`registerShipper`, `registerBroker`, `registerCatalyst`, `registerTerminalManager`), after the user/company is created:

```typescript
// Auto-create product profiles from registration selections
if (input.products?.length) {
  const PRODUCT_CATALOG_SERVER = await getProductCatalog();
  // OR import from frontend/server/lib/productCatalog.ts

  for (const productId of input.products) {
    const catalogEntry = PRODUCT_CATALOG_SERVER.find(p => p.id === productId);
    if (!catalogEntry) continue;

    // Determine default trailer type from TRAILER_PRODUCT_MAP
    const defaultTrailer = Object.entries(TRAILER_PRODUCT_MAP)
      .find(([trailer, products]) => products.includes(productId))?.[0] || 'dry_van';

    try {
      await db.insert(productProfiles).values({
        userId: newUser.id,
        companyId: newCompany?.id || 0,
        nickname: catalogEntry.label,
        trailerType: defaultTrailer,
        equipment: defaultTrailer,
        productName: catalogEntry.label,
        cargoType: mapCategoryToCargoType(catalogEntry.category),
        hazmatClass: catalogEntry.hazmatClass || null,
        isCompanyShared: true, // company-level profile
        tags: [catalogEntry.category.toLowerCase(), catalogEntry.requiresHazmat ? 'hazmat' : 'non-hazmat'],
      });
    } catch (err) {
      console.error(`[Registration] Failed to create product profile for ${productId}:`, err);
      // Non-blocking — registration succeeds even if profile creation fails
    }
  }
}
```

Helper function:
```typescript
function mapCategoryToCargoType(category: string): string {
  const map: Record<string, string> = {
    'Petroleum': 'petroleum',
    'Gas': 'gas',
    'Chemicals': 'chemicals',
    'Cryogenic': 'cryogenic',
    'Food Liquid': 'food_grade',
    'Water': 'water',
    'Dry Freight': 'general',
    'Refrigerated': 'refrigerated',
    'Flatbed': 'general',
    'Heavy Haul': 'oversized',
    'Dry Bulk': 'dry_bulk',
  };
  return map[category] || 'general';
}
```

**Estimate:** +60 lines

### 6g. Shared Constants: Server-Side Product Catalog

**File:** `frontend/server/lib/productCatalog.ts` (NEW — ~200 lines)

Extract the `PRODUCT_CATALOG` and `TRAILER_PRODUCT_MAP` from `CompliancePreview.tsx` into a shared server-side module so both the client component AND the registration server code reference the same canonical product list:

- 45 products with hazmatClass, requiresHazmat, requiresTanker, requiresTWIC, temperatureControlled
- 12 trailer types → applicable products mapping
- 25 compliance rules (TRAILER/PRODUCT/COMBO triggers)
- Export as both client-side ES module and server-side utility

This ensures product definitions are single-source-of-truth and don't drift between client/server.

---

## VERIFICATION PROTOCOL

After completing all phases:

1. **Table exists:**
   ```sql
   SHOW TABLES LIKE 'product_profiles';
   -- Must return 1 row
   SHOW COLUMNS FROM product_profiles;
   -- Must show all columns (nickname, trailerType, hazmatClass, etc.)
   ```

2. **Router works:**
   - Create a product via the tRPC playground or Settings UI
   - List products — verify it appears
   - Update nickname — verify change persists
   - Increment usage — verify usageCount goes up
   - Soft delete — verify hidden from list, still in DB

3. **Wizard flow:**
   - Navigate to Create Load
   - Step 0 shows "My Products" with saved products
   - Click a saved product → verify ALL formData fields populated
   - Verify wizard skips to "Origin & Destination" step
   - Complete the load → verify usageCount incremented

4. **Save from wizard:**
   - Create load manually (full 9-step flow)
   - On Review step, click "Save as Product"
   - Enter nickname → save
   - Go to Settings → My Products → verify it appears
   - Create another load → verify the product appears in Step 0

5. **Company sharing:**
   - User A marks product as company-shared
   - User B at same company sees it in Step 0 with a "Shared" badge
   - User C at different company does NOT see it

6. **Registration onboarding flow:**
   - **Shipper registration:** Complete flow → verify "Products You Ship" step appears after Regulatory
     - Select 3 products → complete registration → login → Create Load → verify Step 0 shows those 3 products
   - **Broker registration:** Complete flow → verify "Products You Broker" step appears after Authority & Bond
     - Select equipment types and products → verify CompliancePreview updates accordingly
   - **Terminal registration:** Complete flow → verify Step 4 "Operations" shows ProductPicker (not hardcoded list)
   - **Dispatch registration:** Complete flow → verify "Commodities You Dispatch" step appears after Experience
   - **Catalyst registration:** No UI changes, verify products are still accepted → verify product_profiles created on completion
   - **Auto-creation:** For each role, verify that selecting N products during registration creates N product_profiles in the database with correct metadata (cargoType, hazmatClass, trailerType mapped from PRODUCT_CATALOG)

7. **Build clean:**
   ```bash
   npm run build
   # Must have 0 errors
   ```

8. **Commit, push to origin/main, rebuild dist/src-snapshot/, deploy to Azure**

---

## FILES SUMMARY

### Phases 1-5 (Existing)
| File | Action | Lines |
|------|--------|-------|
| `frontend/drizzle/schema.ts` | Modify (+80) | Add productProfiles table |
| `frontend/server/db.ts` | Modify (+30) | Add ensureTable for product_profiles |
| `frontend/server/routers/productProfiles.ts` | **New** (~450) | 7 tRPC procedures |
| `frontend/server/routers.ts` | Modify (+2) | Register router |
| `frontend/client/src/pages/LoadCreationWizard.tsx` | Modify (+250) | Step 0, auto-fill, Save as Product |
| `frontend/client/src/components/MyProductsTab.tsx` | **New** (~450) | Settings management UI |
| `frontend/client/src/pages/Settings.tsx` | Modify (+15) | Add 5th tab |
| `frontend/client/src/lib/loadConstants.ts` | **New** (~120) | Shared constants (optional) |
| **Subtotal (Phases 1-5)** | | **~1,400 lines** |

### Phase 6 (Registration Integration)
| File | Action | Lines |
|------|--------|-------|
| `frontend/client/src/pages/RegisterShipper.tsx` | Modify (+80) | Add Products step with ProductPicker + CompliancePreview |
| `frontend/client/src/pages/RegisterBroker.tsx` | Modify (+80) | Add Products step with ProductPicker + equipment selector |
| `frontend/client/src/pages/RegisterTerminal.tsx` | Modify (+30) | Upgrade to shared ProductPicker component |
| `frontend/client/src/pages/RegisterDispatch.tsx` | Modify (+50) | Add Commodities step with ProductPicker |
| `frontend/server/routers/registration.ts` | Modify (+60) | Auto-create product_profiles on registration |
| `frontend/server/lib/productCatalog.ts` | **New** (~200) | Shared PRODUCT_CATALOG + TRAILER_PRODUCT_MAP constants |
| **Subtotal (Phase 6)** | | **~500 lines** |

| **TOTAL (All Phases)** | | **~1,900 lines** |
