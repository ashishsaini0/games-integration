import { memo, useCallback } from 'react';

function LevelSelect({ highestLevel, levelScores, levels, onSelectLevel, onBack }) {
  return (
    <div className="level-select-screen">
      <div className="level-select-header">
        <button className="btn-back" onClick={onBack}>&#8592;</button>
        <h2 className="level-select-title">Select Level</h2>
      </div>
      <div className="level-grid">
        {levels.map((level, i) => {
          const unlocked = i <= highestLevel;
          const completed = levelScores[i] != null;
          const score = levelScores[i] || 0;

          return (
            <LevelTile
              key={i}
              index={i}
              unlocked={unlocked}
              completed={completed}
              score={score}
              targetScore={level.targetScore}
              onSelect={onSelectLevel}
            />
          );
        })}
      </div>
    </div>
  );
}

const LevelTile = memo(function LevelTile({ index, unlocked, completed, score, targetScore, onSelect }) {
  const handleClick = useCallback(() => {
    if (unlocked) onSelect(index);
  }, [unlocked, index, onSelect]);

  let cls = 'level-tile';
  if (!unlocked) cls += ' locked';
  else if (completed) cls += ' completed';

  return (
    <button className={cls} onClick={handleClick} disabled={!unlocked}>
      <span className="level-tile-num">{index + 1}</span>
      {!unlocked && <span className="level-tile-lock">&#128274;</span>}
      {completed && <span className="level-tile-star">&#9733;</span>}
      {completed && (
        <span className="level-tile-score">{score}/{targetScore}</span>
      )}
    </button>
  );
});

export default memo(LevelSelect);
