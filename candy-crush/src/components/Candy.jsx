import { useRef, useCallback, useEffect, memo } from 'react';
import { CANDY_TYPES } from '../utils/generateLevels';

const BOARD_SIZE = 8;
const DRAG_THRESHOLD = 20;

// Realistic candy emoji icons — easily distinguishable for all ages
const CANDY_EMOJIS = [
  '\u{1F352}', // 🍒 Cherry (red)
  '\u{1F36C}', // 🍬 Candy (teal)
  '\u{1FAD0}', // 🫐 Blueberry (blue)
  '\u{1F34F}', // 🍏 Green Apple (green)
  '\u{1F34B}', // 🍋 Lemon (yellow)
  '\u{1F347}', // 🍇 Grape (purple)
];

// Pre-built color style objects with richer gradients for a 3D candy look
const COLOR_STYLES = CANDY_TYPES.map((c) => ({
  background: `radial-gradient(circle at 35% 35%, ${c.color}ee, ${c.color}bb 50%, ${c.color}88 100%)`,
}));

const EMPTY_CELL = <div className="candy-cell empty" />;

function Candy({
  type,
  row,
  col,
  fallDistance,
  special,
  isSelected,
  isAnimating,
  isShaking,
  onClick,
  onDragSwap,
}) {
  const dragStart = useRef(null);

  const handlePointerEnd = useCallback((clientX, clientY) => {
    if (!dragStart.current) return;
    const dx = clientX - dragStart.current.x;
    const dy = clientY - dragStart.current.y;
    const { row: r, col: c, onClick: click, onDragSwap: drag } = dragStart.current.props;

    if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) {
      click(r, c);
      dragStart.current = null;
      return;
    }

    let toRow = r;
    let toCol = c;
    if (Math.abs(dx) > Math.abs(dy)) {
      toCol += dx > 0 ? 1 : -1;
    } else {
      toRow += dy > 0 ? 1 : -1;
    }

    if (toRow >= 0 && toRow < BOARD_SIZE && toCol >= 0 && toCol < BOARD_SIZE) {
      drag(r, c, toRow, toCol);
    }
    dragStart.current = null;
  }, []);

  // Capture current props at pointer-down time so handlers are stable
  const onTouchStart = useCallback((e) => {
    const t = e.touches[0];
    dragStart.current = { x: t.clientX, y: t.clientY, props: dragStart.current?.props };
  }, []);

  const onTouchEnd = useCallback((e) => {
    const t = e.changedTouches[0];
    handlePointerEnd(t.clientX, t.clientY);
  }, [handlePointerEnd]);

  const onMouseDown = useCallback((e) => {
    dragStart.current = { x: e.clientX, y: e.clientY, props: dragStart.current?.props };
  }, []);

  const onMouseUp = useCallback((e) => {
    handlePointerEnd(e.clientX, e.clientY);
  }, [handlePointerEnd]);

  // Sync latest props into the ref via effect (not during render)
  useEffect(() => {
    if (!dragStart.current) {
      dragStart.current = { x: 0, y: 0, props: { row, col, onClick, onDragSwap } };
    } else {
      dragStart.current.props = { row, col, onClick, onDragSwap };
    }
  });

  if (type === null || type === undefined) return EMPTY_CELL;

  let cellClass = 'candy-cell';
  if (isSelected) cellClass += ' selected';
  if (isAnimating) cellClass += ' match-pop';
  if (isShaking) cellClass += ' shake';
  if (fallDistance > 0) cellClass += ' falling';
  if (special) cellClass += ' special-candy';
  if (special === 'super-lightning') cellClass += ' super-lightning';

  const cellStyle = fallDistance > 0
    ? { touchAction: 'none', '--fall': fallDistance }
    : TOUCH_NONE_STYLE;

  return (
    <div
      className={cellClass}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      style={cellStyle}
    >
      <div className="candy-inner" style={COLOR_STYLES[type]}>
        <span className="candy-emoji">{CANDY_EMOJIS[type % CANDY_EMOJIS.length]}</span>
        <div className="candy-shine" />
        {special && <div className="lightning-icon">{special === 'super-lightning' ? '\u26A1' : '\u{1F329}'}</div>}
      </div>
    </div>
  );
}

const TOUCH_NONE_STYLE = { touchAction: 'none' };

export default memo(Candy);
