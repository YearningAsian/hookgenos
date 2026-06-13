'use client';
import { useState, useEffect } from 'react';

const PHRASES = ['stop the scroll', 'kill the swipe', 'demand a tap', 'own the first 3 seconds'];

/**
 * TypingHeadline — the hero's self-rewriting clip-text phrase. It types, holds,
 * deletes, and re-fires alternates the way the generator does, so within a
 * couple seconds a visitor feels "this thing rewrites attention for a living."
 */
export function TypingHeadline() {
  const [pi, setPi] = useState(0);
  const [txt, setTxt] = useState('');
  const [del, setDel] = useState(false);

  useEffect(() => {
    const full = PHRASES[pi];
    const atFull = !del && txt === full;
    const atEmpty = del && txt === '';
    const delay = atFull ? 1400 : atEmpty ? 350 : del ? 38 : 70;
    const t = setTimeout(() => {
      if (atFull) {
        setDel(true);
      } else if (atEmpty) {
        setDel(false);
        setPi(p => (p + 1) % PHRASES.length);
      } else {
        setTxt(del ? full.slice(0, txt.length - 1) : full.slice(0, txt.length + 1));
      }
    }, delay);
    return () => clearTimeout(t);
  }, [txt, del, pi]);

  return (
    <span className="hero__clip">
      {txt}
      <span className="hero__caret" />
    </span>
  );
}
