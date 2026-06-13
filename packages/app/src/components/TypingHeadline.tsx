'use client';
import { useState, useEffect } from 'react';

const PHRASES = ['stop the scroll', 'kill the swipe', 'demand a tap', 'own the first 3 seconds'];

/**
 * TypingHeadline — the hero's self-rewriting clip-text phrase. It types, holds,
 * deletes, and re-fires alternates the way the generator does, so within a
 * couple seconds a visitor feels "this thing rewrites attention for a living."
 * Respects prefers-reduced-motion by showing a single static phrase (a CSS
 * media query alone can't stop a JS timer loop).
 */
export function TypingHeadline() {
  const [reduced, setReduced] = useState(false);
  const [pi, setPi] = useState(0);
  const [txt, setTxt] = useState('');
  const [del, setDel] = useState(false);

  // Detect the reduced-motion preference (deferred so it never runs synchronously
  // in the effect body, and so server/client first render stay identical).
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    const raf = requestAnimationFrame(update);
    mq.addEventListener('change', update);
    return () => { cancelAnimationFrame(raf); mq.removeEventListener('change', update); };
  }, []);

  useEffect(() => {
    if (reduced) return;
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
  }, [txt, del, pi, reduced]);

  return (
    <span className="hero__clip">
      {reduced ? PHRASES[0] : txt}
      <span className="hero__caret" />
    </span>
  );
}
