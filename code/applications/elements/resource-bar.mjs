import ProgressBar from "./progress-bar.mjs";

export default class ResourceBar extends ProgressBar {
  /** @override */
  static tagName = "resource-bar";

  /* -------------------------------------------------- */

  /**
   * An temporary input field inserted when the resource bar is clicked.
   * @type {HTMLInputElement}
   */
  #input;
  get input() {
    return this.#input;
  }

  /* -------------------------------------------------- */

  /** @override */
  connectedCallback() {
    super.connectedCallback();
    if (!this.resource) return;

    const { value, max, pct } = this.resource;

    this.addEventListener("click", ResourceBar.#onClick.bind(this));

    this.#input = this.ownerDocument.createElement("INPUT");
    this.#input.classList.add("hidden", "delta");
    this.#input.type = "text";
    this.#input.value = value;
    this.#input.disabled = true;
    this.#input.name = `${this.getAttribute("resource")}.value`;
    this.insertAdjacentElement("beforeend", this.#input);
    this.#input.addEventListener("blur", ResourceBar.#onBlur.bind(this));
  }

  /* -------------------------------------------------- */

  /**
   * @this ResourceBar
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
   * @this ResourceBar
   */
  static #onBlur(event) {
    this.display.classList.remove("hidden");
    this.#input.classList.add("hidden");
    this.#input.disabled = true;
  }
}
