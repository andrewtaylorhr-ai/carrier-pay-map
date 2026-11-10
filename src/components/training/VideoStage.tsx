"use client";

// A presentation's picture: one video, a piece of it per slide. Moving on to
// the next slide plays its piece and holds the last frame; going back or
// jumping just shows that frame. Slide 0 plays its piece from the start.
import { useEffect, useRef, type ReactNode } from "react";
import { BASE_PATH } from "@/lib/basePath";

export function VideoStage({
  src,
  poster,
  segments,
  slide,
  background,
  children,
}: {
  src: string; // under public/
  poster: string;
  segments: ([number, number] | null)[]; // [from, to] seconds per slide; null = no video
  slide: number;
  background?: ReactNode; // shown instead of the video (e.g. a map)
  children: ReactNode;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const shownSlide = useRef<number | null>(null);
  const seg = segments[slide] ?? null;

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const prev = shownSlide.current;
    shownSlide.current = slide;
    v.pause();
    if (!seg) return;
    const [from, to] = seg;
    // a blocked autoplay still shows the right moment; moving on mid-play is not an error
    const ifBlocked = (e: DOMException) => {
      if (e.name === "NotAllowedError") v.currentTime = to;
    };
    const play = slide === 0 || prev === slide - 1;
    if (!play || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      v.currentTime = to;
      return;
    }
    v.currentTime = from;
    v.play().catch(ifBlocked);
    const stop = setTimeout(() => {
      v.pause();
      v.currentTime = to;
    }, (to - from) * 1000);
    return () => clearTimeout(stop);
    // segments are constants per presentation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide]);

  return (
    <div className="relative overflow-hidden rounded-xl h-[320px] md:h-[460px] xl:h-[560px] bg-[#0a0a0a] border border-[var(--cpm-border)]">
      <video
        ref={video}
        src={`${BASE_PATH}/${src}`}
        poster={`${BASE_PATH}/${poster}`}
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        className={`absolute inset-0 w-full h-full object-cover ${background ? "opacity-0" : ""}`}
      />
      {background ? (
        <div className="absolute inset-0">{background}</div>
      ) : (
        <div className="absolute inset-x-0 top-0 h-2/3 pointer-events-none bg-gradient-to-b from-black/80 via-black/35 to-transparent" />
      )}
      <div className="absolute inset-0 p-5 md:p-7 pointer-events-none [&_a]:pointer-events-auto [&_button]:pointer-events-auto">{children}</div>
    </div>
  );
}
