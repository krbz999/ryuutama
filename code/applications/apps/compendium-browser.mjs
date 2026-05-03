/**
 * @import { ApplicationConfiguration } from "@client/applications/_types.mjs";
 * @import DragDrop from "@client/applications/ux/drag-drop.mjs";
 * @import RyuutamaActor from "../../documents/actor.mjs";
 * @import RyuutamaItem from "../../documents/item.mjs";
 */

/**
 * @typedef {Record<string, -1|0|1>} BrowserCheckboxFilter
 *
 * @typedef {{ min: number, max: number }} BrowserRangeFilter
 *
 * @typedef {Record<string, BrowserCheckboxFilter|BrowserRangeFilter>} BrowserFilterConfiguration
 *
 * @typedef {Record<string, boolean|Record<string, boolean>>|boolean} BrowserLockedConfiguration
 *
 * @typedef {"Actor"|"Item"} FilterDocumentName
 *
 * @typedef {(entry: object, filters: BrowserFilterConfiguration) => boolean} CompendiumFilterCallback
 *
 * @typedef {(filters: BrowserFilterConfiguration) => boolean} CompendiumFilterVisibility
 *
 * @typedef {Set<RyuutamaActor>|Set<RyuutamaItem>|Set<object>} BrowserFetchResults
 *
 * @typedef CompendiumFilter
 * @property {string} [label]                                 Human-readable label.
 * @property {"checkboxes"|"range"} type                      The display type of the filter.
 * @property {CompendiumFilterCallback} callback              A callback invoked when filtering an entry.
 * @property {CompendiumFilterVisibility} [visible]           A callback invoked to determine visibility.
 * @property {FilterDocumentName[]} modes                     Which modes have this filter available.
 * @property {{ value: string, label: string }[]} [options]   The array of options to display in a checkbox-like fashion.
 * @property {number[]} [range]                               An 2-length array which determines the min/max of a 'range'.
 *
 * @typedef _CompendiumBrowserOptions
 * @property {FilterDocumentName} [documentName="Item"]   Initial document type to browse.
 * @property {BrowserFilterConfiguration} [filters]       Initial filters.
 * @property {BrowserLockedConfiguration} [locked]        Locked filters.
 * @property {number} [selection]                         Number of documents to select.
 *
 * @typedef { _CompendiumBrowserOptions & ApplicationConfiguration} CompendiumBrowserOptions
 */

