'use client';
import React from 'react';
import {
    Button,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
} from '@nextui-org/react';
import { useAppStore } from '@/store';
import { Icon } from '@iconify/react';
import { MapType } from '@/types/map';
import { useBusLineStore } from '../../store';
import classNames from 'classnames';

export default function MapSwitcher(props: { isDisabled: boolean }) {
    const { isDisabled } = props;

    const { usingMap, setUsingMap } = useAppStore((state) => ({
        usingMap: state.usingMap,
        setUsingMap: state.setUsingMap,
    }));

    const { mapTheme } = useBusLineStore((state) => ({
        mapTheme: state.mapTheme,
    }));

    const isDark = mapTheme === 'dark';

    const descriptionsMap: Record<MapType, string> = {
        amap: '推荐使用，可查看线路详细信息',
        bmap: '优化中…',
    };

    const labelsMap: Record<MapType, string> = {
        amap: '高德地图',
        bmap: '百度地图',
    };

    return (
        <Dropdown 
            placement="bottom-end" 
            isDisabled={isDisabled}
            classNames={{
                content: isDark ? 'bg-zinc-800 border border-zinc-700' : '',
            }}
        >
            <DropdownTrigger>
                <Button 
                    isDisabled={isDisabled}
                    variant="flat"
                    className={classNames(
                        'h-10 px-3 rounded-xl backdrop-blur-xl border shadow-lg',
                        isDark 
                            ? 'bg-zinc-900/95 border-zinc-700/60 text-zinc-100 hover:bg-zinc-800' 
                            : 'bg-white/95 border-gray-200 text-gray-900 hover:bg-gray-50'
                    )}
                    startContent={
                        <Icon 
                            icon="material-symbols:map" 
                            className={isDark ? 'text-blue-400' : 'text-blue-500'} 
                        />
                    }
                    endContent={
                        <Icon 
                            icon="material-symbols:arrow-drop-down-rounded" 
                            className={classNames(
                                'text-lg',
                                isDark ? 'text-zinc-400' : 'text-gray-400'
                            )} 
                        />
                    }
                >
                    <span className="text-sm">{labelsMap[usingMap]}</span>
                </Button>
            </DropdownTrigger>
            <DropdownMenu<MapType>
                disallowEmptySelection
                aria-label="选择地图"
                selectedKeys={new Set([usingMap])}
                selectionMode="single"
                onSelectionChange={(sel) => {
                    if (sel !== 'all' && sel.size === 1) {
                        setUsingMap(sel.values().next().value);
                    }
                }}
                className="max-w-[280px]"
                itemClasses={{
                    base: isDark ? 'text-zinc-100 data-[hover=true]:bg-zinc-700' : '',
                    description: isDark ? 'text-zinc-400' : '',
                }}
            >
                {Object.keys(labelsMap).map((_key) => {
                    const key = _key as MapType;
                    return (
                        <DropdownItem
                            key={key}
                            description={descriptionsMap[key]}
                            startContent={
                                <Icon 
                                    icon={key === 'amap' ? 'simple-icons:amap' : 'simple-icons:baidu'} 
                                    className={isDark ? 'text-zinc-400' : 'text-gray-400'}
                                />
                            }
                        >
                            {labelsMap[key]}
                        </DropdownItem>
                    );
                })}
            </DropdownMenu>
        </Dropdown>
    );
}
