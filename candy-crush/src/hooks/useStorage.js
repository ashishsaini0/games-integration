import { useState, useCallback } from 'react';

const STORAGE_KEY = 'candy-crush-save';

function loadSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* corrupt data */ }
  return null;
}

function writeSave(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* storage full */ }
}

const DEFAULT_SAVE = {
  highestLevel: 0,
  totalScore: 0,
  levelScores: {},
  soundEnabled: true,
};

export function useStorage() {
  const [save, setSave] = useState(() => {
    const stored = loadSave();
    return stored ? { ...DEFAULT_SAVE, ...stored } : { ...DEFAULT_SAVE };
  });

  const updateSave = useCallback((updater) => {
    setSave((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      writeSave(next);
      return next;
    });
  }, []);

  const completeLevel = useCallback((levelIndex, score) => {
    updateSave((prev) => {
      const bestScore = Math.max(prev.levelScores[levelIndex] || 0, score);
      const newLevelScores = { ...prev.levelScores, [levelIndex]: bestScore };
      const newTotalScore = Object.values(newLevelScores).reduce((a, b) => a + b, 0);
      return {
        ...prev,
        highestLevel: Math.max(prev.highestLevel, levelIndex + 1),
        totalScore: newTotalScore,
        levelScores: newLevelScores,
      };
    });
  }, [updateSave]);

  const toggleSound = useCallback(() => {
    updateSave((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, [updateSave]);

  const resetProgress = useCallback(() => {
    updateSave(() => ({ ...DEFAULT_SAVE }));
  }, [updateSave]);

  return {
    highestLevel: save.highestLevel,
    totalScore: save.totalScore,
    levelScores: save.levelScores,
    soundEnabled: save.soundEnabled,
    completeLevel,
    toggleSound,
    resetProgress,
  };
}
