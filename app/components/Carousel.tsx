"use client";

import { useEffect, useState } from "react";

type Slide = { src: string; alt: string };

export default function Carousel({
  slides,
  interval = 5000,
}: {
  slides: Slide[];
  interval?: number;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), interval);
    return () => clearInterval(id);
  }, [paused, count, interval]);

  if (count === 0) return null;
  const go = (n: number) => setIndex((n + count) % count);
  const btn =
    "grid h-10 w-10 place-items-center rounded-full bg-white/85 text-xl text-ink hover:bg-white";

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Photos of the practice"
      className="relative overflow-hidden rounded-2xl bg-tint"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative aspect-[4/3] sm:aspect-[21/9]">
        {slides.map((s, i) => (
          <img
            key={s.src}
            src={s.src}
            alt={s.alt}
            aria-hidden={i !== index}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 motion-reduce:transition-none ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
      </div>

      {count > 1 && (
        <>
          <button type="button" aria-label="Previous photo" onClick={() => go(index - 1)} className={`${btn} absolute left-3 top-1/2 -translate-y-1/2`}>
            &lsaquo;
          </button>
          <button type="button" aria-label="Next photo" onClick={() => go(index + 1)} className={`${btn} absolute right-3 top-1/2 -translate-y-1/2`}>
            &rsaquo;
          </button>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.src}
                type="button"
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={`h-2.5 w-2.5 rounded-full ${i === index ? "bg-white" : "bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
