'use client';

import React, { useEffect, useRef, useState } from 'react';
import { 
    Button,
    Tooltip,
} from '@nextui-org/react';
import { Icon } from '@iconify/react/dist/iconify.js';
import classNames from 'classnames';
import { useBusLineStore, TransportType, TravelMode } from '../../../store';
import styles from './index.module.scss';

interface IProps {
    isMapReady: boolean;
    onSelectedPoi: (poi: AMap.LngLat) => void;
    AMapInstance?: typeof AMap;
}

const radiusOptions = [
    { value: 200, label: '200米' },
    { value: 300, label: '300米' },
    { value: 500, label: '500米' },
    { value: 800, label: '800米' },
    { value: 1000, label: '1公里' },
    { value: 1500, label: '1.5公里' },
    { value: 2000, label: '2公里' },
];

const durationOptions = [
    { value: 15, label: '15分钟' },
    { value: 30, label: '30分钟' },
    { value: 45, label: '45分钟' },
    { value: 60, label: '1小时' },
    { value: 90, label: '1.5小时' },
    { value: 120, label: '2小时' },
];

const drivingDurationOptions = [
    { value: 5, label: '5分钟' },
    { value: 10, label: '10分钟' },
    { value: 15, label: '15分钟' },
    { value: 20, label: '20分钟' },
    { value: 30, label: '30分钟' },
    { value: 45, label: '45分钟' },
    { value: 60, label: '1小时' },
];

const transportOptions: { key: TransportType; label: string; icon: string; color: string }[] = [
    { key: 'bus', label: '公交', icon: 'material-symbols:directions-bus', color: 'emerald' },
    { key: 'metro', label: '地铁', icon: 'material-symbols:subway', color: 'blue' },
    { key: 'rail', label: '轻轨/市域', icon: 'material-symbols:train', color: 'purple' },
    { key: 'maglev', label: '磁悬浮', icon: 'material-symbols:airline-seat-recline-extra', color: 'rose' },
];

const bikeDistanceOptions = [
    { value: 1000, label: '1公里' },
    { value: 2000, label: '2公里' },
    { value: 3000, label: '3公里' },
    { value: 5000, label: '5公里' },
];

const travelModeOptions: { key: TravelMode; label: string; icon: string }[] = [
    { key: 'transit', label: '公共交通', icon: 'material-symbols:directions-transit' },
    { key: 'driving', label: '驾车', icon: 'material-symbols:directions-car' },
];

interface AutoCompleteType {
    on: (
        type: 'select' | 'choose',
        callback: (event: {
            poi: {
                id: string;
                name: string;
                adcode: string;
                district: string;
                location: AMap.LngLat;
                typecode: string;
            };
        }) => void,
    ) => void;
    search: (keyword: string, callback: (status: string, result: any) => void) => void;
}

const inputElID = 'amap-search-input';

