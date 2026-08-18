import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const rootEl = document.getElementById('root')!;

Promise.all([import('./lib/i18n.tsx'), import('./App.tsx')])
  .then(([{ LanguageProvider }, { default: App }]) => {
    createRoot(rootEl).render(
      <StrictMode>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </StrictMode>
    );
  })
  .catch((err) => {
    // Surface fatal startup errors (e.g. missing env vars) instead of a silent blank page.
    rootEl.innerHTML = `<pre style="padding:16px;color:#b91c1c;white-space:pre-wrap;font-family:monospace;">${
      err instanceof Error ? err.message : String(err)
    }</pre>`;
    console.error(err);
  });
