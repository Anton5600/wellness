import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavBar from '../components/BottomNavBar';
import { wearableService, BiometricsData, WearableDevice, WearableBrand, AromaBioRecommendation, BioImpactRecord } from '../services/wearableService';
import { AromaBreathingModal } from '../components/AromaBreathingModal';

export const WearablesScreen: React.FC = () => {
  const navigate = useNavigate();
  const [device, setDevice] = useState<WearableDevice>(wearableService.getDevice());
  const [metrics, setMetrics] = useState<BiometricsData>(wearableService.getMetrics());
  const [impactHistory, setImpactHistory] = useState<BioImpactRecord[]>(wearableService.getImpactHistory());
  const [isSyncing, setIsSyncing] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<WearableBrand>(device.brand);

  // Breathing Modal State
  const [isBreathingModalOpen, setIsBreathingModalOpen] = useState(false);
  const [selectedOilForBreathing, setSelectedOilForBreathing] = useState('Лаванда');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setDevice(wearableService.getDevice());
    setMetrics(wearableService.getMetrics());
    setImpactHistory(wearableService.getImpactHistory());
  };

  const handleSyncNow = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const updatedMetrics = wearableService.syncMetrics();
      setMetrics(updatedMetrics);
      setDevice(wearableService.getDevice());
      setIsSyncing(false);
    }, 1200);
  };

  const handleConnectBrand = (brand: WearableBrand) => {
    const newDev = wearableService.connectDevice(brand);
    setDevice(newDev);
    setSelectedBrand(brand);
    setShowConnectModal(false);
    refreshData();
  };

  const handleToggleDisconnect = () => {
    if (device.connected) {
      wearableService.disconnectDevice();
    } else {
      wearableService.connectDevice(device.brand);
    }
    refreshData();
  };

  const recommendation: AromaBioRecommendation = wearableService.getAromaRecommendation(metrics);

  const startBreathingWithOil = (oilName: string) => {
    setSelectedOilForBreathing(oilName);
    setIsBreathingModalOpen(true);
  };

  const handleBreathingFinished = () => {
    // Record measurable improvement from practice
    const beforeStress = metrics.stressLevel;
    const afterStress = Math.max(25, beforeStress - Math.floor(Math.random() * 18 + 12));
    const beforeHR = metrics.heartRate;
    const afterHR = Math.max(60, beforeHR - Math.floor(Math.random() * 8 + 6));

    wearableService.recordImpact(selectedOilForBreathing, beforeStress, afterStress, beforeHR, afterHR, 3);
    refreshData();
    setIsBreathingModalOpen(false);
  };

  const brandsList: { id: WearableBrand; name: string; icon: string; description: string; popular?: boolean }[] = [
    { id: 'xiaomi', name: 'Xiaomi / Mi Fitness / Zepp', icon: 'watch', description: 'Xiaomi Watch S1, Redmi Watch, Smart Band', popular: true },
    { id: 'google', name: 'Google Health Connect', icon: 'health_and_safety', description: 'Единая синхронизация Android Health', popular: true },
    { id: 'apple', name: 'Apple Health (iOS)', icon: 'favorite', description: 'Apple Watch & Zapp', popular: true },
    { id: 'huawei', name: 'Huawei Health', icon: 'watch_later', description: 'Huawei Watch GT / Band', popular: false },
    { id: 'samsung', name: 'Samsung Health', icon: 'vital_signs', description: 'Galaxy Watch 4 / 5 / 6', popular: false },
    { id: 'bluetooth', name: 'Bluetooth HR Sensor', icon: 'bluetooth', description: 'Прямой нагрудный пульсометр BLE', popular: false },
  ];

  const getStressColor = (stress: number) => {
    if (stress >= 65) return { text: 'text-red-500', bg: 'bg-red-500', border: 'border-red-500/30', label: 'Высокий' };
    if (stress >= 45) return { text: 'text-amber-500', bg: 'bg-amber-500', border: 'border-amber-500/30', label: 'Умеренный' };
    return { text: 'text-emerald-500', bg: 'bg-emerald-500', border: 'border-emerald-500/30', label: 'Норма' };
  };

  const stressColor = getStressColor(metrics.stressLevel);

  return (
    <div className="pb-28 bg-background-light dark:bg-background-dark min-h-[100dvh]">
      {/* Header */}
      <header className="p-6 pt-8 bg-white dark:bg-[#1f1f1f] border-b border-gray-100 dark:border-white/10 shadow-sm">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center justify-center size-10 rounded-full bg-gray-100 dark:bg-white/10 text-forest dark:text-white active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-lg font-bold text-forest dark:text-white flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-xl">watch</span>
              Смарт-часы & Гаджеты
            </h1>
            <p className="text-xs text-sage dark:text-gray-400">Биометрическая биообратная связь</p>
          </div>

          <button 
            onClick={handleSyncNow}
            disabled={isSyncing || !device.connected}
            className="flex items-center justify-center size-10 rounded-full bg-primary/10 dark:bg-primary/20 text-forest dark:text-primary active:scale-95 transition-transform disabled:opacity-50"
            title="Синхронизировать"
          >
            <span className={`material-symbols-outlined text-xl ${isSyncing ? 'animate-spin text-primary' : ''}`}>
              sync
            </span>
          </button>
        </div>
      </header>

      <main className="px-6 py-6 space-y-6">
        {/* Active Connected Device Card */}
        <div className="bg-white dark:bg-[#1a2d18]/70 backdrop-blur-md rounded-3xl p-5 border border-sage/20 dark:border-white/10 shadow-md relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="size-14 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-forest dark:text-primary shrink-0">
                <span className="material-symbols-outlined text-3xl">watch</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-forest dark:text-white">
                    {device.connected ? device.name : 'Гаджет не подключен'}
                  </h2>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                    device.connected ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-gray-200 text-gray-600'
                  }`}>
                    <span className={`size-1.5 rounded-full ${device.connected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></span>
                    {device.connected ? 'Подключено' : 'Отключено'}
                  </span>
                  {device.connected && (
                    <span className="text-xs text-sage dark:text-gray-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">battery_charging_full</span>
                      {device.batteryLevel}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowConnectModal(true)}
              className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/10 text-forest dark:text-white text-xs font-bold hover:bg-primary/20 active:scale-95 transition-all"
            >
              Сменить
            </button>
          </div>

          {/* Sync status footer */}
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between text-xs text-sage dark:text-gray-400">
            <span>
              {device.lastSyncedAt 
                ? `Последняя синхронизация: ${new Date(device.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Еще не синхронизировано'}
            </span>

            <button 
              onClick={handleToggleDisconnect}
              className="text-xs text-red-500 hover:underline font-medium"
            >
              {device.connected ? 'Отключить' : 'Подключить'}
            </button>
          </div>
        </div>

        {/* Biometrics Dashboard Grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-forest dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">monitoring</span>
              Текущие биомаркеры организма
            </h3>
            <span className="text-xs text-sage dark:text-gray-400">Данные с часов</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Heart Rate */}
            <div className="bg-white dark:bg-[#1a2d18]/50 p-4 rounded-2xl border border-sage/20 dark:border-white/10 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-sage dark:text-gray-400">Пульс (ЧСС)</span>
                <span className="material-symbols-outlined text-red-500 text-lg animate-pulse">favorite</span>
              </div>
              <div className="my-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-forest dark:text-white">{metrics.heartRate}</span>
                  <span className="text-xs text-sage dark:text-gray-400">уд/мин</span>
                </div>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                  {metrics.heartRate < 80 ? 'В покое (Норма)' : 'Повышенный ритм'}
                </p>
              </div>
            </div>

            {/* Stress Level */}
            <div className="bg-white dark:bg-[#1a2d18]/50 p-4 rounded-2xl border border-sage/20 dark:border-white/10 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-sage dark:text-gray-400">Стресс</span>
                <span className={`material-symbols-outlined text-lg ${stressColor.text}`}>psychology</span>
              </div>
              <div className="my-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-forest dark:text-white">{metrics.stressLevel}%</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${stressColor.border} bg-gray-50 dark:bg-black/30 ${stressColor.text}`}>
                    {stressColor.label}
                  </span>
                </div>
                {/* Visual Stress Scale Bar */}
                <div className="w-full bg-gray-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${stressColor.bg}`} 
                    style={{ width: `${metrics.stressLevel}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* HRV */}
            <div className="bg-white dark:bg-[#1a2d18]/50 p-4 rounded-2xl border border-sage/20 dark:border-white/10 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-sage dark:text-gray-400">ВСР (HRV)</span>
                <span className="material-symbols-outlined text-sky-500 text-lg">graphic_eq</span>
              </div>
              <div className="my-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-forest dark:text-white">{metrics.hrv}</span>
                  <span className="text-xs text-sage dark:text-gray-400">мс</span>
                </div>
                <p className="text-[10px] text-sage dark:text-gray-400 font-medium mt-0.5">
                  Вариабельность ритма
                </p>
              </div>
            </div>

            {/* Sleep */}
            <div className="bg-white dark:bg-[#1a2d18]/50 p-4 rounded-2xl border border-sage/20 dark:border-white/10 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-sage dark:text-gray-400">Сон</span>
                <span className="material-symbols-outlined text-indigo-400 text-lg">bedtime</span>
              </div>
              <div className="my-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-forest dark:text-white">{metrics.sleepHours}</span>
                  <span className="text-xs text-sage dark:text-gray-400">ч</span>
                </div>
                <p className="text-[10px] text-indigo-500 font-bold mt-0.5">
                  Индекс {metrics.sleepScore}/100
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Biofeedback Recommendation Section */}
        <div className="bg-gradient-to-br from-primary/15 via-white to-primary/5 dark:from-primary/20 dark:via-[#1a2d18] dark:to-[#0f1f0e] rounded-3xl p-5 border border-primary/30 shadow-md space-y-4">
          <div className="flex items-center gap-2 text-forest dark:text-white">
            <div className="size-8 rounded-full bg-primary text-forest flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-lg">auto_awesome</span>
            </div>
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-forest dark:text-primary">
                ИИ-БиоаромаАнализ
              </h3>
              <p className="text-xs font-semibold text-forest dark:text-white">
                {recommendation.title}
              </p>
            </div>
          </div>

          <p className="text-xs text-forest/90 dark:text-gray-200 leading-relaxed bg-white/60 dark:bg-black/30 p-3 rounded-2xl border border-primary/20">
            {recommendation.reasoning}
          </p>

          <div className="p-3 bg-white/80 dark:bg-black/40 rounded-2xl border border-primary/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-forest dark:text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">spa</span>
                Рекомендуемое масло:
              </span>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-primary/20 text-forest dark:text-primary">
                {recommendation.primaryOil}
              </span>
            </div>

            <p className="text-xs text-sage dark:text-gray-300">
              {recommendation.breathingTechnique}
            </p>

            <button
              onClick={() => startBreathingWithOil(recommendation.primaryOil)}
              className="w-full mt-2 bg-primary hover:bg-primary/90 text-forest font-bold py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <span className="material-symbols-outlined text-lg">air</span>
              Запустить био-дыхание ({recommendation.recommendedDurationMinutes} мин)
            </button>
          </div>
        </div>

        {/* Bio-Impact Recovery History */}
        <div>
          <h3 className="text-base font-bold text-forest dark:text-white mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">insights</span>
            Динамика био-восстановления
          </h3>

          {impactHistory.length === 0 ? (
            <div className="p-6 text-center bg-white dark:bg-[#1a2d18]/40 rounded-2xl border border-sage/20 dark:border-white/10 text-sage dark:text-gray-400 text-xs">
              Проведите первую сессию арома-дыхания, чтобы увидеть измерение пульса и стресса до и после!
            </div>
          ) : (
            <div className="space-y-2.5">
              {impactHistory.map((rec) => {
                const stressDiff = rec.beforeStress - rec.afterStress;
                const hrDiff = rec.beforeHR - rec.afterHR;

                return (
                  <div key={rec.id} className="bg-white dark:bg-[#1a2d18]/60 p-3.5 rounded-2xl border border-sage/20 dark:border-white/10 flex items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold">
                        <span className="material-symbols-outlined text-lg">spa</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-forest dark:text-white">{rec.oilName}</span>
                          <span className="text-[10px] text-sage dark:text-gray-400">
                            {new Date(rec.timestamp).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-sage dark:text-gray-300 mt-0.5">
                          <span>
                            Стресс: <strong className="text-forest dark:text-white">{rec.beforeStress}% → {rec.afterStress}%</strong>
                          </span>
                          <span>
                            ЧСС: <strong className="text-forest dark:text-white">{rec.beforeHR} → {rec.afterHR}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 block">
                        -{stressDiff}% стресса
                      </span>
                      <span className="text-[10px] text-sage dark:text-gray-400 block">
                        -{hrDiff} уд/мин
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Connect Device Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#1a2d18] w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-white/20 relative">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-white/10">
              <h3 className="text-base font-extrabold text-forest dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">watch</span>
                Выберите экосистему часов
              </h3>
              <button 
                onClick={() => setShowConnectModal(false)}
                className="size-8 rounded-full bg-gray-100 dark:bg-white/10 text-forest dark:text-white flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {brandsList.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => handleConnectBrand(brand.id)}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    device.brand === brand.id && device.connected
                      ? 'border-primary bg-primary/10 dark:bg-primary/20'
                      : 'border-sage/20 dark:border-white/10 bg-gray-50 dark:bg-black/20 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-xl">{brand.icon}</span>
                    <div>
                      <p className="text-xs font-bold text-forest dark:text-white">{brand.name}</p>
                      <p className="text-[10px] text-sage dark:text-gray-400">{brand.description}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-sage text-sm">chevron_right</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Aroma Breathing Practice Modal */}
      <AromaBreathingModal
        isOpen={isBreathingModalOpen}
        onClose={handleBreathingFinished}
        oilName={selectedOilForBreathing}
        practiceText={`Приготовьте 1 каплю эфирного масла ${selectedOilForBreathing}. Нанесите на ладони, разотрите и начните глубокие вдохи. Часы будут отслеживать ваш пульс.`}
      />

      <BottomNavBar />
    </div>
  );
};

export default WearablesScreen;
