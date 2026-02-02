interface SeoConfig {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
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

export function applySeo({ title, description, canonical, ogImage }: SeoConfig) {
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
}
