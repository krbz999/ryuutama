import DocumentList from "./document-list.mjs";

export default class EffectsElement extends DocumentList {
  /**
   * Create a html string of this element in a handlebars helper.
   * @param {object} options
   * @returns {Handlebars.SafeString}
   */
  static handlebarsHelper(options) {
    return new Handlebars.SafeString(EffectsElement.create(options.hash).outerHTML);
  }

  /* -------------------------------------------------- */

  /** @override */
  static tagName = "effects-element";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _createEntry(entry, options) {
    const element = super._createEntry(entry, options);
    element.insertAdjacentHTML("beforeend", `<img src="${entry.document.img}" alt="${entry.document.name}">`);
    return element;
  }
}
