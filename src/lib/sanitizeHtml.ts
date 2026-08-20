/**
 * Minimal allowlist sanitizer for the notebook's rich text. Content is
 * client-authored (only ever written by whoever has the site open — there's
 * no multi-user input surface), but it's stored and later rendered back as
 * raw HTML, so stripping script/event-handler/iframe vectors before saving
 * is still the right default rather than trusting execCommand output blind.
 */

const ALLOWED_TAGS = new Set([
  "P", "BR", "B", "STRONG", "I", "EM", "U", "UL", "OL", "LI",
  "H1", "H2", "H3", "A", "IMG", "DIV", "SPAN", "BLOCKQUOTE",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  A: new Set(["href", "target", "rel"]),
  IMG: new Set(["src", "alt", "class"]),
};

export function sanitizeHtml(dirty: string): string {
  if (typeof document === "undefined") return dirty;

  const doc = new DOMParser().parseFromString(dirty, "text/html");
  const walk = (node: Element) => {
    Array.from(node.children).forEach((child) => walk(child));

    if (!ALLOWED_TAGS.has(node.tagName)) {
      // unwrap: replace the element with its children rather than dropping content
      const parent = node.parentNode;
      if (parent) {
        while (node.firstChild) parent.insertBefore(node.firstChild, node);
        parent.removeChild(node);
      }
      return;
    }

    const allowed = ALLOWED_ATTRS[node.tagName];
    Array.from(node.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      if (name.startsWith("on") || (!allowed || !allowed.has(name))) {
        node.removeAttribute(attr.name);
      }
    });

    if (node.tagName === "A") {
      const href = node.getAttribute("href") ?? "";
      if (/^\s*javascript:/i.test(href)) node.removeAttribute("href");
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noreferrer noopener");
    }
    if (node.tagName === "IMG") {
      const src = node.getAttribute("src") ?? "";
      if (!/^data:image\//i.test(src) && !src.startsWith("/")) {
        node.removeAttribute("src");
      }
    }
  };

  Array.from(doc.body.children).forEach((child) => walk(child));
  return doc.body.innerHTML;
}
