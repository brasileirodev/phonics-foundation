import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
export const resources = {
  en: {
    translation: {
      brand: 'Phonics studio',
      eyebrow: 'ONE WORD AT A TIME',
      title: 'Small sounds.\nNew possibilities.',
      intro: 'A space to explore the sounds that bring words to life.',
      foundation: 'Foundation preview',
      preview: 'Our first word',
      language: 'Language',
      loading: 'Connecting to your practice space…',
      connected: 'Practice space connected',
      error: 'We could not connect. Please try again.',
      retry: 'Try again',
      steps: '{{count}} guided steps',
      journey: 'Sounds → combinations → full word',
      note: 'Listening and recording activities are coming next. This preview checks lesson and progress storage.',
      demo: 'Try saving progress',
      saved: '{{count}} of {{total}} steps saved',
      simulate: 'Run simulated evaluation',
      simulated: 'Simulated result: success. No audio was evaluated.',
      reset: 'Reset progress',
      progressError: 'Could not save or load progress. Try again.',
      footer: 'Listen. Explore. Repeat.',
      session: 'Progress stays with this browser session ID.',
    },
  },
  pt: {
    translation: {
      brand: 'Estúdio fônico',
      eyebrow: 'UMA PALAVRA DE CADA VEZ',
      title: 'Pequenos sons.\nNovas possibilidades.',
      intro: 'Um espaço para explorar os sons que dão vida às palavras.',
      foundation: 'Prévia da base',
      preview: 'Nossa primeira palavra',
      language: 'Idioma',
      loading: 'Conectando ao seu espaço de prática…',
      connected: 'Espaço de prática conectado',
      error: 'Não foi possível conectar. Tente novamente.',
      retry: 'Tentar novamente',
      steps: '{{count}} etapas guiadas',
      journey: 'Sons → combinações → palavra completa',
      note: 'As atividades de escuta e gravação vêm a seguir. Esta prévia verifica o armazenamento da lição e do progresso.',
      demo: 'Testar salvamento de progresso',
      saved: '{{count}} de {{total}} etapas salvas',
      simulate: 'Executar avaliação simulada',
      simulated: 'Resultado simulado: sucesso. Nenhum áudio foi avaliado.',
      reset: 'Reiniciar progresso',
      progressError:
        'Não foi possível salvar ou carregar o progresso. Tente novamente.',
      footer: 'Ouça. Explore. Repita.',
      session: 'O progresso fica associado ao identificador deste navegador.',
    },
  },
};
void i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});
export default i18n;
