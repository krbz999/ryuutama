/**
 * @import { Application } from "@client/applications/api/_module.mjs";
 */

export default class ProgressBar extends HTMLElement {
  /**
   * A store of resource bars from which to read values when they are replaced.
   * @type {Map<string, number>}
   */
  static storage = new Map();

  /* -------------------------------------------------- */

  /** @override */
  static tagName = "progress-bar";

  /* -------------------------------------------------- */

  /**
   * The percentage fill.
   * @type {number}
   */
  get pct() {
    return Number(this.getAttribute("pct")) || 0;
  }

  /* -------------------------------------------------- */

  /**
   * Set the percentage fill.
   * @param {number} value
   */
  set pct(value) {
    if (isNaN(value) || (value < 0)) return;
    this.setAttribute("pct", String(value));
    this.#bar.style.setProperty("--fill", `${value}%`);
  }

  /* -------------------------------------------------- */

  /**
   * The inner bar that holds the fill.
   * @type {HTMLSpanElement}
   */
  #bar;
  get bar() {
    return this.#bar;
  }

  /* -------------------------------------------------- */

  /**
   * The element displaying the values.
   * @type {HTMLSpanElement}
   */
  #display;
  get display() {
    return this.#display;
  }

  /* -------------------------------------------------- */

  /**
   * The document sheet's element on which this is attached.
   * @type {HTMLFormElement|null}
   */
  #app;

  /* -------------------------------------------------- */

  /**
   * The document sheet.
   * @type {Application|null}
   */
  get app() {
    return foundry.applications.instances.get(this.#app?.id) ?? null;
  }

  /* -------------------------------------------------- */

  /**
   * The document attached to this element's app.
   * @type {foundry.abstract.Document|null}
   */
  get document() {
    return this.app?.document ?? null;
  }

  /* -------------------------------------------------- */

  /**
   * The tracked resource or other value.
   * @type {{ value: number, max: number, pct: number }|null}
   */
  get resource() {
    const resource = this.getAttribute("resource");
    if (!resource) return null;
    return foundry.utils.getProperty(this.document, resource) ?? null;
  }

  /* -------------------------------------------------- */

  /** @override */
  connectedCallback() {
    this.#app = this.closest(".application") ?? null;
    if (!this.resource) return;

    const { value, max, pct } = this.resource;

    this.#bar = this.ownerDocument.createElement("SPAN");
    this.#bar.classList.add("bar");
    this.#bar.style.setProperty("--fill", `${pct}%`);
    this.insertAdjacentElement("afterbegin", this.#bar);

    this.#display = this.ownerDocument.createElement("SPAN");
    this.#display.classList.add("display");
    this.#display.textContent = `${value} / ${max}`;
    this.insertAdjacentElement("beforeend", this.#display);

    this.#animateConnection();
  }

  /* -------------------------------------------------- */

  /** @override */
  disconnectedCallback() {
    if (this.app?.state <= 0) ProgressBar.storage.delete(this.id);
  }

  /* -------------------------------------------------- */

  /**
   * Animate the change when the element is replaced.
   */
  #animateConnection() {
    const id = this.id;
    if (!id) return;

    const stored = ProgressBar.storage.get(id) ?? null;
    const bar = this.#bar;
    const value = bar.computedStyleMap().get("right").value;
    ProgressBar.storage.set(id, value);

    if (stored === null) return;
    bar.animate([{ right: `${stored}%` }, { right: `${value}%` }], { duration: 500, easing: "ease-in-out" });
  }
}
