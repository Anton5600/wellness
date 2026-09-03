import React from 'react';
import { TimeOfDayPattern } from '../services/recommendation/pattern';

interface PatternCardProps {
  /** Наблюдение; undefined → карточка «данных пока мало». */
  pattern?: TimeOfDayPattern;
  /** Число дней ритуала — для честного текста «за N дней». */
  days: number;
  /** Уже применено — показываем подтверждение вместо кнопки. */
  applied?: boolean;
  /** «Попробовать сейчас» — открыть плеер практики напрямую. */
  onTryNow?: (pattern: TimeOfDayPattern) => void;
  /** «Напомнить» — поставить разовое уведомление на время паттерна. */
  onRemind?: (pattern: TimeOfDayPattern) => void;
  onApply?: (pattern: TimeOfDayPattern) => void;
  onDismiss?: (pattern: TimeOfDayPattern) => void;
}

const formatTime = (hour: number, minute: number): string =>
  `${hour}:${String(minute).padStart(2, '0')}`;

/**
 * Карточка наблюдения «Паттерны» — самодостаточная (без отдельного экрана).
 * Два состояния: реальное наблюдение (с действиями) и честное «данных пока мало».
 */
export const PatternCard: React.FC<PatternCardProps> = ({ pattern, days, applied, onTryNow, onRemind, onApply, onDismiss }) => {
  if (!pattern) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-sky-50 dark:from-violet-500/10 dark:to-sky-500/10 border border-violet-200 dark:border-violet-500/30 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-violet-600 dark:text-violet-300 text-lg">monitoring</span>
          <p className="text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">Наблюдения</p>
        </div>
        <p className="text-sm text-forest dark:text-gray-200 leading-relaxed">
          За {days} дней я начал замечать закономерности, но пока их мало для уверенного вывода.
        </p>
        <p className="text-sm text-sage dark:text-gray-300 leading-relaxed mt-2">
          Через 3–5 дней ритуала появится первое наблюдение.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-sky-50 dark:from-violet-500/10 dark:to-sky-500/10 border border-violet-200 dark:border-violet-500/30 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-violet-600 dark:text-violet-300 text-lg">monitoring</span>
        <p className="text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">Наблюдение</p>
      </div>
      <p className="text-sm text-forest dark:text-gray-200 leading-relaxed">«{pattern.statement}»</p>
      <p className="text-sm text-sage dark:text-gray-300 leading-relaxed mt-2">{pattern.suggestion}</p>

      {/* Действия «здесь и сейчас»: запустить практику или поставить напоминание. */}
      {(onTryNow || onRemind) && (
        <div className="flex flex-wrap gap-2 mt-3">
          {onTryNow && (
            <button
              onClick={() => onTryNow(pattern)}
              className="px-3 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 active:scale-[0.98] transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">play_arrow</span>
              Попробовать сейчас
            </button>
          )}
          {onRemind && (
            <button
              onClick={() => onRemind(pattern)}
              className="px-3 py-2 rounded-xl text-xs font-bold text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-500/40 hover:bg-violet-100 dark:hover:bg-violet-500/10 active:scale-[0.98] transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">notifications</span>
              Напомнить в {formatTime(pattern.reminder.hour, pattern.reminder.minute)}
            </button>
          )}
        </div>
      )}

      {applied ? (
        <p className="mt-3 text-xs font-bold text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-base">check_circle</span>
          Учтено в рекомендациях
        </p>
      ) : (
        <div className="flex flex-wrap gap-2 mt-3">
          {onApply && (
            <button
              onClick={() => onApply(pattern)}
              className="px-3 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 active:scale-[0.98] transition-all"
            >
              Учесть в рекомендациях
            </button>
          )}
          {onDismiss && (
            <button
              onClick={() => onDismiss(pattern)}
              className="px-3 py-2 rounded-xl text-xs font-bold text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-500/40 hover:bg-violet-100 dark:hover:bg-violet-500/10 active:scale-[0.98] transition-all"
            >
              Не показывать
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PatternCard;
