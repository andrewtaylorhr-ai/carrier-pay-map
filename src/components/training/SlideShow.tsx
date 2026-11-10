"use client";

// The Training plan's presentation shell:
// slide kept per browser, Back/Next, arrow keys, swipe, road with a stop per
// slide, and full screen.
import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Truck } from "lucide-react";
import { useLocalStorageState } from "@/lib/hooks/useLocalStorage";

const navBtn =
  "inline-flex items-center gap-1 h-9 px-3 rounded-lg border border-[var(--cpm-border-strong)] text-[13px] font-semibold text-[var(--cpm-text)] transition-colors hover:border-[var(--cpm-accent)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[var(--cpm-border-strong)]";
export const panel = "rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel-alt)] shadow-[0_8px_24px_rgba(0,0,0,.25)] px-5 py-4";
export const eyebrow = "text-[11px] font-bold uppercase tracking-[.14em]";

export function SlideShow({
  storageKey,
  stops,
  greenAt,
  hint,
  stage,
  below,
}: {
  storageKey: string;
  stops: string[]; // one name per slide, slide 0 first
  greenAt: number; // from this slide on the road is green (the Hire stage)
  hint: string;
  stage: (slide: number) => ReactNode;
  below: (slide: number, go: (to: number) => void) => ReactNode;
}) {
  const last = stops.length - 1;
  const [stored, setSlide] = useLocalStorageState<number>(storageKey, 0);
  const slide = Math.min(last, Math.max(0, stored));
  const [full, setFull] = useState(false);
  const root = useRef<HTMLElement>(null);
  const dragFrom = useRef<number | null>(null);

  const go = useCallback(
    (to: number) => {
      const target = Math.min(last, Math.max(0, to));
      if (target !== slide) setSlide(target);
    },
    [slide, last, setSlide]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(slide + 1);
      if (e.key === "ArrowLeft") go(slide - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, slide]);

  useEffect(() => {
    const onChange = () => setFull(document.fullscreenElement === root.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else root.current?.requestFullscreen?.();
  };

  // swipe or drag sideways (not when starting on a link or button)
  const onDown = (e: PointerEvent) => {
    dragFrom.current = (e.target as HTMLElement).closest("a,button") ? null : e.clientX;
  };
  const onUp = (e: PointerEvent) => {
    if (dragFrom.current == null) return;
    const dx = e.clientX - dragFrom.current;
    dragFrom.current = null;
    if (Math.abs(dx) > 70) go(slide + (dx < 0 ? 1 : -1));
  };

  const pct = (slide / last) * 100;
  const green = slide >= greenAt;
  const roadColor = green ? "var(--cpm-green)" : "var(--cpm-accent)";

  return (
    <section ref={root} className={`flex flex-col gap-3 ${full ? "h-screen overflow-auto p-6 justify-center bg-[var(--cpm-bg)]" : ""}`}>
      <div className="touch-pan-y flex flex-col gap-3" onPointerDown={onDown} onPointerUp={onUp}>
        {stage(slide)}
        <div key={slide} className="min-h-[150px]">
          {below(slide, go)}
        </div>
      </div>

      <div className="relative h-10 mx-3">
        <div className="absolute left-0 right-0 top-[27px] h-[3px] rounded bg-[var(--cpm-border-strong)]" />
        <div className="absolute left-0 top-[27px] h-[3px] rounded transition-[width] duration-700" style={{ width: `${pct}%`, background: roadColor }} />
        <Truck size={20} className="absolute top-0 -ml-[10px] transition-[left] duration-700" style={{ left: `${pct}%`, color: green ? "var(--cpm-green)" : "var(--cpm-accent-text)" }} />
        {stops.map((name, i) => (
          <button
            key={i}
            type="button"
            onClick={() => go(i)}
            title={name}
            aria-label={i === 0 ? name : `${i}: ${name}`}
            className="absolute top-[21px] -ml-[7.5px] w-[15px] h-[15px] rounded-full border-2 border-[var(--cpm-bg)]"
            style={{ left: `${(i / last) * 100}%`, background: i === greenAt ? "var(--cpm-green)" : i <= slide ? roadColor : "#4a4a4a" }}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button type="button" className={navBtn} onClick={() => go(slide - 1)} disabled={slide === 0}>
          <ChevronLeft size={16} /> Back
        </button>
        <button type="button" className={navBtn} onClick={() => go(slide + 1)} disabled={slide === last}>
          {slide === 0 ? "Start" : "Next"} <ChevronRight size={16} />
        </button>
        <span className="text-[12px] text-[var(--cpm-text-faint)] hidden sm:inline">{hint}</span>
        <button type="button" className={`${navBtn} ml-auto`} onClick={toggleFull}>
          {full ? <Minimize2 size={15} /> : <Maximize2 size={15} />} {full ? "Exit" : "Full screen"}
        </button>
      </div>
    </section>
  );
}

// The cover's list of slides, each one a button that jumps there.
export function SlideIndex({ titles, onPick, cols }: { titles: string[]; onPick: (slide: number) => void; cols: string }) {
  return (
    <div className={`tp-rise grid gap-2 sm:grid-cols-2 ${cols}`}>
      {titles.map((t, i) => (
        <button
          key={t}
          type="button"
          onClick={() => onPick(i + 1)}
          className="flex items-start gap-2.5 text-left rounded-lg border border-[var(--cpm-border)] bg-[var(--cpm-panel-alt)] px-3 py-2.5 transition-colors hover:border-[var(--cpm-accent)]"
        >
          <span className="w-6 h-6 shrink-0 rounded-md bg-[var(--cpm-accent)] text-white text-[12px] font-bold flex items-center justify-center">{i + 1}</span>
          <span className="text-[12.5px] leading-[1.3] font-semibold text-[var(--cpm-text)]">{t}</span>
        </button>
      ))}
    </div>
  );
}
