import { create } from 'zustand';
import { Question } from '../types';

interface QuizState {
  assessmentId: number | null;
  questions: Question[];
  answers: Record<string, string>;
  currentIndex: number;
  timeLeft: number;
  started: boolean;
  setQuiz: (assessmentId: number, questions: Question[]) => void;
  setAnswer: (questionId: string, answer: string) => void;
  setCurrentIndex: (index: number) => void;
  setTimeLeft: (time: number) => void;
  reset: () => void;
}

export const useQuizStore = create<QuizState>((set) => ({
  assessmentId: null,
  questions: [],
  answers: {},
  currentIndex: 0,
  timeLeft: 3600,
  started: false,
  setQuiz: (assessmentId, questions) =>
    set({ assessmentId, questions, answers: {}, currentIndex: 0, timeLeft: 3600, started: true }),
  setAnswer: (questionId, answer) =>
    set((state) => ({ answers: { ...state.answers, [questionId]: answer } })),
  setCurrentIndex: (index) => set({ currentIndex: index }),
  setTimeLeft: (time) => set({ timeLeft: time }),
  reset: () => set({ assessmentId: null, questions: [], answers: {}, currentIndex: 0, timeLeft: 3600, started: false }),
}));
