import React, { useState } from 'react';
import { ChevronDown, CheckCircle } from 'lucide-react';

export interface Module {
  title: string;
  lessons: string[];
}

interface TrainingSidebarProps {
  modules: Module[];
  currentModule: number;
  currentLesson: number;
  onSelectLesson: (moduleIndex: number, lessonIndex: number) => void;
  completedLessons: Record<string, boolean>;
}

export default function TrainingSidebar({
  modules,
  currentModule,
  currentLesson,
  onSelectLesson,
  completedLessons,
}: TrainingSidebarProps) {
  const [openModule, setOpenModule] = useState<number | null>(0);

  const toggleModule = (index: number) => {
    setOpenModule(openModule === index ? null : index);
  };

  return (
    <div className="w-64 md:w-72 bg-white border-r h-full overflow-y-auto">
      {modules.map((module, mIndex) => (
        <div key={module.title}>
          <button
            onClick={() => toggleModule(mIndex)}
            className="w-full flex items-center justify-between px-4 py-2 text-left font-medium border-b"
          >
            {module.title}
            <ChevronDown
              size={16}
              className={`transition-transform ${openModule === mIndex ? 'rotate-180' : ''}`}
            />
          </button>
          {openModule === mIndex && (
            <div className="px-4 py-2 space-y-1">
              {module.lessons.map((lesson, lIndex) => {
                const id = `${mIndex}-${lIndex}`;
                const isActive =
                  mIndex === currentModule && lIndex === currentLesson;
                return (
                  <button
                    key={id}
                    onClick={() => onSelectLesson(mIndex, lIndex)}
                    className={`w-full flex items-center text-left px-2 py-1 rounded-md text-sm ${
                      isActive
                        ? 'bg-orange-50 text-orange-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {completedLessons[id] && (
                      <CheckCircle
                        size={14}
                        className="text-green-500 mr-2 flex-shrink-0"
                      />
                    )}
                    {!completedLessons[id] && <span className="w-4 mr-2" />}
                    {lesson}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

