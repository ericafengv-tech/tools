'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import '@amap/amap-jsapi-types';
import { getRandomColor, loader } from '@/common/utils';
import { LineData, AMapLineExtData, useBusLineStore } from '../../store';
import ControlPanel from './ControlPanel';
import './index.css';

const MINUTES_PER_STOP = 2.5;

const MAP_STYLES = {
    dark: 'amap://styles/dark',
    light: 'amap://styles/normal',
};

enum EBuslineStrokeWeight {
    Normal = 5,
    Hover = 7,
    Selected = 10,
}

interface IProps {
    jsKey: string;
    jsSecureKey?: string;
    webApiKey?: string;
}

type PolylineEventCallback = (event: {
    type: string;
    target: AMap.Polyline;
    pixel: AMap.Pixel;
    lnglat: AMap.LngLat;
}) => void;

enum EBuslineStrokeStyle {
    base,
    hover,
    selected,
}

//0原始，1提示，2突出
function genPolylineOptions(typeCode: EBuslineStrokeStyle) {
    let options: ConstructorParameters<typeof AMap.Polyline>[0];
    switch (typeCode) {
        case EBuslineStrokeStyle.base: {
            options = {
                strokeOpacity: 0.6,
                strokeWeight: EBuslineStrokeWeight.Normal,
                zIndex: 50,
                bubble: false,
            };
            break;
        }
        case EBuslineStrokeStyle.hover: {
            options = {
                isOutline: true,
                outlineColor: 'white',
                strokeOpacity: 0.8,
                strokeWeight: EBuslineStrokeWeight.Hover,
                zIndex: 100,
                bubble: false,
            };
            break;
        }
        case EBuslineStrokeStyle.selected: {
            options = {
                isOutline: true,
                outlineColor: 'white',
                strokeOpacity: 1,
                strokeWeight: EBuslineStrokeWeight.Selected,
                zIndex: 100,
                bubble: false,
            };
            break;
        }
        default: {
            throw new Error('no typeCode in genPolylineOptions');
        }
    }
    return options;
}

