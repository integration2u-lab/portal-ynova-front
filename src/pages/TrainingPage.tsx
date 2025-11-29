import React, { useState, useEffect } from 'react';
import TrainingSidebar, { Module } from '../components/TrainingSidebar';
import VideoPlayer from '../components/VideoPlayer';
import StudyMaterials from '../components/StudyMaterials';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
        videoUrl: 'https://www.youtube.com/watch?v=mqn4JHL8YVw',
        videoId: extractVideoId('https://www.youtube.com/watch?v=mqn4JHL8YVw'),
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
        title: '3.1 Bom demais para ser verdade...',
        subtitle: 'produto varejo - pacote i5 / opções i1 / conv',
        videoUrl: 'https://youtu.be/YNX5U8OUkXo',
        videoId: extractVideoId('https://youtu.be/YNX5U8OUkXo'),
      },
      {
        id: '3.2',
        title: '3.2 De onde vem a Economia - Energia',
        subtitle: 'TE',
        videoUrl: 'https://youtu.be/7VL63fPdMgs',
        videoId: extractVideoId('https://youtu.be/7VL63fPdMgs'),
      },
      {
        id: '3.3',
        title: '3.3 De onde vem a Economia - Distribuição',
        subtitle: 'TUSD ponta',
        videoUrl: 'https://youtu.be/1STJh5jSGS0',
        videoId: extractVideoId('https://youtu.be/1STJh5jSGS0'),
      },
      {
        id: '3.4',
        title: '3.4 De onde vem a Economia - Demanda',
        subtitle: 'Demanda contratada',
        videoUrl: 'https://youtu.be/jVYYrZm18q4',
        videoId: extractVideoId('https://youtu.be/jVYYrZm18q4'),
      },
      {
        id: '3.5',
        title: '3.5 De onde vem a Economia - Gestão',
        subtitle: 'Otimização e gestão: demanda, modalidade, reativa, planejamento',
        videoUrl: 'https://youtu.be/I3mcNsVisOc',
        videoId: extractVideoId('https://youtu.be/I3mcNsVisOc'),
      },
      {
        id: '3.6',
        title: '3.6 Como funciona na prática?',
        subtitle: 'como funciona - distribuidora/gerador faturas',
        videoUrl: 'https://youtu.be/AJpMGj5ztJY',
        videoId: extractVideoId('https://youtu.be/AJpMGj5ztJY'),
      },
      {
        id: '3.7',
        title: '3.7 Os números não mentem',
        subtitle: 'números ML 95 - negociar preço/prazo/condições, 38k-64k+80k',
        videoUrl: 'https://youtu.be/-NeghTmCjbw',
        videoId: extractVideoId('https://youtu.be/-NeghTmCjbw'),
      },
      {
        id: '3.8',
        title: '3.8 O lado ruim que ajuda sua venda!',
        subtitle: 'alguma notícia ruim - 6 meses pra migrar, 3 faturas, CP',
        videoUrl: 'https://youtu.be/9MEDojVa4j0',
        videoId: extractVideoId('https://youtu.be/9MEDojVa4j0'),
      },
    ],
  },
  {
    title: '4. Conhecendo o Setor',
    lessons: [
      {
        id: '4.1',
        title: '4.1 A dica do Lobo de Wall Street',
        subtitle: 'Jordan Belfort - afiado, especialista no setor, entusiasmado',
        videoUrl: 'https://youtu.be/lwdN0TRNcvc',
        videoId: extractVideoId('https://youtu.be/lwdN0TRNcvc'),
      },
      {
        id: '4.2',
        title: '4.2 O que mais temos no Mercado Livre?',
        subtitle: 'soluções ML - atacado (flex, garantia, conv, CP), varejo, desconto garantido (P e bandeira)',
        videoUrl: 'https://youtu.be/4AfiE6RorGw',
        videoId: extractVideoId('https://youtu.be/4AfiE6RorGw'),
      },
      {
        id: '4.3',
        title: '4.3 O que mais temos para Energia?',
        subtitle: 'soluções - GD, solar (híbrido/zerogrid)',
        videoUrl: 'https://youtu.be/RVSzKkJeIwo',
        videoId: extractVideoId('https://youtu.be/RVSzKkJeIwo'),
      },
      {
        id: '4.4',
        title: '4.4 O que mais temos no Setor Elétrico?',
        subtitle: 'parceiros e soluções - banco capacitor, telemetria, I-REC, bateria',
        videoUrl: 'https://youtu.be/TiVdHWW10yY',
        videoId: extractVideoId('https://youtu.be/TiVdHWW10yY'),
      },
      {
        id: '4.5',
        title: '4.5 As Siglas do Setor',
        subtitle: 'Aneel, CCEE, ONS, SIN, geração/transmissão/distribuição, MME, PLD',
        videoUrl: 'https://youtu.be/AtRg2inL04E',
        videoId: extractVideoId('https://youtu.be/AtRg2inL04E'),
      },
      {
        id: '4.6',
        title: '4.6 O que está por vir?',
        subtitle: 'MP',
        videoUrl: 'https://youtu.be/NfmJUsEQsc0',
        videoId: extractVideoId('https://youtu.be/NfmJUsEQsc0'),
      },
    ],
  },
  {
    title: '5. Comercial',
    lessons: [
      {
        id: '5.1',
        title: '5.1 Nada acontece sem uma Venda!',
        subtitle: 'papel comercial - Brian Tracy: vendas',
        videoUrl: 'https://youtu.be/Od2-K3Oriq8',
        videoId: extractVideoId('https://youtu.be/Od2-K3Oriq8'),
      },
      {
        id: '5.2',
        title: '5.2 Quanto você quer faturar?',
        subtitle: 'plano — estratégia comercial, meta, vendas, apresentações, contatos',
        videoUrl: 'https://youtu.be/NNzfXPWLB5k',
        videoId: extractVideoId('https://youtu.be/NNzfXPWLB5k'),
      },
      {
        id: '5.3',
        title: '5.3 Quem? E Quando?',
        subtitle: 'Decisor, necessidade, $, urgência',
        videoUrl: 'https://youtu.be/MSiKYzZYSZ0',
        videoId: extractVideoId('https://youtu.be/MSiKYzZYSZ0'),
      },
      {
        id: '5.4',
        title: '5.4 Abrindo Oportunidades',
        subtitle: 'prospecção/rapport — toda venda é emocional / dosar tecnicidade',
        videoUrl: 'https://youtu.be/A_f33P7OTiI',
        videoId: extractVideoId('https://youtu.be/A_f33P7OTiI'),
      },
      {
        id: '5.5',
        title: '5.5 O Segredo de Ouro das Vendas',
        subtitle: 'necessidades',
        videoUrl: 'https://youtu.be/2QmsPGzUXtg',
        videoId: extractVideoId('https://youtu.be/2QmsPGzUXtg'),
      },
      {
        id: '5.6',
        title: '5.6 Dando Match!',
        subtitle: 'apresentação — benefícios, histórias, confirmações',
        videoUrl: 'https://youtu.be/jE2Xqnqnn2s',
        videoId: extractVideoId('https://youtu.be/jE2Xqnqnn2s'),
      },
      {
        id: '5.7',
        title: '5.7 Tenha sempre uma Carta na Manga!',
        subtitle: 'negociação — sem garantia, sem custo migração, 100% flex, condição especial DESEJO',
        videoUrl: 'https://youtu.be/4yTid-k8KsY',
        videoId: extractVideoId('https://youtu.be/4yTid-k8KsY'),
      },
      {
        id: '5.8',
        title: '5.8 Seja Esperto, Antecipe as Dúvidas!',
        subtitle: 'esclarecimento — fico sem energia? fio novo? solar? distribuidora boicota? faturas-relatório? ANTECIPAR',
        videoUrl: 'https://youtu.be/RoQQ0ajLERg',
        videoId: extractVideoId('https://youtu.be/RoQQ0ajLERg'),
      },
      {
        id: '5.9',
        title: '5.9 Respire e Avance!',
        subtitle: 'objeções — investimento, momento certo, melhor preço/economia, empresa certa? prazo, contrato/jurídico',
        videoUrl: 'https://youtu.be/4jMjeXxmRSA',
        videoId: extractVideoId('https://youtu.be/4jMjeXxmRSA'),
      },
      {
        id: '5.10',
        title: '5.10 A Hora H!',
        subtitle: 'fechamento',
        videoUrl: 'https://youtu.be/YEHaI5GlpnY',
        videoId: extractVideoId('https://youtu.be/YEHaI5GlpnY'),
      },
      {
        id: '5.11',
        title: '5.11 O Conselho do Flávio Augusto',
        subtitle: 'Flávio Augusto — ambição, técnica e inteligência emocional (gestão das emoções)',
        videoUrl: 'https://youtu.be/73xGN5f-ouU',
        videoId: extractVideoId('https://youtu.be/73xGN5f-ouU'),
      },
    ],
  },
  {
    title: '6. Desfecho',
    lessons: [
      {
        id: '6.1',
        title: '6.1 Agora é com você!',
        subtitle: 'mão na massa, aprender juntos, comissões agressivas, campanhas, executivos',
        videoUrl: 'https://youtu.be/cu77JVwpeI4',
        videoId: extractVideoId('https://youtu.be/cu77JVwpeI4'),
      },
    ],
  },
];

