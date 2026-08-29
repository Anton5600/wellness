import React, { useEffect, useRef } from 'react';

const ITEM_HEIGHT = 44;
const VISIBLE = 5;
const PAD = ITEM_HEIGHT * Math.floor(VISIBLE / 2);

const pad2 = (n: number) => String(n).padStart(2, '0');

interface WheelItem {
  value: number;
  label: string;
}

interface WheelColumnProps {
  items: WheelItem[];
  selected: number;
  onSelect: (value: number) => void;
}

/**
 * Вертикальная «карусель» со скролл-привязкой: пользователь крутит список,
 * значение фиксируется по центральному элементу (плюс тап по строке).
 */
const WheelColumn: React.FC<WheelColumnProps> = ({ items, selected, onSelect }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimer = useRef<number | null>(null);
  const selectedIndex = items.findIndex((i) => i.value === selected);

  // Подкатываем к выбранному элементу при внешнем изменении значения.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || selectedIndex < 0) return;
    el.scrollTo({ top: selectedIndex * ITEM_HEIGHT, behavior: 'smooth' });
  }, [selectedIndex]);

  const commitFromScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const index = Math.round(el.scrollTop / ITEM_HEIGHT);
    const item = items[index];
    if (item && item.value !== selected) onSelect(item.value);
  };

  const handleScroll = () => {
    if (scrollTimer.current) window.clearTimeout(scrollTimer.current);
    scrollTimer.current = window.setTimeout(commitFromScroll, 80);
  };

  useEffect(() => {
    return () => {
      if (scrollTimer.current) window.clearTimeout(scrollTimer.current);
    };
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1f1f1f]"
      style={{ height: ITEM_HEIGHT * VISIBLE, width: 76 }}
    >
      {/* Центральная подсветка выбранного элемента */}
      <div
        className="pointer-events-none absolute inset-x-1 top-1/2 -translate-y-1/2 rounded-lg border-y border-primary/40 bg-primary/10"
        style={{ height: ITEM_HEIGHT }}
      />
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto snap-y snap-mandatory no-scrollbar"
      >
        <div style={{ paddingTop: PAD, paddingBottom: PAD }}>
          {items.map((item) => {
            const isActive = item.value === selected;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onSelect(item.value)}
                className={`block w-full snap-center text-center transition-colors ${
                  isActive
                    ? 'text-forest dark:text-white text-2xl font-extrabold'
                    : 'text-gray-400 dark:text-gray-600 text-lg font-semibold'
                }`}
                style={{ height: ITEM_HEIGHT, lineHeight: `${ITEM_HEIGHT}px` }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface TimeWheelPickerProps {
  value: string; // 'HH:MM'
  onChange: (value: string) => void;
}

/** Выбор времени скроллом: два колеса — часы (0–23) и минуты (шаг 5). */
export const TimeWheelPicker: React.FC<TimeWheelPickerProps> = ({ value, onChange }) => {
  const [hoursStr, minutesStr] = value.split(':');
  const hours = Number(hoursStr) || 0;
  const minutes = Number(minutesStr) || 0;

  const hoursItems: WheelItem[] = Array.from({ length: 24 }, (_, h) => ({
    value: h,
    label: pad2(h),
  }));
  const minutesItems: WheelItem[] = Array.from({ length: 12 }, (_, i) => ({
    value: i * 5,
    label: pad2(i * 5),
  }));

  const handleHours = (h: number) => onChange(`${pad2(h)}:${pad2(minutes)}`);
  const handleMinutes = (m: number) => onChange(`${pad2(hours)}:${pad2(m)}`);

  return (
    <div className="flex items-center justify-center gap-3 select-none">
      <WheelColumn items={hoursItems} selected={hours} onSelect={handleHours} />
      <span className="text-2xl font-extrabold text-forest dark:text-white">:</span>
      <WheelColumn items={minutesItems} selected={minutes} onSelect={handleMinutes} />
    </div>
  );
};

export default TimeWheelPicker;
