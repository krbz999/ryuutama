export default class RichTooltip extends HTMLElement {
  static tagName = "rich-tooltip";

  /* -------------------------------------------------- */

  static tooltips = new Map();

  /* -------------------------------------------------- */

  #document;

  /* -------------------------------------------------- */

  get document() {
    return this.#document;
  }

  /* -------------------------------------------------- */

  set document(document) {
    if (!(document instanceof foundry.abstract.Document)) {
      throw new Error("The document must be an actual Document instance.");
    }
    this.#document = document;
  }

  /* -------------------------------------------------- */

  #rendering = false;

  /* -------------------------------------------------- */

  async refresh() {
    if (this.#rendering) return;
    this.#rendering = true;
    const content = await this.document.system.richTooltip();
    this.replaceWith(...content);
    this.#rendering = false;
  }

  /* -------------------------------------------------- */

  connectedCallback() {
    console.warn("+ CONNECTED");
    RichTooltip.tooltips.set(this.document.uuid, this);
  }

  /* -------------------------------------------------- */

  disconnectedCallback() {
    console.warn("- DISCONNECTED");
    RichTooltip.tooltips.delete(this.document.uuid);
  }
}
