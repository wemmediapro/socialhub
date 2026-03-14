import { Html, Head, Main, NextScript } from 'next/document';

/**
 * Document minimal pour que Next.js charge correctement
 * les composants d'erreur (_error, 404) et évite
 * "missing required error components, refreshing...".
 * Note: viewport doit être dans _app.tsx (Next.js recommande de ne pas le mettre ici).
 */
export default function Document() {
  return (
    <Html lang="fr">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
