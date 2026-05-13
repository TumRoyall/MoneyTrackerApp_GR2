import {
  GardenCurrentState,
  GardenFlowerState,
  GardenHistoryItem,
  GardenMonthlyReport,
  GardenQuality,
  GardenSeed,
  GardenStage,
  GardenTask,
  GardenWeather,
} from '@/modules/garden/models/garden.types';
import { seedCatalog } from '@/modules/garden/assets/seedCatalog';

const today = new Date();
const monthLabel = today.toLocaleString('vi-VN', { month: 'long' });
const yearValue = today.getFullYear();

const qualityByScore = (score: number): GardenQuality => {
  if (score < 35) return 'terrible';
  if (score < 50) return 'poor';
  if (score < 70) return 'average';
  if (score < 85) return 'good';
  return 'excellent';
};

const weatherByScore = (score: number): GardenWeather => {
  if (score < 40) return 'stormy';
  if (score < 55) return 'rainy';
  if (score < 75) return 'cloudy';
  if (score < 90) return 'sunny';
  return 'glowy';
};

const stageByProgress = (progress: number): GardenStage => {
  const stages: GardenStage[] = ['Seed', 'Sprout', 'YoungPlant', 'GrowingPlant', 'Budding', 'Blooming'];
  const index = Math.min(stages.length - 1, Math.max(0, Math.floor(progress * stages.length)));
  return stages[index];
};

const buildFlowerState = (score: number, progress: number): GardenFlowerState => ({
  stage: stageByProgress(progress),
  quality: qualityByScore(score),
  progress,
});

const baseSeed = seedCatalog[0];

let currentSeed: GardenSeed = baseSeed;
let currentScore = 62;
let currentProgress = 0.48;

const baseTasks: GardenTask[] = [
  {
    taskId: 'task-1',
    title: 'Ghi nhanh một khoản chi hôm nay',
    description: 'Chỉ cần 1 giao dịch, cây sẽ được tưới nước.',
    xp: 12,
    completed: false,
  },
  {
    taskId: 'task-2',
    title: 'Xem lại ngân sách trong 2 phút',
    description: 'Nhìn lại kế hoạch giúp hoa vươn thẳng hơn.',
    xp: 18,
    completed: false,
  },
  {
    taskId: 'task-3',
    title: 'Tiết kiệm một khoản nhỏ',
    description: 'Một bước nhỏ để lá thêm xanh.',
    xp: 20,
    completed: false,
  },
];

let tasksState: GardenTask[] = [...baseTasks];

const makeCurrentState = (): GardenCurrentState => {
  const scoreValue = currentScore;
  const flower = buildFlowerState(scoreValue, currentProgress);
  const tasksCompleted = tasksState.filter((task) => task.completed).length;
  return {
    month: monthLabel,
    seed: currentSeed,
    score: {
      value: scoreValue,
      label: 'Điểm chăm sóc',
    },
    weather: weatherByScore(scoreValue),
    flower,
    dailyStreak: 4,
    tasksCompletedToday: tasksCompleted,
    tasksTotalToday: tasksState.length,
    encouragement: 'Hôm nay cây của bạn đang phát triển rất tốt.',
    rewards: [
      {
        rewardId: 'reward-1',
        title: 'Bàn tay chăm sóc',
        description: 'Hoàn thành nhiệm vụ 3 ngày liên tiếp.',
        earnedAt: new Date().toISOString(),
        badgeColor: '#f3c369',
      },
    ],
  };
};

const makeHistory = (): GardenHistoryItem[] => [
  {
    month: 'Tháng 3',
    year: yearValue,
    seed: seedCatalog[2],
    score: { value: 78, label: 'Điểm chăm sóc' },
    flower: { stage: 'Blooming', quality: 'good', progress: 1 },
    completedAt: new Date(yearValue, 2, 30).toISOString(),
  },
  {
    month: 'Tháng 2',
    year: yearValue,
    seed: seedCatalog[1],
    score: { value: 66, label: 'Điểm chăm sóc' },
    flower: { stage: 'Blooming', quality: 'average', progress: 1 },
    completedAt: new Date(yearValue, 1, 28).toISOString(),
  },
  {
    month: 'Tháng 1',
    year: yearValue,
    seed: seedCatalog[3],
    score: { value: 84, label: 'Điểm chăm sóc' },
    flower: { stage: 'Blooming', quality: 'good', progress: 1 },
    completedAt: new Date(yearValue, 0, 31).toISOString(),
  },
];

const historyState = makeHistory();

const makeReport = (): GardenMonthlyReport => ({
  month: monthLabel,
  year: yearValue,
  seed: currentSeed,
  finalScore: { value: currentScore, label: 'Điểm chăm sóc' },
  savingsRate: 0.18,
  spendingChange: -0.07,
  achievements: ['Giữ nhịp ghi chép 10 ngày', 'Giảm chi tiêu tự phát 7%', 'Hoàn thành 14 nhiệm vụ'],
  replay: [
    { stage: 'Seed', quality: 'average', day: 1 },
    { stage: 'Sprout', quality: 'average', day: 6 },
    { stage: 'YoungPlant', quality: 'good', day: 12 },
    { stage: 'GrowingPlant', quality: 'good', day: 18 },
    { stage: 'Budding', quality: 'good', day: 24 },
    { stage: 'Blooming', quality: qualityByScore(currentScore), day: 30 },
  ],
});

export const gardenMockStore = {
  getCurrent: () => makeCurrentState(),
  getHistory: () => historyState,
  getReport: () => makeReport(),
  getTasks: () => tasksState,
  selectSeed: (seedId: string) => {
    const found = seedCatalog.find((seed) => seed.seedId === seedId);
    if (found) {
      currentSeed = found;
      currentProgress = 0.05;
      currentScore = 60;
      tasksState = tasksState.map((task) => ({ ...task, completed: false }));
    }
    return makeCurrentState();
  },
  completeTask: (taskId: string) => {
    tasksState = tasksState.map((task) =>
      task.taskId === taskId ? { ...task, completed: true } : task,
    );
    currentScore = Math.min(92, currentScore + 3);
    currentProgress = Math.min(1, currentProgress + 0.03);
    return tasksState;
  },
  getFlowerState: () => buildFlowerState(currentScore, currentProgress),
};
