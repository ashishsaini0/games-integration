import { memo } from 'react';

function LevelHeader({ level, score, targetScore, movesLeft }) {
  const progress = Math.min((score / targetScore) * 100, 100);
  const movesLow = movesLeft <= 5;

  return (
    <div className="level-header">
      <div className="header-row">
        <div className="header-item">
          <span className="header-label">Level</span>
          <span className="header-value">{level}</span>
        </div>
        <div className="header-item score-section">
          <span className="header-label">Score</span>
          <span className="header-value">
            {score} / {targetScore}
          </span>
        </div>
        <div className="header-item">
          <span className="header-label">Moves</span>
          <span className={`header-value ${movesLow ? 'moves-low' : ''}`}>
            {movesLeft}
          </span>
        </div>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default memo(LevelHeader);
