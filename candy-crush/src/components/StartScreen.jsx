import { memo } from 'react';

function StartScreen({ totalScore, highestLevel, onPlay, onLevelSelect }) {
  return (
    <div className="start-screen">
      <div className="start-card">
        <h1 className="start-title">CANDY CRUSH</h1>
        <div className="start-stats">
          {highestLevel > 0 && (
            <>
              <div className="start-stat">
                <span className="start-stat-label">Best Level</span>
                <span className="start-stat-value">{highestLevel}</span>
              </div>
              <div className="start-stat">
                <span className="start-stat-label">Total Score</span>
                <span className="start-stat-value">{totalScore.toLocaleString()}</span>
              </div>
            </>
          )}
        </div>
        <div className="start-buttons">
          <button className="btn btn-primary btn-large" onClick={onPlay}>
            {highestLevel > 0 ? 'Continue' : 'Play'}
          </button>
          {highestLevel > 0 && (
            <button className="btn btn-secondary" onClick={onLevelSelect}>
              Level Select
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(StartScreen);
