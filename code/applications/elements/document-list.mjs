/**
 * @import { DocumentListConfig, DocumentListEntry } from "./_types.mjs";
 */

export default class DocumentList extends HTMLElement {
  /**
   * Create an instance of this element.
   * @param {DocumentListConfig} options
   * @returns {HTMLElement}
   */
  static create(options) {
    const element = new this();

    // Add css classes.
    if (options.classes) element.classList.add(...DocumentList.#classesFromOptions(options.classes));

    if (!options.documents) {
      throw new Error("A DocumentList cannot be constructed without an array of DocumentListEntries.");
    }

    for (const entryData of options.documents) {
      const entry = element._createEntry(entryData, options);
      if (options.action) entry.dataset.action = options.action;
      element.insertAdjacentElement("beforeend", entry);
    }

    if (options.inline !== false) return element;

    const group = document.createElement("SECTION");
    group.classList.add("document-listing");
    if (options.label) group.insertAdjacentHTML("beforeend", `<h4>${options.label}</h4>`);
    group.insertAdjacentElement("beforeend", element);
    return group;
  }

  /* -------------------------------------------------- */

  /**
   * Create the HTML element of an entry in this listing.
   * @param {DocumentListEntry} entry
   * @param {DocumentListConfig} options
   * @returns {HTMLDivElement}
   */
  _createEntry(entry, options) {
    const element = this.ownerDocument.createElement("DIV");
    element.classList.add("entry");

    if (entry.classes) element.classList.add(...DocumentList.#classesFromOptions(entry.classes));

    const name = entry.label || entry.document.name;
    const dataset = foundry.utils.mergeObject({
      uuid: entry.document.uuid,
      name: entry.document.name,
      documentName: entry.document.documentName,
      tooltipText: options.tooltips ? null : name,
      tooltipHtml: options.tooltips
        ? ryuutama.helpers.interaction.RyuutamaTooltipManager.constructHTML({ uuid: entry.document.uuid })
        : null,
    }, entry.dataset ?? {});
    for (const [k, v] of Object.entries(dataset)) if (v) element.dataset[k] = v;

    return element;
  }

  /* -------------------------------------------------- */

  /**
   * Convert css class data from a string or array of strings to proper format.
   * @param {string|string[]} clsData
   * @returns {string[]}
   */
  static #classesFromOptions(clsData) {
    const classes = typeof clsData === "string"
      ? clsData.split(" ").map(k => k.trim()).filter(_ => _)
      : clsData.map(k => k.trim()).filter(_ => _);
    return classes;
  }
}
