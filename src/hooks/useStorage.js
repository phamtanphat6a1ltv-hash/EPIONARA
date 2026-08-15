import { create } from 'zustand';
import { DB } from "../utils/db.js";

const useStore = create((set, get) => ({
  journals: [],
  aiHistory: [],
  testResults: {},
  snapshots: [],
  stats: { avgMood: null, streak: 0, totalDays: 0, tests: {}, posRate: null, todayJournal: null, aiCount: 0, streakRecoveriesLeft: 5, canRecover: false, breakDateStr: null, recoveredDates: [] },
  letters: [],
  garden: { isWatered: false, quests: [], xp: 0 },
  cbtRecords: [],
  isLoaded: false,

  init: async (force = false) => {
    if (get().isLoaded && !force) return;
    const journals = await DB.getJournals();
    const aiHistory = await DB.getAIHistory();
    const testResults = await DB.getTestResults();
    const snapshots = await DB.getGrowthSnapshots();
    const stats = await DB.getStats();
    const letters = await DB.getLetters();
    const garden = await DB.getGarden();
    const cbtRecords = await DB.getCbtRecords();
    set({
      journals,
      aiHistory,
      testResults,
      snapshots,
      stats,
      letters,
      garden,
      cbtRecords,
      isLoaded: true
    });
  },

  addJournal: async (entry) => {
    const updated = await DB.addJournal(entry);
    const stats = await DB.getStats();
    set({ journals: updated, stats });
    return updated;
  },
  refreshJournals: async () => {
    const journals = await DB.getJournals();
    const stats = await DB.getStats();
    set({ journals, stats });
  },

  addAIHistory: async (entry) => {
    const updated = await DB.addAIHistory(entry);
    const stats = await DB.getStats();
    set({ aiHistory: updated, stats });
    return updated;
  },

  saveTestResult: async (testId, result) => {
    await DB.saveTestResult(testId, result);
    const testResults = await DB.getTestResults();
    const stats = await DB.getStats();
    set({ testResults, stats });
  },

  addGrowthSnapshot: async (snap) => {
    const updated = await DB.addGrowthSnapshot(snap);
    set({ snapshots: updated });
    return updated;
  },

  refreshStats: async () => {
    const stats = await DB.getStats();
    set({ stats });
  },
  recoverStreak: async () => {
    const result = await DB.recoverStreak();
    const stats = await DB.getStats();
    set({ stats });
    return result;
  },

  addLetter: async (letter) => {
    const updated = await DB.addLetter(letter);
    set({ letters: updated });
    return updated;
  },
  updateLetter: async (id, changes) => {
    const updated = await DB.updateLetter(id, changes);
    set({ letters: updated });
    return updated;
  },
  updateGarden: async (changes) => {
    const newGarden = { ...get().garden, ...changes };
    await DB.saveGarden(newGarden);
    set({ garden: newGarden });
  },
  rewardXP: async (amt, questIdx = null) => {
    await DB.rewardXP(amt, questIdx);
    const garden = await DB.getGarden();
    set({ garden });
  },
  addCbtRecord: async (record) => {
    const updated = await DB.addCbtRecord(record);
    set({ cbtRecords: updated });
    return updated;
  },
  deleteCbtRecord: async (id) => {
    const updated = await DB.deleteCbtRecord(id);
    set({ cbtRecords: updated });
    return updated;
  }
}));

export const initStore = (force = false) => useStore.getState().init(force);

export function useCbtRecords() {
  const cbtRecords = useStore(state => state.cbtRecords);
  const addRecord = useStore(state => state.addCbtRecord);
  const deleteRecord = useStore(state => state.deleteCbtRecord);
  return { cbtRecords, addRecord, deleteRecord };
}

// Backwards compatibility wrappers
export function useJournals() {
  const journals = useStore(state => state.journals);
  const addJournal = useStore(state => state.addJournal);
  const refresh = useStore(state => state.refreshJournals);
  return { journals, addJournal, refresh };
}

export function useAIHistory() {
  const aiHistory = useStore(state => state.aiHistory);
  const addEntry = useStore(state => state.addAIHistory);
  return { aiHistory, addEntry };
}

export function useTestResults() {
  const testResults = useStore(state => state.testResults);
  const saveResult = useStore(state => state.saveTestResult);
  return { testResults, saveResult };
}

export function useGrowthSnapshots() {
  const snapshots = useStore(state => state.snapshots);
  const addSnapshot = useStore(state => state.addGrowthSnapshot);
  return { snapshots, addSnapshot };
}

export function useStats() {
  const stats = useStore(state => state.stats);
  const refresh = useStore(state => state.refreshStats);
  const recoverStreak = useStore(state => state.recoverStreak);
  return { stats, refresh, recoverStreak };
}

export function useLetters() {
  const letters = useStore(state => state.letters);
  const addLetter = useStore(state => state.addLetter);
  const updateLetter = useStore(state => state.updateLetter);
  return { letters, addLetter, updateLetter };
}

export function useGarden() {
  const garden = useStore(state => state.garden);
  const updateGarden = useStore(state => state.updateGarden);
  const rewardXP = useStore(state => state.rewardXP);
  return { garden, updateGarden, rewardXP };
}