function Map(props: IProps) {
    if (!props) {
        return null;
    }
    const { jsKey, jsSecureKey, webApiKey } = props;

    const { center, queryConfig, selectionLine, timeFilter, mapTheme, transportConfig, bikeConfig, travelMode, drivingConfig, setCenter, setSelectionLine, setAllLines } =
        useBusLineStore((state) => ({
            center: state.center as AMap.LngLat,
            queryConfig: state.queryConfig,
            selectionLine: state.selectionLine,
            timeFilter: state.timeFilter,
            mapTheme: state.mapTheme,
            transportConfig: state.transportConfig,
            bikeConfig: state.bikeConfig,
            travelMode: state.travelMode,
            drivingConfig: state.drivingConfig,
            setCenter: state.setCenter,
            setSelectionLine: state.setSelectionLine,
            setAllLines: state.setAllLines,
        }));

    const [isMapReady, setIsMapReady] = useState(false);

    const AMapRef = useRef<typeof AMap>({} as typeof AMap);
    const mapRef = useRef<InstanceType<typeof AMap.Map>>(
        {} as InstanceType<typeof AMap.Map>,
    );
    const selectedRef = useRef<{
        polyline: AMap.Polyline;
        lineData: LineData[];
        lineId: string;
    } | null>(null);

    const onInteraction = useCallback(() => {
        mapRef.current?.on('rightclick', handleClickMap);
    }, []);

    useEffect(() => {
        if (jsSecureKey) {
            window._AMapSecurityConfig = {
                securityJsCode: jsSecureKey,
            };
        }
        if (!jsKey) return;
        loader('amap', {
            key: jsKey, // 申请好的Web端开发者Key，首次调用 load 时必填
            version: '2.0', // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
            plugins: [
                'AMap.PlaceSearch',
                'AMap.LineSearch',
                'AMap.AutoComplete',
                'AMap.Geocoder',
                'AMap.Driving',
            ],
        })
            .then((_AMap: typeof AMap) => {
                AMapRef.current = _AMap;
                mapRef.current = new AMap.Map('container', {
                    viewMode: '2D',
                    zoom: 11,
                    mapStyle: MAP_STYLES[mapTheme],
                });

                setIsMapReady(true);

                onInteraction();
            })
            .catch((e) => {
                console.log(e);
            });

        // initBuslineSearch();

        return clearEventListener;
    }, [jsSecureKey, jsKey, onInteraction]);

    useEffect(() => {
        if (mapRef.current && mapRef.current.setMapStyle) {
            mapRef.current.setMapStyle(MAP_STYLES[mapTheme]);
        }
    }, [mapTheme]);

    const handleRenderBusStation = (
        status: 'complete',
        result: {
            info: 'ok';
            poiList: {
                pois: {
                    location: AMap.LngLat;
                    id: string;
                    name: string;
                    address: string;
                    type: string;
                    citycode: string;
                }[];
            };
        },
    ) => {
        console.log('station search result', result);
        
        // 检查搜索结果是否有效
        if (!result.poiList || !result.poiList.pois || result.poiList.pois.length === 0) {
            console.warn('未找到公交站台，请尝试其他位置或增大搜索半径');
            return;
        }
        
        let busList: string[] = [];
        const cityCode = result.poiList.pois[0].citycode;
        const stationData = result.poiList.pois;

        //遍历站台信息
        stationData.forEach((item, index) => {
            // 在地图上绘制车站
            let formatLines = item.address.split(';');
            busList = busList.concat(formatLines);

            let stationMarker = new AMap.Marker({
                map: mapRef.current,
                position: item.location, //基点位置
                zIndex: 10,
                icon: new AMapRef.current.Icon({
                    image: '/icons/station-icon.png',
                    imageSize: new AMapRef.current.Size(24, 24),
                    // imageOffset: new AMapRef.current.Pixel(0, 0),
                    size: new AMapRef.current.Size(24, 24),
                }),
                offset: new AMap.Pixel(-12, -24),
                title: item.name,
                extData: {
                    index,
                    location: item.location,
                    type: item.type,
                    name: item.name, //站名
                    lines: formatLines, //经停线路
                    // district: `${item.pname}-${item.cityname}-${item.adname}`,
                },
            });

            mapRef.current.add(stationMarker);

            // stationMarker.on('click', showStationInfo);
            // stationMarker.on('touchend', preventSetCenterOnMobile);
        });

        handleSearchBusLine(Array.from(new Set(busList)), cityCode);
        console.log('busList', Array.from(new Set(busList)));

        // busList = C.unique(busList); //公交线路去重
    };

    const polylinesRef = useRef<Record<string, AMap.Polyline>>({});
    const allLinesDataRef = useRef<AMapLineExtData[]>([]);

    const isLineInTimeRange = (lineData: LineData, departureTime: string, duration: number): boolean => {
        if (!departureTime) return true;
        
        const [depHour, depMin] = departureTime.split(':').map(Number);
        const depTimeMinutes = depHour * 60 + depMin;
        
        const stime = lineData.stime;
        const etime = lineData.etime;
        const startHour = parseInt(stime.slice(0, 2), 10);
        const startMin = parseInt(stime.slice(2, 4), 10);
        const endHour = parseInt(etime.slice(0, 2), 10);
        const endMin = parseInt(etime.slice(2, 4), 10);
        
        const startTimeMinutes = startHour * 60 + startMin;
        const endTimeMinutes = endHour * 60 + endMin;
        
        if (depTimeMinutes < startTimeMinutes || depTimeMinutes > endTimeMinutes) {
            return false;
        }
        
        const stopsCount = lineData.via_stops?.length || 0;
        const estimatedTravelTime = stopsCount * MINUTES_PER_STOP;
        
        return estimatedTravelTime <= duration;
    };

    const handleSearchBusLine = (busArr: string[], cityCode: string) => {
        /*搜索公交线路并绘制*/
        const linesearch = new (AMap as any).LineSearch({
            pageIndex: 1,
            city: cityCode,
            pageSize: 100,
            extensions: 'all',
        });

        let promiseList: Promise<{ info: string; lineInfo: LineData[] }>[] = [],
            timeDelay = 0;

        polylinesRef.current = {};
        allLinesDataRef.current = [];

        busArr.forEach((item) => {
            timeDelay += 20;
            promiseList.push(
                new Promise((resolve, reject) => {
                    let iTimer = setTimeout(() => {
                        linesearch.search(
                            item,
                            (
                                status: string,
                                result: { info: string; lineInfo: LineData[] },
                            ) => {
                                if (
                                    status === 'complete' &&
                                    result.info === 'OK'
                                ) {
                                    const lineInfo = result.lineInfo;
                                    const lineColor = lineInfo[0].uicolor
                                        ? `#${lineInfo[0].uicolor}`
                                        : getRandomColor();
                                    const preOptions = {
                                        strokeColor: lineColor,
                                    }

                                    if (lineInfo.length !== 0) {
                                        const lineExtData: AMapLineExtData = {
                                            lineData: lineInfo,
                                            color: lineColor,
                                            index: 0,
                                            id: lineInfo[0].id,
                                        };
                                        const polyline = handleRenderBusline(
                                            lineInfo[0].path,
                                            lineExtData,
                                            0,
                                            preOptions,
                                        );
                                        polylinesRef.current[lineInfo[0].id] = polyline;
                                        allLinesDataRef.current.push(lineExtData);
                                    }

                                    resolve(result);
                                } else {
                                    reject(item);
                                }
                                clearTimeout(iTimer);
                            },
                        );
                    }, timeDelay);
                }),
            );
        });

        Promise.all(promiseList).then(() => {
            setAllLines(allLinesDataRef.current);
        });
    };

    useEffect(() => {
        if (!selectionLine) {
            // reset style
            if (selectedRef.current) {
                selectedRef.current.polyline.setOptions(
                    genPolylineOptions(EBuslineStrokeStyle.base),
                );
                selectedRef.current = null;
            }
        }
    }, [selectionLine]);

    useEffect(() => {
        if (!timeFilter) return;
        if (!polylinesRef.current || Object.keys(polylinesRef.current).length === 0) return;

        Object.entries(polylinesRef.current).forEach(([lineId, polyline]) => {
            if (!polyline || !polyline.getExtData) return;
            
            const extData: AMapLineExtData = polyline.getExtData();
            if (!extData || !extData.lineData || !extData.lineData[0]) return;
            
            const lineData = extData.lineData[0];

            if (timeFilter.enabled && timeFilter.departureTime) {
                const inRange = isLineInTimeRange(lineData, timeFilter.departureTime, timeFilter.duration);
                
                if (inRange) {
                    polyline.setOptions({
                        strokeOpacity: 1,
                        strokeWeight: EBuslineStrokeWeight.Normal + 2,
                    });
                    polyline.setzIndex?.(100);
                } else {
                    polyline.setOptions({
                        strokeOpacity: 0.2,
                        strokeWeight: EBuslineStrokeWeight.Normal - 2,
                    });
                    polyline.setzIndex?.(10);
                }
            } else {
                polyline.setOptions({
                    strokeOpacity: 1,
                    strokeWeight: EBuslineStrokeWeight.Normal,
                });
                polyline.setzIndex?.(50);
            }
        });
    }, [timeFilter?.enabled, timeFilter?.departureTime, timeFilter?.duration]);

    function handleRenderBusline(
        busPath: AMap.LngLat[],
        lineInfo: AMapLineExtData,
        styleCode: EBuslineStrokeStyle,
        preOptions: ConstructorParameters<typeof AMap.Polyline>[0] | undefined,
    ) {
        //绘制乘车的路线
        const busPolyline = new AMap.Polyline({
            //   map: mapRef.current,
            path: busPath,
            strokeColor: preOptions ? preOptions.strokeColor : getRandomColor(), //线颜色
            ...genPolylineOptions(styleCode),
            isOutline: true,
            outlineColor: '#dddddd',
            borderWeight: 0.5,
            lineJoin: 'round', //圆角连接
            lineCap: 'round', //圆角线帽
            cursor: 'pointer',
            showDir: true,
            extData: lineInfo, //线路详情
        });
        mapRef.current.add(busPolyline);

        //选中，明显展示
        busPolyline.on('click', handleClickLine);

        //鼠标滑过，提示划过
        busPolyline.on('mouseover', handleMouseoverLine);
        busPolyline.on('mouseout', handleMouseoutLine);

        return busPolyline;
    }

    const calculateDrivingRadius = (minutes: number) => {
        const avgSpeedKmH = 25;
        return (avgSpeedKmH * 1000 * minutes) / 60;
    };

    const handleRenderMetroStationsForDriving = (
        status: 'complete',
        result: {
            info: 'ok';
            poiList: {
                pois: {
                    location: AMap.LngLat;
                    id: string;
                    name: string;
                    address: string;
                    type: string;
                    citycode: string;
                }[];
            };
        },
    ) => {
        if (!result.poiList || !result.poiList.pois || result.poiList.pois.length === 0) {
            console.warn('未找到地铁站');
            return;
        }
        
        const stationData = result.poiList.pois;
        const cityCode = stationData[0]?.citycode;
        const busList: string[] = [];
        
        stationData.forEach((station) => {
            const stationMarker = new AMapRef.current.Marker({
                position: station.location,
                title: station.name,
                label: {
                    content: station.name,
                    direction: 'top',
                },
            });
            mapRef.current.add(stationMarker);
            
            const match = station.name.match(/\(([^)]+)\)/);
            if (match) {
                const lines = match[1].split(';');
                lines.forEach(lineName => {
                    const trimmedName = lineName.trim();
                    if (trimmedName && !busList.includes(trimmedName)) {
                        busList.push(trimmedName);
                    }
                });
            }
        });
        
        if (busList.length === 0) return;
        
        const lineSearch = new (AMap as any).LineSearch({
            pageIndex: 1,
            city: cityCode,
            pageSize: 100,
            extensions: 'all',
        });
        
        const searchPromises = busList.map((lineName) => {
            return new Promise<void>((resolve) => {
                lineSearch.search(lineName, (lineStatus: string, lineResult: any) => {
                    if (lineStatus === 'complete' && lineResult.lineInfo && lineResult.lineInfo.length > 0) {
                        const lineInfoList = lineResult.lineInfo;
                        lineInfoList.forEach((info: any, index: number) => {
                            if (!info.path || info.path.length === 0) return;
                            
                            const color = '#3b82f6';
                            const lineExtData: AMapLineExtData = {
                                lineData: [info],
                                index,
                                color,
                                id: info.id,
                            };
                            
                            handleRenderBusline(
                                info.path,
                                lineExtData,
                                EBuslineStrokeStyle.base,
                                { strokeColor: color },
                            );
                        });
                    }
                    resolve();
                });
            });
        });
        
        Promise.all(searchPromises).then(() => {
            console.log('Metro lines loaded for driving mode');
        });
    };

    useEffect(() => {
        if (center && mapRef.current && AMapRef.current && AMapRef.current.Pixel && AMapRef.current.Marker) {
            const { radius = 500 } = queryConfig || {};
            console.log('center', center, 'travelMode', travelMode);
            mapRef.current.clearMap();
            mapRef.current.setCenter(center, true, 1000);
            
            if (travelMode === 'transit') {
                const poiTypes: string[] = [];
                if (transportConfig.bus) poiTypes.push('150700');
                if (transportConfig.metro) poiTypes.push('150500');
                if (transportConfig.rail || transportConfig.maglev) poiTypes.push('150600');
                
                if (poiTypes.length === 0) {
                    console.warn('请至少选择一种交通方式');
                    return;
                }
                
                const searchRadius = bikeConfig.enabled 
                    ? Math.max(radius, bikeConfig.maxDistance) 
                    : radius;
                
                const placeSearch = new (AMap as any).PlaceSearch({
                    type: poiTypes.join('|'),
                    pageSize: 100,
                    pageIndex: 1,
                    city: '全国',
                    extensions: 'all',
                });
                placeSearch.searchNearBy(
                    '',
                    center,
                    searchRadius,
                    handleRenderBusStation,
                );
                
                try {
                    const circleColors = mapTheme === 'dark' 
                        ? { fill: '#3b82f6', stroke: '#60a5fa', fillOpacity: 0.15 }
                        : { fill: '#c2dfff', stroke: '#3b82f6', fillOpacity: 0.3 };
                    
                    const radiusCircle = new AMapRef.current.Circle({
                        center,
                        radius,
                        fillOpacity: circleColors.fillOpacity,
                        fillColor: circleColors.fill,
                        strokeWeight: 2,
                        strokeColor: circleColors.stroke,
                    });
                    mapRef.current.add(radiusCircle);
                    
                    if (bikeConfig.enabled) {
                        const bikeCircle = new AMapRef.current.Circle({
                            center,
                            radius: bikeConfig.maxDistance,
                            fillOpacity: mapTheme === 'dark' ? 0.08 : 0.15,
                            fillColor: '#f97316',
                            strokeWeight: 2,
                            strokeColor: '#f97316',
                            strokeStyle: 'dashed',
                        });
                        mapRef.current.add(bikeCircle);
                    }
                    
                    const centerMarker = new AMapRef.current.Marker({
                        position: center,
                        title: '当前位置',
                        icon: new AMapRef.current.Icon({
                            image: '/icons/center-icon.png',
                            imageSize: new AMapRef.current.Size(24, 24),
                            size: new AMapRef.current.Size(24, 24),
                        }),
                    });
                    mapRef.current.add(centerMarker);
                } catch (err) {
                    console.error('Error creating markers:', err);
                }
            } else if (travelMode === 'driving') {
                const getAutoTrafficFactor = (departureTime: string): number => {
                    let hour: number;
                    let dayOfWeek: number;
                    
                    if (departureTime) {
                        const date = new Date(departureTime);
                        hour = date.getHours();
                        dayOfWeek = date.getDay();
                    } else {
                        const now = new Date();
                        hour = now.getHours();
                        dayOfWeek = now.getDay();
                    }
                    
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    
                    if (isWeekend) {
                        if (hour >= 10 && hour < 12) return 0.85;
                        if (hour >= 14 && hour < 18) return 0.80;
                        if (hour >= 18 && hour < 21) return 0.75;
                        return 0.95;
                    }
                    
                    if (hour >= 7 && hour < 8) return 0.55;
                    if (hour >= 8 && hour < 9) return 0.45;
                    if (hour >= 9 && hour < 10) return 0.65;
                    if (hour >= 17 && hour < 18) return 0.50;
                    if (hour >= 18 && hour < 19) return 0.55;
                    if (hour >= 19 && hour < 20) return 0.70;
                    if (hour >= 11 && hour < 14) return 0.80;
                    if (hour >= 14 && hour < 17) return 0.75;
                    if (hour >= 20 && hour < 22) return 0.85;
                    return 0.95;
                };
                
                const effectiveTrafficFactor = drivingConfig.useTraffic
                    ? (drivingConfig.autoTrafficFactor 
                        ? getAutoTrafficFactor(drivingConfig.departureTime)
                        : drivingConfig.trafficFactor)
                    : 1.0;
                
                const effectiveDuration = drivingConfig.duration * effectiveTrafficFactor;
                const targetDurationMinutes = effectiveDuration;
                const estimatedRadius = calculateDrivingRadius(targetDurationMinutes);
                const numDirections = 24;
                
                const useFutureApi = webApiKey && drivingConfig.departureTime && drivingConfig.useTraffic;
                
                console.log('Driving mode:', {
                    useFutureApi,
                    webApiKey: !!webApiKey,
                    departureTime: drivingConfig.departureTime,
                    useTraffic: drivingConfig.useTraffic,
                    autoTrafficFactor: drivingConfig.autoTrafficFactor,
                    effectiveTrafficFactor,
                    originalDuration: drivingConfig.duration,
                    effectiveDuration: targetDurationMinutes,
                });
                
                const centerLng = (center as any).getLng ? (center as any).getLng() : (center as any).lng;
                const centerLat = (center as any).getLat ? (center as any).getLat() : (center as any).lat;
                
                const getDestinationPoint = (
                    cLng: number, 
                    cLat: number, 
                    angle: number, 
                    distance: number
                ): [number, number] => {
                    const rad = (angle * Math.PI) / 180;
                    const latOffset = (distance / 111320) * Math.cos(rad);
                    const lngOffset = (distance / (111320 * Math.cos((cLat * Math.PI) / 180))) * Math.sin(rad);
                    return [cLng + lngOffset, cLat + latOffset];
                };
                
                const drivingCircleColors = mapTheme === 'dark'
                    ? { fill: '#06b6d4', stroke: '#22d3ee', fillOpacity: 0.15 }
                    : { fill: '#cffafe', stroke: '#06b6d4', fillOpacity: 0.3 };
                
                const callFutureEtaApi = async (
                    origin: string,
                    destination: string,
                    firsttime: number
                ): Promise<{ duration: number; distance: number } | null> => {
                    return new Promise((resolve) => {
                        const callbackName = `amap_etd_${Date.now()}_${Math.random().toString(36).slice(2)}`;
                        const timeout = setTimeout(() => {
                            delete (window as any)[callbackName];
                            resolve(null);
                        }, 10000);
                        
                        (window as any)[callbackName] = (data: any) => {
                            clearTimeout(timeout);
                            delete (window as any)[callbackName];
                            const script = document.querySelector(`script[data-callback="${callbackName}"]`);
                            if (script) script.remove();
                            
                            if (data.errcode === 0 && data.data?.paths?.length > 0) {
                                const path = data.data.paths[0];
                                const timeInfos = path.time_infos || [];
                                if (timeInfos.length > 0) {
                                    const duration = timeInfos[0].elements?.[0]?.duration || 0;
                                    resolve({ duration, distance: path.distance || 0 });
                                } else {
                                    resolve({ duration: 0, distance: path.distance || 0 });
                                }
                            } else {
                                console.warn('ETD API error:', data.errmsg || data.errdetail);
                                resolve(null);
                            }
                        };
                        
                        const script = document.createElement('script');
                        script.setAttribute('data-callback', callbackName);
                        const params = new URLSearchParams({
                            key: webApiKey!,
                            origin,
                            destination,
                            firsttime: Math.floor(firsttime / 1000).toString(),
                            interval: '60',
                            count: '1',
                            strategy: '1',
                            callback: callbackName,
                        });
                        script.src = `https://restapi.amap.com/v4/etd/driving?${params.toString()}`;
                        script.onerror = () => {
                            clearTimeout(timeout);
                            delete (window as any)[callbackName];
                            resolve(null);
                        };
                        document.body.appendChild(script);
                    });
                };
                
                try {
                    const centerMarker = new AMapRef.current.Marker({
                        position: center,
                        title: '当前位置',
                        icon: new AMapRef.current.Icon({
                            image: '/icons/center-icon.png',
                            imageSize: new AMapRef.current.Size(24, 24),
                            size: new AMapRef.current.Size(24, 24),
                        }),
                    });
                    mapRef.current.add(centerMarker);
                    
                    const reachablePoints: { point: AMap.LngLat; angle: number }[] = [];
                    const failedAngles: number[] = [];
                    let completedCount = 0;
                    
                    const tempCircle = new AMapRef.current.Circle({
                        center,
                        radius: estimatedRadius,
                        fillOpacity: 0.05,
                        fillColor: drivingCircleColors.fill,
                        strokeWeight: 1,
                        strokeColor: drivingCircleColors.stroke,
                        strokeStyle: 'dashed',
                        strokeOpacity: 0.3,
                    });
                    mapRef.current.add(tempCircle);
                    
                    const loadingText = new AMapRef.current.Text({
                        text: useFutureApi ? '正在通过未来路径规划API计算...' : '正在计算驾车可达范围...',
                        position: center,
                        style: {
                            'background-color': mapTheme === 'dark' ? '#27272a' : '#ffffff',
                            'border': mapTheme === 'dark' ? '1px solid #3f3f46' : '1px solid #e5e7eb',
                            'padding': '8px 16px',
                            'border-radius': '8px',
                            'color': mapTheme === 'dark' ? '#a1a1aa' : '#6b7280',
                            'font-size': '13px',
                        },
                    });
                    mapRef.current.add(loadingText);
                    
                    const drawIsochrone = () => {
                        mapRef.current.remove(tempCircle);
                        mapRef.current.remove(loadingText);
                        
                        console.log('Reachable points:', reachablePoints.length);
                        
                        if (reachablePoints.length < 3) {
                            const fallbackCircle = new AMapRef.current.Circle({
                                center,
                                radius: estimatedRadius,
                                fillOpacity: drivingCircleColors.fillOpacity,
                                fillColor: drivingCircleColors.fill,
                                strokeWeight: 3,
                                strokeColor: drivingCircleColors.stroke,
                            });
                            mapRef.current.add(fallbackCircle);
                            return;
                        }
                        
                        const sortedPoints = [...reachablePoints]
                            .sort((a, b) => a.angle - b.angle)
                            .map(item => item.point);
                        
                        const polygon = new AMapRef.current.Polygon({
                            path: sortedPoints,
                            fillColor: drivingCircleColors.fill,
                            fillOpacity: drivingCircleColors.fillOpacity,
                            strokeColor: drivingCircleColors.stroke,
                            strokeWeight: 3,
                            strokeOpacity: 0.9,
                        });
                        mapRef.current.add(polygon);
                        
                        mapRef.current.setFitView([polygon], false, [50, 50, 50, 50]);
                    };
                    
                    if (useFutureApi) {
                        const departureTimestamp = new Date(drivingConfig.departureTime).getTime();
                        const processWithFutureApi = async () => {
                            let apiCallSuccess = false;
                            
                            for (let i = 0; i < numDirections; i++) {
                                const directionAngle = (360 / numDirections) * i;
                                const dest = getDestinationPoint(
                                    centerLng,
                                    centerLat,
                                    directionAngle,
                                    estimatedRadius * 1.5
                                );
                                
                                const origin = `${centerLng},${centerLat}`;
                                const destination = `${dest[0]},${dest[1]}`;
                                
                                try {
                                    const result = await callFutureEtaApi(origin, destination, departureTimestamp);
                                    
                                    if (result) {
                                        apiCallSuccess = true;
                                        const predictedDuration = result.duration;
                                        const totalDistance = result.distance;
                                        
                                        if (predictedDuration > 0 && totalDistance > 0) {
                                            const avgSpeed = totalDistance / predictedDuration;
                                            const reachableDistance = avgSpeed * targetDurationMinutes;
                                            const reachableDest = getDestinationPoint(
                                                centerLng,
                                                centerLat,
                                                directionAngle,
                                                Math.min(reachableDistance, totalDistance)
                                            );
                                            reachablePoints.push({
                                                point: new AMapRef.current.LngLat(reachableDest[0], reachableDest[1]),
                                                angle: directionAngle,
                                            });
                                        } else {
                                            failedAngles.push(directionAngle);
                                        }
                                    } else {
                                        failedAngles.push(directionAngle);
                                    }
                                } catch (err) {
                                    console.error('ETD API call failed:', err);
                                    failedAngles.push(directionAngle);
                                }
                                
                                completedCount++;
                            }
                            
                            if (!apiCallSuccess) {
                                console.warn('未来路径规划API调用失败，可能需要企业开发者权限');
                                loadingText.setText('API权限不足，回退到本地估算...');
                                await new Promise(r => setTimeout(r, 1500));
                                
                                reachablePoints.length = 0;
                                failedAngles.length = 0;
                                completedCount = 0;
                                await fallbackToJsApi();
                                return;
                            }
                            
                            failedAngles.forEach(failedAngle => {
                                const fallbackDest = getDestinationPoint(
                                    centerLng,
                                    centerLat,
                                    failedAngle,
                                    estimatedRadius * 0.7
                                );
                                reachablePoints.push({
                                    point: new AMapRef.current.LngLat(fallbackDest[0], fallbackDest[1]),
                                    angle: failedAngle,
                                });
                            });
                            
                            drawIsochrone();
                            
                            if (drivingConfig.combineMetro && reachablePoints.length > 0) {
                                let maxDist = 0;
                                reachablePoints.forEach(item => {
                                    const dist = (center as any).distance(item.point);
                                    if (dist > maxDist) maxDist = dist;
                                });
                                
                                const metroSearch = new (AMap as any).PlaceSearch({
                                    type: '150500',
                                    pageSize: 50,
                                    pageIndex: 1,
                                    city: '全国',
                                    extensions: 'all',
                                });
                                metroSearch.searchNearBy(
                                    '',
                                    center,
                                    maxDist,
                                    handleRenderMetroStationsForDriving,
                                );
                            }
                        };
                        
                        const fallbackToJsApi = async () => {
                            const drivingPolicy = drivingConfig.useTraffic ? 4 : 0;
                            const driving = new (AMap as any).Driving({
                                policy: drivingPolicy,
                                extensions: 'all',
                                showTraffic: drivingConfig.useTraffic,
                            });
                            
                            const promises: Promise<void>[] = [];
                            
                            for (let i = 0; i < numDirections; i++) {
                                const directionAngle = (360 / numDirections) * i;
                                const dest = getDestinationPoint(
                                    centerLng,
                                    centerLat,
                                    directionAngle,
                                    estimatedRadius * 1.5
                                );
                                
                                const promise = new Promise<void>((resolve) => {
                                    driving.search(
                                        center,
                                        new AMapRef.current.LngLat(dest[0], dest[1]),
                                        (status: string, result: any) => {
                                            if (status === 'complete' && result.routes?.length > 0) {
                                                const route = result.routes[0];
                                                const steps = route.steps || [];
                                                let accumulatedTime = 0;
                                                let reachablePoint: AMap.LngLat | null = null;
                                                
                                                for (const step of steps) {
                                                    const stepTime = step.time / 60;
                                                    if (accumulatedTime + stepTime <= targetDurationMinutes) {
                                                        accumulatedTime += stepTime;
                                                        if (step.path?.length > 0) {
                                                            reachablePoint = step.path[step.path.length - 1];
                                                        }
                                                    } else {
                                                        if (step.path?.length > 1) {
                                                            const remainingTime = targetDurationMinutes - accumulatedTime;
                                                            const ratio = remainingTime / stepTime;
                                                            const pathIndex = Math.floor(step.path.length * ratio);
                                                            if (pathIndex > 0 && pathIndex < step.path.length) {
                                                                reachablePoint = step.path[pathIndex];
                                                            }
                                                        }
                                                        break;
                                                    }
                                                }
                                                
                                                if (reachablePoint) {
                                                    reachablePoints.push({ point: reachablePoint, angle: directionAngle });
                                                } else {
                                                    failedAngles.push(directionAngle);
                                                }
                                            } else {
                                                failedAngles.push(directionAngle);
                                            }
                                            resolve();
                                        }
                                    );
                                });
                                promises.push(promise);
                            }
                            
                            await Promise.all(promises);
                            
                            failedAngles.forEach(failedAngle => {
                                const fallbackDest = getDestinationPoint(
                                    centerLng,
                                    centerLat,
                                    failedAngle,
                                    estimatedRadius * 0.7
                                );
                                reachablePoints.push({
                                    point: new AMapRef.current.LngLat(fallbackDest[0], fallbackDest[1]),
                                    angle: failedAngle,
                                });
                            });
                            
                            drawIsochrone();
                            
                            if (drivingConfig.combineMetro && reachablePoints.length > 0) {
                                let maxDist = 0;
                                reachablePoints.forEach(item => {
                                    const dist = (center as any).distance(item.point);
                                    if (dist > maxDist) maxDist = dist;
                                });
                                
                                const metroSearch = new (AMap as any).PlaceSearch({
                                    type: '150500',
                                    pageSize: 50,
                                    pageIndex: 1,
                                    city: '全国',
                                    extensions: 'all',
                                });
                                metroSearch.searchNearBy(
                                    '',
                                    center,
                                    maxDist,
                                    handleRenderMetroStationsForDriving,
                                );
                            }
                        };
                        
                        processWithFutureApi();
                    } else {
                        const drivingPolicy = drivingConfig.useTraffic ? 4 : 0;
                        const driving = new (AMap as any).Driving({
                            policy: drivingPolicy,
                            extensions: 'all',
                            showTraffic: drivingConfig.useTraffic,
                        });
                        
                        for (let i = 0; i < numDirections; i++) {
                            const directionAngle = (360 / numDirections) * i;
                            const dest = getDestinationPoint(
                                centerLng,
                                centerLat,
                                directionAngle,
                                estimatedRadius * 1.5
                            );
                            
                            ((currentAngle: number) => {
                                const searchCallback = (status: string, result: any) => {
                                    completedCount++;
                                    
                                    if (status === 'complete' && result.routes?.length > 0) {
                                        const route = result.routes[0];
                                        const steps = route.steps || [];
                                        let accumulatedTime = 0;
                                        let reachablePoint: AMap.LngLat | null = null;
                                        
                                        for (const step of steps) {
                                            const stepTime = step.time / 60;
                                            
                                            if (accumulatedTime + stepTime <= targetDurationMinutes) {
                                                accumulatedTime += stepTime;
                                                if (step.path?.length > 0) {
                                                    reachablePoint = step.path[step.path.length - 1];
                                                }
                                            } else {
                                                if (step.path?.length > 1) {
                                                    const remainingTime = targetDurationMinutes - accumulatedTime;
                                                    const ratio = remainingTime / stepTime;
                                                    const pathIndex = Math.floor(step.path.length * ratio);
                                                    if (pathIndex > 0 && pathIndex < step.path.length) {
                                                        reachablePoint = step.path[pathIndex];
                                                    }
                                                }
                                                break;
                                            }
                                        }
                                        
                                        if (reachablePoint) {
                                            reachablePoints.push({ point: reachablePoint, angle: currentAngle });
                                        } else {
                                            failedAngles.push(currentAngle);
                                        }
                                    } else {
                                        failedAngles.push(currentAngle);
                                    }
                                    
                                    if (completedCount === numDirections) {
                                        failedAngles.forEach(failedAngle => {
                                            const fallbackDest = getDestinationPoint(
                                                centerLng,
                                                centerLat,
                                                failedAngle,
                                                estimatedRadius * 0.7
                                            );
                                            reachablePoints.push({
                                                point: new AMapRef.current.LngLat(fallbackDest[0], fallbackDest[1]),
                                                angle: failedAngle,
                                            });
                                        });
                                        drawIsochrone();
                                        
                                        if (drivingConfig.combineMetro && reachablePoints.length > 0) {
                                            let maxDist = 0;
                                            reachablePoints.forEach(item => {
                                                const dist = (center as any).distance(item.point);
                                                if (dist > maxDist) maxDist = dist;
                                            });
                                            
                                            const metroSearch = new (AMap as any).PlaceSearch({
                                                type: '150500',
                                                pageSize: 50,
                                                pageIndex: 1,
                                                city: '全国',
                                                extensions: 'all',
                                            });
                                            metroSearch.searchNearBy(
                                                '',
                                                center,
                                                maxDist,
                                                handleRenderMetroStationsForDriving,
                                            );
                                        }
                                    }
                                };
                                
                                driving.search(
                                    center,
                                    new AMapRef.current.LngLat(dest[0], dest[1]),
                                    searchCallback
                                );
                            })(directionAngle);
                        }
                    }
                    
                    mapRef.current.setZoom(Math.max(10, 14 - Math.log2(estimatedRadius / 1000)));
                } catch (err) {
                    console.error('Error creating driving isochrone:', err);
                }
            }
        }
    }, [center, queryConfig?.radius, mapTheme, transportConfig, bikeConfig, travelMode, drivingConfig, webApiKey]);

    const handleMouseoutLine: PolylineEventCallback = function (event) {
        console.log(
            'handleMouseoutLine',
            event,
            event.target instanceof AMap.Polyline,
            event.target.getOptions(),
        );
        const extData: AMapLineExtData = event.target.getExtData();
        if (selectedRef.current?.lineId === extData.id) {
            return;
        }
        event.target.setOptions(genPolylineOptions(EBuslineStrokeStyle.base));
        event.target.show();
    };

    const handleMouseoverLine: PolylineEventCallback = function (event) {
        console.log(
            'handleMouseoverLine',
            event,
            event.target instanceof AMap.Polyline,
            event.target.getOptions(),
        );
        const extData: AMapLineExtData = event.target.getExtData();
        if (selectedRef.current?.lineId === extData.id) {
            return;
        }
        event.target.setOptions(genPolylineOptions(EBuslineStrokeStyle.hover));
        // if (
        //     selectedRef.current &&
        //     selectedRef.current.hashCode === event.target.hashCode
        // ) {
        //     return;
        // }
        // event.target.setStrokeWeight(EBuslineStrokeWeight.Hover);
    };

    const handleClickLine: PolylineEventCallback = function (event) {
        console.log(
            'handleClickLine',
            event,
            event.target instanceof AMap.Polyline,
        );
        const data = event.target.getExtData();
        if (selectedRef.current?.lineId === event.target.getExtData().id) {
            // 当前已选中
            return;
        } else if (data.lineData) {
            if (selectedRef.current) {
                selectedRef.current.polyline.setOptions(
                    genPolylineOptions(EBuslineStrokeStyle.base),
                );
            }
            const extData: AMapLineExtData = event.target.getExtData();

            setSelectionLine(extData);

            selectedRef.current = {
                polyline: event.target,
                lineData: extData.lineData,
                lineId: extData.id,
            };
            event.target.setOptions(
                genPolylineOptions(EBuslineStrokeStyle.selected),
            );
        }
    };

    function handleClickMap(event: {
        type: string;
        target: any;
        pixel: AMap.Pixel;
        lnglat: AMap.LngLat;
    }) {
        setCenter(event.lnglat);
    }

    const clearEventListener = () => {
        if (mapRef.current) {
            mapRef.current?.destroy?.();
        }
    };

    const handleSelectPoi = (poi: AMap.LngLat) => {
        setCenter(poi);
    };

    return (
        <div className="amap w-full h-full">
            <div id="container"></div>
            <ControlPanel
                isMapReady={isMapReady}
                onSelectedPoi={handleSelectPoi}
                AMapInstance={AMapRef.current}
            />
        </div>
    );
}

export default Map;
