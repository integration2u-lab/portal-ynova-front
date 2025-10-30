import React, { useState, useEffect } from 'react';
import TrainingSidebar, { Module } from '../components/TrainingSidebar';
import VideoPlayer from '../components/VideoPlayer';
import StudyMaterials from '../components/StudyMaterials';

// Helper function to extract YouTube video ID
const extractVideoId = (url: string): string => {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
  return match ? match[1] : '';
};

const modules: Module[] = [
  {
    title: '1. Introdução',
    lessons: [
      {
        id: '1.1',
        title: '1.1 Seja Bem-Vindo!',
        subtitle: 'Alice no País das Maravilhas: Para onde vai?',
        videoUrl: 'https://youtu.be/CQw_upKpLmc',
        videoId: extractVideoId('https://youtu.be/CQw_upKpLmc'),
      },
      {
        id: '1.2',
        title: '1.2 Conheça a Ynova',
        subtitle: 'Ynova: marketplace - competitividade, RJ, B optante, hospitais...',
        videoUrl: 'https://youtu.be/tjviUR7UiKw',
        videoId: extractVideoId('https://youtu.be/tjviUR7UiKw'),
      },
      {
        id: '1.3',
        title: '1.3 Nosso Marketplace',
        subtitle: 'Segurança: fornecedores/geradores, números Ynova',
        videoUrl: 'https://youtu.be/4nXjvysnfD8',
        videoId: extractVideoId('https://youtu.be/4nXjvysnfD8'),
      },
      {
        id: '1.4',
        title: '1.4 Nosso Propósito',
        subtitle: 'Propósito: empresário / mundo melhor / 600 Ibirapueras',
        videoUrl: 'https://youtu.be/BzTr4KyH_bM',
        videoId: extractVideoId('https://youtu.be/BzTr4KyH_bM'),
      },
    ],
  },
  {
    title: '2. Produto',
    lessons: [
      {
        id: '2.1',
        title: '2.1 Oferecemos Competitividade!',
        subtitle: 'Preço: supermercado - câmara fria / reforma',
        videoUrl: 'https://youtu.be/thBYRAEjbUQ',
        videoId: extractVideoId('https://youtu.be/thBYRAEjbUQ'),
      },
      {
        id: '2.2',
        title: '2.2 Deixamos o Mundo Melhor!',
        subtitle: 'Sustentabilidade: Volvo - descarbonização escopo 2, relatório sustentabilidade',
        videoUrl: 'https://youtu.be/5YDTFZEZzhU',
        videoId: extractVideoId('https://youtu.be/5YDTFZEZzhU'),
      },
      {
        id: '2.3',
        title: '2.3 Utilização Sem Preocupações',
        subtitle: 'Flex 100% - Amyr',
        videoUrl: 'https://youtu.be/oa0RwApa5Tw',
        videoId: extractVideoId('https://youtu.be/oa0RwApa5Tw'),
      },
      {
        id: '2.4',
        title: '2.4 Atendimento Personalizado',
        subtitle: 'Time dedicado - Terra Way',
        videoUrl: 'https://youtu.be/EpWKU5XQAF8',
        videoId: extractVideoId('https://youtu.be/EpWKU5XQAF8'),
      },
      {
        id: '2.5',
        title: '2.5 Tecnologia e IA com a Ynova',
        subtitle: 'Galpão logística',
        videoUrl: 'https://youtu.be/LKijM796CSQ',
        videoId: extractVideoId('https://youtu.be/LKijM796CSQ'),
      },
      {
        id: '2.6',
        title: '2.6 Isenção de Bandeiras Tarifárias',
        subtitle: 'Indústria Plástico - La Niña',
        videoUrl: 'https://youtu.be/7QIUwXrxMGY',
        videoId: extractVideoId('https://youtu.be/7QIUwXrxMGY'),
      },
      {
        id: '2.7',
        title: '2.7 Maior Produtividade na Ponta',
        subtitle: 'Fischer',
        videoUrl: 'https://youtu.be/40-sPiMwQaU',
        videoId: extractVideoId('https://youtu.be/40-sPiMwQaU'),
      },
      {
        id: '2.8',
        title: '2.8 O Melhor de Tudo: Custo Zero!',
        subtitle: 'Migração sem custo - Rádio Tupi',
        videoUrl: 'https://youtu.be/gkXXfZAVHCk',
        videoId: extractVideoId('https://youtu.be/gkXXfZAVHCk'),
      },
      {
        id: '2.9',
        title: '2.9 Venda Mais! Conte Histórias!',
        subtitle: 'Contar histórias para vender',
        videoUrl: 'https://youtu.be/tBsqEJvDBHE',
        videoId: extractVideoId('https://youtu.be/tBsqEJvDBHE'),
      },
    ],
  },
  {
    title: '3. Está bom demais pra ser verdade, e é isso mesmo!',
    lessons: [
      {
        id: '3.1',
        title: '3.1 Bom Demais para Ser Verdade...',
        subtitle: 'Produto varejo - pacote i5 / opções i1 / conv',
        videoUrl: '',
        videoId: 'z_Xe5j8xkfI',
      },
      {
        id: '3.2',
        title: '3.2 De Onde Vem a Economia - Energia (TE)',
        subtitle: '',
        videoUrl: '',
        videoId: 'z_Xe5j8xkfI',
      },
      {
        id: '3.3',
        title: '3.3 De Onde Vem a Economia - Distribuição (TUSD Ponta)',
        subtitle: '',
        videoUrl: '',
        videoId: 'z_Xe5j8xkfI',
      },
      {
        id: '3.4',
        title: '3.4 De Onde Vem a Economia - Demanda Contratada',
        subtitle: '',
        videoUrl: '',
        videoId: 'z_Xe5j8xkfI',
      },
      {
        id: '3.5',
        title: '3.5 De Onde Vem a Economia - Gestão',
        subtitle: 'Otimização: demanda, modalidade, reativa, planejamento',
        videoUrl: '',
        videoId: 'z_Xe5j8xkfI',
      },
      {
        id: '3.6',
        title: '3.6 Como Funciona na Prática?',
        subtitle: 'Distribuidora / Gerador / Faturas',
        videoUrl: '',
        videoId: 'z_Xe5j8xkfI',
      },
      {
        id: '3.7',
        title: '3.7 Os Números Não Mentem',
        subtitle: 'ML 95, negociar preço/prazo/condições (38k-64k+80k)',
        videoUrl: '',
        videoId: 'z_Xe5j8xkfI',
      },
      {
        id: '3.8',
        title: '3.8 O Lado Ruim que Ajuda sua Venda!',
        subtitle: 'Notícia ruim - 6 meses pra migrar, 3 faturas, CP',
        videoUrl: '',
        videoId: 'z_Xe5j8xkfI',
      },
    ],
  },
  {
    title: '4. Conhecendo o Setor',
    lessons: [
      {
        id: '4.1',
        title: '4.1 A Dica do Lobo de Wall Street',
        subtitle: 'Jordan Belfort: afiado, especialista, entusiasmado',
        videoUrl: '',
        videoId: 'z_Xe5j8xkfI',
      },
      {
        id: '4.2',
        title: '4.2 O que Mais Temos no Mercado Livre?',
        subtitle: 'Soluções ML - atacado, varejo, desconto garantido',
        videoUrl: '',
        videoId: 'z_Xe5j8xkfI',
      },
      {
        id: '4.3',
        title: '4.3 O que Mais Temos para Energia?',
        subtitle: 'GD, solar híbrido, zero grid',
        videoUrl: '',
        videoId: 'z_Xe5j8xkfI',
      },
      {
        id: '4.4',
        title: '4.4 O que Mais Temos no Setor Elétrico?',
        subtitle: 'Parcerias: banco de capacitor, telemetria, I-REC, baterias',
        videoUrl: '',
        videoId: 'z_Xe5j8xkfI',
      },
      {
        id: '4.5',
        title: '4.5 As Siglas do Setor',
        subtitle: 'ANEEL, CCEE, ONS, SIN, Geração, Transmissão, Distribuição, PLD',
        videoUrl: '',
        videoId: 'z_Xe5j8xkfI',
      },
      {
        id: '4.6',
        title: '4.6 O que Está por Vir?',
        subtitle: 'MP / atualizações futuras do setor',
        videoUrl: '',
        videoId: 'z_Xe5j8xkfI',
      },
    ],
  },
  {
    title: '5. Comercial',
    lessons: [
      {
        id: '5.1',
        title: '5.1 Nada Acontece Sem uma Venda!',
        subtitle: 'Brian Tracy - vendas',
        videoUrl: '',
        videoId: 'z_Xe5j8xkfI',
      },
      {
        id: '5.2',
        title: '5.2 Quanto Você Quer Faturar?',
        subtitle: 'Planejamento comercial, metas, apresentações, contatos',
        videoUrl: '',
        videoId: 'z_Xe5j8xkfI',
      },
      {
        id: '5.3',
        title: '5.3 Quem? E Quando?',
        subtitle: 'Decisor, necessidade, dinheiro, urgência',
        videoUrl: '',
        videoId: 'z_Xe5j8xkfI',
      },
      {
        id: '5.4',
        title: '5.4 Abrindo Oportunidades',
        subtitle: 'Prospecção e rapport: toda venda é emocional',
        videoUrl: '',
        videoId: 'z_Xe5j8xkfI',
      },
      {
        id: '5.5',
        title: '5.5 O Segredo de Ouro das Vendas',
        subtitle: 'Identificar necessidades reais',
        videoUrl: '',
        videoId: 'z_Xe5j8xkfI',
      },
      {
        id: '5.6',
        title: '5.6 Dando Match!',
        subtitle: 'Apresentação: benefícios, histórias, confirmações',
        videoUrl: '',
        videoId: 'z_Xe5j8xkfI',
      },
      {
        id: '5.7',
        title: '5.7 Tenha Sempre uma Carta na Manga!',
        subtitle: 'Negociação: condições especiais e diferenciais',
        videoUrl: '',
        videoId: 'z_Xe5j8xkfI',
      },
      {
        id: '5.8',
        title: '5.8 Seja Esperto, Antecipe as Dúvidas!',
        subtitle: 'Respostas sobre energia, fio novo, solar, distribuidora, relatórios',
        videoUrl: '',
        videoId: 'z_Xe5j8xkfI',
      },
      {
        id: '5.9',
        title: '5.9 Respire e Avance!',
        subtitle: 'Objeções: investimento, preço, contrato, prazos',
        videoUrl: '',
        videoId: 'z_Xe5j8xkfI',
      },
      {
        id: '5.10',
        title: '5.10 A Hora H!',
        subtitle: 'Fechamento da venda',
        videoUrl: '',
        videoId: 'z_Xe5j8xkfI',
      },
      {
        id: '5.11',
        title: '5.11 O Conselho do Flávio Augusto',
        subtitle: 'Ambição, técnica e inteligência emocional',
        videoUrl: '',
        videoId: 'z_Xe5j8xkfI',
      },
    ],
  },
  {
    title: '6. Desfecho',
    lessons: [
      {
        id: '6.1',
        title: '6.1 Agora é com Você!',
        subtitle: 'Mão na massa, aprendizado conjunto, comissões agressivas, campanhas, executivos. Conte conosco!',
        videoUrl: '',
        videoId: 'z_Xe5j8xkfI',
      },
    ],
  },
];

