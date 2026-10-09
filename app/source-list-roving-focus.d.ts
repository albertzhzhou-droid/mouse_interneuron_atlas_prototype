export function resolveSourceListRovingKey(keys: string[], state: { scope: string; focusedScope?: string | null; focusedKey?: string | null; selectedKey?: string | null }): string | null;
export function nextSourceListRovingKey(keys: string[], currentKey: string, key: string, modifiers?: { altKey?: boolean; ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean }): string | null;
