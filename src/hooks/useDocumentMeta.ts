import { useEffect } from 'react';

interface Meta {
  title: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
}

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/** Client-side metadata. Note: link-preview crawlers that do not run JavaScript will see the static tags in index.html. */
export function useDocumentMeta({ title, description, canonical, noindex }: Meta) {
  useEffect(() => {
    document.title = title;
    setMeta('meta[property="og:title"]', 'property', 'og:title', title);
    if (description) {
      setMeta('meta[name="description"]', 'name', 'description', description);
      setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    }
    if (canonical) {
      let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = canonical;
      setMeta('meta[property="og:url"]', 'property', 'og:url', canonical);
    }
    setMeta('meta[name="robots"]', 'name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
  }, [title, description, canonical, noindex]);
}
