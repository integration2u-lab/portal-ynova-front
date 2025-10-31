import React, { useState, useEffect } from 'react';
import { ChevronDown, CheckCircle } from 'lucide-react';

export interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  videoUrl: string;
  videoId: string;
}

export interface Module {
  title: string;
  lessons: Lesson[];
}

interface TrainingSidebarProps {
  modules: Module[];
  currentModule: number;
  currentLesson: number;
  onSelectLesson: (moduleIndex: number, lessonIndex: number) => void;
  completedLessons: Set<string>;
  isCollapsed?: boolean;
}

export default function TrainingSidebar({
  modules,
  currentModule,
  currentLesson,
  onSelectLesson,
  completedLessons,
  isCollapsed = false,
}: TrainingSidebarProps) {
  const [openModule, setOpenModule] = useState<number | null>(currentModule);

  useEffect(() => {
    setOpenModule(currentModule);
  }, [currentModule]);

  const toggleModule = (index: number) => {
    setOpenModule(openModule === index ? null : index);
  };

  if (isCollapsed) {
    return (
      <div className="w-full h-full flex flex-col bg-white dark:bg-[#3E3E3E] border-t md:border-t-0 md:border-r border-gray-200 dark:border-[#1E1E1E] text-gray-900 dark:text-gray-100 overflow-hidden">
        <div className="flex-1 overflow-hidden min-h-0">
          {modules.map((module, mIndex) => {
            const moduleNum = module.title.match(/^\d+/)?.[0] || (mIndex + 1).toString();
            const isActive = mIndex === currentModule;
            const hasCompletedAll = module.lessons.every((_, lIndex) => 
              completedLessons.has(`${mIndex}-${lIndex}`)
            );
            return (
              <div key={module.title} className="relative group">
                <button
                  onClick={() => {
                    if (!isActive) {
                      onSelectLesson(mIndex, 0);
                    }
                  }}
                  className={`w-full flex items-center justify-center py-3 border-b border-gray-200 dark:border-[#1E1E1E] hover:bg-gray-50 dark:hover:bg-[#2E2E2E] transition-colors ${
                    isActive
                      ? 'bg-[#FE5200]/10 text-[#FE5200] dark:bg-[#FE5200]/20 dark:text-[#FE5200]'
                      : 'text-gray-700 dark:text-gray-200'
                  }`}
                  title={module.title}
                >
                  <span className="text-sm font-semibold">{moduleNum}</span>
                  {hasCompletedAll && (
                    <CheckCircle
                      size={12}
                      className="absolute top-1 right-1 text-green-500"
                    />
                  )}
                </button>
                <span className="absolute left-full ml-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                  {module.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-[#3E3E3E] border-t md:border-t-0 md:border-r border-gray-200 dark:border-[#1E1E1E] text-gray-900 dark:text-gray-100 overflow-hidden">
      <div className="flex-1 overflow-hidden min-h-0">
        {modules.map((module, mIndex) => (
          <div key={module.title}>
            <button
              onClick={() => toggleModule(mIndex)}
              className="w-full flex items-center justify-between px-3 sm:px-4 py-2 text-left text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-[#1E1E1E] hover:bg-gray-50 dark:hover:bg-[#2E2E2E] transition-colors"
            >
              <span className="truncate">{module.title}</span>
              <ChevronDown
                size={16}
                className={`transition-transform flex-shrink-0 ${openModule === mIndex ? 'rotate-180' : ''}`}
              />
            </button>
            {openModule === mIndex && (
              <div className="px-3 sm:px-4 py-2 space-y-1">
                {module.lessons.map((lesson, lIndex) => {
                  const id = `${mIndex}-${lIndex}`;
                  const isActive =
                    mIndex === currentModule && lIndex === currentLesson;
                  const isCompleted = completedLessons.has(id);
                  return (
                    <button
                      key={id}
                      onClick={() => onSelectLesson(mIndex, lIndex)}
                      className={`w-full flex items-center text-left px-2 py-1.5 rounded-md text-xs sm:text-sm transition-colors ${
                        isActive
                          ? 'bg-[#FE5200]/10 text-[#FE5200] dark:bg-[#FE5200]/20 dark:text-[#FE5200]'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1E1E1E]'
                      }`}
                    >
                      {isCompleted && (
                        <CheckCircle
                          size={14}
                          className="text-green-500 mr-2 flex-shrink-0"
                        />
                      )}
                      {!isCompleted && <span className="w-4 mr-2" />}
                      <span className="truncate">{lesson.title}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

