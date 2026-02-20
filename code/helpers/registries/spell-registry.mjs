/**
 * @import CompendiumCollection from "@client/documents/collections/compendium-collection.mjs";
 */

/**
 * @typedef {"incantation"|"spring"|"summer"|"autumn"|"winter"} Season
 * @typedef {"low"|"mid"|"high"} Level
 */

export default class SpellRegistry {
  /**
   * Has the registry been initialized?
   * @type {boolean}
   */
  #initialized = false;

  /* -------------------------------------------------- */

  /**
   * Spells categorized by category.
   * @type {Record<Season, Map<string, Set<string>>>}
   */
  #byCategory = Object.fromEntries(Object.keys(ryuutama.config.spellCategories).map(key => [key, new Map()]));

  /* -------------------------------------------------- */

  /**
   * Spells categorized by level (low, mid, high).
   * @type {Record<Level, Map<string, Set<string>>>}
   */
  #byLevel = Object.fromEntries(Object.keys(ryuutama.config.spellLevels).map(key => [key, new Map()]));

  /* -------------------------------------------------- */

  /**
   * Spells categorized by source.
   * @type {Record<string, Map<string, Set<string>>>}
   */
  #bySource = {};

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
      "system.category",
      "system.spell.level",
      "system.identifier",
      "system.source.book",
      "system.source.custom",
    ];
    await pack.getIndex({ fields });
    const spells = pack.index.filter(index => index.type === "spell");

    spells.forEach(spell => {
      const identifier = spell.system.identifier
        ? spell.system.identifier
        : ryuutama.utils.createDefaultIdentifier(spell.name);

      /** @type {Season} */
      const c = spell.system.category.value;

      /** @type {Level} */
      const l = spell.system.spell.level;

      const category = this.#byCategory[c];
      const level = this.#byLevel[l];

      if (!category || !level) {
        console.warn(
          `Malformed or expired data detected on spell '${spell.uuid}'. This spell was not added to the registry.`,
        );
        return;
      }

      if (!category.get(identifier)) category.set(identifier, new Set());
      category.get(identifier).add(spell.uuid);

      if (!level.get(identifier)) level.set(identifier, new Set());
      level.get(identifier).add(spell.uuid);

      const source = spell.system.source.custom || spell.system.source.book || "";
      if (!this.#bySource[source]) this.#bySource[source] = new Map();
      if (!this.#bySource[source].get(identifier)) this.#bySource[source].set(identifier, new Set());
      this.#bySource[source].get(identifier).add(spell.uuid);
    });
  }
}
