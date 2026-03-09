// 6 candy colors with distinct visual identities
export const CANDY_TYPES = [
  { id: 0, color: '#FF6B6B', name: 'red' },
  { id: 1, color: '#4ECDC4', name: 'teal' },
  { id: 2, color: '#45B7D1', name: 'blue' },
  { id: 3, color: '#96CEB4', name: 'green' },
  { id: 4, color: '#FFEAA7', name: 'yellow' },
  { id: 5, color: '#DDA0DD', name: 'purple' },
];

const BOARD_SIZE = 8;

let nextCandyId = 1;

export function createCandy(type, row, col) {
  return { id: nextCandyId++, type, row, col };
}

function seededRandom(seed) {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/**
 * Check if placing candy `type` at (row, col) creates a 3-in-a-row.
 */
function wouldMatch(board, row, col, type) {
  if (
    col >= 2 &&
    board[row][col - 1]?.type === type &&
    board[row][col - 2]?.type === type
  ) {
    return true;
  }
  if (
    row >= 2 &&
    board[row - 1][col]?.type === type &&
    board[row - 2][col]?.type === type
  ) {
    return true;
  }
  return false;
}

/**
 * Find all matches of 3+ on a board. Returns a Set of "row,col" keys.
 */
function findMatchesOnBoard(board) {
  const matched = new Set();
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const candy = board[row][col];
      if (!candy) continue;
      const t = candy.type;

      if (col <= BOARD_SIZE - 3) {
        if (board[row][col + 1]?.type === t && board[row][col + 2]?.type === t) {
          let end = col + 2;
          while (end + 1 < BOARD_SIZE && board[row][end + 1]?.type === t) end++;
          for (let c = col; c <= end; c++) matched.add(`${row},${c}`);
        }
      }
      if (row <= BOARD_SIZE - 3) {
        if (board[row + 1]?.[col]?.type === t && board[row + 2]?.[col]?.type === t) {
          let end = row + 2;
          while (end + 1 < BOARD_SIZE && board[end + 1]?.[col]?.type === t) end++;
          for (let r = row; r <= end; r++) matched.add(`${r},${col}`);
        }
      }
    }
  }
  return matched;
}

/**
 * Check if the board has at least one valid swap that produces a match.
 */
function boardHasValidMove(board) {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (col < BOARD_SIZE - 1) {
        // Swap right
        [board[row][col], board[row][col + 1]] = [board[row][col + 1], board[row][col]];
        const has = findMatchesOnBoard(board).size > 0;
        [board[row][col], board[row][col + 1]] = [board[row][col + 1], board[row][col]];
        if (has) return true;
      }
      if (row < BOARD_SIZE - 1) {
        // Swap down
        [board[row][col], board[row + 1][col]] = [board[row + 1][col], board[row][col]];
        const has = findMatchesOnBoard(board).size > 0;
        [board[row][col], board[row + 1][col]] = [board[row + 1][col], board[row][col]];
        if (has) return true;
      }
    }
  }
  return false;
}

/**
 * Generate an 8x8 board with no initial matches.
 * Validates that at least one valid move exists.
 * Retries up to maxAttempts times if the board is stuck.
 */
function generateBoard(rng, candyTypes, maxAttempts = 20) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const board = Array.from({ length: BOARD_SIZE }, () =>
      Array(BOARD_SIZE).fill(null)
    );

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        let type;
        let tries = 0;
        do {
          type = candyTypes[Math.floor(rng() * candyTypes.length)];
          tries++;
          if (tries > 50) break;
        } while (wouldMatch(board, row, col, type));
        board[row][col] = createCandy(type, row, col);
      }
    }

    if (boardHasValidMove(board)) return board;
  }

  // Fallback: return the last generated board (extremely rare edge case)
  const board = Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill(null)
  );
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      let type;
      let tries = 0;
      do {
        type = candyTypes[Math.floor(rng() * candyTypes.length)];
        tries++;
        if (tries > 50) break;
      } while (wouldMatch(board, row, col, type));
      board[row][col] = createCandy(type, row, col);
    }
  }
  return board;
}

