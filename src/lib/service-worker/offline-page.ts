import type { OfflineFonts } from './policy';

/**
 * The page the service worker answers with when a page load cannot reach the
 * network (docs/service-worker.md). It is the full-page counterpart to
 * OfflineNotice.svelte, which covers navigations inside an already-loaded
 * page; the copy matches it.
 *
 * Self-contained on purpose — inline styles, inline script, the ghost drawn
 * inline — because anything it linked to would need the network it is
 * standing in for. The only exception is the fonts, which the worker keeps
 * cached for exactly this.
 *
 * It reads the requested URL from `location` rather than having it baked in,
 * so nothing request-controlled is ever written into the HTML.
 */
export function offlinePage(fonts: OfflineFonts): string {
	const face = (family: string, url: string | undefined, weight: string) =>
		url
			? `@font-face{font-family:'${family}';src:url('${url}') format('woff2');font-weight:${weight};font-display:swap}`
			: '';

	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex">
<title>Offline — RazerGhost</title>
<script>try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}</script>
<style>
${face('Instrument Serif', fonts.display, '400')}
${face('Archivo Variable', fonts.body, '100 900')}
${face('JetBrains Mono Variable', fonts.mono, '100 800')}
:root{color-scheme:light dark;--bg:light-dark(#faf9f6,#0c0c0d);--white:light-dark(#14130f,#f3f1ed);--gray:light-dark(#4a4843,#c9c6c1);--dim:light-dark(#656259,#8d8a85);--accent:light-dark(#0d6d87,#22d3ee);--border:light-dark(#c9c5bc,#333331)}
:root[data-theme=light]{color-scheme:light}
:root[data-theme=dark]{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--gray);font:16px/1.6 'Archivo Variable',system-ui,sans-serif;padding:24px max(16px,env(safe-area-inset-left))}
main{max-width:26rem;text-align:center}
svg{color:var(--accent)}
.label{margin:24px 0 0;font:12px 'JetBrains Mono Variable',ui-monospace,monospace;letter-spacing:.18em;text-transform:uppercase;color:var(--dim)}
h1{margin:8px 0 0;font:400 38px/1.1 'Instrument Serif',Georgia,serif;letter-spacing:-.01em;color:var(--white)}
p.msg{margin:12px 0 0}
.actions{margin-top:32px;display:flex;flex-wrap:wrap;gap:12px;justify-content:center}
button,a.btn{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--border);border-radius:9999px;padding:8px 16px;font:inherit;font-size:14px;color:var(--dim);background:none;text-decoration:none;cursor:pointer}
button{border-color:var(--accent);color:var(--accent)}
button:disabled{opacity:.5;cursor:default}
.debug{margin-top:40px;font:12px/1.5 'JetBrains Mono Variable',ui-monospace,monospace;color:var(--dim);text-align:left;border-top:1px solid var(--border);padding-top:16px}
</style>
</head>
<body>
<main>
<svg width="56" height="72" viewBox="17 7 66 86" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round" aria-hidden="true"><path d="M20 81.688 L20 41.169 C20 24.07 33.542 10 50 10 C66.458 10 80 24.07 80 41.169 L80 81.688 L70 90 L60 81.688 L50 90 L40 81.688 L30 90 Z"/><circle cx="40" cy="43.249" r="4" fill="currentColor" stroke="none"/><circle cx="60" cy="43.249" r="4" fill="currentColor" stroke="none"/></svg>
<p class="label" id="label">No connection</p>
<h1 id="heading">You're offline</h1>
<p class="msg" id="msg">This page needs the connection to load. It'll open by itself as soon as you're back online.</p>
<div class="actions">
<button type="button" id="retry">Try again</button>
<a class="btn" href="/">Home</a>
</div>
<div class="debug" id="debug" hidden></div>
</main>
<script>
(function(){
  var retry=document.getElementById('retry');
  function reload(){retry.disabled=true;retry.textContent='Opening…';location.reload()}
  retry.addEventListener('click',reload);
  window.addEventListener('online',reload);
  // Online but still here means the device has a connection and the site
  // did not answer — a server that is down or unreachable, not the reader's
  // wifi. Different words, so the two are not confused.
  if(navigator.onLine){
    document.getElementById('label').textContent="Couldn't connect";
    document.getElementById('heading').textContent="Couldn't reach the site";
    document.getElementById('msg').textContent="Your connection looks fine, but the site didn't answer. Trying again in a moment usually works.";
  }
  // On a local build, say what this page is. A stopped \`pnpm preview\`
  // looks exactly like an outage from here, and a page that does not
  // explain itself is how a service worker wastes an afternoon.
  if(/^(localhost|127\\.0\\.0\\.1|\\[::1\\])$/.test(location.hostname)){
    var d=document.getElementById('debug');
    d.hidden=false;
    d.textContent='Served by the service worker (X-Ghostbase-SW: offline-fallback) because the request for '+location.pathname+location.search+' failed at the network level. Server not running? DevTools \\u2192 Application \\u2192 Service workers to bypass or unregister.';
  }
})();
</script>
</body>
</html>`;
}