const { Application, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Application class responsible for filtering and searching through Actor and Item compendiums.
 */
export default class RyuutamaCompendiumBrowser extends HandlebarsApplicationMixin(Application) {
  /**
   * Application class responsible for filtering and searching through Actor and Item compendiums.
   * @param {CompendiumBrowserOptions} [options]
   */
  constructor({ documentName = "Item", filters = {}, locked = {}, selection = null, ...options } = {}) {
    super(options);
    this.#filter = RyuutamaCompendiumBrowser.#toInitialFilters(documentName, filters);
    this.#locked = locked;
    this.#documentName = documentName;
    this.#selection = (selection > 0) ? { max: selection, selected: new Set() } : null;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    id: "compendium-browser-{id}",
    classes: ["ryuutama", "compendium-browser"],
    tag: "form",
    position: {
      width: 800,
      height: 800,
    },
    window: {
      title: "RYUUTAMA.BROWSER.title",
      icon: "fa-solid fa-map",
      resizable: true,
    },
    actions: {
      adjustFilter: {
        handler: RyuutamaCompendiumBrowser.#adjustFilter,
        buttons: [0, 2],
      },
      changeDocumentType: RyuutamaCompendiumBrowser.#changeDocumentType,
      confirmSelection: RyuutamaCompendiumBrowser.#confirmSelection,
      openDocument: RyuutamaCompendiumBrowser.#openDocument,
      removeSelected: RyuutamaCompendiumBrowser.#removeSelected,
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    sidebar: {
      template: "systems/ryuutama/templates/apps/compendium-browser/sidebar.hbs",
    },
    tabs: {
      template: "systems/ryuutama/templates/apps/compendium-browser/tabs.hbs",
    },
    search: {
      template: "systems/ryuutama/templates/apps/compendium-browser/search.hbs",
    },
    filters: {
      template: "systems/ryuutama/templates/apps/compendium-browser/filters.hbs",
      scrollable: [""],
    },
    results: {
      template: "systems/ryuutama/templates/apps/compendium-browser/results.hbs",
      scrollable: [""],
    },
    selected: {
      template: "systems/ryuutama/templates/apps/compendium-browser/selected.hbs",
      scrollable: [".content"],
    },
  };

  /* -------------------------------------------------- */

  /**
   * Additional indexed fields.
   * @type {Record<FilterDocumentName, string[]>}
   */
  static COMPENDIUM_INDEX_PATHS = {
    Actor: [
      "system.details.category",
      "system.details.level",
      "system.environment.season",
      "system.source.book",
      "system.source.custom",
    ],
    Item: [
      "system.category.value", // spell category, herb category
      "system.identifier",
      "system.source.book",
      "system.source.custom",
      "system.spell.activation.cast",
      "system.spell.level",
      "system.storage",
    ],
  };

  /* -------------------------------------------------- */

  /**
   * Configuration of all compendium browser filters.
   * @type {Record<string, CompendiumFilter>}
   */
  static get FILTERS() {
    const isExactType = (filters, type) => {
      const types = RyuutamaCompendiumBrowser._toSetOptions(filters.itemTypes);
      return (types.size === 1) && types.has(type);
    };

    const evaluateFilter = (entry, filters, name, path, allowBlank = false) => {
      const value = Array.from(RyuutamaCompendiumBrowser._toSetOptions(filters[name]));
      if (allowBlank && !foundry.utils.getProperty(entry, path)) {
        return !value.length || !foundry.utils.objectValues(filters[name]).some(v => v === 1);
      }

      return foundry.applications.ux.SearchFilter.evaluateFilter(entry, {
        value,
        operator: foundry.applications.ux.SearchFilter.OPERATORS.CONTAINS,
        field: path,
      });
    };

    const isMonster = entry => entry.type === "monster";

    return RyuutamaCompendiumBrowser.#FILTERS ??= {
      itemTypes: {
        type: "checkboxes",
        callback: (entry, filters) => {
          const value = RyuutamaCompendiumBrowser._toSetOptions(filters.itemTypes);
          const { types = [], categories = [] } = Object.groupBy(
            value,
            v => (v in CONFIG.Item.dataModels) ? "types" : "categories",
          );
          Object.keys(CONFIG.Item.dataModels).forEach(type => {
            if (categories.includes(CONFIG.Item.dataModels[type]?.metadata?.itemGroup)) types.push(type);
          });

          return foundry.applications.ux.SearchFilter.evaluateFilter(entry, {
            value: types,
            operator: foundry.applications.ux.SearchFilter.OPERATORS.CONTAINS,
            field: "type",
          });
        },
        modes: ["Item"],
        options: new Set(Object.keys(CONFIG.Item.dataModels).map(type => {
          return CONFIG.Item.dataModels[type]?.metadata?.itemGroup ?? type;
        })).toObject().map(value => {
          const grp = `RYUUTAMA.ITEM.CREATE_GROUP.${value}`;
          if (game.i18n.has(grp)) return { value, label: _loc(grp), isGroup: true };
          return { value, label: _loc(`TYPES.Item.${value}`) };
        }).sort((a, b) => a.isGroup ? 1 : a.label.localeCompare(b.label)),
      },
      spellCategory: {
        label: _loc("RYUUTAMA.BROWSER.FILTERS.spellCategory"),
        type: "checkboxes",
        callback: (entry, filters) => evaluateFilter(entry, filters, "spellCategory", "system.category.value"),
        visible: (filters) => isExactType(filters, "spell"),
        modes: ["Item"],
        options: Object.entries(ryuutama.CONST.SPELL_CATEGORIES._toConfig)
          .map(([value, { label }]) => ({ value, label })),
      },
      spellLevel: {
        label: _loc("RYUUTAMA.BROWSER.FILTERS.spellLevel"),
        type: "checkboxes",
        callback: (entry, filters) => evaluateFilter(entry, filters, "spellLevel", "system.spell.level"),
        modes: ["Item"],
        visible: (filters) => isExactType(filters, "spell"),
        options: Object.entries(ryuutama.CONST.SPELL_LEVELS._toConfig)
          .map(([value, { label }]) => ({ value, label })),
      },
      herbCategory: {
        label: _loc("RYUUTAMA.BROWSER.FILTERS.herbCategory"),
        type: "checkboxes",
        callback: (entry, filters) => evaluateFilter(entry, filters, "herbCategory", "system.category.value"),
        modes: ["Item"],
        visible: (filters) => isExactType(filters, "herb"),
        options: Object.entries(ryuutama.CONST.HERB_TYPES._toConfig)
          .map(([value, { label }]) => ({ value, label })),
      },
      monsterLevel: {
        label: _loc("RYUUTAMA.BROWSER.FILTERS.monsterLevel"),
        type: "range",
        modes: ["Actor"],
        callback: (entry, filters) => {
          if (!isMonster(entry)) return false;
          let value = filters.monsterLevel.min || 0;
          let operator = foundry.applications.ux.SearchFilter.OPERATORS.GREATER_THAN_EQUAL;
          if (Number.isInteger(filters.monsterLevel.max)) {
            value = [value, filters.monsterLevel.max];
            operator = foundry.applications.ux.SearchFilter.OPERATORS.BETWEEN;
          }

          return foundry.applications.ux.SearchFilter.evaluateFilter(entry, {
            operator, value,
            field: "system.details.level",
          });
        },
      },
      monsterCategory: {
        label: _loc("RYUUTAMA.BROWSER.FILTERS.monsterCategory"),
        type: "checkboxes",
        callback: (entry, filters) => isMonster(entry)
          && evaluateFilter(entry, filters, "monsterCategory", "system.details.category", true),
        modes: ["Actor"],
        options: Object.entries(ryuutama.config.monsterCategories)
          .map(([value, { label }]) => ({ value, label })),
      },
      monsterSeason: {
        label: _loc("RYUUTAMA.BROWSER.FILTERS.monsterSeason"),
        type: "checkboxes",
        callback: (entry, filters) => isMonster(entry)
          && evaluateFilter(entry, filters, "monsterSeason", "system.environment.season", true),
        modes: ["Actor"],
        options: Object.entries(ryuutama.config.seasons)
          .map(([value, { label }]) => ({ value, label })),
      },
      source: {
        label: _loc("RYUUTAMA.BROWSER.FILTERS.sources"),
        type: "checkboxes",
        callback: (entry, filters) => {
          const source = entry.system.source.custom || entry.system.source.book || "";
          const value = Array.from(RyuutamaCompendiumBrowser._toSetOptions(filters.source));
          if (!source) {
            return !value.length || !foundry.utils.objectValues(filters.source).some(v => v === 1);
          }

          return foundry.applications.ux.SearchFilter.evaluateFilter({ source }, {
            value,
            operator: foundry.applications.ux.SearchFilter.OPERATORS.CONTAINS,
            field: "source",
          });
        },
        modes: ["Actor", "Item"],
        options: Object.entries(ryuutama.config.sources)
          .map(([value, label]) => ({ value, label })),
      },
    };
  }

  /**
   * Configuration of all compendium browser filters.
   * @type {Record<string, CompendiumFilter>}
   */
  static #FILTERS;

  /* -------------------------------------------------- */

  /**
   * Utility object for retrieving index entries.
   * @type {Record<FilterDocumentName, object>}
   */
  static ENTRIES = Object.freeze({
    get Actor() {
      return Object.fromEntries(
        game.packs
          .filter(pack => pack.metadata.type === "Actor")
          .map(pack => [pack.metadata.id, pack.index.contents]),
      );
    },
    get Item() {
      return Object.fromEntries(
        game.packs
          .filter(pack => pack.metadata.type === "Item")
          .map(pack => [pack.metadata.id, pack.index.contents]),
      );
    },
  });

  /* -------------------------------------------------- */
  /*   Public Methods                                   */
  /* -------------------------------------------------- */

  /**
   * Fetch documents that match search parameters.
   * @param {FilterDocumentName} documentName                 The type of documents to fetch.
   * @param {object} [options]
   * @param {BrowserFilterConfiguration} [options.filters]    Search filters to apply.
   * @param {boolean} [options.indexOnly=false]               Return the index rather than full documents.
   * @returns {Promise<BrowserFetchResults>}                  A promise that resolves to the fetched entries.
   */
  static async fetch(documentName, { filters, indexOnly = false } = {}) {
    filters = RyuutamaCompendiumBrowser.#toInitialFilters(documentName, filters);

    const methods = Object.entries(RyuutamaCompendiumBrowser.FILTERS)
      .filter(([, { visible, modes }]) =>
        modes.includes(documentName) && ((typeof visible !== "function") || visible(filters)),
      )
      .map(([name]) => name);
    if (!methods.length) return new Set();

    const match = (entry, pack) => {
      if (pack.index.has(entry.system.storage)) return false;
      return methods.every(name => RyuutamaCompendiumBrowser.FILTERS[name].callback(entry, filters));
    };

    const matches = Object.entries(RyuutamaCompendiumBrowser.ENTRIES[documentName]).reduce((acc, [pack, entries]) => {
      pack = game.packs.get(pack);
      if (!pack.visible) return acc;
      return acc.concat(entries.filter(entry => match(entry, pack)));
    }, []);

    if (indexOnly) return new Set(matches);
    return new Set((await Promise.all(matches.map(a => fromUuid(a.uuid)))).filter(_ => _));
  }

  /* -------------------------------------------------- */

  /**
   * Create an instance of the compendium browser that allowed for selecting a specific number of documents.
   * @param {CompendiumBrowserOptions} [options]
   * @returns {Promise<BrowserFetchResults|null>}   A promise that resolves to the selected documents.
   */
  static async pick({ documentName, filters, locked, selection = 1, ...options } = {}) {
    const application = new this({ documentName, filters, locked, selection, ...options });
    const { promise, resolve } = Promise.withResolvers();
    application.addEventListener("close", () => resolve(application.selected), { once: true });
    application.render({ force: true });
    return promise;
  }

  /* -------------------------------------------------- */
  /*   Instance Properties                              */
  /* -------------------------------------------------- */

  /**
   * Is changing the document name allowed?
   * @type {boolean}
   */
  get allowChangingTabs() {
    return !this.#selection?.max && (this.#locked !== true) && foundry.utils.isEmpty(this.#locked);
  }

  /* -------------------------------------------------- */

  /**
   * Current document type being filtered.
   * @type {FilterDocumentName}
   */
  #documentName;

  /* -------------------------------------------------- */

  /**
   * Re-used drag-drop instance.
   * @type {DragDrop}
   */
  #dragdrop;

  /* -------------------------------------------------- */

  /**
   * The current filter.
   * @type {BrowserFilterConfiguration}
   */
  #filter;

  /* -------------------------------------------------- */

  /**
   * The filter options that are locked.
   * @type {BrowserLockedConfiguration}
   */
  #locked;

  /* -------------------------------------------------- */

  /**
   * Cached results.
   * @type {Iterator<object>}
   */
  #results;

  /* -------------------------------------------------- */

  /**
   * Number of results that have been filtered and appended.
   * @type {number}
   */
  #resultsCount;

  /* -------------------------------------------------- */

  /**
   * Current search filter input.
   * @type {string}
   */
  #searchInput;

  /* -------------------------------------------------- */

  /**
   * Selected documents. This value is returned during a `pick` operation.
   * @type {RyuutamaActor[]|RyuutamaItem[]|null}
   */
  #selected = null;

  /**
   * Selected documents. This value is returned during a `pick` operation.
   * @type {RyuutamaActor[]|RyuutamaItem[]|null}
   */
  get selected() {
    return this.#selected;
  }

  /* -------------------------------------------------- */

  /**
   * Selection configuration.
   * @type {{ max: number, selected: Set<string> }|null}
   */
  #selection;

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    Object.assign(context, { rootId: this.id });
    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);
    switch (partId) {
      case "tabs":
        await this.#prepareTabsPart(context, options);
        break;
      case "search":
        await this.#prepareSearchPart(context, options);
        break;
      case "filters":
        await this.#prepareFiltersPart(context, options);
        break;
      case "results":
        await this.#prepareResultsPart(context, options);
        break;
      case "selected":
        await this.#prepareSelectedPart(context, options);
        break;
    }
    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare context for a part.
   * @param {object} context    Rendering context. **will be mutated.**
   * @param {object} options    Rendering options.
   * @returns {Promise<void>}
   */
  async #prepareTabsPart(context, options) {
    const disabled = !this.allowChangingTabs;
    context.buttons = [
      {
        disabled,
        label: _loc("DOCUMENT.Actors"),
        icon: getDocumentClass("Actor").getDefaultArtwork({}).img,
        documentName: "Actor",
        active: this.#documentName === "Actor",
      },
      {
        disabled,
        label: _loc("DOCUMENT.Items"),
        icon: getDocumentClass("Item").getDefaultArtwork({}).img,
        documentName: "Item",
        active: this.#documentName === "Item",

      },
    ];
  }

  /* -------------------------------------------------- */

  /**
   * Prepare context for a part.
   * @param {object} context    Rendering context. **will be mutated.**
   * @param {object} options    Rendering options.
   * @returns {Promise<void>}
   */
  async #prepareSearchPart(context, options) {
    context.value = this.#searchInput;
    context.placeholder = _loc("SIDEBAR.Search", { types: _loc(`DOCUMENT.${this.#documentName}s`) });
  }

  /* -------------------------------------------------- */

  /**
   * Prepare context for a part.
   * @param {object} context    Rendering context. **will be mutated.**
   * @param {object} options    Rendering options.
   * @returns {Promise<void>}
   */
  async #prepareFiltersPart(context, options) {
    const filters = Object.entries(RyuutamaCompendiumBrowser.FILTERS)
      .filter(([, filter]) => filter.modes.includes(this.#documentName)
        && ((typeof filter.visible !== "function") || filter.visible(this.#filter)))
      .map(([name, filter]) => {
        let range;
        let options;

        switch (filter.type) {
          case "checkboxes": {
            options = filter.options.map(o => {
              const _name = `${name}.${o.value}`;
              const value = foundry.utils.getProperty(this.#filter, _name);
              return {
                value: o.value,
                label: o.label,
                icon: (value === 1)
                  ? "fa-solid fa-check"
                  : (value === -1)
                    ? "fa-solid fa-times"
                    : "fa-regular fa-square",
                isLocked: this.#isLocked(_name),
              };
            });
            break;
          }
          case "range":
            range = {
              min: foundry.utils.getProperty(this.#filter, `${name}.min`) ?? null,
              max: foundry.utils.getProperty(this.#filter, `${name}.max`) ?? null,
              minLocked: this.#isLocked(`${name}.min`),
              maxLocked: this.#isLocked(`${name}.max`),
              minPh: filter.range?.[0] ?? "0",
              maxPh: filter.range?.[1] ?? "ထ",
            };
            break;
        }

        return {
          name, range, options,
          label: filter.label ?? null,
          type: filter.type,
        };
      });

    context.filters = filters;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare context for a part.
   * @param {object} context    Rendering context. **will be mutated.**
   * @param {object} options    Rendering options.
   * @returns {Promise<void>}
   */
  async #prepareResultsPart(context, options) {
    context.selectedResults = Object.fromEntries(Array.from(this.#selection?.selected ?? []).map(uuid => [uuid, true]));
    context.displayResultSelection = !!this.#selection?.max;
    context.documentName = this.#documentName;

    const rgx = new RegExp(RegExp.escape(this.#searchInput ?? ""), "i");
    let results = await RyuutamaCompendiumBrowser.fetch(this.#documentName, { filters: this.#filter, indexOnly: true });
    results = Array.from(results)
      .filter(result => {
        if (!this.#searchInput || !rgx) return true;
        return rgx.test(foundry.applications.ux.SearchFilter.cleanQuery(result.name));
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    this.#results = context.results = Iterator.from(results);

    if (options.isFirstRender || options.clearCachedResults) {
      // A first render of re-render by changing the filters means the results are entirely new.
      context._results = Array.from(context.results.take(50))
        .map(index => this.#createResult(index).outerHTML).join("");
      this.#resultsCount = 50;
    } else {
      // A general re-render should fetch the same number of results.
      context._results = Array.from(context.results.take(this.#resultsCount))
        .map(index => this.#createResult(index).outerHTML).join("");
    }
  }

  /* -------------------------------------------------- */

  /**
   * Prepare context for a part.
   * @param {object} context    Rendering context. **will be mutated.**
   * @param {object} options    Rendering options.
   * @returns {Promise<void>}
   */
  async #prepareSelectedPart(context, options) {
    if (!this.#selection?.max) return;
    context.displaySelected = true;
    context.currentlySelected = Array.from(this.#selection.selected)
      .map(uuid => fromUuidSync(uuid))
      .filter(_ => _)
      .sort((a, b) => a.name.localeCompare(b.name));

    context.displayControls = true;
    context.selection = {
      value: this.#selection.selected.size,
      max: this.#selection.max,
    };
    context.defaultArtwork = getDocumentClass(this.#documentName).getDefaultArtwork({}).img;
    context.displayTooltips = this.#documentName === "Item";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _attachPartListeners(partId, element, options) {
    super._attachPartListeners(partId, element, options);

    if (partId === "filters") {
      const listener = foundry.utils.debounce(RyuutamaCompendiumBrowser.#onChangeRangeFilter, 200);
      element.querySelectorAll("[data-change]").forEach(element => {
        const eventName = element.dataset.change;
        element.addEventListener(eventName, event => listener.call(this, event, element));
      });
    }

    else if (partId === "search") {
      const input = element.querySelector("[name=search]");
      const listener = foundry.utils.debounce(RyuutamaCompendiumBrowser.#onSearch, 200);
      input.addEventListener("input", event => listener.call(this, event, input));
    }

    else if (partId === "results") {
      const listener = foundry.utils.debounce(RyuutamaCompendiumBrowser.#onScrollResults, 100);
      element.addEventListener("scroll", (event) => listener.call(this, event, element));

      const dd = this.#dragdrop ??= new CONFIG.ux.DragDrop({
        dragSelector: "[data-dragstart]",
        callbacks: {
          dragstart: RyuutamaCompendiumBrowser.#onDragStart.bind(this),
        },
      });
      dd.bind(this.element);
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _syncPartState(partId, newElement, priorElement, state) {
    if ((partId === "results") && (newElement.dataset.documentName !== priorElement.dataset.documentName)) {
      // Do not retain scroll position of the results when swapping document name.
      state.scrollPositions = [];
    }

    super._syncPartState(partId, newElement, priorElement, state);
  }

  /* -------------------------------------------------- */

  /**
   * Create result HTML for an indexed document.
   * @param {object} index
   * @returns {HTMLElement}
   */
  #createResult(index) {
    const { max, selected } = this.#selection ?? {};
    const { name, type, uuid, img } = index;
    const displayTooltip = this.#documentName === "Item";
    const isSelected = selected?.has(uuid);
    const displaySelection = !!max;
    const src = img || getDocumentClass(this.#documentName).getDefaultArtwork({ type }).img;

    const identity = `
    <a class="identity" data-action="openDocument">
      <img src="${src}" alt="${name}" loading="lazy">
      <span class="name">${name}</span>
    </a>`;

    /** @type {HTMLElement} */
    const controls = foundry.utils.parseHTML("<span class='controls'></span>");
    if (displaySelection) {
      controls.insertAdjacentHTML("beforeend",
        `<input type="checkbox" data-change="selectResult" ${isSelected ? "checked" : ""}>`,
      );
    }

    const result = document.createElement("DIV");
    result.classList.add("result");
    if (displaySelection && isSelected) result.classList.add("selected");
    result.dataset.tooltipDirection = "RIGHT";
    result.dataset.uuid = uuid;
    result.dataset.dragstart = "";
    result.dataset.name = name;
    if (displayTooltip) result.dataset.tooltipHtml = CONFIG.ux.TooltipManager.constructHTML({ uuid });

    result.insertAdjacentHTML("beforeend", identity);
    result.insertAdjacentElement("beforeend", controls);

    return result;
  }

  /* -------------------------------------------------- */
  /*   Event Handlers                                   */
  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onChangeForm(formConfig, event) {
    super._onChangeForm(formConfig, event);

    if (event.target?.dataset.change === "selectResult") {
      const checked = event.target.checked;
      const uuid = event.target.closest("[data-uuid]").dataset.uuid;
      if (!checked) this.#selection.selected.delete(uuid);
      else this.#selection.selected.add(uuid);
      this.render({ parts: ["selected"] });
    }
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaCompendiumBrowser
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing element that defined the [data-action].
   */
  static #adjustFilter(event, target) {
    const { filter, value } = target.dataset;
    const name = `${filter}.${value}`;

    // Locked filters cannot be modified.
    if (this.#isLocked(name)) return;

    const current = foundry.utils.getProperty(this.#filter, name) ?? 0;
    const options = [0, 1, -1];
    if (event.button === 2) options.reverse();
    const index = options.indexOf(current);
    const next = options[index + 1] ?? options[0];
    foundry.utils.setProperty(this.#filter, name, next);
    this.render({ parts: ["filters", "results"] });
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaCompendiumBrowser
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing element that defined the [data-action].
   */
  static #changeDocumentType(event, target) {
    if (!this.allowChangingTabs) return;
    const documentName = target.dataset.documentName;
    if (documentName === this.#documentName) return;
    this.#documentName = documentName;
    this.#filter = RyuutamaCompendiumBrowser.#baseFilterConfiguration(this.#documentName);
    this.#locked = {};
    this.#selected = null;
    this.#selection?.selected.clear();
    this.#searchInput = "";
    this.render({ clearCachedResults: true });
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaCompendiumBrowser
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing element that defined the [data-action].
   */
  static async #confirmSelection(event, target) {
    target.disabled = true;
    const uuids = Array.from(this.#selection.selected);
    const documents = await Promise.all(uuids.map(uuid => fromUuid(uuid)));
    this.#selected = documents.filter(_ => _);
    this.close();
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaCompendiumBrowser
   * @param {Event} event           The initiating change or input event.
   * @param {HTMLElement} target    The element the change event listener was attached to.
   */
  static #onChangeRangeFilter(event, target) {
    const { filter, value } = target.dataset;

    const name = `${filter}.${value}`;
    if (this.#isLocked(name)) return;

    let v = target.valueAsNumber;
    if (isNaN(v) || (v < 0)) v = 0;
    foundry.utils.setProperty(this.#filter, name, v);

    this.render({ parts: ["filters", "results"] });
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaCompendiumBrowser
   * @param {DragEvent} event
   */
  static #onDragStart(event) {
    const uuid = event.currentTarget.closest("[data-uuid]").dataset.uuid;
    const { type } = foundry.utils.parseUuid(uuid);
    event.dataTransfer.setData("text/plain", JSON.stringify({ uuid, type }));
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaCompendiumBrowser
   * @param {WheelEvent} event      The initiating scroll event.
   * @param {HTMLElement} target    The element the change event listener was attached to.
   */
  static #onScrollResults(event, target) {
    const { scrollTop, scrollHeight, clientHeight } = target;
    if ((scrollTop + clientHeight) < (scrollHeight - 50)) return;

    /** @type {HTMLElement} */
    const parent = event.target.querySelector(".content");
    this.#results.take(50).forEach(index => {
      this.#resultsCount++;
      const html = this.#createResult(index);
      html.draggable = true;
      html.addEventListener("dragstart", this.#dragdrop.callbacks.dragstart.bind(this));
      parent.insertAdjacentElement("beforeend", html);
    });
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaCompendiumBrowser
   * @param {InputEvent} event
   * @param {HTMLElement} target
   */
  static #onSearch(event, target) {
    this.#searchInput = target.value;
    this.render({ parts: ["results"] });
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaCompendiumBrowser
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing element that defined the [data-action].
   */
  static #openDocument(event, target) {
    fromUuid(target.closest("[data-uuid]").dataset.uuid)
      .then(doc => doc.sheet.render({ force: true }));
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaCompendiumBrowser
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing element that defined the [data-action].
   */
  static #removeSelected(event, target) {
    const uuid = target.closest("[data-uuid]").dataset.uuid;
    this.#selection.selected.delete(uuid);
    this.render({ parts: ["results", "selected"] });
  }

  /* -------------------------------------------------- */
  /*   Utility Methods                                  */
  /* -------------------------------------------------- */

  /**
   * Is this filter locked?
   * @param {string} name   A key like `spellLevel.mid` to check for a specific
   *                        option, or `spellLevel` for an entire category.
   * @returns {boolean}
   */
  #isLocked(name) {
    if (this.#locked === true) return true;
    const [a, b] = name.split(".");
    return (this.#locked[a] === true) || (this.#locked[a]?.[b] === true);
  }

  /* -------------------------------------------------- */

  /**
   * Utility method for retrieving the set of values from a filter.
   * @param {BrowserCheckboxFilter} [filter]
   * @returns {Set<string>}
   */
  static _toSetOptions(filter = {}) {
    filter = foundry.utils.objectValues(filter).some(v => v === 1)
      ? Object.keys(filter).filter(k => filter[k] === 1)
      : Object.keys(filter).filter(k => filter[k] !== -1);
    return new Set(filter);
  }

  /* -------------------------------------------------- */

  /**
   * Construct base filter configuration.
   * @param {FilterDocumentName} documentName
   * @returns {BrowserFilterConfiguration}
   */
  static #baseFilterConfiguration(documentName) {
    return Object.entries(RyuutamaCompendiumBrowser.FILTERS).reduce((acc, [name, filter]) => {
      if (!filter.modes.includes(documentName)) return acc;
      let obj;
      switch (filter.type) {
        case "checkboxes":
          obj = Object.fromEntries(filter.options.map(({ value }) => [value, 0]));
          break;
        case "range": {
          const [min = 0, max = null] = filter.range ?? [];
          obj = { min, max };
          break;
        }
      }
      return Object.assign(acc, { [name]: obj });
    }, {});
  }

  /* -------------------------------------------------- */

  /**
   * Utility method for creating initial filter configurations.
   * @param {FilterDocumentName} documentName
   * @param {BrowserFilterConfiguration} [filters]
   * @returns {BrowserFilterConfiguration}
   */
  static #toInitialFilters(documentName, filters = {}) {
    const base = RyuutamaCompendiumBrowser.#baseFilterConfiguration(documentName);
    return foundry.utils.mergeObject(base, filters, { insertKeys: false, insertValues: false });
  }
}
