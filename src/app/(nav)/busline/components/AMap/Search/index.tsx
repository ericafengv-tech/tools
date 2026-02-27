import React, { useEffect, useRef } from 'react';
import { Input, Select, SelectItem } from '@nextui-org/react';
import { Icon } from '@iconify/react/dist/iconify.js';
import classNames from 'classnames';
import { useBusLineStore } from '../../../store';

import styles from './index.module.scss';

interface IProps {
    isMapReady: boolean;
    onSelectedPoi: (poi: AMap.LngLat) => void;
}

const radiusOptions = [
    { value: '200', label: '200米' },
    { value: '300', label: '300米' },
    { value: '500', label: '500米' },
    { value: '800', label: '800米' },
    { value: '1000', label: '1公里' },
    { value: '1500', label: '1.5公里' },
    { value: '2000', label: '2公里' },
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
}

const inputElID = 'amap-search-input';

function SearchBar(props: IProps) {
    const { isMapReady, onSelectedPoi } = props;
    const autoCompleteRef = useRef<AutoCompleteType>();
    const sugListRef = useRef<HTMLDivElement>(null);

    const { queryConfig, setQueryConfig } = useBusLineStore((state) => ({
        queryConfig: state.queryConfig,
        setQueryConfig: state.setQueryConfig,
    }));

    useEffect(() => {
        if (!isMapReady) return;
        autoCompleteRef.current = new (AMap as any).AutoComplete({
            input: inputElID,
            output: sugListRef.current,
        });

        onInteraction();
    }, [isMapReady]);

    const onInteraction = () => {
        autoCompleteRef.current?.on?.('select', (selection) => {
            console.log('select', selection);
            if (selection.poi.location) {
                onSelectedPoi(selection.poi.location);
            }
        });
    };

    const handleRadiusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newRadius = parseInt(e.target.value, 10);
        setQueryConfig({ ...queryConfig, radius: newRadius });
    };

    return (
        <div className="z-50 absolute left-0 right-0 mx-auto top-4 w-[380px]">
            <div className="flex gap-2">
                <Input
                    className="flex-1"
                    color="primary"
                    startContent={<Icon icon="material-symbols:search-rounded" />}
                    id={inputElID}
                    placeholder="输入地址或右键点击地图"
                    size="lg"
                />
                <Select
                    className="w-[120px]"
                    size="lg"
                    color="primary"
                    selectedKeys={[String(queryConfig?.radius || 500)]}
                    onChange={handleRadiusChange}
                    aria-label="搜索半径"
                >
                    {radiusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </Select>
            </div>
            <div
                className={classNames(
                    'w-full bg-white rounded-b-md',
                    styles.sugList,
                )}
                ref={sugListRef}
            ></div>
        </div>
    );
}

export default SearchBar;
