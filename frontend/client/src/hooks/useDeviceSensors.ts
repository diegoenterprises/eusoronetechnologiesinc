/**
 * useDeviceSensors — Device orientation & motion sensors for GPS fallback
 * 
 * Reads magnetometer (compass heading), accelerometer, and gyroscope
 * via the DeviceOrientation and DeviceMotion Web APIs.
 * Used as a fallback when GPS is unavailable (tunnels, parking garages, etc.)
 * to estimate heading and detect movement for dead-reckoning.
 */

import { useState, useEffect, useRef, useCallback } from "react";

export interface SensorData {
  // Magnetometer / compass
  compassHeading: number | null; // 0-360 degrees, 0=North
  // Accelerometer (m/s²)
  accelX: number | null;
  accelY: number | null;
  accelZ: number | null;
  // Gyroscope (deg/s)
  gyroAlpha: number | null; // z-axis rotation
  gyroBeta: number | null;  // x-axis rotation
  gyroGamma: number | null; // y-axis rotation
  // Derived
  isMoving: boolean;
  movementConfidence: number; // 0-1
  estimatedSpeedMps: number | null; // rough speed estimate from accelerometer
  // Status
  available: boolean;
  permissionGranted: boolean;
  error: string | null;
}

const ACCEL_MOVEMENT_THRESHOLD = 1.5; // m/s² above gravity noise
const SMOOTHING_FACTOR = 0.3; // exponential smoothing

export function useDeviceSensors(enabled: boolean = true) {
  const [sensors, setSensors] = useState<SensorData>({
    compassHeading: null,
    accelX: null, accelY: null, accelZ: null,
    gyroAlpha: null, gyroBeta: null, gyroGamma: null,
    isMoving: false,
    movementConfidence: 0,
    estimatedSpeedMps: null,
    available: false,
    permissionGranted: false,
    error: null,
  });

  const accelHistoryRef = useRef<number[]>([]);
  const smoothedAccelRef = useRef(0);
  const speedEstimateRef = useRef(0);
  const lastTimestampRef = useRef<number>(Date.now());

  const requestPermission = useCallback(async () => {
    // iOS 13+ requires explicit permission
    if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      try {
        const perm = await (DeviceOrientationEvent as any).requestPermission();
        if (perm === "granted") {
          setSensors(prev => ({ ...prev, permissionGranted: true }));
          return true;
        } else {
          setSensors(prev => ({ ...prev, permissionGranted: false, error: "Sensor permission denied" }));
          return false;
        }
      } catch {
        setSensors(prev => ({ ...prev, error: "Failed to request sensor permission" }));
        return false;
      }
    }
    // Non-iOS: permission implicit
    setSensors(prev => ({ ...prev, permissionGranted: true }));
    return true;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const hasOrientation = "DeviceOrientationEvent" in window;
    const hasMotion = "DeviceMotionEvent" in window;

    if (!hasOrientation && !hasMotion) {
      setSensors(prev => ({ ...prev, available: false, error: "Device sensors not available" }));
      return;
    }

    setSensors(prev => ({ ...prev, available: true }));

    // Request permission on iOS
    requestPermission();

    // Orientation handler (magnetometer / compass)
    const handleOrientation = (e: DeviceOrientationEvent) => {
      let heading: number | null = null;

      // webkitCompassHeading for iOS
      if ((e as any).webkitCompassHeading != null) {
        heading = (e as any).webkitCompassHeading;
      } else if (e.alpha != null) {
        // Android: alpha is the compass heading (0-360, but inverted)
        heading = (360 - e.alpha) % 360;
      }

      setSensors(prev => ({
        ...prev,
        compassHeading: heading != null ? Math.round(heading * 10) / 10 : prev.compassHeading,
        gyroAlpha: e.alpha,
        gyroBeta: e.beta,
        gyroGamma: e.gamma,
        permissionGranted: true,
      }));
    };

    // Motion handler (accelerometer)
    const handleMotion = (e: DeviceMotionEvent) => {
      const accel = e.accelerationIncludingGravity;
      if (!accel) return;

      const now = Date.now();
      const dt = (now - lastTimestampRef.current) / 1000; // seconds
      lastTimestampRef.current = now;

      const ax = accel.x ?? 0;
      const ay = accel.y ?? 0;
      const az = accel.z ?? 0;

      // Net acceleration magnitude (subtract ~9.8 gravity)
      const magnitude = Math.sqrt(ax * ax + ay * ay + az * az);
      const netAccel = Math.abs(magnitude - 9.81);

      // Exponential smoothing
      smoothedAccelRef.current = SMOOTHING_FACTOR * netAccel + (1 - SMOOTHING_FACTOR) * smoothedAccelRef.current;

      // Keep history for movement confidence
      accelHistoryRef.current.push(smoothedAccelRef.current);
      if (accelHistoryRef.current.length > 30) accelHistoryRef.current.shift();

      // Movement detection
      const isMoving = smoothedAccelRef.current > ACCEL_MOVEMENT_THRESHOLD;
      const avgAccel = accelHistoryRef.current.reduce((a, b) => a + b, 0) / accelHistoryRef.current.length;
      const movementConfidence = Math.min(1, avgAccel / (ACCEL_MOVEMENT_THRESHOLD * 3));

      // Rough speed estimate via integration (very approximate)
      if (isMoving && dt > 0 && dt < 1) {
        speedEstimateRef.current = Math.max(0, speedEstimateRef.current + netAccel * dt);
        // Decay when below threshold
        if (netAccel < ACCEL_MOVEMENT_THRESHOLD * 0.5) {
          speedEstimateRef.current *= 0.9;
        }
        // Cap at reasonable walking/driving speed
        speedEstimateRef.current = Math.min(speedEstimateRef.current, 40); // ~90mph max
      } else if (!isMoving) {
        speedEstimateRef.current *= 0.8; // decay when stationary
      }

      setSensors(prev => ({
        ...prev,
        accelX: Math.round(ax * 100) / 100,
        accelY: Math.round(ay * 100) / 100,
        accelZ: Math.round(az * 100) / 100,
        isMoving,
        movementConfidence: Math.round(movementConfidence * 100) / 100,
        estimatedSpeedMps: Math.round(speedEstimateRef.current * 10) / 10,
      }));
    };

    window.addEventListener("deviceorientation", handleOrientation, true);
    window.addEventListener("devicemotion", handleMotion, true);

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation, true);
      window.removeEventListener("devicemotion", handleMotion, true);
    };
  }, [enabled, requestPermission]);

  return { sensors, requestPermission };
}