/**
 * Generate a fresh random board for reshuffling during gameplay.
 * Uses Math.random (not seeded) since it's a runtime reshuffle.
 */
export function generateRandomBoard(candyTypes) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const board = Array.from({ length: BOARD_SIZE }, () =>
      Array(BOARD_SIZE).fill(null)
    );

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        let type;
        let tries = 0;
        do {
          type = candyTypes[Math.floor(Math.random() * candyTypes.length)];
          tries++;
          if (tries > 50) break;
        } while (wouldMatch(board, row, col, type));
        board[row][col] = createCandy(type, row, col);
      }
    }

    if (boardHasValidMove(board)) return board;
  }

  // Fallback: return last attempt
  const board = Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill(null)
  );
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const type = candyTypes[Math.floor(Math.random() * candyTypes.length)];
      board[row][col] = createCandy(type, row, col);
    }
  }
  return board;
}

/**
 * Pick a random subset of candy type indices.
 * count: how many types to pick (3-6).
 */
function pickCandySubset(rng, count) {
  const all = [0, 1, 2, 3, 4, 5];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.slice(0, count).sort((a, b) => a - b);
}

/**
 * Random int in [min, max] inclusive using the provided rng.
 */
function randRange(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

/**
 * Generate 100 levels with progressive difficulty scaling.
 *
 * Level  1-20 (Easy):     4 candy types, 30-40 moves, target  500-1500
 * Level 21-60 (Medium):   4-5 candy types, 20-30 moves, target 1000-3000
 * Level 61-100 (Hard):    5-6 candy types, 15-25 moves, target 2500-5000
 *
 * Within each tier, difficulty ramps gradually.
 * All generated boards are validated to have at least one valid move.
 */
export function generateLevels() {
  const masterSeed = Date.now();
  const levels = [];

  for (let i = 0; i < 100; i++) {
    let callCount = 0;
    const rand = () => {
      callCount++;
      return seededRandom(masterSeed + i * 997 + callCount);
    };

    const levelNum = i + 1;
    let candyCount, movesMin, movesMax, scoreMin, scoreMax;

    if (levelNum <= 20) {
      // Easy — generous moves, low targets, fewer candy types
      candyCount = 4;
      // Gradually tighten within the tier
      const t = (levelNum - 1) / 19; // 0..1 across tier
      movesMin = Math.round(35 - t * 5);   // 35 → 30
      movesMax = Math.round(40 - t * 5);   // 40 → 35
      scoreMin = Math.round(500 + t * 400);  // 500 → 900
      scoreMax = Math.round(1000 + t * 500); // 1000 → 1500
    } else if (levelNum <= 60) {
      // Medium — moderate moves and targets, 4-5 candy types
      const t = (levelNum - 21) / 39; // 0..1 across tier
      candyCount = t < 0.5 ? 4 : 5;
      movesMin = Math.round(25 - t * 5);   // 25 → 20
      movesMax = Math.round(30 - t * 5);   // 30 → 25
      scoreMin = Math.round(1000 + t * 1000); // 1000 → 2000
      scoreMax = Math.round(2000 + t * 1000); // 2000 → 3000
    } else {
      // Hard — tight moves, high targets, 5-6 candy types
      const t = (levelNum - 61) / 39; // 0..1 across tier
      candyCount = t < 0.5 ? 5 : 6;
      movesMin = Math.round(20 - t * 5);   // 20 → 15
      movesMax = Math.round(25 - t * 5);   // 25 → 20
      scoreMin = Math.round(2500 + t * 1500); // 2500 → 4000
      scoreMax = Math.round(3500 + t * 1500); // 3500 → 5000
    }

    const candyTypes = pickCandySubset(rand, candyCount);
    const moves = randRange(rand, movesMin, movesMax);
    const targetScore = randRange(rand, scoreMin, scoreMax);
    const board = generateBoard(rand, candyTypes);

    levels.push({
      level: levelNum,
      targetScore,
      moves,
      candyTypes,
      board,
    });
  }

  return levels;
}
