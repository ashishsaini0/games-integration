import { useState, useCallback, useRef, useEffect } from 'react';
import { createCandy, generateRandomBoard } from '../utils/generateLevels';

const BOARD_SIZE = 8;

function cloneBoard(board) {
  return board.map((row) =>
    row.map((cell) => (cell ? { ...cell } : null))
  );
}

/**
 * Find all matches of 3+. Returns an array of encoded positions (row * 8 + col).
 */
function findMatches(board) {
  const matched = [];
  const seen = new Uint8Array(64);

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const candy = board[row][col];
      if (candy === null) continue;
      const t = candy.type;

      if (col <= BOARD_SIZE - 3 &&
          board[row][col + 1]?.type === t &&
          board[row][col + 2]?.type === t) {
        let end = col + 2;
        while (end + 1 < BOARD_SIZE && board[row][end + 1]?.type === t) end++;
        for (let c = col; c <= end; c++) {
          const idx = row * BOARD_SIZE + c;
          if (!seen[idx]) { seen[idx] = 1; matched.push(idx); }
        }
      }

      if (row <= BOARD_SIZE - 3 &&
          board[row + 1]?.[col]?.type === t &&
          board[row + 2]?.[col]?.type === t) {
        let end = row + 2;
        while (end + 1 < BOARD_SIZE && board[end + 1]?.[col]?.type === t) end++;
        for (let r = row; r <= end; r++) {
          const idx = r * BOARD_SIZE + col;
          if (!seen[idx]) { seen[idx] = 1; matched.push(idx); }
        }
      }
    }
  }

  return matched;
}

function removeMatches(board, matched) {
  let score = 0;
  for (let i = 0; i < matched.length; i++) {
    const idx = matched[i];
    board[(idx / BOARD_SIZE) | 0][idx % BOARD_SIZE] = null;
    score += 10;
  }
  if (matched.length > 3) {
    score += (matched.length - 3) * 15;
  }
  return score;
}

function applyGravity(board) {
  for (let col = 0; col < BOARD_SIZE; col++) {
    const candies = [];
    for (let row = BOARD_SIZE - 1; row >= 0; row--) {
      if (board[row][col] !== null) {
        candies.push(board[row][col]);
      }
      board[row][col] = null;
    }
    for (let i = 0; i < candies.length; i++) {
      const newRow = BOARD_SIZE - 1 - i;
      const oldRow = candies[i].row;
      const dist = newRow - oldRow;
      candies[i].row = newRow;
      candies[i].col = col;
      if (dist > 0) candies[i].fallDistance = dist;
      board[newRow][col] = candies[i];
    }
  }
}

function spawnCandies(board, candyTypes) {
  for (let col = 0; col < BOARD_SIZE; col++) {
    let emptyCount = 0;
    for (let row = 0; row < BOARD_SIZE; row++) {
      if (board[row][col] === null) emptyCount++;
    }
    for (let row = 0; row < BOARD_SIZE; row++) {
      if (board[row][col] === null) {
        const type = candyTypes[Math.floor(Math.random() * candyTypes.length)];
        const candy = createCandy(type, row, col);
        candy.fallDistance = emptyCount;
        board[row][col] = candy;
      }
    }
  }
}

/**
 * In-place swap check — no board cloning needed.
 */
function hasValidMoves(board) {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (col < BOARD_SIZE - 1) {
        [board[row][col], board[row][col + 1]] = [board[row][col + 1], board[row][col]];
        const has = findMatches(board).length > 0;
        [board[row][col], board[row][col + 1]] = [board[row][col + 1], board[row][col]];
        if (has) return true;
      }
      if (row < BOARD_SIZE - 1) {
        [board[row][col], board[row + 1][col]] = [board[row + 1][col], board[row][col]];
        const has = findMatches(board).length > 0;
        [board[row][col], board[row + 1][col]] = [board[row + 1][col], board[row][col]];
        if (has) return true;
      }
    }
  }
  return false;
}

function matchedToSet(matched) {
  const set = new Set();
  for (let i = 0; i < matched.length; i++) set.add(matched[i]);
  return set;
}

function scheduleFrame(callback, delayMs) {
  return setTimeout(() => requestAnimationFrame(callback), delayMs);
}

const EMPTY_SET = new Set();

