// Minimal, dependency-free controls for the audience-facing slide deck.
function indexForHash(hash, count) {
  const match = /^#slide-(\d+)$/.exec(hash);
  if (!match) return 0;
  const number = Number(match[1]);
  return Number.isSafeInteger(number) && number >= 1 && number <= count ? number - 1 : 0;
}

function nextIndex(current, step, count) {
  return Math.max(0, Math.min(count - 1, current + step));
}

if (typeof document !== 'undefined') {
  const slides = [...document.querySelectorAll('.slide')];
  const counter = document.getElementById('slide-counter');
  const progress = document.getElementById('progress');
  const previous = document.getElementById('previous');
  const next = document.getElementById('next');
  const notes = document.getElementById('speaker-notes');
  let current = indexForHash(window.location.hash, slides.length);

  function show(index, updateUrl = true) {
    current = Math.max(0, Math.min(slides.length - 1, index));
    slides.forEach((slide, position) => {
      slide.hidden = position !== current;
      slide.setAttribute('aria-hidden', String(position !== current));
    });
    const number = String(current + 1).padStart(2, '0');
    counter.textContent = `${number} / ${String(slides.length).padStart(2, '0')}`;
    progress.style.width = `${((current + 1) / slides.length) * 100}%`;
    progress.setAttribute('aria-valuenow', String(current + 1));
    previous.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    notes.href = `outline.html#slide-${slides[current].dataset.outlineSlide || current + 1}`;
    if (updateUrl) history.replaceState(null, '', `#slide-${current + 1}`);
    document.dispatchEvent(new Event('deckchange'));
  }

  previous.addEventListener('click', () => show(nextIndex(current, -1, slides.length)));
  next.addEventListener('click', () => show(nextIndex(current, 1, slides.length)));
  window.addEventListener('hashchange', () => show(indexForHash(location.hash, slides.length), false));
  document.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest('a, button, input, textarea, select')) return;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(event.key)) {
      event.preventDefault();
      show(nextIndex(current, 1, slides.length));
    } else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(event.key)) {
      event.preventDefault();
      show(nextIndex(current, -1, slides.length));
    } else if (event.key === 'Home') {
      event.preventDefault();
      show(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      show(slides.length - 1);
    }
  });
  show(current, false);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { indexForHash, nextIndex };
}

if(typeof location !== "undefined" && location.protocol === "file:") document.querySelector("#file-notice")?.removeAttribute("hidden");
