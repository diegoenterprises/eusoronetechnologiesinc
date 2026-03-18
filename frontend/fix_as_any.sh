#!/bin/bash
# Fix all 'as any' type casts in router files
# Excluded files: futureVision, dispatch, advancedFinancials, safety, agreements, wallet, messages, gamification, dispatchPlanner, pricebook, dataMigration, communicationHub, driverWellness, quotes, location, emergencyProtocols, stripe, fscEngine, allocationTracker, shippers, documentCenter, superAdmin

cd /Users/diegousoro/Desktop/eusoronetechnologiesinc/frontend

EXCLUDED="futureVision.ts dispatch.ts advancedFinancials.ts safety.ts agreements.ts wallet.ts messages.ts gamification.ts dispatchPlanner.ts pricebook.ts dataMigration.ts communicationHub.ts driverWellness.ts quotes.ts location.ts emergencyProtocols.ts stripe.ts fscEngine.ts allocationTracker.ts shippers.ts documentCenter.ts superAdmin.ts"

for f in server/routers/*.ts; do
  base=$(basename "$f")
  skip=0
  for ex in $EXCLUDED; do
    if [ "$base" = "$ex" ]; then
      skip=1
      break
    fi
  done
  if [ "$skip" = "1" ]; then continue; fi
  # Skip test files
  case "$f" in *__tests__*) continue;; esac

  # Pattern 1: (ctx.user as any)?.PROP -> ctx.user!.PROP
  sed -i '' 's/(ctx\.user as any)?\.id/ctx.user!.id/g' "$f"
  sed -i '' 's/(ctx\.user as any)?\.companyId/ctx.user!.companyId/g' "$f"
  sed -i '' 's/(ctx\.user as any)?\.role/ctx.user!.role/g' "$f"
  sed -i '' 's/(ctx\.user as any)?\.name/ctx.user!.name/g' "$f"
  sed -i '' 's/(ctx\.user as any)?\.email/ctx.user!.email/g' "$f"

  # Pattern 1b: (ctx.user as any).PROP (no optional chaining)
  sed -i '' 's/(ctx\.user as any)\.id/ctx.user!.id/g' "$f"
  sed -i '' 's/(ctx\.user as any)\.companyId/ctx.user!.companyId/g' "$f"
  sed -i '' 's/(ctx\.user as any)\.role/ctx.user!.role/g' "$f"
  sed -i '' 's/(ctx\.user as any)\.name/ctx.user!.name/g' "$f"
  sed -i '' 's/(ctx\.user as any)\.email/ctx.user!.email/g' "$f"

  # Pattern 2: (ctx as any).user?.id -> ctx.user?.id
  sed -i '' 's/(ctx as any)\.user/ctx.user/g' "$f"

  # Pattern 3: (ctx as any).req -> ctx.req
  sed -i '' 's/(ctx as any)\.req/ctx.req/g' "$f"

  # Pattern 4: (result as any).insertId || (result as any)[0]?.insertId
  sed -i '' 's/(result as any)\.insertId || (result as any)\[0\]?\.insertId || 0/(result as unknown as { insertId: number }).insertId || 0/g' "$f"
  sed -i '' 's/(result as any)\.insertId || (result as any)\[0\]?\.insertId/(result as unknown as { insertId: number }).insertId/g' "$f"
  sed -i '' 's/(inserted as any)\.insertId/(inserted as unknown as { insertId: number }).insertId/g' "$f"

  # Pattern 5: (result as any)[0]?.affectedRows
  sed -i '' 's/(result as any)\[0\]?\.affectedRows/(result as unknown as [{ affectedRows?: number }])[0]?.affectedRows/g' "$f"

  # Pattern 6: l.pickupLocation as any || {} -> l.pickupLocation as Record<string, unknown> || {}
  sed -i '' 's/\.pickupLocation as any/.pickupLocation as Record<string, unknown>/g' "$f"
  sed -i '' 's/\.deliveryLocation as any/.deliveryLocation as Record<string, unknown>/g' "$f"
  sed -i '' 's/\.currentLocation as any/.currentLocation as Record<string, unknown>/g' "$f"

  # Pattern 7: [] as any[] -> [] as unknown[]
  sed -i '' 's/\[\] as any\[\]/[] as unknown[]/g' "$f"

  # Pattern 8: (user as any)?.companyId -> user?.companyId (User type has companyId)
  sed -i '' 's/(user as any)?\.companyId/user?.companyId/g' "$f"
  sed -i '' 's/(user as any)\.companyId/user.companyId/g' "$f"

  # Pattern 9: (rows as any[]) -> (rows as unknown[])
  sed -i '' 's/(rows as any\[\])/(rows as unknown[])/g' "$f"
  sed -i '' 's/(truckRows as any\[\])/(truckRows as unknown[])/g' "$f"

  # Pattern 10: metadata as any -> as Record<string, unknown>
  sed -i '' 's/metadata as any/metadata as Record<string, unknown>/g' "$f"

  # Pattern 11: (wsErr as any)?.message -> (wsErr as Error)?.message
  sed -i '' 's/(wsErr as any)?\.message/(wsErr as Error)?.message/g' "$f"
  sed -i '' 's/(bulkErr as any)?\.message/(bulkErr as Error)?.message/g' "$f"
  sed -i '' 's/(triggerErr as any)?\.message/(triggerErr as Error)?.message/g' "$f"

  # Pattern 12: (result as unknown as any[][]) -> (result as unknown as Record<string, unknown>[][])
  sed -i '' 's/(result as unknown as any\[\]\[\])/(result as unknown as Record<string, unknown>[][])/g' "$f"

  # Pattern 13: } as any) -> } as typeof TABLE.$inferInsert) -- too variable, skip for now

  # Pattern 14: (load as any)?.PROP -> (load as Record<string, unknown>)?.PROP
  sed -i '' 's/(load as any)?\./(load as Record<string, unknown>)?./g' "$f"

  # Pattern 15: (neg?.currentOffer as any) -> (neg?.currentOffer as Record<string, unknown>)
  sed -i '' 's/as any) ||/as Record<string, unknown>) ||/g' "$f"

done

echo "Done. Checking remaining 'as any' count..."
grep -c "as any" server/routers/*.ts | grep -v ":0$" | grep -v futureVision | grep -v "/dispatch\.ts:" | grep -v advancedFinancials | grep -v "/safety\.ts:" | grep -v "/agreements\.ts:" | grep -v "/wallet\.ts:" | grep -v "/messages\.ts:" | grep -v gamification | grep -v dispatchPlanner | grep -v "/pricebook\.ts:" | grep -v dataMigration | grep -v communicationHub | grep -v driverWellness | grep -v "/quotes\.ts:" | grep -v "/location\.ts:" | grep -v emergencyProtocols | grep -v "/stripe\.ts:" | grep -v fscEngine | grep -v allocationTracker | grep -v "/shippers\.ts:" | grep -v documentCenter | grep -v superAdmin
