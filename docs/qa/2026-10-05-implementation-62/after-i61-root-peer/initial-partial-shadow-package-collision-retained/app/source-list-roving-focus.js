function validKeys(keys) {
  if (!Array.isArray(keys) || keys.some(k => typeof k !== 'string' || !k) || new Set(keys).size !== keys.length) throw new Error('Source list focus requires unique full-string keys');
}

/** Focus navigation never returns an activation, source change or biological join. */
export function resolveSourceListRovingKey(keys, { scope, focusedScope = null, focusedKey = null, selectedKey = null }) {
  validKeys(keys);
  if (typeof scope !== 'string' || !scope) throw new Error('Source list focus requires a scoped membership');
  if (scope === focusedScope && keys.includes(focusedKey)) return focusedKey;
  return keys.includes(selectedKey) ? selectedKey : keys[0] ?? null;
}

export function nextSourceListRovingKey(keys, currentKey, key, modifiers = {}) {
  validKeys(keys);
  if (!keys.length || modifiers.altKey || modifiers.ctrlKey || modifiers.metaKey || modifiers.shiftKey) return null;
  const index = keys.indexOf(currentKey);
  if (index < 0) return null;
  if (key === 'Home') return keys[0];
  if (key === 'End') return keys.at(-1);
  if (key === 'ArrowDown') return keys[(index + 1) % keys.length];
  if (key === 'ArrowUp') return keys[(index + keys.length - 1) % keys.length];
  return null;
}
