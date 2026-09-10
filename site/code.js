// Source viewer for the lesson pages: <div class="code" data-src="src/sandbox/RedRect.js"></div>
// fetches the real file from the repo (so the lessons never drift from the code)
// and shows it with a link to the file on GitHub. data-open="true" expands it.
const root = new URL('../', import.meta.url).href;
const GITHUB = 'https://github.com/larsbrubaker/music-editor/blob/main/';

function escapeHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

async function fill(el) {
  const src = el.dataset.src;
  const open = el.dataset.open === 'true';
  el.innerHTML = `<div class="head"><span>${src}</span><a href="${GITHUB}${src}" target="_blank" rel="noopener">view on GitHub</a></div>` +
    `<details${open ? ' open' : ''}><summary>${open ? 'hide' : 'show'} source</summary><pre>loading…</pre></details>`;
  const details = el.querySelector('details');
  details.addEventListener('toggle', () => { details.querySelector('summary').textContent = details.open ? 'hide source' : 'show source'; });
  try {
    const res = await fetch(root + src);
    let text = await res.text();
    const range = el.dataset.lines; // "12-40"
    if (range) { const [a, b] = range.split('-').map(Number); text = text.split('\n').slice(a - 1, b).join('\n'); }
    el.querySelector('pre').innerHTML = escapeHtml(text);
  } catch (e) { el.querySelector('pre').textContent = 'could not load ' + src; }
}

export function initCode(scope = document) { for (const el of scope.querySelectorAll('.code[data-src]')) { fill(el); } }
