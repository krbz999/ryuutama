/**
 * Custom element for caching and displaying svgs, allowing for styling.
 */
export default class IconElement extends HTMLElement {
  /**
   * Cached svg elements.
   * @type {Map<string, string|Promise<string>>}
   */
  static #svgCache = new Map();

  /* -------------------------------------------------- */

  /** @override */
  static tagName = "ryuutama-icon";

  /* -------------------------------------------------- */

  /**
   * Path to the SVG source file.
   * @type {string}
   */
  get src() {
    return this.getAttribute("src");
  }
  set src(src) {
    this.setAttribute("src", src);
  }

  /* -------------------------------------------------- */

  /** @override */
  connectedCallback() {
    const insertElement = html => {
      if (!html) return;
      const ids = new Map();
      this.innerHTML = html.replaceAll(/__\d+__/g, (match) => {
        if (!ids.get(match)) ids.set(match, foundry.utils.randomID());
        return ids.get(match);
      });
    };

    // Insert element immediately if already available, otherwise wait for fetch
    const element = IconElement.fetch(this.src);
    if (element instanceof Promise) element.then(insertElement);
    else insertElement(element);
  }

  /* -------------------------------------------------- */

  /**
   * Fetch and cache SVG element.
   * @param {string} src                  File path of the svg element.
   * @returns {string|Promise<string>}    Promise if the element is not cached, otherwise the element directly.
   */
  static fetch(src) {
    if (!src.endsWith(".svg")) return `<img src="${src}">`;
    if (!IconElement.#svgCache.has(src)) IconElement.#svgCache.set(src, fetch(src)
      .then(b => b.text())
      .then(t => IconElement.#svgCache.set(src, t).get(src)));
    return IconElement.#svgCache.get(src);
  }
}
