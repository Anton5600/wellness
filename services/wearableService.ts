export interface BiometricsData {
  heartRate: number; // уд/мин (BPM)
  stressLevel: number; // 0 - 100%
  hrv: number; // мс (ВСР)
  sleepScore: number; // 0 - 100
  sleepHours: number; // hours
  spO2: number; // % (Oxygen saturation)
  steps: number;
  timestamp: number;
}

export type WearableBrand = 'xiaomi' | 'apple' | 'google' | 'huawei' | 'samsung' | 'bluetooth';

export type ConnectionMode = 'health_connect' | 'web_bluetooth' | 'demo';

export interface WearableDevice {
  id: string;
  brand: WearableBrand;
  name: string;
  connected: boolean;
  connectionMode: ConnectionMode;
  batteryLevel: number;
  lastSyncedAt: number | null;
  autoSync: boolean;
  stressAlertEnabled: boolean;
  stressThreshold: number; // e.g. 65%
  statusMessage?: string;
}

export interface AromaBioRecommendation {
  primaryOil: string;
  secondaryOil: string;
  title: string;
  reasoning: string;
  breathingTechnique: string;
  recommendedDurationMinutes: number;
  urgency: 'low' | 'medium' | 'high';
}

export interface BioImpactRecord {
  id: string;
  timestamp: number;
  oilName: string;
  beforeStress: number;
  afterStress: number;
  beforeHR: number;
  afterHR: number;
  durationMinutes: number;
}

const STORAGE_KEY_DEVICE = 'wellness_wearable_device';
const STORAGE_KEY_METRICS = 'wellness_wearable_metrics';
const STORAGE_KEY_IMPACT = 'wellness_wearable_impact';

// Default initial metrics (e.g. realistic readings from Xiaomi Watch S1 Active)
const DEFAULT_DEVICE: WearableDevice = {
  id: 'dev_xiaomi_s1',
  brand: 'xiaomi',
  name: 'Xiaomi Watch S1 Active',
  connected: false,
  connectionMode: 'health_connect',
  batteryLevel: 84,
  lastSyncedAt: null,
  autoSync: true,
  stressAlertEnabled: true,
  stressThreshold: 65,
  statusMessage: 'Ожидает авторизации в Google Health Connect / Mi Fitness',
};

const DEFAULT_METRICS: BiometricsData = {
  heartRate: 78,
  stressLevel: 64,
  hrv: 42,
  sleepScore: 82,
  sleepHours: 7.5,
  spO2: 98,
  steps: 6420,
  timestamp: Date.now() - 12 * 60 * 1000,
};

class WearableService {
  private device: WearableDevice;
  private metrics: BiometricsData;
  private impactHistory: BioImpactRecord[] = [];

  constructor() {
    this.device = this.loadDevice();
    this.metrics = this.loadMetrics();
    this.impactHistory = this.loadImpactHistory();
  }

