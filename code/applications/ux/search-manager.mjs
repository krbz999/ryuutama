/**
 * @import RyuutamaActor from "../../documents/actor.mjs";
 * @import RyuutamaItem from "../../documents/item.mjs";
 * @import {
 *  SearchCategory,
 *  LockedSearchFilter, ConfigurableSearchFilter,
 *  InitializedLockedSearchFilter, InitializedConfigurableSearchFilter,
 * } from "../../_types.mjs";
 */

/**
 * A utility class for managing search filter options for the item collection of an actor.
 * @param {RyuutamaActor} actor
 * @param {object} search
 */
export default class RyuutamaSearchManager {
  constructor(actor, search) {
    this.actor = actor;
    this.#initialize(search);
  }

  /* -------------------------------------------------- */

  /**
   * Categorization modes.
   * @type {{ GROUPED: number, UNGROUPED: number }}
   */
  static CATEGORIZATION_MODES = Object.freeze({
    GROUPED: 1,
    UNGROUPED: -1,
  });

  /* -------------------------------------------------- */

  /**
   * Sort modes.
   * @type {{ ALPHABETIC: string, MANUAL: string }}
   */
  static SORT_MODES = Object.freeze({
    ALPHABETIC: "a",
    MANUAL: "m",
  });

  /* -------------------------------------------------- */

  /**
   * The actor whose embedded collection of items to search.
   * @type {RyuutamaActor}
   */
  actor;

  /* -------------------------------------------------- */

  /**
   * @type {Map<string, {
  *  locked: InitializedLockedSearchFilter[],
  *  filters: Map<string, InitializedConfigurableSearchFilter>,
   * }>}
   */
  #search;

  /* -------------------------------------------------- */

  /**
   * Initialize the search data.
   * @param {Record<string, SearchCategory>} search
   */
  #initialize(search) {
    this.#search = new Map();
    search = foundry.utils.deepClone(search);

    /**
     * @param {LockedSearchFilter|ConfigurableSearchFilter} filter
     * @param {boolean} [locked=true]
     * @returns {InitializedLockedSearchFilter|InitializedConfigurableSearchFilter}
     */
    const prepare = (filter, locked = true) => {
      let { field, operator, value } = filter;
      if (typeof value === "function") value = value();
      if (!locked) value = new Map(value.map(v => [v, 0]));
      return { field, operator, value };
    };

