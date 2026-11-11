// Shared DOM helpers for the thumb columns.

/**
 * A Sierra button for a thumb column. `short` shows when the column is narrow
 * (body[data-cols="narrow"], set by the stage on resize), `long` otherwise.
 */
export function colButton({ id, long, short = long, className = '', onClick }) {
  const b = document.createElement('button');
  b.type = 'button'; b.id = id; b.className = `btn-sierra ${className}`.trim();
  b.setAttribute('aria-label', long);
  b.innerHTML = `<span class="long"></span><span class="short"></span>`;
  b.querySelector('.long').textContent = long;
  b.querySelector('.short').textContent = short;
  if (onClick) b.addEventListener('click', onClick);
  return b;
}
