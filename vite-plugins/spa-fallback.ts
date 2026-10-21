import type { Plugin } from 'vite';

/**
 * GitHub Pages has no server-side rewrites: opening /<repo>/admin directly returns a real 404.
 * GitHub then serves 404.html, which turns the path into /<repo>/?/admin and redirects to index.html.
 * A small inline script in index.html turns it back into /<repo>/admin before React Router starts.
 * (Technique from rafgraph/spa-github-pages.) The number of path segments to keep is derived from
 * Vite's `base`, so the base path is defined in exactly one place.
 */
export function build404Html(base: string): string {
  const keep = base.split('/').filter(Boolean).length;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="robots" content="noindex" />
    <title>Daily Bible Verse — AlphaOmega Studio</title>
    <script>
      // Redirects /<repo>/some/path?x=1#h to /<repo>/?/some/path&x=1#h (see index.html for the inverse).
      var segmentsToKeep = ${keep};
      var l = window.location;
      l.replace(
        l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
        l.pathname.split('/').slice(0, 1 + segmentsToKeep).join('/') + '/?/' +
        l.pathname.slice(1).split('/').slice(segmentsToKeep).join('/').replace(/&/g, '~and~') +
        (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
        l.hash
      );
    </script>
  </head>
  <body></body>
</html>
`;
}

export function spaFallback(base: string): Plugin {
  return {
    name: 'spa-fallback-404',
    apply: 'build',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: '404.html', source: build404Html(base) });
    },
  };
}
