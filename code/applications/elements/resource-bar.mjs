/**
 * @import { Application } from "@client/applications/api/_module.mjs";
 */

export default class ResourceBar extends HTMLElement {
  /**
   * A store of resource bars from which to read values when they are replaced.
   * @type {Map<string, number>}
   */
  static storage = new Map();

  /* -------------------------------------------------- */

  /** @override */
  static tagName = "resource-bar";

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

  /* -------------------------------------------------- */

  /**
   * An temporary input field inserted when the resource bar is clicked.
   * @type {HTMLInputElement}
   */
  #input;

  /* -------------------------------------------------- */

  /**
   * The element displaying the values.
   * @type {HTMLSpanElement}
   */
  #display;

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
   * The path to the attribute this displays.
   * @type {string}
   */
  get name() {
    return this.getAttribute("name");
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
   * The relevant resource tied to this bar.
   * @type {object|null}
   */
  get resource() {
    let path = this.name.split(".");
    path.pop();
    path = path.join(".");
    return foundry.utils.getProperty(this.document ?? {}, path) ?? null;
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
    this.addEventListener("click", ResourceBar.#onClick.bind(this));

    this.#display = this.ownerDocument.createElement("SPAN");
    this.#display.classList.add("display");
    this.#display.textContent = `${value} / ${max}`;
    this.insertAdjacentElement("beforeend", this.#display);

    this.#input = this.ownerDocument.createElement("INPUT");
    this.#input.classList.add("hidden", "delta");
    this.#input.type = "text";
    this.#input.value = value;
    this.#input.disabled = true;
    this.#input.name = this.name;
    this.insertAdjacentElement("beforeend", this.#input);
    this.#input.addEventListener("blur", ResourceBar.#onBlur.bind(this));

    this.#animateConnection();
  }

  /* -------------------------------------------------- */

  /** @override */
  disconnectedCallback() {
    if (this.app?.state <= 0) ResourceBar.storage.delete(this.id);
  }

  /* -------------------------------------------------- */

  #animateConnection() {
    const id = this.id;
    if (!id) return;

    const stored = ResourceBar.storage.get(id) ?? null;
    const bar = this.#bar;
    const value = bar.computedStyleMap().get("right").value;
    ResourceBar.storage.set(id, value);

    if (stored === null) return;
    bar.animate([{ right: `${stored}%` }, { right: `${value}%` }], { duration: 500 });
  }

  /* -------------------------------------------------- */

  /**
   * @this ResourceBar
   */
  static #onClick(event) {
    if (!this.app.isEditable) return;

    this.#display.classList.add("hidden");
    this.#input.classList.remove("hidden");
    this.#input.disabled = false;
    this.#input.select();
  }

  /* -------------------------------------------------- */

  /**
   * @this ResourceBar
   */
  static #onBlur(event) {
    this.#display.classList.remove("hidden");
    this.#input.classList.add("hidden");
    this.#input.disabled = true;
  }
}
