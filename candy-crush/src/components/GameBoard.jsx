import { memo } from 'react';
import Candy from './Candy';

function GameBoard({
  board,
  selectedCandy,
  animatingCells,
  shakeCell,
  lightningEffect,
  onCandyClick,
  onDragSwap,
}) {
  if (!board || board.length === 0) return null;

  // Build set of cells being hit by lightning for visual overlay
  const lightningHitCells = new Set();
  if (lightningEffect) {
    for (const le of lightningEffect) {
      if (le.special === 'lightning-h' || le.special === 'super-lightning') {
        for (let c = 0; c < 8; c++) lightningHitCells.add(le.row * 8 + c);
      }
      if (le.special === 'lightning-v' || le.special === 'super-lightning') {
        for (let r = 0; r < 8; r++) lightningHitCells.add(r * 8 + le.col);
      }
    }
  }

  return (
    <div className="game-board">
      {board.map((row, rowIndex) =>
        row.map((candy, colIndex) => {
          const isSelected =
            selectedCandy?.row === rowIndex && selectedCandy?.col === colIndex;
          const isAnimating = animatingCells.has(rowIndex * 8 + colIndex);
          const isShaking =
            shakeCell?.row === rowIndex && shakeCell?.col === colIndex;
          const isLightningHit = lightningHitCells.has(rowIndex * 8 + colIndex);

          return (
            <div key={candy ? candy.id : `e-${rowIndex}-${colIndex}`} className={isLightningHit ? 'lightning-hit-wrapper' : undefined} style={{ position: 'relative' }}>
              <Candy
                type={candy ? candy.type : null}
                row={rowIndex}
                col={colIndex}
                fallDistance={candy?.fallDistance || 0}
                special={candy?.special || null}
                isSelected={isSelected}
                isAnimating={isAnimating}
                isShaking={isShaking}
                onClick={onCandyClick}
                onDragSwap={onDragSwap}
              />
            </div>
          );
        })
      )}
    </div>
  );
}

export default memo(GameBoard);
