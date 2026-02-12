interface SeoConfig {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  keywords?: string[];
  structuredData?: Record<string, unknown>;
}

function setMeta(name: string, content: string) {
  let element = document.querySelector(`meta[name="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('name', name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setProperty(property: string, content: string) {
  let element = document.querySelector(`meta[property="${property}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('property', property);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setCanonical(href: string) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function setJsonLd(data?: Record<string, unknown>) {
  let script = document.querySelector('script[data-seo=\"jsonld\"]');
  if (!data) {
    if (script) {
      script.remove();
    }
    return;
  }
  if (!script) {
    script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('data-seo', 'jsonld');
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

export function applySeo({ title, description, canonical, ogImage, keywords, structuredData }: SeoConfig) {
  document.title = title;
  setMeta('description', description);
  setProperty('og:title', title);
  setProperty('og:description', description);
  setProperty('twitter:title', title);
  setProperty('twitter:description', description);
  if (ogImage) {
    setProperty('og:image', ogImage);
    setProperty('twitter:image', ogImage);
  }
  if (canonical) {
    setCanonical(canonical);
  }
  if (keywords && keywords.length > 0) {
    setMeta('keywords', keywords.join(', '));
  }
  setJsonLd(structuredData);
}
