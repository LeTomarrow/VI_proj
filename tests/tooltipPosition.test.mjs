import test from 'node:test';
import assert from 'node:assert/strict';
import { outsidePlotPosition } from '../src/js/tooltipPosition.js';

const viewport = { width: 1200, height: 800 };
const card = { width: 250, height: 100 };
test('scatter tooltip anchors above the plot, clear of its data', () => {
  const plot = { left: 100, right: 1000, top: 300, bottom: 700 };
  const p = outsidePlotPosition(plot, card, viewport);
  assert.ok(p.y + card.height < plot.top);
  assert.ok(p.x >= 8 && p.x + card.width <= viewport.width - 8);
  assert.deepEqual(outsidePlotPosition(plot, card, viewport), p, 'position does not depend on the mouse');
});
test('scatter tooltip flips below or beside the plot when there is no room above', () => {
  const plot = { left: 100, right: 800, top: 20, bottom: 500 };
  assert.ok(outsidePlotPosition(plot, card, viewport).y > plot.bottom);
  const tall = { ...plot, bottom: 790 };
  assert.ok(outsidePlotPosition(tall, card, viewport).x > tall.right);
});
