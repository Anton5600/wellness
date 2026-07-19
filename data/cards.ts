import harmonyImg from '../src/assets/cards/card_harmony_art_1779902775411.png';
import strengthImg from '../src/assets/cards/card_strength_art_1779903072376.png';
import acceptanceImg from '../src/assets/cards/card_acceptance_art_1779903089676.png';
import lightImg from '../src/assets/cards/card_light_art_1779902816072.png';
import growthImg from '../src/assets/cards/card_growth_art_1779902799238.png';
import courageImg from '../src/assets/cards/card_courage_art_1779903107156.png';
import releaseImg from '../src/assets/cards/card_release_art_1779903123352.png';
import clarityImg from '../src/assets/cards/card_clarity_art_1779903143705.png';
import wonderImg from '../src/assets/cards/card_wonder_art_1779903158773.png';
import stillnessImg from '../src/assets/cards/card_stillness_art_1779903177053.png';
import flowImg from '../src/assets/cards/card_flow_art_1779903193737.png';
import focusImg from '../src/assets/cards/card_focus_art_1779903222652.png';
import groundingImg from '../src/assets/cards/card_grounding_art_1779903240614.png';
import transformationImg from '../src/assets/cards/card_transformation_art_1779903259330.png';
import inspirationImg from '../src/assets/cards/card_inspiration_art_1779903276195.png';
import intuitionImg from '../src/assets/cards/card_intuition_art_1779903294054.png';
import patienceImg from '../src/assets/cards/card_patience_art_1779903311030.png';
import gratitudeImg from '../src/assets/cards/card_gratitude_art_1779903328850.png';
import playfulnessImg from '../src/assets/cards/card_playfulness_art_1779903345943.png';
import boundariesImg from '../src/assets/cards/card_boundaries_art_1779903361706.png';

export type MetaphoricCard = {
  id: string;
  title: string;
  message: string;
  image: string;
  emotionKey?: string; // Tying to a specific state or undefined for general
};

export const METAPHORIC_CARDS: MetaphoricCard[] = [
  { 
    id: 'harmony', 
    title: 'Гармония', 
    message: 'Сегодня день, когда стоит найти внутренний баланс. Позвольте событиям течь естественно.', 
    image: harmonyImg,
    emotionKey: 'trust'
  },
  { 
    id: 'strength', 
    title: 'Сила', 
    message: 'У вас достаточно внутренних ресурсов, чтобы справиться с любыми задачами. Верьте в себя.', 
    image: strengthImg,
    emotionKey: 'anticipation'
  },
  { 
    id: 'acceptance', 
    title: 'Принятие', 
    message: 'Отпустите то, что вы не можете изменить. Примите текущий момент таким, какой он есть.', 
    image: acceptanceImg,
    emotionKey: 'sadness'
  },
  { 
    id: 'light', 
    title: 'Свет', 
    message: 'Ваша энергия освещает путь не только вам, но и окружающим. Делитесь своим теплом.', 
    image: lightImg,
    emotionKey: 'joy'
  },
  { 
    id: 'growth', 
    title: 'Рост', 
    message: 'Каждый шаг, даже самый маленький, ведет вас к развитию. Замечайте свои успехи.', 
    image: growthImg,
    emotionKey: 'anticipation'
  },
  {
    id: 'courage',
    title: 'Смелость',
    message: 'За страхом скрывается огромный потенциал энергии. Сделайте шаг навстречу неизвестному.',
    image: courageImg,
    emotionKey: 'fear'
  },
  {
    id: 'release',
    title: 'Освобождение',
    message: 'Гнев — это топливо для изменений. Используйте его, чтобы очертить свои границы, а не разрушать.',
    image: releaseImg,
    emotionKey: 'anger'
  },
  {
    id: 'clarity',
    title: 'Ясность',
    message: 'Иногда нужно взять паузу, чтобы туман рассеялся и путь стал виден. Не торопитесь.',
    image: clarityImg,
    emotionKey: 'disgust'
  },
  {
    id: 'wonder',
    title: 'Чудо',
    message: 'Жизнь полна неожиданных сюрпризов. Позвольте себе удивиться новому дню и его дарам.',
    image: wonderImg,
    emotionKey: 'surprise'
  },
  {
    id: 'stillness',
    title: 'Тишина',
    message: 'В тишине можно услышать ответы на самые важные вопросы. Позвольте себе просто быть.',
    image: stillnessImg,
    emotionKey: 'trust'
  },
  {
    id: 'flow',
    title: 'Поток',
    message: 'Отбросьте напряжение. Подобно реке, найдите самый естественный путь для достижения цели.',
    image: flowImg,
  },
  {
    id: 'focus',
    title: 'Фокус',
    message: 'Направьте свое внимание на то, что действительно важно. Остальное отложите на потом.',
    image: focusImg,
  },
  {
    id: 'grounding',
    title: 'Заземление',
    message: 'Почувствуйте твердую почву под ногами. Ваша опора всегда с вами, внутри вас.',
    image: groundingImg,
    emotionKey: 'fear'
  },
  {
    id: 'transformation',
    title: 'Трансформация',
    message: 'Каждый кризис — это шанс на перерождение. Вы способны выйти из трудностей обновленным.',
    image: transformationImg,
    emotionKey: 'sadness'
  },
  {
    id: 'inspiration',
    title: 'Вдохновение',
    message: 'Идеи витают вокруг вас. Раскройте свой разум, и вы увидите скрытый потенциал.',
    image: inspirationImg,
    emotionKey: 'joy'
  },
  {
    id: 'intuition',
    title: 'Интуиция',
    message: 'Доверьтесь своему внутреннему голосу. Он знает путь лучше, чем логические доводы.',
    image: intuitionImg,
    emotionKey: 'trust'
  },
  {
    id: 'patience',
    title: 'Терпение',
    message: 'Некоторые семена прорастают долго. Дайте времени сделать свою работу и продолжайте верить.',
    image: patienceImg,
  },
  {
    id: 'gratitude',
    title: 'Благодарность',
    message: 'Оглянитесь вокруг и скажите "спасибо" за то, что у вас уже есть. Благодарность притягивает изобилие.',
    image: gratitudeImg,
    emotionKey: 'joy'
  },
  {
    id: 'playfulness',
    title: 'Легкость',
    message: 'Относитесь к жизни как к игре. Сбросьте излишнюю серьезность и позвольте себе улыбаться.',
    image: playfulnessImg,
    emotionKey: 'surprise'
  },
  {
    id: 'boundaries',
    title: 'Границы',
    message: 'Защищайте свое пространство. Сказать "нет" чему-то одному — значит сказать "да" себе.',
    image: boundariesImg,
    emotionKey: 'anger'
  }
];
