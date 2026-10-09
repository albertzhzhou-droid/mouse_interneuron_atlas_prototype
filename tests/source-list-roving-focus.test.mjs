import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveSourceListRovingKey, nextSourceListRovingKey } from '../app/source-list-roving-focus.js';
const keys = ['BANC:648518346349515746', 'BANC:648518346349515747', 'BANC:648518346349515748'];
test('only current exact membership can keep focus, with selected or first-row fallback', () => {
  assert.equal(resolveSourceListRovingKey(keys, { scope: 'page1', focusedScope: 'page1', focusedKey: keys[1], selectedKey: keys[0] }), keys[1]);
  assert.equal(resolveSourceListRovingKey(keys, { scope: 'page2', focusedScope: 'page1', focusedKey: keys[1], selectedKey: keys[0] }), keys[0]);
  assert.equal(resolveSourceListRovingKey(keys, { scope: 'filtered', focusedScope: 'filtered', focusedKey: 'absent', selectedKey: 'absent' }), keys[0]);
  assert.equal(resolveSourceListRovingKey([], { scope: 'empty', focusedScope: 'prior', focusedKey: keys[0], selectedKey: keys[0] }), null);
});
test('focus stays in the current page and exact string IDs retain precision through wrap/Home/End', () => {
  assert.equal(nextSourceListRovingKey(keys, keys[0], 'ArrowDown'), keys[1]);
  assert.equal(nextSourceListRovingKey(keys, keys[0], 'ArrowUp'), keys[2]);
  assert.equal(nextSourceListRovingKey(keys, keys[2], 'ArrowDown'), keys[0]);
  assert.equal(nextSourceListRovingKey(keys, keys[1], 'Home'), keys[0]);
  assert.equal(nextSourceListRovingKey(keys, keys[1], 'End'), keys[2]);
  assert.equal(nextSourceListRovingKey(keys, 'unknown', 'ArrowDown'), null);
  assert.equal(nextSourceListRovingKey([], keys[0], 'Home'), null);
});
test('activation, Tab, modifiers and assistive-technology shortcuts remain native', () => {
  for (const key of ['Enter', ' ', 'Tab', 'ArrowLeft', 'ArrowRight', 'Escape']) assert.equal(nextSourceListRovingKey(keys, keys[0], key), null);
  for (const modifier of ['altKey', 'ctrlKey', 'metaKey', 'shiftKey']) assert.equal(nextSourceListRovingKey(keys, keys[0], 'ArrowDown', { [modifier]: true }), null);
});
test('ambiguous or non-string keys cannot silently become a focus target', () => {
  for (const bad of [[keys[0], keys[0]], [1], [''], null]) {
    assert.throws(() => nextSourceListRovingKey(bad, keys[0], 'Home'));
    assert.throws(() => resolveSourceListRovingKey(bad, { scope: 'current' }));
  }
  assert.throws(() => resolveSourceListRovingKey(keys, { scope: '' }));
});