function ControlPanel(props: IProps) {
    const { isMapReady, onSelectedPoi, AMapInstance } = props;
    const autoCompleteRef = useRef<AutoCompleteType>();
    const sugListRef = useRef<HTMLDivElement>(null);
    const [searchValue, setSearchValue] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [showSettings, setShowSettings] = useState(true);
    
    const AMapObj = AMapInstance || (typeof AMap !== 'undefined' ? AMap : null);

    const { 
        queryConfig, 
        setQueryConfig, 
        timeFilter, 
        setTimeFilter,
        mapTheme,
        setMapTheme,
        transportConfig,
        setTransportConfig,
        bikeConfig,
        setBikeConfig,
        travelMode,
        setTravelMode,
        drivingConfig,
        setDrivingConfig,
    } = useBusLineStore((state) => ({
        queryConfig: state.queryConfig,
        setQueryConfig: state.setQueryConfig,
        timeFilter: state.timeFilter,
        setTimeFilter: state.setTimeFilter,
        mapTheme: state.mapTheme,
        setMapTheme: state.setMapTheme,
        transportConfig: state.transportConfig,
        setTransportConfig: state.setTransportConfig,
        bikeConfig: state.bikeConfig,
        setBikeConfig: state.setBikeConfig,
        travelMode: state.travelMode,
        setTravelMode: state.setTravelMode,
        drivingConfig: state.drivingConfig,
        setDrivingConfig: state.setDrivingConfig,
    }));
    

    const isDark = mapTheme === 'dark';

    useEffect(() => {
        if (!isMapReady || !AMapObj) return;
        
        try {
            autoCompleteRef.current = new (AMapObj as any).AutoComplete({
                input: inputElID,
                output: sugListRef.current,
            });

            autoCompleteRef.current?.on?.('select', (selection) => {
                if (selection.poi.location) {
                    setSearchValue(selection.poi.name);
                    onSelectedPoi(selection.poi.location);
                }
            });
        } catch (err) {
            console.error('AutoComplete init error:', err);
        }
    }, [isMapReady, AMapObj]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchValue.trim()) {
            handleSearch();
        }
    };

    const handleSearch = () => {
        if (!searchValue.trim() || isSearching) return;
        
        if (!AMapObj) {
            console.error('AMap not loaded');
            return;
        }
        
        setIsSearching(true);
        
        try {
            const placeSearch = new (AMapObj as any).PlaceSearch({
                city: '全国',
                citylimit: false,
                pageSize: 1,
                extensions: 'base',
            });
            
            placeSearch.search(searchValue.trim(), (status: string, result: any) => {
                console.log('PlaceSearch result:', status, result);
                if (status === 'complete' && result.poiList?.pois?.length > 0) {
                    const poi = result.poiList.pois[0];
                    if (poi.location) {
                        onSelectedPoi(poi.location);
                        setSearchValue(poi.name);
                    }
                    setIsSearching(false);
                } else {
                    const geocoder = new (AMapObj as any).Geocoder();
                    geocoder.getLocation(searchValue.trim(), (geoStatus: string, geoResult: any) => {
                        console.log('Geocoder result:', geoStatus, geoResult);
                        if (geoStatus === 'complete' && geoResult.geocodes?.length > 0) {
                            const location = geoResult.geocodes[0].location;
                            onSelectedPoi(location);
                        } else {
                            console.warn('未找到该地址，请尝试更详细的地址');
                        }
                        setIsSearching(false);
                    });
                }
            });
        } catch (err) {
            console.error('Search error:', err);
            setIsSearching(false);
        }
    };

    const handleTimeEnabledChange = (enabled: boolean) => {
        setTimeFilter({
            ...timeFilter!,
            enabled,
            departureTime: enabled && !timeFilter?.departureTime 
                ? getCurrentTime() 
                : timeFilter?.departureTime || '',
        });
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTimeFilter({
            ...timeFilter!,
            departureTime: e.target.value,
        });
    };

    const getCurrentTime = () => {
        const now = new Date();
        return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    };

    const toggleTheme = () => {
        setMapTheme(isDark ? 'light' : 'dark');
    };

    const currentRadius = queryConfig?.radius || 500;
    const currentDuration = timeFilter?.duration || 30;

    const cardClass = classNames(
        'backdrop-blur-xl rounded-2xl shadow-2xl border transition-all duration-300',
        isDark 
            ? 'bg-zinc-900/95 border-zinc-700/60' 
            : 'bg-white/95 border-gray-200'
    );

    return (
        <div className={classNames(
            'z-50 absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center',
            isDark ? 'dark' : ''
        )}>
            {/* 搜索栏卡片 */}
            <div className={classNames(cardClass, 'p-3')}>
                <div className="flex items-center gap-2">
                    {/* 搜索框 */}
                    <div className="relative">
                        <div className={classNames(
                            'flex items-center h-11 rounded-xl border px-3 gap-2 w-[280px] transition-colors',
                            isDark 
                                ? 'bg-zinc-800 border-zinc-600 focus-within:border-blue-500' 
                                : 'bg-gray-50 border-gray-200 focus-within:border-blue-500'
                        )}>
                            <Icon 
                                icon="material-symbols:location-on" 
                                className={classNames(
                                    'text-lg flex-shrink-0',
                                    isDark ? 'text-blue-400' : 'text-blue-500'
                                )} 
                            />
                            <input
                                id={inputElID}
                                type="text"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="输入地址搜索"
                                className={classNames(
                                    'flex-1 bg-transparent outline-none text-sm min-w-0',
                                    isDark 
                                        ? 'text-zinc-100 placeholder:text-zinc-500' 
                                        : 'text-gray-900 placeholder:text-gray-400'
                                )}
                            />
                            {searchValue && (
                                <button
                                    onClick={() => setSearchValue('')}
                                    className={classNames(
                                        'flex-shrink-0 p-1 rounded hover:bg-black/10',
                                        isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-gray-400 hover:text-gray-600'
                                    )}
                                >
                                    <Icon icon="material-symbols:close" className="text-base" />
                                </button>
                            )}
                        </div>
                        <div
                            className={classNames(
                                'absolute top-full left-0 w-full z-[9999]',
                                isDark ? styles.sugListDark : styles.sugListLight,
                            )}
                            ref={sugListRef}
                        ></div>
                    </div>

                    {/* 搜索按钮 */}
                    <Button
                        className={classNames(
                            'h-11 px-4 rounded-xl font-medium min-w-0',
                            isDark 
                                ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                        )}
                        onPress={handleSearch}
                        isLoading={isSearching}
                        isIconOnly={isSearching}
                    >
                        {isSearching ? null : <Icon icon="material-symbols:search" className="text-lg" />}
                    </Button>

                    <div className={classNames('w-px h-7', isDark ? 'bg-zinc-700' : 'bg-gray-200')} />

                    {/* 时间筛选开关 - 仅在公共交通模式下显示 */}
                    {travelMode === 'transit' && (
                        <Tooltip content="时间筛选" placement="bottom" classNames={{ content: isDark ? 'bg-zinc-700 text-zinc-100' : '' }}>
                            <Button
                                isIconOnly
                                variant={timeFilter?.enabled ? 'solid' : 'flat'}
                                className={classNames(
                                    'h-11 w-11 rounded-xl min-w-0',
                                    timeFilter?.enabled 
                                        ? 'bg-amber-500 text-white' 
                                        : isDark 
                                            ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' 
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                )}
                                onPress={() => handleTimeEnabledChange(!timeFilter?.enabled)}
                            >
                                <Icon icon="material-symbols:schedule" className="text-xl" />
                            </Button>
                        </Tooltip>
                    )}

                    {/* 设置展开/折叠 */}
                    <Tooltip content={showSettings ? '收起设置' : '展开设置'} placement="bottom" classNames={{ content: isDark ? 'bg-zinc-700 text-zinc-100' : '' }}>
                        <Button
                            isIconOnly
                            variant="flat"
                            className={classNames(
                                'h-11 w-11 rounded-xl min-w-0',
                                showSettings
                                    ? isDark ? 'bg-zinc-700 text-zinc-200' : 'bg-gray-200 text-gray-700'
                                    : isDark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            )}
                            onPress={() => setShowSettings(!showSettings)}
                        >
                            <Icon icon={showSettings ? 'material-symbols:expand-less' : 'material-symbols:tune'} className="text-xl" />
                        </Button>
                    </Tooltip>

                    {/* 主题切换 */}
                    <Tooltip content={isDark ? '浅色模式' : '深色模式'} placement="bottom" classNames={{ content: isDark ? 'bg-zinc-700 text-zinc-100' : '' }}>
                        <Button
                            isIconOnly
                            variant="flat"
                            className={classNames(
                                'h-11 w-11 rounded-xl min-w-0',
                                isDark 
                                    ? 'bg-zinc-800 hover:bg-zinc-700 text-amber-400' 
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                            )}
                            onPress={toggleTheme}
                        >
                            <Icon icon={isDark ? 'material-symbols:light-mode' : 'material-symbols:dark-mode'} className="text-xl" />
                        </Button>
                    </Tooltip>
                </div>
            </div>

            {/* 设置选项卡片 */}
            {showSettings && (
                <div className={classNames(cardClass, 'p-3 mt-2')}>
                    {/* 出行方式切换 */}
                    <div className="flex items-center gap-2 mb-3">
                        <span className={classNames('text-xs flex-shrink-0', isDark ? 'text-zinc-500' : 'text-gray-400')}>
                            方式
                        </span>
                        <div className={classNames(
                            'flex rounded-lg p-0.5',
                            isDark ? 'bg-zinc-800' : 'bg-gray-100'
                        )}>
                            {travelModeOptions.map((option) => (
                                <button
                                    key={option.key}
                                    onClick={() => setTravelMode(option.key)}
                                    className={classNames(
                                        'px-3 py-1.5 text-xs rounded-md transition-all flex items-center gap-1.5 font-medium',
                                        travelMode === option.key
                                            ? isDark 
                                                ? 'bg-blue-600 text-white shadow-lg' 
                                                : 'bg-white text-blue-600 shadow-md'
                                            : isDark
                                                ? 'text-zinc-400 hover:text-zinc-200'
                                                : 'text-gray-500 hover:text-gray-700'
                                    )}
                                >
                                    <Icon icon={option.icon} className="text-base" />
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 公共交通模式设置 */}
                    {travelMode === 'transit' && (
                        <>
                            {/* 交通方式 + 骑行接驳 */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={classNames('text-xs flex-shrink-0', isDark ? 'text-zinc-500' : 'text-gray-400')}>
                                    交通
                                </span>
                                {transportOptions.map((option) => {
                                    const isActive = transportConfig[option.key];
                                    const colorMap: Record<string, string> = {
                                        emerald: 'bg-emerald-600 text-white',
                                        blue: 'bg-blue-600 text-white',
                                        purple: 'bg-purple-600 text-white',
                                        rose: 'bg-rose-600 text-white',
                                    };
                                    return (
                                        <button
                                            key={option.key}
                                            onClick={() => setTransportConfig({ [option.key]: !isActive })}
                                            className={classNames(
                                                'px-2 py-1 text-xs rounded-lg transition-all flex items-center gap-1',
                                                isActive
                                                    ? colorMap[option.color]
                                                    : isDark
                                                        ? 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                                                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                            )}
                                        >
                                            <Icon icon={option.icon} className="text-sm" />
                                            {option.label}
                                        </button>
                                    );
                                })}
                                
                                <div className={classNames('w-px h-5', isDark ? 'bg-zinc-700' : 'bg-gray-200')} />
                                
                                <button
                                    onClick={() => setBikeConfig({ enabled: !bikeConfig.enabled })}
                                    className={classNames(
                                        'px-2 py-1 text-xs rounded-lg transition-all flex items-center gap-1',
                                        bikeConfig.enabled
                                            ? 'bg-orange-500 text-white'
                                            : isDark
                                                ? 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                    )}
                                >
                                    <Icon icon="material-symbols:pedal-bike" className="text-sm" />
                                    骑行接驳
                                </button>
                            </div>

                            {/* 步行范围 */}
                            <div className={classNames('flex items-center gap-2 flex-wrap mt-2 pt-2 border-t', isDark ? 'border-zinc-800' : 'border-gray-100')}>
                                <span className={classNames('text-xs flex-shrink-0', isDark ? 'text-zinc-500' : 'text-gray-400')}>
                                    <Icon icon="material-symbols:directions-walk" className="inline mr-0.5 text-emerald-500" />
                                    步行
                                </span>
                                {radiusOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setQueryConfig({ ...queryConfig, radius: option.value })}
                                        className={classNames(
                                            'px-2 py-1 text-xs rounded-md transition-colors',
                                            currentRadius === option.value
                                                ? isDark ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white'
                                                : isDark
                                                    ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                        )}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>

                            {/* 骑行距离 */}
                            {bikeConfig.enabled && (
                                <div className={classNames('flex items-center gap-2 flex-wrap mt-2 pt-2 border-t', isDark ? 'border-zinc-800' : 'border-gray-100')}>
                                    <span className={classNames('text-xs flex-shrink-0', isDark ? 'text-zinc-500' : 'text-gray-400')}>
                                        <Icon icon="material-symbols:pedal-bike" className="inline mr-0.5 text-orange-500" />
                                        骑行
                                    </span>
                                    {bikeDistanceOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => setBikeConfig({ maxDistance: option.value })}
                                            className={classNames(
                                                'px-2 py-1 text-xs rounded-md transition-colors',
                                                bikeConfig.maxDistance === option.value
                                                    ? isDark ? 'bg-orange-600 text-white' : 'bg-orange-500 text-white'
                                                    : isDark
                                                        ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                            )}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* 时间筛选面板 */}
                            {timeFilter?.enabled && (
                                <div className={classNames('mt-2 pt-2 border-t', isDark ? 'border-zinc-800' : 'border-gray-100')}>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <div className="flex items-center gap-1.5">
                                            <span className={classNames('text-xs', isDark ? 'text-zinc-500' : 'text-gray-400')}>
                                                <Icon icon="material-symbols:departure-board" className="inline mr-0.5 text-amber-500" />
                                                出发
                                            </span>
                                            <input
                                                type="time"
                                                className={classNames(
                                                    'h-8 px-2 rounded-lg border text-xs outline-none transition-colors w-[100px]',
                                                    isDark 
                                                        ? 'bg-zinc-800 border-zinc-700 text-zinc-100 focus:border-blue-500' 
                                                        : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'
                                                )}
                                                value={timeFilter.departureTime}
                                                onChange={handleTimeChange}
                                            />
                                        </div>
                                        
                                        <div className="flex items-center gap-1.5">
                                            <span className={classNames('text-xs', isDark ? 'text-zinc-500' : 'text-gray-400')}>
                                                <Icon icon="material-symbols:timer" className="inline mr-0.5 text-violet-500" />
                                                时长
                                            </span>
                                            {durationOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => setTimeFilter({ ...timeFilter!, duration: option.value })}
                                                    className={classNames(
                                                        'px-2 py-1 text-xs rounded-md transition-colors whitespace-nowrap',
                                                        currentDuration === option.value
                                                            ? isDark ? 'bg-violet-600 text-white' : 'bg-violet-500 text-white'
                                                            : isDark
                                                                ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                    )}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* 驾车模式设置 */}
                    {travelMode === 'driving' && (
                        <>
                            {/* 出发时间和交通状况 */}
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                    <span className={classNames('text-xs', isDark ? 'text-zinc-500' : 'text-gray-400')}>
                                        <Icon icon="material-symbols:schedule" className="inline mr-0.5 text-amber-500" />
                                        出发
                                    </span>
                                    <input
                                        type="datetime-local"
                                        className={classNames(
                                            'h-8 px-2 rounded-lg border text-xs outline-none transition-colors w-[165px]',
                                            isDark 
                                                ? 'bg-zinc-800 border-zinc-700 text-zinc-100 focus:border-blue-500' 
                                                : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'
                                        )}
                                        value={drivingConfig.departureTime}
                                        onChange={(e) => setDrivingConfig({ departureTime: e.target.value })}
                                        min={new Date().toISOString().slice(0, 16)}
                                    />
                                    {drivingConfig.departureTime && (
                                        <button
                                            onClick={() => setDrivingConfig({ departureTime: '' })}
                                            className={classNames(
                                                'p-1 rounded text-xs',
                                                isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-gray-400 hover:text-gray-600'
                                            )}
                                        >
                                            <Icon icon="material-symbols:close" className="text-sm" />
                                        </button>
                                    )}
                                </div>
                                
                                <button
                                    onClick={() => setDrivingConfig({ useTraffic: !drivingConfig.useTraffic })}
                                    className={classNames(
                                        'px-2 py-1 text-xs rounded-lg transition-all flex items-center gap-1',
                                        drivingConfig.useTraffic
                                            ? 'bg-red-500 text-white'
                                            : isDark
                                                ? 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                    )}
                                >
                                    <Icon icon="material-symbols:traffic" className="text-sm" />
                                    考虑拥堵
                                </button>
                            </div>

                            {/* 驾车时长选择 */}
                            <div className={classNames('flex items-center gap-2 flex-wrap mt-2 pt-2 border-t', isDark ? 'border-zinc-800' : 'border-gray-100')}>
                                <span className={classNames('text-xs flex-shrink-0', isDark ? 'text-zinc-500' : 'text-gray-400')}>
                                    <Icon icon="material-symbols:timer" className="inline mr-0.5 text-cyan-500" />
                                    时长
                                </span>
                                {drivingDurationOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setDrivingConfig({ duration: option.value })}
                                        className={classNames(
                                            'px-2 py-1 text-xs rounded-md transition-colors',
                                            drivingConfig.duration === option.value
                                                ? isDark ? 'bg-cyan-600 text-white' : 'bg-cyan-500 text-white'
                                                : isDark
                                                    ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                        )}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>

                            {/* 驾车+地铁组合 */}
                            <div className={classNames('flex items-center gap-2 flex-wrap mt-2 pt-2 border-t', isDark ? 'border-zinc-800' : 'border-gray-100')}>
                                <span className={classNames('text-xs flex-shrink-0', isDark ? 'text-zinc-500' : 'text-gray-400')}>
                                    组合
                                </span>
                                <button
                                    onClick={() => setDrivingConfig({ combineMetro: !drivingConfig.combineMetro })}
                                    className={classNames(
                                        'px-2.5 py-1.5 text-xs rounded-lg transition-all flex items-center gap-1.5',
                                        drivingConfig.combineMetro
                                            ? 'bg-blue-600 text-white'
                                            : isDark
                                                ? 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                    )}
                                >
                                    <Icon icon="material-symbols:directions-car" className="text-sm" />
                                    <span>+</span>
                                    <Icon icon="material-symbols:subway" className="text-sm" />
                                    驾车+地铁
                                </button>
                                <span className={classNames('text-xs', isDark ? 'text-zinc-600' : 'text-gray-400')}>
                                    开车到地铁站后换乘地铁
                                </span>
                            </div>
                            
                            {/* 拥堵系数调节 - 仅在开启考虑拥堵时显示 */}
                            {drivingConfig.useTraffic && (
                                <div className={classNames('mt-2 pt-2 border-t', isDark ? 'border-zinc-800' : 'border-gray-100')}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={classNames('text-xs', isDark ? 'text-zinc-500' : 'text-gray-400')}>
                                            <Icon icon="material-symbols:speed" className="inline mr-0.5 text-orange-500" />
                                            拥堵系数
                                        </span>
                                        <button
                                            onClick={() => setDrivingConfig({ autoTrafficFactor: !drivingConfig.autoTrafficFactor })}
                                            className={classNames(
                                                'px-2 py-0.5 text-xs rounded transition-colors',
                                                drivingConfig.autoTrafficFactor
                                                    ? isDark ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white'
                                                    : isDark
                                                        ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                            )}
                                        >
                                            {drivingConfig.autoTrafficFactor ? '自动' : '手动'}
                                        </button>
                                    </div>
                                    
                                    {drivingConfig.autoTrafficFactor ? (
                                        <div className={classNames('text-xs p-2 rounded-lg', isDark ? 'bg-zinc-800/50' : 'bg-gray-50')}>
                                            {(() => {
                                                const getAutoFactor = () => {
                                                    let hour: number;
                                                    let dayOfWeek: number;
                                                    if (drivingConfig.departureTime) {
                                                        const date = new Date(drivingConfig.departureTime);
                                                        hour = date.getHours();
                                                        dayOfWeek = date.getDay();
                                                    } else {
                                                        const now = new Date();
                                                        hour = now.getHours();
                                                        dayOfWeek = now.getDay();
                                                    }
                                                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                                                    
                                                    if (isWeekend) {
                                                        if (hour >= 10 && hour < 12) return { factor: 0.85, level: '周末上午', color: 'yellow' };
                                                        if (hour >= 14 && hour < 18) return { factor: 0.80, level: '周末下午', color: 'yellow' };
                                                        if (hour >= 18 && hour < 21) return { factor: 0.75, level: '周末傍晚', color: 'orange' };
                                                        return { factor: 0.95, level: '周末畅通', color: 'green' };
                                                    }
                                                    
                                                    if (hour >= 7 && hour < 8) return { factor: 0.55, level: '早高峰前段', color: 'red' };
                                                    if (hour >= 8 && hour < 9) return { factor: 0.45, level: '早高峰高峰', color: 'red' };
                                                    if (hour >= 9 && hour < 10) return { factor: 0.65, level: '早高峰尾段', color: 'orange' };
                                                    if (hour >= 17 && hour < 18) return { factor: 0.50, level: '晚高峰高峰', color: 'red' };
                                                    if (hour >= 18 && hour < 19) return { factor: 0.55, level: '晚高峰中段', color: 'red' };
                                                    if (hour >= 19 && hour < 20) return { factor: 0.70, level: '晚高峰尾段', color: 'orange' };
                                                    if (hour >= 11 && hour < 14) return { factor: 0.80, level: '午间平峰', color: 'yellow' };
                                                    if (hour >= 14 && hour < 17) return { factor: 0.75, level: '下午平峰', color: 'yellow' };
                                                    if (hour >= 20 && hour < 22) return { factor: 0.85, level: '晚间', color: 'green' };
                                                    return { factor: 0.95, level: '夜间畅通', color: 'green' };
                                                };
                                                
                                                const info = getAutoFactor();
                                                const effectiveDuration = Math.round(drivingConfig.duration * info.factor);
                                                const colorMap: Record<string, string> = {
                                                    red: isDark ? 'text-red-400' : 'text-red-500',
                                                    orange: isDark ? 'text-orange-400' : 'text-orange-500',
                                                    yellow: isDark ? 'text-yellow-400' : 'text-yellow-600',
                                                    green: isDark ? 'text-green-400' : 'text-green-600',
                                                };
                                                
                                                return (
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className={colorMap[info.color]}>{info.level}</span>
                                                            <span className={isDark ? 'text-zinc-500' : 'text-gray-400'}>
                                                                速度 ×{Math.round(info.factor * 100)}%
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className={isDark ? 'text-zinc-400' : 'text-gray-500'}>实际可达 </span>
                                                            <span className={isDark ? 'text-cyan-400' : 'text-cyan-600'}>{effectiveDuration}分钟</span>
                                                            <span className={isDark ? 'text-zinc-500' : 'text-gray-400'}> 车程</span>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <input
                                                type="range"
                                                min="0.3"
                                                max="1.0"
                                                step="0.05"
                                                value={drivingConfig.trafficFactor}
                                                onChange={(e) => setDrivingConfig({ trafficFactor: parseFloat(e.target.value) })}
                                                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                                style={{
                                                    background: isDark 
                                                        ? `linear-gradient(to right, #ef4444 0%, #f97316 30%, #eab308 60%, #22c55e 100%)`
                                                        : `linear-gradient(to right, #ef4444 0%, #f97316 30%, #eab308 60%, #22c55e 100%)`,
                                                }}
                                            />
                                            <div className="flex justify-between text-xs">
                                                <span className={isDark ? 'text-red-400' : 'text-red-500'}>严重拥堵</span>
                                                <span className={classNames(
                                                    'font-medium',
                                                    drivingConfig.trafficFactor < 0.5 ? (isDark ? 'text-red-400' : 'text-red-500') :
                                                    drivingConfig.trafficFactor < 0.7 ? (isDark ? 'text-orange-400' : 'text-orange-500') :
                                                    drivingConfig.trafficFactor < 0.85 ? (isDark ? 'text-yellow-400' : 'text-yellow-600') :
                                                    (isDark ? 'text-green-400' : 'text-green-600')
                                                )}>
                                                    {Math.round(drivingConfig.trafficFactor * 100)}%
                                                    <span className={isDark ? 'text-zinc-500' : 'text-gray-400'}> → </span>
                                                    {Math.round(drivingConfig.duration * drivingConfig.trafficFactor)}分钟
                                                </span>
                                                <span className={isDark ? 'text-green-400' : 'text-green-600'}>畅通</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 提示信息 */}
                            <div className={classNames('mt-3 pt-2 border-t text-xs', isDark ? 'border-zinc-800 text-zinc-500' : 'border-gray-100 text-gray-400')}>
                                <Icon icon="material-symbols:info" className="inline mr-1" />
                                {drivingConfig.departureTime ? (
                                    <>
                                        预计 <span className={isDark ? 'text-amber-400' : 'text-amber-600'}>
                                            {new Date(drivingConfig.departureTime).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span> 出发
                                    </>
                                ) : '当前时间出发'}
                                {drivingConfig.combineMetro && (
                                    <>，可换乘<span className={isDark ? 'text-blue-400' : 'text-blue-600'}>地铁</span></>
                                )}
                                {!drivingConfig.useTraffic && (
                                    <span className={isDark ? 'text-zinc-600' : 'text-gray-400'}>（理想路况）</span>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default ControlPanel;