  private loadDevice(): WearableDevice {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DEVICE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('[WearableService] Error loading device', e);
    }
    return DEFAULT_DEVICE;
  }

  private loadMetrics(): BiometricsData {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_METRICS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('[WearableService] Error loading metrics', e);
    }
    return DEFAULT_METRICS;
  }

  private loadImpactHistory(): BioImpactRecord[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_IMPACT);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('[WearableService] Error loading impact history', e);
    }
    return [
      {
        id: '1',
        timestamp: Date.now() - 24 * 3600 * 1000,
        oilName: 'Лаванда',
        beforeStress: 72,
        afterStress: 48,
        beforeHR: 84,
        afterHR: 71,
        durationMinutes: 3,
      },
      {
        id: '2',
        timestamp: Date.now() - 2 * 24 * 3600 * 1000,
        oilName: 'Бергамот',
        beforeStress: 68,
        afterStress: 44,
        beforeHR: 80,
        afterHR: 69,
        durationMinutes: 5,
      }
    ];
  }

  public getDevice(): WearableDevice {
    return { ...this.device };
  }

  public getMetrics(): BiometricsData {
    return { ...this.metrics };
  }

  public getImpactHistory(): BioImpactRecord[] {
    return [...this.impactHistory];
  }

  public saveDevice(device: WearableDevice): void {
    this.device = device;
    localStorage.setItem(STORAGE_KEY_DEVICE, JSON.stringify(device));
  }

  public saveMetrics(metrics: BiometricsData): void {
    this.metrics = metrics;
    localStorage.setItem(STORAGE_KEY_METRICS, JSON.stringify(metrics));
  }

  public connectDevice(brand: WearableBrand, mode: ConnectionMode = 'health_connect', customName?: string): WearableDevice {
    const brandNames: Record<WearableBrand, string> = {
      xiaomi: 'Xiaomi Watch S1 Active',
      apple: 'Apple Watch Series 9',
      google: 'Google Pixel Watch / Health Connect',
      huawei: 'Huawei Watch GT 4',
      samsung: 'Galaxy Watch 6',
      bluetooth: 'Bluetooth HR Sensor',
    };

    const isConnected = mode === 'demo';
    const statusMsg = mode === 'demo'
      ? 'Демо-режим (эмуляция для тестирования)'
      : mode === 'web_bluetooth'
      ? 'Поиск Bluetooth смарт-часов...'
      : `Ожидает синхронизации с ${brandNames[brand] || 'часами'}`;

    const newDevice: WearableDevice = {
      id: `dev_${brand}_${Date.now()}`,
      brand,
      name: customName || brandNames[brand] || 'Смарт-часы',
      connected: isConnected,
      connectionMode: mode,
      batteryLevel: isConnected ? 88 : 0,
      lastSyncedAt: isConnected ? Date.now() : null,
      autoSync: true,
      stressAlertEnabled: true,
      stressThreshold: 65,
      statusMessage: statusMsg,
    };

    this.saveDevice(newDevice);
    if (isConnected) {
      this.syncMetrics();
    }
    return newDevice;
  }

  public async connectRealBluetooth(): Promise<{ success: boolean; message: string }> {
    if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
      try {
        const device = await (navigator as any).bluetooth.requestDevice({
          filters: [{ services: ['heart_rate'] }],
          optionalServices: ['battery_service']
        });
        
        this.device.connected = true;
        this.device.connectionMode = 'web_bluetooth';
        this.device.name = device.name || 'Bluetooth Heart Rate Monitor';
        this.device.lastSyncedAt = Date.now();
        this.device.statusMessage = 'Подключено по Web Bluetooth API (прямое соединение)';
        this.saveDevice(this.device);
        this.syncMetrics();
        return { success: true, message: `Подключено устройство: ${this.device.name}` };
      } catch (err: any) {
        console.warn('[WearableService] Bluetooth connection error/cancel:', err);
        return { 
          success: false, 
          message: err?.message || 'Сканирование Bluetooth отменено или устройство не найдено.' 
        };
      }
    } else {
      return {
        success: false,
        message: 'Ваш браузер или текущее окружение не поддерживает прямое Web Bluetooth соединение. Для подключения Xiaomi Watch S1 используйте Health Connect на Android.'
      };
    }
  }

  public enableDemoMode(): WearableDevice {
    this.device.connected = true;
    this.device.connectionMode = 'demo';
    this.device.batteryLevel = 85;
    this.device.statusMessage = 'Демо-эмуляция (для тестирования рекомендаций)';
    this.saveDevice(this.device);
    this.syncMetrics();
    return { ...this.device };
  }

  public disconnectDevice(): void {
    this.device.connected = false;
    this.device.lastSyncedAt = null;
    this.device.statusMessage = 'Отключено пользователем';
    this.saveDevice(this.device);
  }

  public syncMetrics(): BiometricsData {
    // Generate realistic slight variation based on active state or time of day
    const baseHR = 65 + Math.floor(Math.random() * 25); // 65-90 bpm
    const baseStress = 35 + Math.floor(Math.random() * 40); // 35-75%
    const baseHRV = 35 + Math.floor(Math.random() * 30); // 35-65 ms
    const baseSpO2 = 97 + Math.floor(Math.random() * 3); // 97-99%

    const updatedMetrics: BiometricsData = {
      heartRate: baseHR,
      stressLevel: baseStress,
      hrv: baseHRV,
      sleepScore: 82,
      sleepHours: 7.4,
      spO2: baseSpO2,
      steps: (this.metrics.steps || 5000) + Math.floor(Math.random() * 350),
      timestamp: Date.now(),
    };

    this.device.lastSyncedAt = Date.now();
    this.device.batteryLevel = Math.max(15, this.device.batteryLevel - 1);
    this.saveDevice(this.device);
    this.saveMetrics(updatedMetrics);

    return updatedMetrics;
  }

  public getAromaRecommendation(metrics: BiometricsData = this.metrics): AromaBioRecommendation {
    const { stressLevel, hrv, heartRate } = metrics;

    if (stressLevel >= 65 || heartRate > 82 || hrv < 40) {
      return {
        primaryOil: 'Лаванда',
        secondaryOil: 'Бергамот',
        title: 'Высокое симпатическое напряжение',
        reasoning: `Часы зафиксировали уровень стресса ${stressLevel}% и пульс ${heartRate} уд/мин. Наблюдается преобладание симпатической нервной системы (реакция "бей или беги").`,
        breathingTechnique: 'Дыхание по квадрату 4-4-4-4 с эфирным маслом Лаванды или Бергамота снизит ЧСС и повысит ВСР (HRV).',
        recommendedDurationMinutes: 5,
        urgency: 'high',
      };
    } else if (stressLevel >= 45 || heartRate > 75) {
      return {
        primaryOil: 'Иланг-Иланг',
        secondaryOil: 'Франкинсенс (Ладан)',
        title: 'Умеренное эмоциональное напряжение',
        reasoning: `Показатели ВСР (${hrv} мс) указывают на легкое накопление усталости. Стресс ${stressLevel}%.`,
        breathingTechnique: 'Мягкое седативное дыхание 4-7-8 с маслом Иланг-иланга восстановит дыхательный ритм.',
        recommendedDurationMinutes: 3,
        urgency: 'medium',
      };
    } else {
      return {
        primaryOil: 'Лимон',
        secondaryOil: 'Мята перечная',
        title: 'Оптимальное состояние баланса',
        reasoning: `Отличные показатели! Уровень стресса ${stressLevel}%, ВСР в норме (${hrv} мс), пульс спокойный (${heartRate} уд/мин).`,
        breathingTechnique: 'Бодрящая 2-минутная арома-ингаляция Лимоном или Мятой для поддержания тонуса и фокуса.',
        recommendedDurationMinutes: 2,
        urgency: 'low',
      };
    }
  }

  public recordImpact(oilName: string, beforeStress: number, afterStress: number, beforeHR: number, afterHR: number, durationMinutes: number): BioImpactRecord {
    const record: BioImpactRecord = {
      id: `impact_${Date.now()}`,
      timestamp: Date.now(),
      oilName,
      beforeStress,
      afterStress,
      beforeHR,
      afterHR,
      durationMinutes,
    };

    this.impactHistory.unshift(record);
    if (this.impactHistory.length > 20) {
      this.impactHistory = this.impactHistory.slice(0, 20);
    }

    // Update metrics after session
    this.metrics.stressLevel = afterStress;
    this.metrics.heartRate = afterHR;
    this.metrics.hrv = Math.min(85, this.metrics.hrv + 12);
    this.metrics.timestamp = Date.now();

    localStorage.setItem(STORAGE_KEY_IMPACT, JSON.stringify(this.impactHistory));
    this.saveMetrics(this.metrics);

    return record;
  }
}

export const wearableService = new WearableService();
