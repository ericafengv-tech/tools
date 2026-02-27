'use client';

import { Icon } from '@iconify/react';
import { Button, Tabs, Tab, ScrollShadow } from '@nextui-org/react';
import classNames from 'classnames';
import { useEffect } from 'react';
import { useBusLineStore } from '../../store';

export default function LinePanel() {
    const { selection, setSelectionLine, mapTheme } = useBusLineStore((state) => ({
        selection: state.selectionLine,
        setSelectionLine: state.setSelectionLine,
        mapTheme: state.mapTheme,
    }));

    useEffect(() => {
        if (selection) {
            console.log('selection', selection);
        }
    }, [selection]);

    const handleClose = () => {
        setSelectionLine(undefined);
    };

    const isDark = mapTheme === 'dark';

    return (
        <div
            className={classNames(
                'h-full rounded-2xl shadow-2xl relative transition-all duration-300 backdrop-blur-xl border',
                isDark 
                    ? 'bg-zinc-900/95 border-zinc-700/60' 
                    : 'bg-white/95 border-gray-200',
                {
                    'w-0 overflow-hidden opacity-0': !selection,
                    'w-[300px] opacity-100': selection,
                },
            )}
        >
            <div className="p-4 h-full flex flex-col">
                <Button
                    isIconOnly
                    radius="full"
                    size="sm"
                    variant="flat"
                    className={classNames(
                        'absolute top-3 right-3',
                        isDark 
                            ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200' 
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    )}
                    onClick={handleClose}
                >
                    <Icon icon="material-symbols:close-rounded" className="text-lg" />
                </Button>
                
                <div className="flex items-center gap-2 mb-3">
                    <div className={classNames(
                        'w-8 h-8 rounded-lg flex items-center justify-center',
                        isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                    )}>
                        <Icon 
                            icon="material-symbols:route" 
                            className={isDark ? 'text-blue-400' : 'text-blue-600'} 
                        />
                    </div>
                    <h2 className={classNames(
                        'text-base font-semibold',
                        isDark ? 'text-zinc-100' : 'text-gray-900'
                    )}>线路详情</h2>
                </div>

                {selection && (
                    <ScrollShadow className="flex-grow overflow-auto -mx-1 px-1">
                        <Tabs
                            classNames={{
                                base: 'w-full',
                                tabList: classNames(
                                    'flex-none rounded-lg p-0.5 gap-0',
                                    isDark ? 'bg-zinc-800' : 'bg-gray-100'
                                ),
                                cursor: classNames(
                                    'rounded-md',
                                    isDark ? 'bg-zinc-700' : 'bg-white shadow-sm'
                                ),
                                tab: classNames(
                                    'h-8 text-xs',
                                    isDark ? 'text-zinc-500 data-[selected=true]:text-zinc-100' : 'text-gray-500'
                                ),
                                tabContent: 'group-data-[selected=true]:font-medium',
                            }}
                            size="sm"
                        >
                            {selection.lineData.map((line) => (
                                <Tab key={line.id} title={line.name}>
                                    <div className="space-y-3 mt-3">
                                        <div className={classNames(
                                            'p-3 rounded-xl',
                                            isDark ? 'bg-zinc-800/80' : 'bg-gray-50'
                                        )}>
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div>
                                                    <span className={classNames(
                                                        'text-xs',
                                                        isDark ? 'text-zinc-500' : 'text-gray-400'
                                                    )}>起点</span>
                                                    <p className={classNames(
                                                        'font-medium text-sm mt-0.5',
                                                        isDark ? 'text-zinc-200' : 'text-gray-800'
                                                    )}>{line.start_stop}</p>
                                                </div>
                                                <div>
                                                    <span className={classNames(
                                                        'text-xs',
                                                        isDark ? 'text-zinc-500' : 'text-gray-400'
                                                    )}>终点</span>
                                                    <p className={classNames(
                                                        'font-medium text-sm mt-0.5',
                                                        isDark ? 'text-zinc-200' : 'text-gray-800'
                                                    )}>{line.end_stop}</p>
                                                </div>
                                                <div>
                                                    <span className={classNames(
                                                        'text-xs',
                                                        isDark ? 'text-zinc-500' : 'text-gray-400'
                                                    )}>票价</span>
                                                    <p className={classNames(
                                                        'font-medium text-sm mt-0.5',
                                                        isDark ? 'text-emerald-400' : 'text-emerald-600'
                                                    )}>{line.basic_price}</p>
                                                </div>
                                                <div>
                                                    <span className={classNames(
                                                        'text-xs',
                                                        isDark ? 'text-zinc-500' : 'text-gray-400'
                                                    )}>运营时间</span>
                                                    <p className={classNames(
                                                        'font-medium text-sm mt-0.5',
                                                        isDark ? 'text-zinc-200' : 'text-gray-800'
                                                    )}>
                                                        {line.stime.slice(0, 2)}:{line.stime.slice(2, 4)}-
                                                        {line.etime.slice(0, 2)}:{line.etime.slice(2, 4)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <h3 className={classNames(
                                                'font-medium text-xs mb-2 flex items-center gap-1.5 uppercase tracking-wide',
                                                isDark ? 'text-zinc-500' : 'text-gray-400'
                                            )}>
                                                <Icon icon="material-symbols:location-on" className="text-sm" />
                                                途经站点 ({line.via_stops.length})
                                            </h3>
                                            <ul className="relative ml-1.5">
                                                <div
                                                    className="absolute left-[5px] top-2 w-0.5 h-[calc(100%-16px)] rounded-full opacity-60"
                                                    style={{ backgroundColor: selection.color }}
                                                ></div>
                                                {line.via_stops.map((stop, stopIndex) => (
                                                    <li
                                                        key={stopIndex}
                                                        className="flex items-center py-0.5"
                                                    >
                                                        <span
                                                            className={classNames(
                                                                'w-3 h-3 border-2 rounded-full mr-2 z-10 flex-shrink-0',
                                                                isDark ? 'bg-zinc-900' : 'bg-white'
                                                            )}
                                                            style={{ borderColor: selection.color }}
                                                        ></span>
                                                        <span className={classNames(
                                                            'text-xs',
                                                            isDark ? 'text-zinc-400' : 'text-gray-600'
                                                        )}>{stop.name}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </Tab>
                            ))}
                        </Tabs>
                    </ScrollShadow>
                )}
            </div>
        </div>
    );
}
