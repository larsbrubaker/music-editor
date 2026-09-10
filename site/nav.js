// Renders the site header so every page shares one navigation bar.
//   <header class="top" data-current="app"></header>
const root = new URL('../', import.meta.url).href;
export const CHAPTERS = [
  ['01-warm-up', 'Warm Up'], ['02-basic-graphics', 'Basic Graphics'], ['03-reaction-architecture', 'Reaction Architecture'],
  ['04-recognition', 'Recognition'], ['05-reactions', 'Reactions'], ['06-music', 'Music'], ['07-music-notes', 'Music Notes'],
  ['08-refactoring-and-appendix', 'Refactoring & Appendix'],
];
export function renderNav(header) {
  const cur = header.dataset.current || '';
  const link = (href, label, id) => `<a href="${root}${href}"${cur === id ? ' class="current"' : ''}>${label}</a>`;
  header.innerHTML = `<div class="in"><a class="brand" href="${root}">Gesture Music Editor</a><nav>` +
    link('', 'Home', 'home') + ' ' +
    CHAPTERS.map(([slug, name], i) => link(`lessons/${slug}.html`, `${i + 1}. ${name}`, slug)).join(' ') + ' ' +
    link('app/', 'The App', 'app') + ' ' +
    `<a href="https://github.com/larsbrubaker/music-editor" target="_blank" rel="noopener">GitHub</a></nav></div>`;
}
for (const h of document.querySelectorAll('header.top')) { renderNav(h); }
