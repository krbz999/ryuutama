/**
 * @import CompendiumCollection from "@client/documents/collections/compendium-collection.mjs";
 */

/**
 * @typedef {"incantation"|"spring"|"summer"|"autumn"|"winter"} SpellCategory
 *
 * @typedef {"low"|"mid"|"high"} SpellLevel
 *
 * @typedef SpellRegistryEntry
 * @property {SpellCategory} category
 * @property {string} identifier
 * @property {object} index
 * @property {SpellLevel} level
 * @property {string} name
 * @property {string} source
 * @property {string} uuid
 */

export default class SpellRegistry {
  /**
   * Has the registry been initialized?
   * @type {boolean}
   */
  #initialized = false;

  /* -------------------------------------------------- */

  /**
   * @type {Record<SpellCategory, SpellRegistryEntry[]>}
   */
  #byCategory = Object.fromEntries(Object.values(ryuutama.CONST.SPELL_CATEGORIES).map(k => [k, []]));

  /* -------------------------------------------------- */

  /**
   * @type {Record<SpellLevel, SpellRegistryEntry[]>}
   */
  #byLevel = Object.fromEntries(Object.values(ryuutama.CONST.SPELL_LEVELS).map(k => [k, []]));

  /* -------------------------------------------------- */

  /**
   * @type {Record<string, SpellRegistryEntry[]>}
   */
  #bySource = {};

  /* -------------------------------------------------- */

  /**
   * @type {SpellRegistryEntry[]}
   */
  #entries = [];

  /* -------------------------------------------------- */

  /**
   * Register entry.
   * @param {SpellRegistryEntry} entry
   */
  #register(entry) {
    this.#byCategory[entry.category].push(entry);
    this.#byLevel[entry.level].push(entry);
    this.#bySource[entry.source] ??= [];
    this.#bySource[entry.source].push(entry);
    this.#entries.push(entry);
  }

  /* -------------------------------------------------- */

  /**
   * Initialize the registry.
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.#initialized) {
      throw new Error(`A ${this.constructor.name} cannot be re-initialized.`);
    }
    this.#initialized = true;

    for (const pack of game.packs) {
      await this.#initializePack(pack);
    }
  }

  /* -------------------------------------------------- */

  /**
   * @param {CompendiumCollection} pack
   */
  async #initializePack(pack) {
    if (pack.metadata.type !== "Item") return;
    const fields = [
      "system.category.value",
      "system.spell.level",
      "system.identifier",
      "system.source.book",
      "system.source.custom",
    ];
    await pack.getIndex({ fields });
    const spells = pack.index.filter(index => index.type === "spell");

    spells.forEach(index => {
      const category = index.system.category.value;
      const identifier = index.system.identifier
        ? index.system.identifier
        : ryuutama.utils.createDefaultIdentifier(index.name);
      const level = index.system.spell.level;
      const name = index.name;
      const source = index.system.source.custom || index.system.source.book || "";
      const uuid = index.uuid;

      if (!(category in this.#byCategory) || !identifier || !(level in this.#byLevel)) {
        console.warn(
          `Malformed or expired data detected on spell '${index.uuid}'. This spell was not added to the registry.`,
        );
        return;
      }

      const entry = { category, identifier, index, level, name, source, uuid };
      this.#register(entry);
    });
  }

  /* -------------------------------------------------- */

  /**
   * Search and filter the registry.
   * @param {object} [parameters]
   * @param {string|string[]} [parameters.category]   Spell categories from `ryuutama.CONST.SPELL_CATEGORIES`.
   * @param {string|string[]} [parameters.level]      Spell levels from `ryuutama.CONST.SPELL_LEVELS`.
   * @param {string|string[]} [parameters.source]     Sources.
   * @returns {string[]}                              Uuids of spells that satisfied the filters.
   */
  search({ category, level, source } = {}) {
    const filters = [];
    const SearchFilter = foundry.applications.ux.SearchFilter;

    const filter = (field, value) => {
      filters.push({
        field, value,
        operator: Array.isArray(value) ? SearchFilter.OPERATORS.CONTAINS : SearchFilter.OPERATORS.EQUALS,
      });
    };

    if (category) filter("category", category);
    if (level) filter("level", level);
    if (source) filter("source", source);

    const results = [];
    this.#entries.forEach(entry => {
      if (filters.every(filter => SearchFilter.evaluateFilter(entry, filter))) results.push(entry.uuid);
    });
    return results;
  }
}
