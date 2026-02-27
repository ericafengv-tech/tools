'use client';

import { useEffect } from 'react';
import BMap from './components/BMap';
import AMap from './components/AMap';
import { Button } from '@nextui-org/react';
import { useAppStore } from '@/store';
import MapSwitcher from './components/MapSwitcher';
import CSRWrapper from '@/common/components/CSRWrapper';
import LinePanel from './components/LinePanel';
import Icon from '@/common/components/Icon';
import { useBusLineStore } from './store';
import classNames from 'classnames';

export default function Page() {
    const { amapKey, amapWebKey, bmapKey, usingMap } = useAppStore((state) => ({
        amapKey: state.amapKey,
        amapWebKey: state.amapWebKey,
        bmapKey: state.bmapKey,
        usingMap: state.usingMap,
        setUsingMap: state.setUsingMap,
    }));

    const { mapTheme } = useBusLineStore((state) => ({
        mapTheme: state.mapTheme,
    }));

    const isDark = mapTheme === 'dark';

    useEffect(() => {
        const updateTheme = () => {
            if (isDark) {
                document.body.classList.add('dark-mode');
                document.documentElement.classList.add('dark');
            } else {
                document.body.classList.remove('dark-mode');
                document.documentElement.classList.remove('dark');
            }
        };
        
        const frameId = requestAnimationFrame(updateTheme);
        
        return () => {
            cancelAnimationFrame(frameId);
        };
    }, [isDark]);

    return (
        <main className={classNames(
            'w-full h-full relative flex-1 transition-colors duration-300',
            isDark ? 'bg-zinc-950' : 'bg-gray-100'
        )}>
            {/* 右上角地图切换器 */}
            <div className="absolute z-50 right-4 top-4">
                <MapSwitcher isDisabled={!bmapKey && !amapKey.key} />
            </div>
            
            {/* 左侧线路详情面板 */}
            <div className="absolute z-50 left-4 h-full py-4">
                <LinePanel />
            </div>
            
            {usingMap === 'bmap' && bmapKey ? <BMap jsKey={bmapKey} /> : null}
            {usingMap === 'amap' && amapKey.key && amapKey.securityKey ? (
                <AMap jsKey={amapKey.key} jsSecureKey={amapKey.securityKey} webApiKey={amapWebKey} />
            ) : null}
            
            <CSRWrapper>
                {!bmapKey && !amapKey.key ? (
                    <div className={classNames(
                        'w-full h-full flex justify-center items-center flex-col',
                        isDark ? 'text-zinc-300' : 'text-gray-700'
                    )}>
                        <div className={classNames(
                            'p-8 rounded-2xl backdrop-blur-xl border',
                            isDark 
                                ? 'bg-zinc-900/90 border-zinc-700/60' 
                                : 'bg-white/90 border-gray-200'
                        )}>
                            <Icon
                                icon="material-symbols:map-outline"
                                className={classNames(
                                    'w-16 h-16 mx-auto mb-4',
                                    isDark ? 'text-blue-400' : 'text-blue-500'
                                )}
                            />
                            <p className="text-center mb-6">
                                注册高德/百度地图开发者，点击页面右上角「配置地图密钥」按钮
                                <br />
                                填入应用 JS key & 安全密钥
                            </p>
                            <div className="flex justify-center">
                                <Button
                                    startContent={
                                        <Icon
                                            icon="material-symbols:unknown-document-rounded"
                                            className="w-5 h-5"
                                        />
                                    }
                                    color="primary"
                                    className="font-medium"
                                    onClick={() => {
                                        window.open('/guide/get-key', '_blank');
                                    }}
                                >
                                    查看详细教程及说明
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </CSRWrapper>
        </main>
    );
}