    for (const [key, { locked = [], filters = [] }] of Object.entries(search)) {
      const data = { locked: [], filters: new Map() };
      for (const filter of locked) data.locked.push(prepare(filter));
      for (const { id, ...rest } of filters) data.filters.set(id, prepare(rest, false));
      this.#search.set(key, data);
    }
  }

  /* -------------------------------------------------- */

  /**
   * Get the current value of a nested filter.
   * @param {string} category   The section, e.g. 'spells' or 'inventory'.
   * @param {string} filter     The type of filter in the section, e.g., 'level'.
   * @param {string} key        The key of the given filter, e.g., 'low'.
   * @returns {-1|0|1}          The state of the filter.
   */
  get(category, filter, key) {
    return this.#search.get(category).filters.get(filter).value.get(key);
  }

  /* -------------------------------------------------- */

  /**
   * Set a filter.
   * @param {string} category   The section, e.g. 'spells' or 'inventory'.
   * @param {string} filter     The type of filter in the section, e.g., 'level'.
   * @param {string} key        The key of the given filter, e.g., 'low'.
   * @param {-1|0|1} value      The new value.
   * @returns {-1|0|1}          The state of the filter.
   */
  set(category, filter, key, value) {
    this.#search.get(category).filters.get(filter).value.set(key, value);
    return value;
  }

  /* -------------------------------------------------- */

  /**
   * Cycle a filter to the next logical state.
   * @param {string} category   The section, e.g. 'spells' or 'inventory'.
   * @param {string} filter     The type of filter in the section, e.g., 'level'.
   * @param {string} key        The key of the given filter, e.g., 'low'.
   * @param {boolean} [reverse] Cycle in the other direction.
   * @returns {-1|0|1}          The state of the filter.
   */
  cycle(category, filter, key, reverse = false) {
    const cycle = [1, -1, 0];
    if (reverse) cycle.reverse();
    const current = this.get(category, filter, key);
    const state = cycle[cycle.findIndex(k => k === current) + 1] ?? cycle[0];
    return this.set(category, filter, key, state);
  }

  /* -------------------------------------------------- */

  /**
   * Search for items.
   * @param {string} category     The section, e.g., 'spells' or 'inventory'.
   * @param {string} [query]      A search query.
   * @returns {RyuutamaItem[]}    Matched items.
   */
  search(category, query) {
    const data = this.#search.get(category);
    const filters = foundry.utils.deepClone(data.locked);

    for (const [k, object] of data.filters.entries()) {
      const some = object.value.keys().some(h => this.get(category, k, h) === 1);
      const v = [];
      for (const [key, value] of object.value.entries()) {
        let push;
        switch (value) {
          case -1: push = false; break;
          case 0: push = !some; break;
          case 1: push = true;
        }
        if (push) v.push(key);
      }
      filters.push({ field: object.field, operator: object.operator, value: v });
    }
    return this.actor.items.search({ query, filters });
  }

  /* -------------------------------------------------- */
  /*   CATEGORIZATION                                   */
  /* -------------------------------------------------- */

  /**
   * Get the current categorization mode of a category and actor type.
   * @param {string} category   The section, e.g., 'spells' or 'inventory'.
   * @returns {-1|1}
   */
  currentCategorizationMode(category) {
    let value = game.user.getFlag(ryuutama.id, ["categorizationMode", this.actor.type, category].join("."));
    if (!Object.values(RyuutamaSearchManager.CATEGORIZATION_MODES).includes(value)) value = 1;
    return value;
  }

  /* -------------------------------------------------- */

  /**
   * Change the categorization mode of a category.
   * @param {string} category   The section, e.g., 'spells' or 'inventory'.
   * @param {string} [mode]     The categorization mode.
   * @returns {Promise}
   */
  async categorize(category, mode = RyuutamaSearchManager.CATEGORIZATION_MODES.GROUPED) {
    if (!Object.values(RyuutamaSearchManager.CATEGORIZATION_MODES).includes(mode)) return;
    await game.user.setFlag(ryuutama.id, ["categorizationMode", this.actor.type, category].join("."), mode);
  }

  /* -------------------------------------------------- */

  /**
   * Cycle the categorization mode of a category.
   * @param {string} category   The section, e.g., 'spells' or 'inventory'.
   * @returns {Promise}
   */
  async cycleCategorizationMode(category) {
    const cycle = Object.values(RyuutamaSearchManager.CATEGORIZATION_MODES);
    const current = this.currentCategorizationMode(category);
    const next = cycle[cycle.findIndex(k => k === current) + 1] ?? cycle[0];
    await this.categorize(category, next);
  }

  /* -------------------------------------------------- */
  /*   SORTING                                          */
  /* -------------------------------------------------- */

  /**
   * Get the current sort mode of a category and actor type.
   * @param {string} category     The section, e.g., 'spells' or 'inventory'.
   * @returns {"a"|"m"}
   */
  currentSortMode(category) {
    let value = game.user.getFlag(ryuutama.id, ["sortMode", this.actor.type, category].join("."));
    if (!Object.values(RyuutamaSearchManager.SORT_MODES).includes(value)) value = "m";
    return value;
  }

  /* -------------------------------------------------- */

  /**
   * Change the sort mode of a category.
   * @param {string} category   The section, e.g., 'spells' or 'inventory'.
   * @param {string} [mode]     The sort mode.
   * @returns {Promise}
   */
  async sort(category, mode = RyuutamaSearchManager.SORT_MODES.ALPHABETIC) {
    if (!Object.values(RyuutamaSearchManager.SORT_MODES).includes(mode)) return;
    await game.user.setFlag(ryuutama.id, ["sortMode", this.actor.type, category].join("."), mode);
  }

  /* -------------------------------------------------- */

  /**
   * Cycle the sort mode of a category.
   * @param {string} category   The section, e.g., 'spells' or 'inventory'.
   * @returns {Promise}
   */
  async cycleSortMode(category) {
    const cycle = Object.values(RyuutamaSearchManager.SORT_MODES);
    const current = this.currentSortMode(category);
    const next = cycle[cycle.findIndex(k => k === current) + 1] ?? cycle[0];
    await this.sort(category, next);
  }
}
