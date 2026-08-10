import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { wearableService, BiometricsData, WearableDevice } from '../services/wearableService';

interface WearableWidgetProps {
  onStartBreathing?: (oilName: string) => void;
}

export const WearableWidget: React.FC<WearableWidgetProps> = ({ onStartBreathing }) => {
  const navigate = useNavigate();
  const [device, setDevice] = useState<WearableDevice>(wearableService.getDevice());
  const [metrics, setMetrics] = useState<BiometricsData>(wearableService.getMetrics());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setDevice(wearableService.getDevice());
    setMetrics(wearableService.getMetrics());
  }, []);

  const handleSync = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSyncing(true);
    setTimeout(() => {
      const updated = wearableService.syncMetrics();
      setMetrics(updated);
      setDevice(wearableService.getDevice());
      setIsSyncing(false);
    }, 1200);
  };

  const recommendation = wearableService.getAromaRecommendation(metrics);

  const getStressBadge = (stress: number) => {
    if (stress >= 65) return { label: 'Высокий', bg: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' };
    if (stress >= 45) return { label: 'Умеренный', bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
    return { label: 'Норма', bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
  };

  const stressBadge = getStressBadge(metrics.stressLevel);

  return (
    <div 
      onClick={() => navigate('/wearables')}
      className="bg-white dark:bg-[#1a2d18]/60 backdrop-blur-md rounded-2xl p-4 border border-sage/20 dark:border-white/10 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-forest dark:text-primary">
            <span className="material-symbols-outlined text-lg">watch</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-forest dark:text-white truncate max-w-[170px]">
                {device.connected ? device.name : 'Смарт-часы не подключены'}
              </span>
              {device.connected && (
                <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" title="Подключено"></span>
              )}
            </div>
            <p className="text-[10px] text-sage dark:text-gray-400">
              {device.connected ? `Батарея: ${device.batteryLevel}%` : 'Нажмите для подключения'}
            </p>
          </div>
        </div>

        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center justify-center size-8 rounded-full bg-gray-100 dark:bg-white/10 text-forest dark:text-white hover:bg-primary/20 transition-all active:scale-90"
          title="Синхронизировать данные"
        >
          <span className={`material-symbols-outlined text-base ${isSyncing ? 'animate-spin text-primary' : ''}`}>
            sync
          </span>
        </button>
      </div>

      {/* Biometrics row */}
      {device.connected ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2 bg-gray-50 dark:bg-black/20 p-2.5 rounded-xl border border-gray-100 dark:border-white/5">
            {/* Heart rate */}
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-1 text-red-500">
                <span className="material-symbols-outlined text-sm animate-bounce">favorite</span>
                <span className="text-sm font-extrabold text-forest dark:text-white">{metrics.heartRate}</span>
              </div>
              <span className="text-[9px] text-sage dark:text-gray-400 font-medium">ЧСС (уд/мин)</span>
            </div>

            {/* Stress level */}
            <div className="flex flex-col items-center text-center border-x border-gray-200 dark:border-white/10 px-1">
              <div className="flex items-center gap-1">
                <span className="text-sm font-extrabold text-forest dark:text-white">{metrics.stressLevel}%</span>
              </div>
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${stressBadge.bg}`}>
                {stressBadge.label}
              </span>
            </div>

            {/* HRV */}
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-1 text-sky-500">
                <span className="material-symbols-outlined text-sm">monitoring</span>
                <span className="text-sm font-extrabold text-forest dark:text-white">{metrics.hrv}</span>
              </div>
              <span className="text-[9px] text-sage dark:text-gray-400 font-medium">ВСР (мс)</span>
            </div>
          </div>

          {/* Smart recommendation highlight */}
          <div className="p-2.5 rounded-xl bg-primary/10 dark:bg-primary/20 border border-primary/20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="material-symbols-outlined text-primary text-base shrink-0">spa</span>
              <div className="truncate">
                <p className="text-[11px] font-bold text-forest dark:text-white truncate">
                  Био-рекомендация: {recommendation.primaryOil}
                </p>
                <p className="text-[10px] text-sage dark:text-gray-300 truncate">
                  {recommendation.title}
                </p>
              </div>
            </div>

            <span className="material-symbols-outlined text-sage text-sm group-hover:translate-x-1 transition-transform shrink-0">
              chevron_right
            </span>
          </div>
        </div>
      ) : (
        <div className="py-2 text-center">
          <p className="text-xs text-sage dark:text-gray-300 mb-2">
            Синхронизируйте Xiaomi, Apple Health или Google Health Connect для анализа биомаркеров
          </p>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
            Подключить гаджет
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </span>
        </div>
      )}
    </div>
  );
};
