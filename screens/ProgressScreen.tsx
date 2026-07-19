import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavBar from '../components/BottomNavBar';
import { useAuth } from '../context/AuthContext';
import { EmotionHistoryEntry, EmotionKey } from '../types';
import { getEmotionHistory } from '../services/firestoreService';
import { EMOTIONS } from '../constants';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const ProgressScreen: React.FC = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState<EmotionHistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'all'>('week');
    const [exporting, setExporting] = useState(false);
    const navigate = useNavigate();
    const chartRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            if (user) {
                setLoading(true);
                // Получаем историю и сортируем от старых к новым для правильного отображения линии
                const userHistory = (await getEmotionHistory(user.uid)).reverse();
                setHistory(userHistory);
                setLoading(false);
            }
        };
        fetchHistory();
    }, [user]);

    const colorMap: {[key: string]: string} = {
        'bg-orange-500': '#f97316',
        'bg-blue-400': '#60a5fa',
        'bg-purple-400': '#c084fc',
        'bg-orange-400': '#fb923c',
        'bg-indigo-400': '#818cf8',
        'bg-gray-400': '#9ca3af',
        'bg-red-500': '#ef4444',
        'bg-teal-400': '#2dd4bf',
    };

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
        if (timeFilter === 'week') return entry.timestamp >= now - 7 * 24 * 60 * 60 * 1000;
        if (timeFilter === 'month') return entry.timestamp >= now - 30 * 24 * 60 * 60 * 1000;
        return true; // 'all'
    });

    // Подготавливаем данные для графика
    const chartData = filteredHistory.map((entry, index) => {
        const emotion = EMOTIONS[entry.emotionKey];
        return {
            index: index, // Используем индекс для равномерного распределения по оси X
            id: entry.id,
            emotionKey: entry.emotionKey,
            time: entry.timestamp,
            timeStr: new Date(entry.timestamp).toLocaleString('ru-RU', { 
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
            }),
            stateIndex: stateOrder.indexOf(entry.emotionKey),
            stateName: emotion.title,
            color: colorMap[emotion.color] || '#ccc'
        };
    });

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
            const html2canvasModule = await import('html2canvas');
            const html2canvas = html2canvasModule.default ? html2canvasModule.default : html2canvasModule;
            const { jsPDF } = await import('jspdf');

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
                    onClick={handleExportPDF} 
                    disabled={loading || filteredHistory.length === 0 || exporting}
                    className="flex flex-col items-center justify-center text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sage/10 p-2 rounded-xl transition-colors"
                    title="Экспорт в PDF"
                >
                    <span className="material-symbols-outlined text-2xl">{exporting ? 'hourglass_empty' : 'picture_as_pdf'}</span>
                    <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">PDF</span>
                </button>
            </header>

            <main className="px-4 flex-1 flex flex-col">
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
                                            const emotionKey = data?.payload?.emotionKey || data?.emotionKey;
                                            if (emotionKey) {
                                                const result = EMOTIONS[emotionKey as EmotionKey];
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