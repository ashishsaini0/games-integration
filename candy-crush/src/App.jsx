import { useMemo, useState, useCallback } from 'react';
import StartScreen from './components/StartScreen';
import LevelSelect from './components/LevelSelect';
import GameBoard from './components/GameBoard';
import LevelHeader from './components/LevelHeader';
import { useGameLogic } from './hooks/useGameLogic';
import { useSound } from './hooks/useSound';
import { useStorage } from './hooks/useStorage';
import { generateLevels } from './utils/generateLevels';
import './styles/game.css';

export default function App() {
  const levels = useMemo(() => generateLevels(), []);
  const [screen, setScreen] = useState('start');
  const [startLevel, setStartLevel] = useState(0);

  const {
    highestLevel, totalScore, levelScores,
    soundEnabled, completeLevel, toggleSound,
  } = useStorage();

  const { playSwap, playMatch, playLevelComplete, playFail, playLightning } = useSound(soundEnabled);

  const onLevelComplete = useCallback(() => {
    playLevelComplete();
  }, [playLevelComplete]);

  const onFail = useCallback(() => {
    playFail();
  }, [playFail]);

  const soundCallbacks = useMemo(
    () => ({
      onSwap: playSwap,
      onMatch: playMatch,
      onLevelComplete,
      onFail,
      onLightning: playLightning,
    }),
    [playSwap, playMatch, onLevelComplete, onFail, playLightning]
  );

  const {
    board, score, movesLeft, gameState, currentLevel,
    selectedCandy, animatingCells, shakeCell, lightningEffect, paused, targetScore,
    handleCandyClick, handleDragSwap, nextLevel, retryLevel,
    goToLevel, togglePause,
  } = useGameLogic(levels, soundCallbacks, startLevel);

  // Handle level completion persistence
  const handleNextLevel = useCallback(() => {
    completeLevel(currentLevel, score);
    nextLevel();
  }, [completeLevel, currentLevel, score, nextLevel]);

  const handleRetry = useCallback(() => {
    retryLevel();
  }, [retryLevel]);

  // Screen navigation
  const handlePlay = useCallback(() => {
    goToLevel(highestLevel < 100 ? highestLevel : 0);
    setStartLevel(highestLevel < 100 ? highestLevel : 0);
    setScreen('game');
  }, [highestLevel, goToLevel]);

  const handleLevelSelect = useCallback(() => {
    setScreen('levels');
  }, []);

  const handleSelectLevel = useCallback((index) => {
    goToLevel(index);
    setStartLevel(index);
    setScreen('game');
  }, [goToLevel]);

  const handleBackToStart = useCallback(() => {
    setScreen('start');
  }, []);

  if (screen === 'start') {
    return (
      <div className="app">
        <StartScreen
          totalScore={totalScore}
          highestLevel={highestLevel}
          onPlay={handlePlay}
          onLevelSelect={handleLevelSelect}
        />
        <button
          className="btn-sound"
          onClick={toggleSound}
          title={soundEnabled ? 'Mute' : 'Unmute'}
        >
          {soundEnabled ? '\u266B' : '\u2716'}
        </button>
      </div>
    );
  }

  if (screen === 'levels') {
    return (
      <div className="app">
        <LevelSelect
          highestLevel={highestLevel}
          levelScores={levelScores}
          levels={levels}
          onSelectLevel={handleSelectLevel}
          onBack={handleBackToStart}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <div className="title-row">
        <button className="btn-icon" onClick={handleBackToStart} title="Menu">
          &#9776;
        </button>
        <h1 className="game-title">FRUIT CRUSH</h1>
        <button className="btn-icon" onClick={togglePause} title={paused ? 'Resume' : 'Pause'}>
          {paused ? '\u25B6' : '\u2759\u2759'}
        </button>
        <button
          className="btn-icon"
          onClick={toggleSound}
          title={soundEnabled ? 'Mute' : 'Unmute'}
        >
          {soundEnabled ? '\u266B' : '\u2716'}
        </button>
      </div>

      <LevelHeader
        level={currentLevel + 1}
        score={score}
        targetScore={targetScore}
        movesLeft={movesLeft}
      />

      <GameBoard
        board={board}
        selectedCandy={selectedCandy}
        animatingCells={animatingCells}
        shakeCell={shakeCell}
        lightningEffect={lightningEffect}
        onCandyClick={handleCandyClick}
        onDragSwap={handleDragSwap}
      />

      {paused && gameState === 'playing' && (
        <div className="overlay">
          <div className="overlay-card">
            <div className="overlay-icon">&#9208;</div>
            <div className="overlay-title">Paused</div>
            <div className="overlay-buttons">
              <button className="btn btn-primary" onClick={togglePause}>
                Resume
              </button>
              <button className="btn btn-secondary" onClick={handleBackToStart}>
                Quit
              </button>
            </div>
          </div>
        </div>
      )}

      {gameState === 'won' && (
        <div className="overlay">
          <div className="overlay-card">
            <div className="overlay-icon">&#9733;</div>
            <div className="overlay-title win">Level Complete!</div>
            <div className="overlay-score">
              {score} / {targetScore}
            </div>
            <div className="overlay-total">Total: {totalScore}</div>
            <div className="overlay-buttons">
              {currentLevel < 99 ? (
                <button className="btn btn-primary" onClick={handleNextLevel}>
                  Next Level
                </button>
              ) : (
                <div className="overlay-title win">All 100 levels cleared!</div>
              )}
              <button className="btn btn-secondary" onClick={handleBackToStart}>
                Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {gameState === 'lost' && (
        <div className="overlay">
          <div className="overlay-card">
            <div className="overlay-icon">&#10060;</div>
            <div className="overlay-title lose">Level Failed</div>
            <div className="overlay-score">
              {score} / {targetScore}
            </div>
            <div className="overlay-total">Total: {totalScore}</div>
            <div className="overlay-buttons">
              <button className="btn btn-primary" onClick={handleRetry}>
                Try Again
              </button>
              <button className="btn btn-secondary" onClick={handleBackToStart}>
                Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
