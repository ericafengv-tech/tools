import { StateCreator, create } from 'zustand';

export interface LineData {
    id: string;
    path: AMap.LngLat[];
    citycode: string;
    basic_price: string;
    total_price: string;
    stime: string;
    etime: string;
    name: string;
    start_stop: string;
    end_stop: string;
    uicolor: string;
    type?: string;
    via_stops: {
        location: AMap.LngLat;
        id: string;
        name: string;
        sequence: number;
    }[];
}

export interface AMapLineExtData {
    id: string;
    lineData: LineData[];
    index: number;
    color: string;
    transportType?: TransportType;
}

export type TransportType = 'bus' | 'metro' | 'maglev' | 'rail';

export interface TransportConfig {
    bus: boolean;
    metro: boolean;
    maglev: boolean;
    rail: boolean;
}

export interface BikeConfig {
    enabled: boolean;
    maxDistance: number;
}

export type TravelMode = 'transit' | 'driving';

export interface DrivingConfig {
    enabled: boolean;
    duration: number;
    combineMetro: boolean;
    departureTime: string;
    useTraffic: boolean;
    trafficFactor: number;
    autoTrafficFactor: boolean;
}

export interface StoreStates {
    selectionLine?: AMapLineExtData;
    center?: AMap.LngLat | Omit<BMapGL.Point, 'equals'>;
    mapTheme: 'dark' | 'light';

    stations?: (
        | {
              location: AMap.LngLat;
              id: string;
              name: string;
              address: string;
              type: string;
              citycode: string;
          }
        | BMapGL.LocalResultPoi
    )[];

    queryConfig?: {
        radius: number;
    };

    timeFilter?: {
        enabled: boolean;
        departureTime: string;
        duration: number;
    };

    transportConfig: TransportConfig;

    bikeConfig: BikeConfig;

    travelMode: TravelMode;

    drivingConfig: DrivingConfig;

    allLines?: AMapLineExtData[];
}

export interface StoreActions {
    setSelectionLine: (line?: AMapLineExtData) => void;
    setCenter: (poi: AMap.LngLat | Omit<BMapGL.Point, 'equals'>) => void;
    setQueryConfig: (config: StoreStates['queryConfig']) => void;
    setStations: (stations: StoreStates['stations']) => void;
    setTimeFilter: (filter: StoreStates['timeFilter']) => void;
    setAllLines: (lines: StoreStates['allLines']) => void;
    setMapTheme: (theme: StoreStates['mapTheme']) => void;
    setTransportConfig: (config: Partial<TransportConfig>) => void;
    setBikeConfig: (config: Partial<BikeConfig>) => void;
    setTravelMode: (mode: TravelMode) => void;
    setDrivingConfig: (config: Partial<DrivingConfig>) => void;
}

const store: StateCreator<StoreStates & StoreActions> = (set, get) => {
    return {
        selectionLine: undefined,
        mapTheme: 'dark',
        queryConfig: {
            radius: 500,
        },
        timeFilter: {
            enabled: false,
            departureTime: '',
            duration: 30,
        },
        transportConfig: {
            bus: true,
            metro: true,
            maglev: true,
            rail: true,
        },
        bikeConfig: {
            enabled: false,
            maxDistance: 3000,
        },
        travelMode: 'transit',
        drivingConfig: {
            enabled: false,
            duration: 15,
            combineMetro: false,
            departureTime: '',
            useTraffic: true,
            trafficFactor: 1.0,
            autoTrafficFactor: true,
        },
        allLines: [],
        setSelectionLine: (line) => set({ selectionLine: line }),
        setCenter: (poi) => {
            set({ center: poi });
        },
        setQueryConfig: (config) => {
            set({ queryConfig: config });
        },
        setStations: (stations) => {
            set({ stations });
        },
        setTimeFilter: (filter) => {
            set({ timeFilter: filter });
        },
        setAllLines: (lines) => {
            set({ allLines: lines });
        },
        setMapTheme: (theme) => {
            set({ mapTheme: theme });
        },
        setTransportConfig: (config) => {
            set({ transportConfig: { ...get().transportConfig, ...config } });
        },
        setBikeConfig: (config) => {
            set({ bikeConfig: { ...get().bikeConfig, ...config } });
        },
        setTravelMode: (mode) => {
            set({ travelMode: mode });
        },
        setDrivingConfig: (config) => {
            set({ drivingConfig: { ...get().drivingConfig, ...config } });
        },
    };
};

export const useBusLineStore = create<StoreStates & StoreActions>()(store);
