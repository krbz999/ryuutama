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
   * A temporary input field displayed when the progress bar is clicked.
   * @type {HTMLInputElement|null}
   */
  #input = null;
  get input() {
    return this.#input;
  }

  /* -------------------------------------------------- */

  /**
   * The id of the application on which this is rendered.
   * @type {string|null}
   */
  #appId;

  /* -------------------------------------------------- */

  /**
   * The application on which this is rendered.
   * @type {Application|null}
   */
  get app() {
    return foundry.applications.instances.get(this.#appId);
  }

  /* -------------------------------------------------- */

  /** @override */
  connectedCallback() {
    const { value, pct, label, input, name } = this.dataset;
    this.#appId = this.closest(".application")?.id ?? null;

    this.#bar = this.ownerDocument.createElement("SPAN");
    this.#bar.classList.add("bar");
    this.#bar.style.setProperty("--fill", `${pct}%`);
    this.insertAdjacentElement("afterbegin", this.#bar);

    this.#display = this.ownerDocument.createElement("SPAN");
    this.#display.classList.add("display");
    this.#display.textContent = label;
    this.insertAdjacentElement("beforeend", this.#display);

    this.#animateConnection();

    if (!this.hasAttribute("data-input") || (input === "false")) return;
    this.addEventListener("click", ProgressBar.#onClick.bind(this));
    this.#input = this.ownerDocument.createElement("INPUT");
    this.#input.classList.add("hidden", "delta");
    this.#input.type = "text";
    this.#input.value = value;
    this.#input.disabled = true;
    this.#input.name = name;
    this.insertAdjacentElement("beforeend", this.#input);
    this.#input.addEventListener("blur", ProgressBar.#onBlur.bind(this));
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

  /* -------------------------------------------------- */

  /**
   * @this ProgressBar
   */
  static #onClick(event) {
    if (!this.app?.isEditable) return;

    this.display.classList.add("hidden");
    this.#input.classList.remove("hidden");
    this.#input.disabled = false;
    this.#input.select();
  }

  /* -------------------------------------------------- */

  /**
   * @this ProgressBar
   */
  static #onBlur(event) {
    this.display.classList.remove("hidden");
    this.#input.classList.add("hidden");
    this.#input.disabled = true;
  }
}
