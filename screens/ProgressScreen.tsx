import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavBar from '../components/BottomNavBar';
import { useAuth } from '../context/AuthContext';
import { EmotionalGraphEntry, EmotionKey } from '../types';
import { compassService } from '../services/compassService';
import { EMOTIONS } from '../constants';
import { EMOTION_HEX } from '../services/recommendation/color';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useUnlockedFeatures, FEATURE_DAYS } from '../hooks/useUnlockedFeatures';

/** Оси Плутчика для радара недели — стабильный порядок. */
const RADAR_EMOTIONS: EmotionKey[] = ['joy', 'trust', 'fear', 'surprise', 'sadness', 'disgust', 'anger', 'anticipation'];

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const ProgressScreen: React.FC = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState<EmotionalGraphEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'all'>('week');
    const [exporting, setExporting] = useState(false);
    const navigate = useNavigate();
    const chartRef = useRef<HTMLDivElement>(null);
    const { features, streak } = useUnlockedFeatures();
    const pdfUnlocked = features?.exportPdf ?? false;

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                compassService.setCurrentUserId(user?.uid);
                // Новый контур emotionalGraph. Сортируем от старых к новым для линии слева направо.
                const userHistory = (await compassService.getHistory()).reverse();
                setHistory(userHistory);
            } catch (error) {
                console.error("Failed to load history:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [user]);

    // Жестко задаем порядок состояний от низких (негативных) к высоким (позитивным)
    const stateOrder: EmotionKey[] = [
        'anger',        // Раздражение (самое низкое)
        'disgust',      // Усталость
        'fear',         // Беспокойство
        'sadness',      // Задумчивость
        'trust',        // Умиротворение
        'anticipation', // Равновесие
        'surprise',     // Энергичность
        'joy'           // Вдохновение (самое высокое)
    ];

    // Фильтруем историю по времени
    const now = Date.now();
    const filteredHistory = history.filter(entry => {
        if (timeFilter === 'week') return entry.timestamp >= now - WEEK_MS;
        if (timeFilter === 'month') return entry.timestamp >= now - 30 * 24 * 60 * 60 * 1000;
        return true; // 'all'
    });

    // Подготавливаем данные для графика
    const chartData = filteredHistory.map((entry, index) => {
        const emotion = EMOTIONS[entry.dominant];
        return {
            index: index, // Используем индекс для равномерного распределения по оси X
            id: entry.date,
            dominant: entry.dominant,
            time: entry.timestamp,
            timeStr: new Date(entry.timestamp).toLocaleString('ru-RU', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            }),
            stateIndex: stateOrder.indexOf(entry.dominant),
            stateName: emotion.title,
            color: EMOTION_HEX[entry.dominant] || '#ccc'
        };
    });

    // --- Радар недели: усреднённый plutchikInferred за последние 7 дней ---
    const weeklyAvg = (() => {
        const weekly = history.filter(e => e.timestamp >= now - WEEK_MS);
        if (weekly.length === 0) return null;
        const sum: Record<EmotionKey, number> = { joy: 0, trust: 0, fear: 0, surprise: 0, sadness: 0, disgust: 0, anger: 0, anticipation: 0 };
        weekly.forEach(e => RADAR_EMOTIONS.forEach(k => { sum[k] += e.plutchikInferred?.[k] ?? 0; }));
        return RADAR_EMOTIONS.map(k => ({ emotion: EMOTIONS[k].title, value: +(sum[k] / weekly.length).toFixed(2) }));
    })();

    // --- Календарь эмоций: текущий месяц, ячейки залиты цветом доминанты ---
    const calNow = new Date();
    const calYear = calNow.getFullYear();
    const calMonth = calNow.getMonth();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const firstWeekday = (new Date(calYear, calMonth, 1).getDay() + 6) % 7; // Пн = 0
    const entriesByDate = new Map(history.map(e => [e.date, e]));
    const calCells: Array<{ day: number; entry?: EmotionalGraphEntry }> = [];
    for (let i = 0; i < firstWeekday; i++) calCells.push({ day: 0 });
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        calCells.push({ day: d, entry: entriesByDate.get(dateStr) });
    }

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 pointer-events-none">
                    <p className="font-bold text-forest dark:text-white">{data.stateName}</p>
                    <p className="text-sm text-sage dark:text-gray-400">{data.timeStr}</p>
                    <p className="text-xs text-primary mt-1 font-semibold">Нажмите, чтобы открыть</p>
                </div>
            );
        }
        return null;
    };

    const handleExportPDF = async () => {
        if (!chartRef.current) return;
        try {
            setExporting(true);

            const canvas = await html2canvas(chartRef.current, { scale: 2, backgroundColor: null });
            const imgData = canvas.toDataURL('image/png');
            // A4 page dimensions in landscape
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`emotional_report_${timeFilter}.pdf`);
        } catch (e) {
            console.error("Failed to export PDF", e);
            alert("Ошибка при экспорте в PDF");
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="pb-28 bg-background-light dark:bg-background-dark min-h-[100dvh] flex flex-col">
            <header className="p-6 pt-8 flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-forest dark:text-white">Динамика</h1>
                    <p className="text-sage dark:text-gray-400 mt-1">Визуализируйте свою эмоциональную динамику.</p>
                </div>
                <button
                    onClick={pdfUnlocked ? handleExportPDF : undefined}
                    disabled={!pdfUnlocked || loading || filteredHistory.length === 0 || exporting}
                    className="flex flex-col items-center justify-center text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sage/10 p-2 rounded-xl transition-colors"
                    title={pdfUnlocked ? 'Экспорт в PDF' : `PDF-экспорт откроется на ${FEATURE_DAYS.exportPdf} дне (сейчас ${streak?.longest ?? 0})`}
                >
                    <span className="material-symbols-outlined text-2xl">{!pdfUnlocked ? 'lock' : exporting ? 'hourglass_empty' : 'picture_as_pdf'}</span>
                    <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">PDF</span>
                </button>
            </header>

            <main className="px-4 flex-1 flex flex-col">
                {/* Радар недели */}
                <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 mb-4">
                    <h2 className="text-sm font-bold text-sage dark:text-gray-400 uppercase tracking-wider mb-2 px-2">Радар недели</h2>
                    {loading ? (
                        <div className="w-full h-[260px] bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                    ) : weeklyAvg ? (
                        <div className="w-full h-[260px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={weeklyAvg} outerRadius="70%">
                                    <PolarGrid stroke="#9ca3af" opacity={0.3} />
                                    <PolarAngleAxis dataKey="emotion" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                                    <PolarRadiusAxis domain={[0, 1]} tick={false} axisLine={false} />
                                    <Radar dataKey="value" stroke="#98c281" fill="#98c281" fillOpacity={0.4} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="w-full h-[160px] flex flex-col items-center justify-center text-center text-sage">
                            <p className="font-semibold text-forest dark:text-white">Нет данных за неделю</p>
                            <p className="text-sm mt-1">Сделайте чек-ин, чтобы увидеть свой профиль.</p>
                        </div>
                    )}
                </div>

                {/* Календарь эмоций */}
                <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 mb-4">
                    <h2 className="text-sm font-bold text-sage dark:text-gray-400 uppercase tracking-wider mb-2 px-2">
                        Календарь эмоций · {calNow.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                    </h2>
                    <div className="grid grid-cols-7 gap-1">
                        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
                            <div key={d} className="text-center text-[10px] font-bold text-sage dark:text-gray-500 py-1">{d}</div>
                        ))}
                        {calCells.map((cell, i) => {
                            if (cell.day === 0) return <div key={`empty-${i}`} />;
                            const hex = cell.entry ? EMOTION_HEX[cell.entry.dominant] : undefined;
                            return (
                                <div
                                    key={`day-${cell.day}`}
                                    title={cell.entry ? `${EMOTIONS[cell.entry.dominant].title}` : undefined}
                                    className="aspect-square rounded-lg flex items-center justify-center text-xs font-bold"
                                    style={hex
                                        ? { backgroundColor: hex, color: '#fff' }
                                        : { backgroundColor: 'rgba(156,163,175,0.15)', color: '#9ca3af' }}
                                >
                                    {cell.day}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-4">
                    <button
                        onClick={() => setTimeFilter('week')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${timeFilter === 'week' ? 'bg-white dark:bg-gray-700 text-forest dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        Неделя
                    </button>
                    <button
                        onClick={() => setTimeFilter('month')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${timeFilter === 'month' ? 'bg-white dark:bg-gray-700 text-forest dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        Месяц
                    </button>
                    <button
                        onClick={() => setTimeFilter('all')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${timeFilter === 'all' ? 'bg-white dark:bg-gray-700 text-forest dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        Всё время
                    </button>
                </div>

                <div ref={chartRef} className="w-full h-[450px] bg-white dark:bg-[#1f1f1f] rounded-2xl p-4 pt-6 relative shadow-sm border border-gray-100 dark:border-gray-800 overflow-x-auto overflow-y-hidden">
                    {loading ? (
                         <div className="w-full h-full flex flex-col animate-pulse p-2">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-xl mb-6"></div>
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                         </div>
                    ) : filteredHistory.length > 0 ? (
                        <div style={{ width: `${Math.max(100, chartData.length * 15)}%`, height: '400px', minWidth: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 10, right: 30, bottom: 60, left: 90 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} horizontal={false} />
                                    <XAxis
                                        type="number"
                                        dataKey="index"
                                        name="Время"
                                        domain={[0, Math.max(5, chartData.length - 1)]}
                                        ticks={chartData.map(d => d.index)}
                                        tickFormatter={(val) => chartData[val]?.timeStr || ''}
                                        angle={-45}
                                        textAnchor="end"
                                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                                        axisLine={{ stroke: '#e5e7eb' }}
                                        tickLine={false}
                                        height={60}
                                    />
                                    <YAxis
                                        type="number"
                                        dataKey="stateIndex"
                                        name="Состояние"
                                        domain={[0, stateOrder.length - 1]}
                                        ticks={[0, 1, 2, 3, 4, 5, 6, 7]}
                                        tickFormatter={(val) => EMOTIONS[stateOrder[val]]?.title || ''}
                                        tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500, textAnchor: 'start', dx: -85 }}
                                        interval={0}
                                        axisLine={{ stroke: '#e5e7eb' }}
                                        tickLine={false}
                                        width={90}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#9ca3af', opacity: 0.4 }} />
                                    <Scatter
                                        data={chartData}
                                        line={{ stroke: '#98c281', strokeWidth: 2 }}
                                        shape="circle"
                                        onClick={(data: any) => {
                                            const dominant = data?.payload?.dominant || data?.dominant;
                                            if (dominant) {
                                                const result = EMOTIONS[dominant as EmotionKey];
                                                if (result) {
                                                    navigate('/result', { state: { result, fromHistory: true } });
                                                }
                                            }
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} className="cursor-pointer hover:opacity-80 transition-opacity" />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-center text-sage">
                            <span className="material-symbols-outlined text-5xl text-primary mb-4">monitoring</span>
                             <p className="font-semibold text-forest dark:text-white">Нет данных</p>
                            <p className="text-sm mt-1">За выбранный период нет записей.</p>
                        </div>
                    )}
                </div>
                <p className="text-xs text-center text-gray-400 mt-4">
                    {filteredHistory.length > 0 ? `Показано записей: ${chartData.length}` : ''}
                </p>
            </main>

            <BottomNavBar />
        </div>
    );
};

export default ProgressScreen;
