import { memo } from 'react';
import Candy from './Candy';

function GameBoard({
  board,
  selectedCandy,
  animatingCells,
  shakeCell,
  onCandyClick,
  onDragSwap,
}) {
  if (!board || board.length === 0) return null;

  return (
    <div className="game-board">
      {board.map((row, rowIndex) =>
        row.map((candy, colIndex) => {
          const isSelected =
            selectedCandy?.row === rowIndex && selectedCandy?.col === colIndex;
          const isAnimating = animatingCells.has(rowIndex * 8 + colIndex);
          const isShaking =
            shakeCell?.row === rowIndex && shakeCell?.col === colIndex;

          return (
            <Candy
              key={candy ? candy.id : `e-${rowIndex}-${colIndex}`}
              type={candy ? candy.type : null}
              row={rowIndex}
              col={colIndex}
              fallDistance={candy?.fallDistance || 0}
              isSelected={isSelected}
              isAnimating={isAnimating}
              isShaking={isShaking}
              onClick={onCandyClick}
              onDragSwap={onDragSwap}
            />
          );
        })
      )}
    </div>
  );
}

export default memo(GameBoard);
