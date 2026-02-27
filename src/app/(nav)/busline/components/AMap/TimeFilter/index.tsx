'use client';

import React from 'react';
import { Input, Select, SelectItem, Switch } from '@nextui-org/react';
import { Icon } from '@iconify/react/dist/iconify.js';
import { useBusLineStore } from '../../../store';

const durationOptions = [
    { value: '15', label: '15分钟' },
    { value: '30', label: '30分钟' },
    { value: '45', label: '45分钟' },
    { value: '60', label: '1小时' },
    { value: '90', label: '1.5小时' },
    { value: '120', label: '2小时' },
];

function TimeFilter() {
    const { timeFilter, setTimeFilter } = useBusLineStore((state) => ({
        timeFilter: state.timeFilter,
        setTimeFilter: state.setTimeFilter,
    }));

    const handleEnabledChange = (enabled: boolean) => {
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

    const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setTimeFilter({
            ...timeFilter!,
            duration: parseInt(e.target.value, 10),
        });
    };

    const getCurrentTime = () => {
        const now = new Date();
        return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    };

    return (
        <div className="z-50 absolute right-6 top-16 bg-white rounded-lg shadow-lg p-3 w-[200px]">
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium flex items-center gap-1">
                    <Icon icon="material-symbols:schedule" className="text-lg" />
                    时间筛选
                </span>
                <Switch
                    size="sm"
                    isSelected={timeFilter?.enabled || false}
                    onValueChange={handleEnabledChange}
                />
            </div>
            
            {timeFilter?.enabled && (
                <div className="space-y-2">
                    <Input
                        type="time"
                        label="出发时间"
                        size="sm"
                        value={timeFilter.departureTime}
                        onChange={handleTimeChange}
                        startContent={
                            <Icon icon="material-symbols:departure-board" className="text-gray-400" />
                        }
                    />
                    <Select
                        label="可接受时长"
                        size="sm"
                        selectedKeys={[String(timeFilter.duration)]}
                        onChange={handleDurationChange}
                    >
                        {durationOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </Select>
                    <p className="text-xs text-gray-500 mt-2">
                        高亮显示在 {timeFilter.duration} 分钟内可到达的线路
                    </p>
                </div>
            )}
        </div>
    );
}

export default TimeFilter;
