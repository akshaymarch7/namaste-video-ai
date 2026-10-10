"use client";

/** Move keyboard focus without creating a same-document history entry. */
export function SkipLink() {
  return <a className="skip-link" href="#main" onClick={event => {
    const target = document.getElementById('main');
    if (!target?.getClientRects().length) return;
    event.preventDefault();
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: 'start' });
  }}>Skip to content</a>;
}
