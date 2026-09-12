import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  shouldEngagePull,
  pullOffsetFor,
  isRefreshTriggered,
  pullLabel,
} from '../services/pullGesture';

/**
 * Жест «потянуть вниз для обновления», как в соцсетях.
 *
 * Оборачивает содержимое экрана и по протяжке вниз от начала списка запускает
 * `onRefresh`. Слушатели touch вешаются нативно (`passive: false`): через проп
 * `onTouchMove` в React 17+ событие помечено как пассивное, и `preventDefault`
 * не сработал бы — тогда жест уходил бы в нативную прокрутку и в собственную
 * «потяни-чтобы-обновить» самого Chrome.
 *
 * Поддерживаются оба варианта прокрутки: экраны со скроллом окна (дашборд) и
 * экраны с внутренним `overflow-y-auto` — ближайший прокручиваемый предок
 * ищется на `touchstart`.
 */
interface PullToRefreshProps {
  onRefresh: () => Promise<unknown> | unknown;
  children: React.ReactNode;
}

/** Ближайший прокручиваемый предок или null, если прокручивается само окно. */
const findScroller = (node: EventTarget | null): HTMLElement | null => {
  let el = node instanceof Element ? (node as HTMLElement) : null;
  while (el && el !== document.body) {
    const overflowY = window.getComputedStyle(el).overflowY;
    if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
      return el;
    }
    el = el.parentElement;
  }
  return null;
};

const isAtTop = (scroller: HTMLElement | null): boolean =>
  scroller
    ? scroller.scrollTop <= 0
    : (window.scrollY || document.documentElement.scrollTop || 0) <= 0;

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [pull, setPull] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Жест и состояние держим в ref: слушатели вешаются один раз и не должны
  // пересоздаваться на каждое движение пальца.
  const gesture = useRef({ startX: 0, startY: 0, engaged: false, scroller: null as HTMLElement | null });
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const reset = useCallback(() => {
    gesture.current.engaged = false;
    pullRef.current = 0;
    setPull(0);
    setDragging(false);
  }, []);

  const trigger = useCallback(async () => {
    refreshingRef.current = true;
    setRefreshing(true);
    setPull(0);
    const startedAt = Date.now();
    try {
      await onRefreshRef.current();
    } catch (e) {
      console.warn('[PullToRefresh] обновление не удалось:', e);
    }
    // Держим индикатор минимальное время, иначе на быстрой сети он мигает.
    const elapsed = Date.now() - startedAt;
    if (elapsed < 500) await new Promise((r) => setTimeout(r, 500 - elapsed));
    refreshingRef.current = false;
    setRefreshing(false);
    reset();
  }, [reset]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const onTouchStart = (e: TouchEvent) => {
      if (refreshingRef.current || e.touches.length !== 1) return;
      const touch = e.touches[0];
      gesture.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        engaged: false,
        scroller: findScroller(e.target),
      };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (refreshingRef.current || e.touches.length !== 1) return;
      const g = gesture.current;
      const touch = e.touches[0];
      const dx = touch.clientX - g.startX;
      const dy = touch.clientY - g.startY;

      if (!g.engaged) {
        if (!shouldEngagePull(dx, dy, isAtTop(g.scroller))) return;
        g.engaged = true;
        setDragging(true);
      }

      // Увели вверх — жест больше не наш, отпускаем контент на место.
      if (!isAtTop(g.scroller)) {
        reset();
        return;
      }

      e.preventDefault();
      const next = pullOffsetFor(dy);
      pullRef.current = next;
      setPull(next);
    };

    const onTouchEnd = () => {
      if (refreshingRef.current) return;
      if (gesture.current.engaged && isRefreshTriggered(pullRef.current)) {
        void trigger();
        return;
      }
      reset();
    };

    host.addEventListener('touchstart', onTouchStart, { passive: true });
    host.addEventListener('touchmove', onTouchMove, { passive: false });
    host.addEventListener('touchend', onTouchEnd);
    host.addEventListener('touchcancel', onTouchEnd);

    return () => {
      host.removeEventListener('touchstart', onTouchStart);
      host.removeEventListener('touchmove', onTouchMove);
      host.removeEventListener('touchend', onTouchEnd);
      host.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [reset, trigger]);

  const visible = pull > 0 || refreshing;

  return (
    <div ref={hostRef} className="relative">
      <div
        aria-hidden={!visible}
        className="pointer-events-none absolute inset-x-0 top-0 z-50 flex justify-center"
        style={{
          transform: `translateY(${Math.max(pull, 0)}px)`,
          opacity: visible ? 1 : 0,
          transition: dragging ? 'none' : 'transform 220ms ease-out, opacity 220ms ease-out',
        }}
      >
        <div className="mt-3 flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-2 shadow-md dark:bg-sage/90">
          <span className={`material-symbols-outlined text-[18px] text-primary ${refreshing ? 'animate-spin' : ''}`}>
            refresh
          </span>
          <span className="text-xs font-medium text-sage dark:text-white">{pullLabel(pull, refreshing)}</span>
        </div>
      </div>

      <div
        style={{
          // Нулевое смещение задаём явно, а не `undefined`: переход к `transform: none`
          // не анимируется, и контент возвращался бы рывком.
          transform: `translateY(${pull}px)`,
          transition: dragging ? 'none' : 'transform 220ms ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
