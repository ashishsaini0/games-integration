import { useRef, useCallback, useEffect, memo } from 'react';
import { CANDY_TYPES } from '../utils/generateLevels';

const BOARD_SIZE = 8;
const DRAG_THRESHOLD = 20;

// Pre-computed shape SVGs — never recreated
const SIZE = 28;
const HALF = SIZE / 2;
const FILL = 'rgba(255,255,255,0.3)';

const SHAPE_SVGS = [
  /* circle */   <svg key="c" width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="candy-shape"><circle cx={HALF} cy={HALF} r={HALF - 2} fill={FILL} /></svg>,
  /* diamond */  <svg key="d" width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="candy-shape"><polygon points={`${HALF},2 ${SIZE - 2},${HALF} ${HALF},${SIZE - 2} 2,${HALF}`} fill={FILL} /></svg>,
  /* square */   <svg key="s" width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="candy-shape"><rect x="4" y="4" width={SIZE - 8} height={SIZE - 8} rx="3" fill={FILL} /></svg>,
  /* triangle */ <svg key="t" width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="candy-shape"><polygon points={`${HALF},3 ${SIZE - 3},${SIZE - 3} 3,${SIZE - 3}`} fill={FILL} /></svg>,
  /* star */     <svg key="st" width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="candy-shape"><polygon points={`${HALF},2 ${HALF + 4},${HALF - 4} ${SIZE - 2},${HALF - 3} ${HALF + 6},${HALF + 3} ${HALF + 4},${SIZE - 2} ${HALF},${HALF + 5} ${HALF - 4},${SIZE - 2} ${HALF - 6},${HALF + 3} 2,${HALF - 3} ${HALF - 4},${HALF - 4}`} fill={FILL} /></svg>,
  /* hexagon */  <svg key="h" width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="candy-shape"><polygon points={`${HALF},2 ${SIZE - 3},${HALF / 2 + 1} ${SIZE - 3},${HALF + HALF / 2 - 1} ${HALF},${SIZE - 2} 3,${HALF + HALF / 2 - 1} 3,${HALF / 2 + 1}`} fill={FILL} /></svg>,
];

// Pre-built color style objects so we don't allocate inline on every render
const COLOR_STYLES = CANDY_TYPES.map((c) => ({ backgroundColor: c.color }));

const EMPTY_CELL = <div className="candy-cell empty" />;

function Candy({
  type,
  row,
  col,
  fallDistance,
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
        {SHAPE_SVGS[type % SHAPE_SVGS.length]}
        <div className="candy-shine" />
      </div>
    </div>
  );
}

const TOUCH_NONE_STYLE = { touchAction: 'none' };

export default memo(Candy);
