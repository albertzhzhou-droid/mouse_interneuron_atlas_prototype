"use client";

import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { resolveSourceListRovingKey, nextSourceListRovingKey } from './source-list-roving-focus.js';
import './source-list-keyboard.css';

export function useSourceListRovingFocus(keys: string[], selectedKey: string | null, namespace: string) {
  const helpId = useId();
  const scope = JSON.stringify([namespace, keys]);
  const [focus, setFocus] = useState<{ scope: string | null; key: string | null }>({ scope: null, key: null });
  const elements = useRef(new Map<string, HTMLButtonElement>());
  const rovingKey = resolveSourceListRovingKey(keys, { scope, focusedScope: focus.scope, focusedKey: focus.key, selectedKey });
  const remember = (key: string) => setFocus(previous => previous.scope === scope && previous.key === key ? previous : { scope, key });
  const buttonProps = (key: string) => ({
    'data-source-list-key': key,
    tabIndex: rovingKey === key ? 0 : -1,
    ref: (element: HTMLButtonElement | null) => { if (element) elements.current.set(key, element); else elements.current.delete(key); },
    onFocus: () => remember(key),
    onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
      const nextKey = nextSourceListRovingKey(keys, key, event.key, event);
      if (nextKey === null) return;
      event.preventDefault();
      remember(nextKey);
      elements.current.get(nextKey)?.focus();
    },
  });
  return { helpId, buttonProps };
}