export function useGameLogic(levels, callbacks = {}, startLevel = 0) {
  const [currentLevel, setCurrentLevel] = useState(startLevel);
  const [levelVersion, setLevelVersion] = useState(0);
  const [prevLevelKey, setPrevLevelKey] = useState('init');
  const [board, setBoard] = useState([]);
  const [score, setScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(0);
  const [gameState, setGameState] = useState('playing');
  const [selectedCandy, setSelectedCandy] = useState(null);
  const [animatingCells, setAnimatingCells] = useState(EMPTY_SET);
  const [shakeCell, setShakeCell] = useState(null);
  const [paused, setPaused] = useState(false);
  const isProcessing = useRef(false);
  const candyTypesRef = useRef([0, 1, 2, 3]);
  const cbRef = useRef(callbacks);
  const cascadeRef = useRef(null);
  const timersRef = useRef([]);

  // Sync callback ref in effect
  useEffect(() => { cbRef.current = callbacks; });

  const clearAllTimers = useCallback(() => {
    const timers = timersRef.current;
    for (let i = 0; i < timers.length; i++) clearTimeout(timers[i]);
    timers.length = 0;
  }, []);

  const addTimer = useCallback((callback, delayMs) => {
    const id = scheduleFrame(callback, delayMs);
    timersRef.current.push(id);
    return id;
  }, []);

  // Cleanup timers on unmount
  useEffect(() => clearAllTimers, [clearAllTimers]);

  // Reset state when level or version changes (React-approved "adjusting state during render")
  const levelKey = `${currentLevel}-${levelVersion}`;
  if (levelKey !== prevLevelKey && levels?.[currentLevel]) {
    setPrevLevelKey(levelKey);
    const level = levels[currentLevel];
    setBoard(cloneBoard(level.board));
    setScore(0);
    setMovesLeft(level.moves);
    setGameState('playing');
    setSelectedCandy(null);
    setAnimatingCells(EMPTY_SET);
    setShakeCell(null);
  }

  // Sync refs when level changes (must be in effect per React 19 rules)
  useEffect(() => {
    if (levels?.[currentLevel]) {
      clearAllTimers();
      candyTypesRef.current = levels[currentLevel].candyTypes;
      isProcessing.current = false;
    }
  }, [currentLevel, levelVersion, levels, clearAllTimers]);

  const processCascade = useCallback(
    (currentBoard, runningScore, currentMovesLeft) => {
      const matched = findMatches(currentBoard);

      if (matched.length === 0) {
        isProcessing.current = false;
        setAnimatingCells(EMPTY_SET);

        if (!hasValidMoves(currentBoard)) {
          const freshBoard = generateRandomBoard(candyTypesRef.current);
          setBoard(freshBoard);
        }
        return;
      }

      cbRef.current.onMatch?.();
      setAnimatingCells(matchedToSet(matched));

      addTimer(() => {
        const newBoard = cloneBoard(currentBoard);
        const gained = removeMatches(newBoard, matched);
        const newScore = runningScore + gained;
        setScore(newScore);
        setTotalScore((prev) => prev + gained);

        addTimer(() => {
          applyGravity(newBoard);
          spawnCandies(newBoard, candyTypesRef.current);
          setBoard(cloneBoard(newBoard));
          setAnimatingCells(EMPTY_SET);

          const level = levels[currentLevel];
          if (newScore >= level.targetScore) {
            setGameState('won');
            isProcessing.current = false;
            cbRef.current.onLevelComplete?.();
            return;
          }
          if (currentMovesLeft <= 0 && newScore < level.targetScore) {
            setGameState('lost');
            isProcessing.current = false;
            cbRef.current.onFail?.();
            return;
          }

          addTimer(() => {
            cascadeRef.current(newBoard, newScore, currentMovesLeft);
          }, 180);
        }, 180);
      }, 260);
    },
    [levels, currentLevel, addTimer]
  );

  // Keep cascade ref in sync via effect
  useEffect(() => { cascadeRef.current = processCascade; });

  const swapCandies = useCallback(
    (row1, col1, row2, col2) => {
      if (isProcessing.current || paused) return;
      if (gameState !== 'playing') return;

      const rowDiff = Math.abs(row1 - row2);
      const colDiff = Math.abs(col1 - col2);
      if (rowDiff + colDiff !== 1) return;

      const newBoard = cloneBoard(board);
      [newBoard[row1][col1], newBoard[row2][col2]] = [
        newBoard[row2][col2],
        newBoard[row1][col1],
      ];
      if (newBoard[row1][col1]) {
        newBoard[row1][col1].row = row1;
        newBoard[row1][col1].col = col1;
      }
      if (newBoard[row2][col2]) {
        newBoard[row2][col2].row = row2;
        newBoard[row2][col2].col = col2;
      }

      const matched = findMatches(newBoard);
      if (matched.length === 0) {
        setShakeCell({ row: row1, col: col1 });
        addTimer(() => setShakeCell(null), 380);
        return;
      }

      cbRef.current.onSwap?.();

      const newMoves = movesLeft - 1;
      setMovesLeft(newMoves);
      setBoard(newBoard);
      isProcessing.current = true;

      addTimer(() => {
        processCascade(newBoard, score, newMoves);
      }, 100);
    },
    [board, movesLeft, score, gameState, paused, processCascade, addTimer]
  );

  const handleCandyClick = useCallback(
    (row, col) => {
      if (isProcessing.current || paused || gameState !== 'playing') return;

      if (selectedCandy) {
        swapCandies(selectedCandy.row, selectedCandy.col, row, col);
        setSelectedCandy(null);
      } else {
        setSelectedCandy({ row, col });
      }
    },
    [selectedCandy, gameState, paused, swapCandies]
  );

  const handleDragSwap = useCallback(
    (fromRow, fromCol, toRow, toCol) => {
      if (isProcessing.current || paused || gameState !== 'playing') return;
      setSelectedCandy(null);
      swapCandies(fromRow, fromCol, toRow, toCol);
    },
    [gameState, paused, swapCandies]
  );

  const nextLevel = useCallback(() => {
    if (currentLevel < 99) {
      setCurrentLevel((prev) => prev + 1);
    }
  }, [currentLevel]);

  const retryLevel = useCallback(() => {
    setLevelVersion((v) => v + 1);
  }, []);

  const goToLevel = useCallback((levelIndex) => {
    setCurrentLevel(levelIndex);
    setTotalScore(0);
    setLevelVersion((v) => v + 1);
  }, []);

  const restartGame = useCallback(() => {
    goToLevel(0);
  }, [goToLevel]);

  const togglePause = useCallback(() => {
    if (gameState === 'playing') {
      setPaused((p) => !p);
    }
  }, [gameState]);

  return {
    board,
    score,
    totalScore,
    movesLeft,
    gameState,
    currentLevel,
    selectedCandy,
    animatingCells,
    shakeCell,
    paused,
    targetScore: levels?.[currentLevel]?.targetScore ?? 0,
    handleCandyClick,
    handleDragSwap,
    nextLevel,
    retryLevel,
    restartGame,
    goToLevel,
    togglePause,
  };
}