export default function TrainingPage() {
  const [currentModule, setCurrentModule] = useState(0);
  const [currentLesson, setCurrentLesson] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <div className="flex-shrink-0 mb-2 hidden md:block">
        <h1 className="text-base font-semibold text-gray-900 dark:text-white">Treinamento</h1>
      </div>
      <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden gap-4">
        <div className={`hidden md:flex md:flex-shrink-0 md:h-full transition-all duration-300 relative ${
          isSidebarCollapsed ? 'md:w-16' : 'md:w-64 lg:w-72'
        }`}>
          <TrainingSidebar
            modules={modules}
            currentModule={currentModule}
            currentLesson={currentLesson}
            onSelectLesson={handleSelectLesson}
            completedLessons={completedLessons}
            isCollapsed={isSidebarCollapsed}
          />
          <button
            className="hidden md:flex items-center justify-center w-6 h-12 absolute right-0 top-4 -mr-3 z-10 bg-white dark:bg-[#3E3E3E] border border-gray-200 dark:border-[#1E1E1E] rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2E2E2E] transition-colors shadow-sm"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            aria-label={isSidebarCollapsed ? "Expandir módulos" : "Recolher módulos"}
            title={isSidebarCollapsed ? "Expandir módulos" : "Recolher módulos"}
          >
            {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto min-h-0">
            {currentLessonData && (
              <div className="bg-white dark:bg-[#3E3E3E] rounded-lg shadow-md p-4 sm:p-6 mb-4 max-w-4xl mx-auto">
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

            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mb-4">
              <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
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
              <div className="flex-1 sm:flex-initial flex items-center gap-2 w-full sm:w-48 min-w-0">
                <div className="flex-1 bg-gray-200 dark:bg-[#1E1E1E] rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-[#FE5200] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{progress}%</span>
              </div>
            </div>

            <div className="mb-4">
              <StudyMaterials />
            </div>
          </div>
        </div>
      </div>

      <div className="md:hidden mt-4">
        <TrainingSidebar
          modules={modules}
          currentModule={currentModule}
          currentLesson={currentLesson}
          onSelectLesson={handleSelectLesson}
          completedLessons={completedLessons}
        />
      </div>
    </div>
  );
}

