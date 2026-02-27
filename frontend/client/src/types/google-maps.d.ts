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
    addListener(event: string, handler: (...args: any[]) => void): MapsEventListener;
  }

  class LatLng {
    constructor(lat: number, lng: number);
    lat(): number;
    lng(): number;
  }

  class Marker {
    constructor(options?: MarkerOptions);
    setMap(map: Map | null): void;
    addListener(event: string, handler: (...args: any[]) => void): MapsEventListener;
  }

  class Polyline {
    constructor(options?: PolylineOptions);
    setMap(map: Map | null): void;
  }

  class Circle {
    constructor(options?: CircleOptions);
    setMap(map: Map | null): void;
    addListener(event: string, handler: (...args: any[]) => void): MapsEventListener;
  }

  class Polygon {
    constructor(options?: PolygonOptions);
    setMap(map: Map | null): void;
    addListener(event: string, handler: (...args: any[]) => void): MapsEventListener;
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
    setPosition(latLng: LatLngLiteral | LatLng): void;
    open(map: Map | any, anchor?: any): void;
    close(): void;
  }

  interface MapsEventListener {
    remove(): void;
  }

  interface MapMouseEvent {
    latLng?: LatLng;
  }

  enum SymbolPath {
    CIRCLE = 0,
    FORWARD_CLOSED_ARROW = 1,
    FORWARD_OPEN_ARROW = 2,
    BACKWARD_CLOSED_ARROW = 3,
    BACKWARD_OPEN_ARROW = 4,
  }

  interface Symbol {
    path: SymbolPath | string;
    fillColor?: string;
    fillOpacity?: number;
    strokeColor?: string;
    strokeWeight?: number;
    scale?: number;
    rotation?: number;
    anchor?: Point;
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
    gestureHandling?: string;
    [key: string]: any;
  }

  interface LatLngLiteral {
    lat: number;
    lng: number;
  }

  interface MarkerOptions {
    position?: LatLngLiteral | LatLng;
    map?: Map;
    icon?: string | Icon | Symbol;
    title?: string;
    zIndex?: number;
    [key: string]: any;
  }

  interface PolylineOptions {
    path?: (LatLngLiteral | LatLng)[];
    strokeColor?: string;
    strokeWeight?: number;
    strokeOpacity?: number;
    map?: Map;
    [key: string]: any;
  }

  interface CircleOptions {
    center?: LatLngLiteral | LatLng;
    radius?: number;
    strokeColor?: string;
    strokeWeight?: number;
    strokeOpacity?: number;
    fillColor?: string;
    fillOpacity?: number;
    map?: Map;
    [key: string]: any;
  }

  interface PolygonOptions {
    paths?: (LatLngLiteral | LatLng)[];
    strokeColor?: string;
    strokeWeight?: number;
    fillColor?: string;
    fillOpacity?: number;
    map?: Map;
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
