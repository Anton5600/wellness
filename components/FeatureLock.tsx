import React from 'react';

interface FeatureLockProps {
  /** Разблокирована ли фича (флаг из getUnlockedFeatures). */
  unlocked: boolean;
  /** Человекочитаемое название фичи. */
  title: string;
  /** День streak, на котором фича открывается. */
  dayRequired: number;
  /** Текущий день подряд у пользователя. */
  currentDay: number;
  children: React.ReactNode;
}

/**
 * Показывает children, если фича открыта, иначе — компактную карточку-заглушку
 * с замком и прогрессом до открытия. Используется для streak-гейтинга
 * (карты/паттерны/каталог/PDF-экспорт).
 */
export const FeatureLock: React.FC<FeatureLockProps> = ({
  unlocked,
  title,
  dayRequired,
  currentDay,
  children,
}) => {
  if (unlocked) return <>{children}</>;

  const progress = Math.min(100, Math.round((currentDay / dayRequired) * 100));

  return (
    <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
      <div className="flex items-start gap-3">
        <div className="size-11 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-sage dark:text-gray-400 text-2xl">lock</span>
        </div>
        <div className="min-w-0">
          <p className="font-bold text-forest dark:text-white">{title}</p>
          <p className="text-xs text-sage dark:text-gray-400 mt-0.5">
            Откроется на {dayRequired} дне непрерывных чекинов. Сейчас у вас {currentDay} дн.
          </p>
          <div className="mt-3 h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-sage dark:text-gray-500 mt-1 font-medium">{progress}% до открытия</p>
        </div>
      </div>
    </div>
  );
};

export default FeatureLock;
