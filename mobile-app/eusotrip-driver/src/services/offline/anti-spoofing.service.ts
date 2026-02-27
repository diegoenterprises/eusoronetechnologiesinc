// ═══════════════════════════════════════════════════════════════════════════════
// ANTI-SPOOFING SERVICE
// Detects fake/mock GPS locations to prevent driver fraud.
// Runs locally on every GPS update — no internet needed.
// ═══════════════════════════════════════════════════════════════════════════════

interface SpoofCheckResult {
  isMock: boolean;
  flags: string[];
  severity: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface GPSPoint {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy: number;
  speed?: number;
  timestamp: Date;
}

class AntiSpoofingService {
  private readonly MAX_SPEED_MPH = 120; // Flag anything faster than this
  private readonly SUSPICIOUS_ACCURACY_THRESHOLD = 3; // meters
  private readonly MAX_ALTITUDE_CHANGE_PER_HOUR = 5000; // feet

  /**
   * Check a location for signs of spoofing
   */
  checkLocation(
    current: GPSPoint,
    previous: GPSPoint | null
  ): SpoofCheckResult {
    const flags: string[] = [];
    let severity: SpoofCheckResult['severity'] = 'NONE';

    // Check 1: Mock location provider
    // Note: This requires native module to detect. Placeholder for now.
    // In production, use react-native-device-info or similar
    // if (DeviceInfo.isMockLocationEnabled()) {
    //   flags.push('MOCK_LOCATION');
    //   severity = 'CRITICAL';
    // }

    // Check 2: Teleportation (impossible speed)
    if (previous) {
      const timeDiffMs = current.timestamp.getTime() - previous.timestamp.getTime();
      const timeDiffHours = timeDiffMs / (1000 * 60 * 60);

      if (timeDiffHours > 0) {
        const distanceMeters = this.haversineDistance(
          previous.latitude,
          previous.longitude,
          current.latitude,
          current.longitude
        );

        const speedMph = (distanceMeters / 1609.34) / timeDiffHours;

        if (speedMph > this.MAX_SPEED_MPH) {
          flags.push('TELEPORTATION');
          severity = this.maxSeverity(severity, 'HIGH');
        }

        // More aggressive check: > 200mph is definitely spoofing
        if (speedMph > 200) {
          flags.push('TELEPORTATION_CRITICAL');
          severity = 'CRITICAL';
        }
      }
    }

    // Check 3: Suspicious accuracy (too perfect)
    if (current.accuracy < this.SUSPICIOUS_ACCURACY_THRESHOLD) {
      flags.push('SUSPICIOUS_ACCURACY');
      severity = this.maxSeverity(severity, 'MEDIUM');
    }

    // Check 4: Altitude jump
    if (previous && current.altitude !== undefined && previous.altitude !== undefined) {
      const timeDiffMs = current.timestamp.getTime() - previous.timestamp.getTime();
      const timeDiffHours = timeDiffMs / (1000 * 60 * 60);

      if (timeDiffHours > 0) {
        const altitudeChangeFeet = Math.abs(
          (current.altitude - previous.altitude) * 3.28084
        );
        const altitudeChangePerHour = altitudeChangeFeet / timeDiffHours;

        if (altitudeChangePerHour > this.MAX_ALTITUDE_CHANGE_PER_HOUR) {
          flags.push('ALTITUDE_JUMP');
          severity = this.maxSeverity(severity, 'MEDIUM');
        }
      }
    }

    return {
      isMock: severity === 'CRITICAL',
      flags,
      severity,
    };
  }

  private maxSeverity(
    a: SpoofCheckResult['severity'],
    b: SpoofCheckResult['severity']
  ): SpoofCheckResult['severity'] {
    const order: SpoofCheckResult['severity'][] = ['NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    return order.indexOf(a) > order.indexOf(b) ? a : b;
  }

  private haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

export const antiSpoofing = new AntiSpoofingService();
