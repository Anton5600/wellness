import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { compassService } from '../services/compassService';
import {
  determineEntryScenario,
  getGreeting,
  EntryContext,
} from '../services/recommendation/entry';
import { PRACTICE_BY_ID } from '../data/practices';
import { EveningFeedback } from '../types';

const FEEDBACK_OPTIONS: Array<{ value: EveningFeedback; label: string; icon: string }> = [
  { value: 'better', label: 'Помогло', icon: 'thumb_up' },
  { value: 'same', label: 'Так себе', icon: 'remove' },
  { value: 'worse', label: 'Не помогло', icon: 'thumb_down' },
];

/**
 * «Утренний мост» — короткий (≈5 сек) переход «вчера → сегодня» перед ритуалом.
 * Определяет сценарий входа из вчерашнего контекста и мягко подводит к CTA «Как ты сейчас?».
 * Маркер «показан сегодня» ставится на монтировании, чтобы гейт дашборда не зациклился.
 */
const EntryBridgeScreen: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const uid = user?.uid ?? 'guest';

  const [ctx, setCtx] = useState<EntryContext | null>(null);
  const [feedbackSaving, setFeedbackSaving] = useState(false);
  const [feedbackDone, setFeedbackDone] = useState(false);

  useEffect(() => {
    compassService.setCurrentUserId(uid);
    compassService.markBridgeShown();
    let cancelled = false;
    compassService.getEntryContext().then((c) => {
      if (!cancelled) setCtx(c);
    });
    return () => { cancelled = true; };
  }, [uid]);

  if (!ctx) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const decision = determineEntryScenario(ctx);
  const greeting = getGreeting(ctx.timeOfDay, ctx.streak, ctx.yesterday.completed);
  const practice = ctx.yesterday.practiceId ? PRACTICE_BY_ID[ctx.yesterday.practiceId] : undefined;
  const yesterdayDate = compassService.getYesterdayDateStr();

  const saveFeedback = async (value: EveningFeedback) => {
    setFeedbackSaving(true);
    await compassService.saveEveningFeedback(yesterdayDate, value);
    setFeedbackDone(true);
    setFeedbackSaving(false);
  };

  const goToRitual = () => navigate('/');

  const yesterdayCard = (
    <div className="rounded-2xl bg-white dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className="size-10 shrink-0 rounded-full"
          style={{ backgroundColor: ctx.yesterday.color ?? '#98c281' }}
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-sage dark:text-gray-400">Вчера</p>
          <p className="font-bold text-forest dark:text-white truncate">
            {ctx.yesterday.oil ?? 'Ритуал'}
          </p>
        </div>
        {ctx.yesterday.eveningFeedbackDone && (
          <span className="flex items-center gap-1 text-xs font-bold text-primary">
            <span className="material-symbols-outlined text-base">check_circle</span>
            Помогло
          </span>
        )}
      </div>
      {practice && (
        <p className="mt-2 text-xs text-sage dark:text-gray-400">
          Практика: {practice.title}
        </p>
      )}
    </div>
  );

  return (
    <div
      className={`flex min-h-[100dvh] flex-col justify-center px-6 py-10 ${
        decision.warmBackground
          ? 'bg-gradient-to-b from-amber-50 to-background-light dark:from-amber-500/10 dark:to-background-dark'
          : 'bg-background-light dark:bg-background-dark'
      }`}
    >
      <div className="space-y-6">
        <div>
          <p className="text-primary text-xs font-bold uppercase tracking-widest mb-2">Утренний мост</p>
          <h1 className="text-3xl font-extrabold text-forest dark:text-white leading-tight">{greeting}</h1>
        </div>

        {decision.scenario === 'fresh_day' && (
          <>
            {ctx.yesterday.completed ? yesterdayCard : null}
            <div className="rounded-2xl bg-primary/10 dark:bg-primary/5 border border-primary/20 p-4">
              <p className="text-sm text-forest dark:text-gray-200 leading-relaxed">
                Сегодня — новый цвет и новое масло. Одно масло, одна практика.
              </p>
            </div>
          </>
        )}

        {decision.scenario === 'pending_feedback' && (
          <div className="rounded-2xl bg-white dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
            <p className="text-sm font-bold text-forest dark:text-white mb-1">Как сработало вчерашнее масло?</p>
            <p className="text-xs text-sage dark:text-gray-400 mb-4">
              Один ответ — и мы учтём его в следующих рекомендациях.
            </p>
            {!feedbackDone ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {FEEDBACK_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => saveFeedback(opt.value)}
                      disabled={feedbackSaving}
                      className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border font-bold text-xs transition-all border-gray-200 dark:border-gray-700 text-forest dark:text-gray-300 hover:bg-primary/10 active:scale-95 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-lg">{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={goToRitual}
                  disabled={feedbackSaving}
                  className="mt-3 w-full text-center text-xs font-semibold text-sage dark:text-gray-400 underline underline-offset-2 disabled:opacity-50"
                >
                  Пропустить и начать сегодня
                </button>
              </>
            ) : (
              <p className="text-sm text-forest dark:text-gray-200 font-medium">Спасибо! Отзыв учтён.</p>
            )}
          </div>
        )}

        {decision.scenario === 'unfinished_practice' && (
          <div className="rounded-2xl bg-white dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
            <p className="text-sm text-forest dark:text-gray-200 leading-relaxed">
              Вчерашняя практика{ctx.yesterday.oil ? ` «${ctx.yesterday.oil}»` : ''} осталась
              {practice ? ` (${practice.title})` : ''} незавершённой. Это тоже забота о себе.
            </p>
            {practice && (
              <button
                onClick={() => navigate(`/practice/${practice.id}`)}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white bg-primary hover:bg-primary-dark active:scale-[0.98] transition-all"
              >
                <span className="material-symbols-outlined">{practice.icon}</span>
                Завершить вчерашнюю
              </button>
            )}
            <button
              onClick={goToRitual}
              className="mt-2 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-forest dark:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-[0.98] transition-all"
            >
              Начать сегодня заново
            </button>
          </div>
        )}

        {decision.scenario === 'missed_day' && (
          <div className="rounded-2xl bg-white dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800 p-5 shadow-sm space-y-3">
            <p className="text-sm text-forest dark:text-gray-200 leading-relaxed">
              Вчера был выходной — и это нормально.
            </p>
            <p className="text-sm font-bold text-forest dark:text-white">
              Твой стрик: {ctx.streak.current} дн.
              {ctx.missed === 1 ? ' (вчера — пауза)' : ' (пропуск)'}
            </p>
            <p className="text-sm text-sage dark:text-gray-400 leading-relaxed">
              Мы не считаем пропуски. Мы считаем возвращения.
            </p>
          </div>
        )}

        <button
          onClick={goToRitual}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white bg-primary hover:bg-primary-dark active:scale-[0.98] transition-all shadow-md shadow-primary/20"
        >
          <span className="material-symbols-outlined">waving_hand</span>
          Как ты сейчас?
        </button>
      </div>
    </div>
  );
};

export default EntryBridgeScreen;
