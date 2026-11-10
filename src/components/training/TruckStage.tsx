"use client";

// The roadmap's picture: a real video of the truck being built. Slide 0 plays
// it through, each step plays on to that step's moment, Hire drives it away.
import { useEffect, useRef, type ReactNode } from "react";
import { BASE_PATH } from "@/lib/basePath";

// Where the video stops for steps 1 to 10, in seconds.
const STEP_TIMES = [0.1, 0.7, 1.1, 1.6, 2.1, 2.5, 3, 3.5, 4, 4.9];
const VIDEO_END = 10;

export function TruckStage({ slide, children }: { slide: number; children: ReactNode }) {
  const video = useRef<HTMLVideoElement>(null);
  const shownSlide = useRef<number | null>(null);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const from = shownSlide.current;
    shownSlide.current = slide;
    const hire = slide > STEP_TIMES.length;
    const target = slide === 0 || hire ? VIDEO_END : STEP_TIMES[slide - 1];
    v.pause();
    // a blocked autoplay still shows the right moment; moving on mid-play is not an error
    const ifBlocked = (e: DOMException) => {
      if (e.name === "NotAllowedError") v.currentTime = target;
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      v.currentTime = target;
      return;
    }
    if (slide === 0 || hire) {
      v.currentTime = slide === 0 ? 0 : STEP_TIMES[STEP_TIMES.length - 1];
      v.play().catch(ifBlocked);
      return;
    }
    // only the next step plays; going back or jumping just shows the moment
    if (from !== slide - 1 || slide === 1) {
      v.currentTime = target;
      return;
    }
    v.currentTime = STEP_TIMES[slide - 2];
    v.play().catch(ifBlocked);
    const stop = setTimeout(() => {
      v.pause();
      v.currentTime = target;
    }, (target - STEP_TIMES[slide - 2]) * 1000);
    return () => clearTimeout(stop);
  }, [slide]);

  return (
    <div className="relative overflow-hidden rounded-xl h-[320px] md:h-[460px] xl:h-[560px] bg-[#0a0a0a] border border-[var(--cpm-border)]">
      <video
        ref={video}
        src={`${BASE_PATH}/training/truck-build.mp4`}
        poster={`${BASE_PATH}/training/truck-build-end.jpg`}
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-x-0 top-0 h-2/3 pointer-events-none bg-gradient-to-b from-black/80 via-black/35 to-transparent" />
      <div className="absolute inset-0 p-5 md:p-7">{children}</div>
    </div>
  );
}
