"use client";
import { useEffect } from "react";

export default function ClientFixer() {
  useEffect(() => {
    // 1. Fix carousels: Make them horizontally scrollable
    // Find any ul that looks like it might be a carousel track (has id starting with _R_ or just by structure)
    const carousels = document.querySelectorAll('ul[id^="_R_"]');
    carousels.forEach(ul => {
      // Apply flex layout for native scrolling
      ul.style.display = 'flex';
      ul.style.overflowX = 'auto';
      ul.style.scrollSnapType = 'x mandatory';
      ul.style.gap = '16px';
      ul.style.padding = '0 20px';
      ul.style.scrollbarWidth = 'none'; // hide scrollbar for Firefox
      ul.style.msOverflowStyle = 'none'; // hide scrollbar for IE/Edge
      
      const slides = ul.querySelectorAll('li');
      slides.forEach(li => {
        // Strip the absolute transforms that stuck them together
        li.style.position = 'relative';
        li.style.transform = 'none';
        li.style.flex = '0 0 auto';
        li.style.scrollSnapAlign = 'center';
      });
      
      // Fix buttons if they exist
      const container = ul.closest('div._1rffjwg2') || ul.parentElement.parentElement;
      if (container) {
        const prevBtn = container.querySelector('button[aria-label="Previous slide"]');
        const nextBtn = container.querySelector('button[aria-label="Next slide"]');
        if (prevBtn && nextBtn) {
          prevBtn.onclick = () => ul.scrollBy({ left: -300, behavior: 'smooth' });
          nextBtn.onclick = () => ul.scrollBy({ left: 300, behavior: 'smooth' });
          // Re-enable disabled prev button
          prevBtn.removeAttribute('disabled');
        }
      }
    });

    // 2. Fix videos that might not auto-play
    const videos = document.querySelectorAll('video');
    videos.forEach(v => {
      v.setAttribute('autoplay', 'true');
      v.setAttribute('loop', 'true');
      v.setAttribute('muted', 'true');
      v.setAttribute('playsinline', 'true');
      // Sometimes play() fails if the user hasn't interacted, but muted helps
      v.play().catch(e => console.warn("Autoplay prevented on video", e));
    });
  }, []);

  return null;
}
