import { PropsWithChildren, useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

type Props = PropsWithChildren<{
  to?: string;           // where to send the user
  clicks?: number;       // how many rapid clicks
  windowMs?: number;     // click window
}>;

/** Wrap any element. Triggers when:
 *  - Rapid n-clicks (default 3) OR
 *  - Alt+Click OR
 *  - Key sequence: L O G I N (within 1.5s)
 */
export default function SecretLogin({
  children,
  to = "/login?tab=signin&src=secret",
  clicks = 3,
  windowMs = 1200
}: Props) {
  const nav = useNavigate();
  const [seq, setSeq] = useState<string>("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickTimes = useRef<number[]>([]);

  const go = useCallback(() => nav(to), [nav, to]);

  const onClick = (e: React.MouseEvent) => {
    if (e.altKey) return go();
    const now = Date.now();
    clickTimes.current.push(now);
    // keep only clicks within window
    clickTimes.current = clickTimes.current.filter(t => now - t <= windowMs);
    if (clickTimes.current.length >= clicks) go();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const next = (seq + k).slice(-5);
      setSeq(next);
      if (timer.current) globalThis.clearTimeout(timer.current);
      timer.current = globalThis.setTimeout(() => setSeq(""), 1500);
      if (next === "login") go();
    };
    globalThis.addEventListener("keydown", onKey);
    return () => {
      globalThis.removeEventListener("keydown", onKey);
      if (timer.current) globalThis.clearTimeout(timer.current);
    };
  }, [seq, go]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // Trigger click logic manually or call go logic if appropriate
      // Since onClick handles the complex logic, we can re-route or simplify. 
      // For a secret login, we might not want explicit keyboard activation for the 'clicks' feature, 
      // but SonarQube demands it. The 'L O G I N' sequence is already handled by window listener.
      // We'll map Enter/Space to a "click".
      const now = Date.now();
      clickTimes.current.push(now);
      clickTimes.current = clickTimes.current.filter(t => now - t <= windowMs);
      if (clickTimes.current.length >= clicks) go();
    }
  };

  // Non-intrusive wrapper: no styles, no tab stop by default unless accessible
  return (
    <span 
      onClick={onClick} 
      onKeyDown={onKeyDown}
      role="button" 
      tabIndex={0} 
      style={{ display: "contents", cursor: "pointer" }}
    >
      {children}
    </span>
  );
}
