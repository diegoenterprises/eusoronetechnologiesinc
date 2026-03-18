/** Test utilities for EusoTrip backend tests */

export function createMockContext(overrides: Partial<{
  userId: number; role: string; companyId: number; email: string;
}> = {}) {
  return {
    user: {
      id: overrides.userId ?? 1,
      role: overrides.role ?? 'SHIPPER',
      companyId: overrides.companyId ?? 1,
      email: overrides.email ?? 'test@eusotrip.com',
    },
    req: {} as any,
    res: {} as any,
  };
}

export function createMockLoad(overrides: Partial<Record<string, any>> = {}) {
  return {
    id: 1,
    loadNumber: 'LOAD-TEST-001',
    shipperId: 1,
    catalystId: 2,
    driverId: 3,
    status: 'posted',
    rate: '2500.00',
    distance: '500',
    cargoType: 'dry_van',
    hazmatClass: null,
    ...overrides,
  };
}
