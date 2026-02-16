import { useState, useEffect } from "react";

interface GeoPosition {
  latitude: number;
  longitude: number;
}

/**
 * Browser Geolocation hook — captures lat/lng once on mount,
 * refreshes every 5 minutes. Returns undefined until the first fix.
 */
export function useGeolocation(): GeoPosition | undefined {
  const [pos, setPos] = useState<GeoPosition | undefined>(undefined);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const update = () => {
      navigator.geolocation.getCurrentPosition(
        (p) => setPos({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
        () => {}, // silently ignore denied / unavailable
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
      );
    };

    update();
    const id = setInterval(update, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return pos;
}