export default function TrainingPage() {
  const [currentModule, setCurrentModule] = useState(0);
  const [currentLesson, setCurrentLesson] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);

  useEffect(() => {
    const stored = localStorage.getItem('trainingState');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setCurrentModule(data.moduloAtual || 0);
        setCurrentLesson(data.licaoAtual || 0);
        setCompletedLessons(new Set(data.concluidas || []));
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    const data = {
      moduloAtual: currentModule,
      licaoAtual: currentLesson,
      concluidas: Array.from(completedLessons),
      totalLicoes: totalLessons,
    };
    localStorage.setItem('trainingState', JSON.stringify(data));
  }, [currentModule, currentLesson, completedLessons]);

  const completedCount = completedLessons.size;
  const progress = Math.round((completedCount / totalLessons) * 100);

  const handleSelectLesson = (mIndex: number, lIndex: number) => {
    setCurrentModule(mIndex);
    setCurrentLesson(lIndex);
  };

  const handleNext = () => {
    const id = `${currentModule}-${currentLesson}`;
    setCompletedLessons((prev) => new Set(prev).add(id));

    const lessonsInModule = modules[currentModule].lessons.length;
    if (currentModule === modules.length - 1 && currentLesson === lessonsInModule - 1) {
      return;
    }
    if (currentLesson < lessonsInModule - 1) {
      setCurrentLesson(currentLesson + 1);
    } else {
      setCurrentModule(currentModule + 1);
      setCurrentLesson(0);
    }
  };

  const handlePrev = () => {
    if (currentLesson > 0) {
      setCurrentLesson(currentLesson - 1);
    } else if (currentModule > 0) {
      const prevModule = currentModule - 1;
      setCurrentModule(prevModule);
      setCurrentLesson(modules[prevModule].lessons.length - 1);
    }
  };

  const isLastLesson =
    currentModule === modules.length - 1 &&
    currentLesson === modules[currentModule].lessons.length - 1;

  const currentLessonData = modules[currentModule]?.lessons[currentLesson];

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] -mx-4 sm:-mx-6 lg:-mx-10 -mt-4 sm:-mt-6 lg:-mt-8">
      <div className="px-4 sm:px-6 lg:px-10 pt-4 sm:pt-6 lg:pt-8 mb-2 sm:mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Treinamento para Consultor Ynova</h1>
      </div>
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        <div className="hidden md:block">
          <TrainingSidebar
            modules={modules}
            currentModule={currentModule}
            currentLesson={currentLesson}
            onSelectLesson={handleSelectLesson}
            completedLessons={completedLessons}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10">
          <header className="sticky top-0 z-10 bg-white dark:bg-[#3E3E3E] p-3 sm:p-4 shadow mb-4 -mx-4 sm:-mx-6 lg:-mx-10">
            <div className="px-4 sm:px-6 lg:px-10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0">
                <div className="font-semibold text-sm sm:text-base truncate">
                  {modules[currentModule]?.title} → {currentLessonData?.title}
                </div>
                <div className="flex-1 md:ml-4 min-w-0">
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-1">Progresso: {progress}%</div>
                  <div className="w-full bg-gray-200 dark:bg-[#1E1E1E] rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-[#FE5200]"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {currentLessonData && (
            <div className="bg-white dark:bg-[#3E3E3E] rounded-lg shadow-md p-4 sm:p-6 mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {currentLessonData.title}
              </h2>
              {currentLessonData.subtitle && (
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4">
                  {currentLessonData.subtitle}
                </p>
              )}
              <VideoPlayer videoId={currentLessonData.videoId} />
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4">
            <button
              onClick={handlePrev}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg w-full sm:w-auto transition-colors text-sm sm:text-base"
            >
              ← Anterior
            </button>
            <button
              onClick={handleNext}
              disabled={isLastLesson}
              className={`bg-[#FE5200] hover:bg-[#FE5200]/90 text-white px-4 py-2 rounded-lg w-full sm:w-auto transition-colors text-sm sm:text-base ${isLastLesson ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Próximo →
            </button>
          </div>

          <div className="mb-4">
            <StudyMaterials />
          </div>

          <div className="mb-4 md:hidden">
            <TrainingSidebar
              modules={modules}
              currentModule={currentModule}
              currentLesson={currentLesson}
              onSelectLesson={handleSelectLesson}
              completedLessons={completedLessons}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

