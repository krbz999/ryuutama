/**
 * @import { InventoryElementEntry, InventoryElementConfig } from "./_types.mjs";
 */

export default class InventoryElement extends HTMLElement {
  /**
   * Create an inventory element.
   * @param {InventoryElementConfig} options
   * @returns {InventoryElement}
   */
  static create(options) {
    const element = new this();

    if (options.classes) {
      element.classList.add(...InventoryElement.#classesFromOption(options.classes));
    }

    if (!options.documents) {
      throw new Error("An InventoryElement cannot be constructed without any documents to render.");
    }

    for (const [i, entryData] of options.documents.entries()) {
      const entry = element.#createEntry(entryData, options, i);
      if (options.action) entry.dataset.action = options.action;
      element.insertAdjacentElement("beforeend", entry);
    }

    return element;
  }

  /* -------------------------------------------------- */

  /**
   * Create a html string of this element in a handlebars helper.
   * @param {object} options
   * @returns {Handlebars.SafeString}
   */
  static handlebarsHelper(options) {
    return new Handlebars.SafeString(InventoryElement.create(options.hash).outerHTML);
  }

  /* -------------------------------------------------- */

  /** @override */
  static tagName = "inventory-element";

  /* -------------------------------------------------- */

  /**
   * @param {InventoryElementEntry} config
   * @param {InventoryElementConfig} options
   * @param {number} index
   * @returns {HTMLElement}
   */
  #createEntry(config, options, index) {
    const entry = this.ownerDocument.createElement("DIV");

    entry.classList.add("entry");
    if (config.classes) div.classList.add(...InventoryElement.#classesFromOption(config.classes));

    const name = config.label || config.document.name;
    entry.dataset.itemId = config.document.id;
    entry.dataset.name = config.document.name;
    entry.dataset.documentName = config.document.documentName;
    entry.dataset.tooltipText = name;
    for (const [k, v] of Object.entries(config.dataset ?? {})) entry.dataset[k] = v;

    entry.insertAdjacentHTML("beforeend", `<img src="${config.document.img}" alt="${name}">`);

    return entry;
  }

  /* -------------------------------------------------- */

  /**
   * Convert css class data from a string or array of strings to proper format.
   * @param {string|string[]} clsData
   * @returns {string[]}
   */
  static #classesFromOption(clsData) {
    const classes = typeof clsData === "string"
      ? clsData.split(" ").map(k => k.trim()).filter(_ => _)
      : clsData.map(k => k.trim()).filter(_ => _);
    return classes;
  }
}
