import React, { useState, useEffect } from 'react';
import TrainingSidebar, { Module } from '../components/TrainingSidebar';
import VideoPlayer from '../components/VideoPlayer';

const modules: Module[] = Array.from({ length: 10 }, (_, i) => ({
  title: `Módulo ${i + 1}`,
  lessons: Array.from({ length: 3 + (i % 3) }, (_, j) => `Lição ${j + 1}`),
}));

export default function TrainingPage() {
  const [currentModule, setCurrentModule] = useState(0);
  const [currentLesson, setCurrentLesson] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('trainingProgress');
    if (stored) {
      setCompletedLessons(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('trainingProgress', JSON.stringify(completedLessons));
  }, [completedLessons]);

  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const completedCount = Object.keys(completedLessons).length;
  const progress = Math.round((completedCount / totalLessons) * 100);

  useEffect(() => {
    localStorage.setItem('trainingOverallProgress', progress.toString());
  }, [progress]);

  const handleSelectLesson = (mIndex: number, lIndex: number) => {
    setCurrentModule(mIndex);
    setCurrentLesson(lIndex);
    setIsSidebarOpen(false);
  };

  const handleNext = () => {
    const id = `${currentModule}-${currentLesson}`;
    setCompletedLessons((prev) => ({ ...prev, [id]: true }));

    const lessonsInModule = modules[currentModule].lessons.length;
    if (currentLesson < lessonsInModule - 1) {
      setCurrentLesson(currentLesson + 1);
    } else if (currentModule < modules.length - 1) {
      setCurrentModule(currentModule + 1);
      setCurrentLesson(0);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full">
      <div className="hidden md:block">
        <TrainingSidebar
          modules={modules}
          currentModule={currentModule}
          currentLesson={currentLesson}
          onSelectLesson={handleSelectLesson}
          completedLessons={completedLessons}
        />
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-64 bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <TrainingSidebar
              modules={modules}
              currentModule={currentModule}
              currentLesson={currentLesson}
              onSelectLesson={handleSelectLesson}
              completedLessons={completedLessons}
            />
          </div>
        </div>
      )}

      <div className="flex-1 p-4">
        <button
          className="md:hidden mb-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
          onClick={() => setIsSidebarOpen(true)}
        >
          Módulos
        </button>
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">Progresso: {progress}%</div>
        <VideoPlayer videoId="z_Xe5j8xkfI" />
        <button
          onClick={handleNext}
          className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
        >
          Próximo
        </button>
      </div>
    </div>
  );
}

