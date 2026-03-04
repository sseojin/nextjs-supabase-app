// Naver Maps API TypeScript declarations

declare namespace naver.maps {
  class LatLng {
    constructor(lat: number, lng: number);
    lat(): number;
    lng(): number;
  }

  class LatLngBounds {
    extend(latlng: LatLng): void;
    getNE(): LatLng;
    getSW(): LatLng;
  }

  class Point {
    constructor(x: number, y: number);
  }

  class Size {
    constructor(width: number, height: number);
  }

  interface MapOptions {
    center?: LatLng;
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  class Map {
    constructor(element: HTMLElement | string, options: MapOptions);
    getCenter(): LatLng;
    getZoom(): number;
    fitBounds(bounds: LatLngBounds): void;
    panToBounds(bounds: LatLngBounds): void;
    setCenter(center: LatLng): void;
    setZoom(zoom: number): void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  interface MarkerOptions {
    position?: LatLng;
    map?: Map | null;
    title?: string;
    icon?: {
      content?: string;
      anchor?: Point;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  class Marker {
    constructor(options: MarkerOptions);
    getPosition(): LatLng;
    setPosition(position: LatLng): void;
    getTitle(): string;
    setTitle(title: string): void;
    setMap(map: Map | null): void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  interface InfoWindowOptions {
    content?: HTMLElement | string;
    position?: LatLng;
    maxWidth?: number;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    anchorSize?: Size;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  class InfoWindow {
    constructor(options: InfoWindowOptions);
    open(map: Map, marker?: Marker): void;
    close(): void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  class Event {
    static addListener(
      target: object,
      eventName: string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handler: (this: any, ...args: any[]) => void,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      thisArg?: any, // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): any;
    static removeListener(id: object): void;
  }
}

declare namespace naver {
  export namespace maps {
    export { Map, LatLng, LatLngBounds, Point, Size, Marker, InfoWindow, Event };
  }
}

interface Window {
  naver?: {
    maps: typeof naver.maps;
  };
}
