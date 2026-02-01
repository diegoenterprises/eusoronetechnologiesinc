/**
 * EUSOTRIP Load Testing - User Distribution & Behavior
 */

export const USER_DISTRIBUTION = {
  driver_owner_operator: 35,
  driver_company: 25,
  carrier_small: 10,
  carrier_medium: 5,
  carrier_large: 2,
  broker_small: 8,
  broker_large: 3,
  shipper: 7,
  freight_agent: 2,
  factoring: 1,
  lumper: 1,
  escort: 0.5,
  terminal: 0.3,
  admin: 0.2
};

export const ACTIVITY_PATTERNS = {
  0: 0.3, 1: 0.2, 2: 0.15, 3: 0.15, 4: 0.2, 5: 0.4,
  6: 0.7, 7: 0.9, 8: 1.2, 9: 1.3, 10: 1.4, 11: 1.3,
  12: 1.1, 13: 1.2, 14: 1.4, 15: 1.5, 16: 1.4, 17: 1.2,
  18: 0.9, 19: 0.7, 20: 0.6, 21: 0.5, 22: 0.4, 23: 0.35
};

export const DAY_OF_WEEK_PATTERNS = {
  sunday: 0.4, monday: 1.1, tuesday: 1.2, wednesday: 1.2,
  thursday: 1.3, friday: 1.1, saturday: 0.5
};

export function selectUserType() {
  const total = Object.values(USER_DISTRIBUTION).reduce((a, b) => a + b, 0);
  let random = Math.random() * total;
  for (const [type, weight] of Object.entries(USER_DISTRIBUTION)) {
    random -= weight;
    if (random <= 0) return type;
  }
  return 'driver_owner_operator';
}

export function getActivityMultiplier() {
  const hour = new Date().getHours();
  return ACTIVITY_PATTERNS[hour] || 1.0;
}
