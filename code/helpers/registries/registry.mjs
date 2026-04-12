/**
 * @import CompendiumCollection from "@client/documents/collections/compendium-collection.mjs";
 */

/**
 * @typedef RegistryEntry
 * @property {object} index
 * @property {string} name
 * @property {string} uuid
 * @property {Record<string, *>} properties
 */

export default class BaseRegistry {
  /**
   * Properties that can be filtered upon and entries are categorized by.
   * @type {string[]}
   */
  static PROPERTIES;

  /* -------------------------------------------------- */

  /**
   * Properties to retrieve from the compendium index.
   * @type {string[]}
   */
  static FIELDS;

  /* -------------------------------------------------- */

  /**
   * The item subtype to store.
   * @type {string}
   */
  static TYPE;

  /* -------------------------------------------------- */

  /**
   * Register in individual arrays on a per-property basis.
   * @type {Map<string, Map<*, RegistryEntry[]>>}
   */
  #byProperty = new Map();

  /* -------------------------------------------------- */

  /**
   * Has this registry been initialized?
   * @type {boolean}
   */
  #initialized = false;

  /* -------------------------------------------------- */

  /**
   * @type {RegistryEntry[]}
   */
  #entries = [];

  /* -------------------------------------------------- */

  /**
   * Register an entry.
   * @param {RegistryEntry} entry
   */
  #register(entry) {
    this.#entries.push(entry);
    this.constructor.PROPERTIES.forEach(property => {
      const map = this.#byProperty.get(property);
      const value = entry.properties[property];
      if (!map.get(value)) map.set(value, []);
      map.get(value).push(entry);
    });
  }

  /* -------------------------------------------------- */

  /**
   * Initialize the registry.
   */
  initialize() {
    if (this.#initialized) {
      throw new Error(`A ${this.constructor.name} cannot be re-initialized.`);
    }
    this.#initialized = true;

    this.constructor.PROPERTIES.forEach(property => this.#byProperty.set(property, new Map()));
    for (const pack of game.packs) this.#initializePack(pack);
  }

  /* -------------------------------------------------- */

  /**
   * Source entries from a pack.
   * @param {CompendiumCollection} pack
   */
  #initializePack(pack) {
    if (pack.metadata.type !== "Item") return;
    const items = pack.index.filter(index => index.type === this.constructor.TYPE);
    items.forEach(index => {
      const entry = this._initializeItem(index);
      if (entry) this.#register(entry);
    });
  }

  /* -------------------------------------------------- */

  /**
   * Initialize an index entry into a registry entry.
   * @param {object} index
   * @returns {RegistryEntry|null}
   */
  _initializeItem(index) {
    const name = index.name;
    const uuid = index.uuid;
    return { index, name, uuid, properties: {} };
  }

  /* -------------------------------------------------- */

  /**
   * Search and filter the registry.
   * @param {Record<string, any|any[]} [properties]   The data to filter by, a record of keys from `PROPERTIES`.
   * @returns {string[]}                              Uuids of the items that satisfied the filters.
   */
  search(properties = {}) {
    foundry.utils.logCompatibilityWarning(
      "Ryuutama | The registries in 'ryuutama.registries' have been deprecated in favor of using the Compendium Browser.",
      { since: "2.1.0", until: "2.3.0", once: true },
    );
    const filters = [];
    const SearchFilter = foundry.applications.ux.SearchFilter;
    const filter = (field, value) => {
      if (!this.constructor.PROPERTIES.includes(field)) return;
      filters.push({
        value,
        field: `properties.${field}`,
        operator: Array.isArray(value) ? SearchFilter.OPERATORS.CONTAINS : SearchFilter.OPERATORS.EQUALS,
      });
    };
    Object.entries(properties).forEach(([k, v]) => filter(k, v));

    const results = [];
    this.#entries.forEach(entry => {
      if (filters.every(filter => SearchFilter.evaluateFilter(entry, filter))) results.push(entry.uuid);
    });
    return results;
  }
}
