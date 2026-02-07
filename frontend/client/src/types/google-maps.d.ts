/// <reference types="google.maps" />

/**
 * Google Maps type declarations for HotZones.tsx
 * The google.maps namespace is loaded via script tag at runtime.
 * Install @types/google.maps for full type coverage if needed.
 */
declare namespace google.maps {
  class Map {
    constructor(element: HTMLElement, options?: MapOptions);
    setOptions(options: MapOptions): void;
    panTo(latLng: LatLng | LatLngLiteral): void;
    setZoom(zoom: number): void;
  }

  class LatLng {
    constructor(lat: number, lng: number);
    lat(): number;
    lng(): number;
  }

  class Marker {
    constructor(options?: MarkerOptions);
    setMap(map: Map | null): void;
    addListener(event: string, handler: (...args: any[]) => void): void;
  }

  class Size {
    constructor(width: number, height: number);
  }

  class Point {
    constructor(x: number, y: number);
  }

  class InfoWindow {
    constructor(options?: any);
    setContent(content: string | HTMLElement): void;
    open(map: Map, anchor?: any): void;
    close(): void;
  }

  interface MapOptions {
    center?: LatLngLiteral;
    zoom?: number;
    styles?: MapTypeStyle[];
    disableDefaultUI?: boolean;
    zoomControl?: boolean;
    mapTypeControl?: boolean;
    streetViewControl?: boolean;
    fullscreenControl?: boolean;
    backgroundColor?: string;
    [key: string]: any;
  }

  interface LatLngLiteral {
    lat: number;
    lng: number;
  }

  interface MarkerOptions {
    position?: LatLngLiteral | LatLng;
    map?: Map;
    icon?: string | Icon;
    title?: string;
    zIndex?: number;
    [key: string]: any;
  }

  interface Icon {
    url: string;
    scaledSize?: Size;
    anchor?: Point;
  }

  interface MapTypeStyle {
    elementType?: string;
    featureType?: string;
    stylers: { [key: string]: any }[];
  }

  namespace visualization {
    class HeatmapLayer {
      constructor(options?: HeatmapLayerOptions);
      setMap(map: Map | null): void;
      setData(data: WeightedLocation[]): void;
      set(key: string, value: any): void;
    }

    interface HeatmapLayerOptions {
      data?: WeightedLocation[];
      map?: Map;
      gradient?: string[];
      radius?: number;
      opacity?: number;
    }

    interface WeightedLocation {
      location: LatLng;
      weight: number;
    }
  }

  namespace marker {
    class AdvancedMarkerElement {
      setMap(map: Map | null): void;
    }
  }
}
