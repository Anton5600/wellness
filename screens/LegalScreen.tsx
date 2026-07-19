import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { privacyPolicyText, termsOfServiceText } from '../data/legal';

const LegalScreen: React.FC = () => {
    const navigate = useNavigate();
    const { documentType } = useParams<{ documentType: string }>();

    const content = useMemo(() => {
        if (documentType === 'privacy') {
            return {
                title: 'Политика конфиденциальности',
                text: privacyPolicyText
            };
        } else if (documentType === 'terms') {
            return {
                title: 'Пользовательское соглашение',
                text: termsOfServiceText
            };
        }
        return {
            title: 'Документ не найден',
            text: 'Запрошенный документ не существует.'
        };
    }, [documentType]);

    // Format text nicely (paragraphs)
    const formattedText = content.text.split('\n\n').map((paragraph, index) => (
        <p key={index} className="mb-4 text-sm text-sage dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
            {paragraph}
        </p>
    ));

    return (
        <div className="flex flex-col min-h-[100dvh] w-full bg-background-light dark:bg-background-dark font-display">
            <header className="flex items-center p-4 bg-white dark:bg-[#1f1f1f] shadow-sm sticky top-0 z-10 shrink-0">
                <button 
                    onClick={() => navigate(-1)} 
                    className="size-10 flex border border-gray-100 dark:border-gray-800 items-center justify-center rounded-full bg-white dark:bg-[#2a2a2a] text-forest dark:text-white shadow-sm"
                >
                    <span className="material-symbols-outlined shrink-0 block">arrow_back_ios_new</span>
                </button>
                <div className="ml-4 flex-1">
                    <h1 className="text-xl font-extrabold text-forest dark:text-white truncate pr-4">
                        {content.title}
                    </h1>
                </div>
            </header>

            <main className="flex-1 p-6 overflow-y-auto">
                <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl p-6 shadow-sm border border-sage/10 dark:border-sage/20">
                    {formattedText}
                </div>
            </main>
        </div>
    );
};

export default LegalScreen;
