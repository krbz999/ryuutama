import RyuutamaDocumentSheet from "../../api/document-sheet.mjs";

/**
 * @import { ContextMenuEntry } from "@client/applications/ux/context-menu.mjs";
 * @import RyuutamaSearchManager from "../../ux/search-manager.mjs";
 * @import { SearchCategory } from "../../../_types.mjs";
 */

/**
 * Base actor sheet.
 * @extends RyuutamaDocumentSheet
 */
export default class RyuutamaBaseActorSheet extends RyuutamaDocumentSheet {
  /** @override */
  static DEFAULT_OPTIONS = {
    actions: {
      advance: RyuutamaBaseActorSheet.#advance,
      castSpell: RyuutamaBaseActorSheet.#castSpell,
      configure: RyuutamaBaseActorSheet.#configure,
      configurePrototypeToken: RyuutamaBaseActorSheet.#configurePrototypeToken,
      cycleCategorizationMode: RyuutamaBaseActorSheet.#cycleCategorizationMode,
      cycleSortMode: RyuutamaBaseActorSheet.#cycleSortMode,
      deleteEffect: RyuutamaBaseActorSheet.#deleteEffect,
      deleteItem: RyuutamaBaseActorSheet.#deleteItem,
      renderItem: RyuutamaBaseActorSheet.#renderItem,
      rollAttack: RyuutamaBaseActorSheet.#rollAttack,
      rollCheck: RyuutamaBaseActorSheet.#rollCheck,
      showPortrait: RyuutamaBaseActorSheet.#showPortrait,
      toggleFilterList: RyuutamaBaseActorSheet.#toggleFilterList,
      toggleFilterOption: { handler: RyuutamaBaseActorSheet.#toggleFilterOption, buttons: [0, 2] },
      toggleSectionCollapse: RyuutamaBaseActorSheet.#toggleSectionCollapse,
      toggleStatus: RyuutamaBaseActorSheet.#toggleStatus,
      unequipItem: RyuutamaBaseActorSheet.#unequipItem,
    },
    window: {
      resizable: true,
      controls: [
        {
          action: "configurePrototypeToken",
          icon: "fa-solid fa-circle-user",
          label: "TOKEN.TitlePrototype",
          ownership: "OWNER",
        },
      ],
    },
  };

  /* -------------------------------------------------- */

  /**
   * Search configuration.
   * @type {Record<string, SearchCategory>}
   */
  static SEARCH = {};

  /* -------------------------------------------------- */

  /** @override */
  get title() {
    return this.document.name;
  }

  /* -------------------------------------------------- */

  /**
   * Notes sections that have been collapsed.
   * @type {Set<string>}
   */
  #collapsedSections = new Set();

  /* -------------------------------------------------- */

  /**
   * @type {RyuutamaSearchManager}
   */
  #search = new ryuutama.applications.ux.RyuutamaSearchManager(this.document, this.constructor.SEARCH);
  get search() {
    return this.#search;
  }

  /* -------------------------------------------------- */

  /**
   * The unique search filters.
   * @type {Map<string, RyuutamaSearchFilter>}
   */
  #searchFilters = new Map();

  /* -------------------------------------------------- */

  /**
   * The search inputs with currently expanded filter lists.
   * If the key is in the set, the list is expanded.
   * @type {Set<string>}
   */
  #expandedFilters = new Set();
  get expandedFilters() {
    return this.#expandedFilters;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _getHeaderControls() {
    const controls = super._getHeaderControls();
    if (!this.isEditable || this.document.isToken) {
      controls.findSplice(c => c.action === "configurePrototypeToken");
    }
    return controls;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.collapsed = Object.fromEntries(Array.from(this.#collapsedSections).map(s => [s, true]));

    // Set up search filters.
    for (const key of Object.keys(this.constructor.SEARCH)) {
      if (this.#searchFilters.get(key)) continue;
      this.#searchFilters.set(key, new ryuutama.applications.ux.RyuutamaSearchFilter({
        inputSelector: `[id="${context.rootId}-search.${key}"]`,
        contentSelector: `[data-search-container="${key}"]`,
        initial: "",
        callback: RyuutamaBaseActorSheet.#searchListings.bind(this),
        delay: 200,
      }));
    }

    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);

    // Manage items.
    this._createContextMenu(
      RyuutamaBaseActorSheet.#createItemContextOptions.bind(this),
      "[data-item-context]",
      { hookName: "get{}ItemContextOptions", parentClassHooks: false, fixed: true },
    );

    // Manage effects.
    this._createContextMenu(
      RyuutamaBaseActorSheet.#createActiveEffectContextOptions.bind(this),
      "[data-effect-context]",
      { hookName: "Get{}ActiveEffectContextOptions", parentClassHooks: false, fixed: true },
    );
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    for (const k of Object.keys(this.constructor.SEARCH)) {
      this.#searchFilters.get(k).bind(this.element, false);
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _processFormData(event, form, formData) {
    formData = super._processFormData(event, form, formData);

    for (const resource of ["stamina", "mental"]) {
      if (foundry.utils.hasProperty(formData, `system.resources.${resource}.value`)) {
        const value = foundry.utils.getProperty(formData, `system.resources.${resource}.value`);
        const { max } = this.document.system.resources[resource];
        foundry.utils.setProperty(formData, `system.resources.${resource}.spent`, max - value);
      }
    }

    return formData;
  }

  /* -------------------------------------------------- */

  /**
   * Create context menu options for items.
   * @this RyuutamaBaseActorSheet
   * @returns {ContextMenuEntry[]}
   */
  static #createItemContextOptions() {
    const getItem = target => this.getEmbeddedDocument(target.closest("[data-uuid]").dataset.uuid);

    /** @type {ContextMenuEntry[]} */
    const options = [
      {
        name: "RYUUTAMA.ACTOR.CONTEXT.ITEM.view",
        icon: "fa-solid fa-fw fa-eye",
        callback: target => getItem(target).sheet.render({ force: true, mode: 1 }),
      },
      {
        name: "RYUUTAMA.ACTOR.CONTEXT.ITEM.edit",
        icon: "fa-solid fa-fw fa-edit",
        callback: target => getItem(target).sheet.render({ force: true, mode: 0 }),
      },
      {
        name: "RYUUTAMA.ACTOR.CONTEXT.ITEM.delete",
        icon: "fa-solid fa-fw fa-trash",
        callback: target => getItem(target).deleteDialog(),
        condition: target => this.isEditable && (getItem(target).type !== "class"),
      },
      {
        group: "system",
        name: "RYUUTAMA.ACTOR.CONTEXT.ITEM.equip",
        icon: "fa-solid fa-fw fa-shield",
        condition: target => {
          if (!this.isEditable || (this.document.type !== "traveler")) return false;
          const item = getItem(target);
          if ((item.type === "shield") && !this.document.system.canEquipShield) return false;
          else if (!this.document.system.schema.fields.equipped.has(item.type)) return false;
          const equipped = this.document.system.equipped[item.type];
          return equipped !== item;
        },
        callback: target => {
          const item = getItem(target);
          this.document.update({ [`system.equipped.${item.type}`]: item.id });
        },
      },
      {
        group: "system",
        name: "RYUUTAMA.ACTOR.CONTEXT.ITEM.unequip",
        icon: "fa-solid fa-fw fa-shield-alt",
        condition: target => {
          const item = getItem(target);
          return this.isEditable && (this.document.type === "traveler")
            && (this.document.system.equipped[item.type] === item);
        },
        callback: target => {
          const item = getItem(target);
          this.document.update({ [`system.equipped.${item.type}`]: null });
        },
      },
      {
        group: "system",
        name: "RYUUTAMA.ACTOR.CONTEXT.ITEM.assignSpecialAbility",
        icon: "fa-solid fa-fw fa-star",
        condition: target => {
          if (this.document.type !== "monster") return false;
          const item = getItem(target);
          const isSpecial = this.document.getFlag(ryuutama.id, "specialAbility") === item.id;
          return (item.type === "skill") && !isSpecial;
        },
        callback: target => {
          const item = getItem(target);
          this.document.setFlag(ryuutama.id, "specialAbility", item.id);
        },
      },
      {
        group: "system",
        name: "RYUUTAMA.ACTOR.CONTEXT.ITEM.castSpell",
        icon: "fa-solid fa-fw fa-book",
        condition: target => {
          const item = getItem(target);
          return (typeof this.document.system.castSpell === "function") && (item.type === "spell");
        },
        callback: target => {
          this.document.system.castSpell(getItem(target));
        },
      },
    ];

    if (game.release.generation < 14) return options.map(k => ({ ...k, icon: `<i class="${k.icon}"></i>` }));
    return options;
  }

  /* -------------------------------------------------- */

  /**
   * Create context menu options for effects.
   * @this RyuutamaBaseActorSheet
   * @returns {ContextMenuEntry[]}
   */
  static #createActiveEffectContextOptions() {
    const getItem = target => this.getEmbeddedDocument(target.closest("[data-uuid]").dataset.uuid);

    /** @type {ContextMenuEntry[]} */
    const options = [
      {
        name: "RYUUTAMA.ACTOR.CONTEXT.EFFECT.edit",
        icon: "fa-solid fa-fw fa-edit",
        callback: target => getItem(target).sheet.render({ force: true }),
      },
      {
        name: "RYUUTAMA.ACTOR.CONTEXT.EFFECT.delete",
        icon: "fa-solid fa-fw fa-trash",
        callback: target => getItem(target).deleteDialog(),
        condition: target => (getItem(target).parent === this.document) && this.isEditable,
      },
      {
        name: "RYUUTAMA.ACTOR.CONTEXT.EFFECT.disable",
        icon: "fa-solid fa-fw fa-times",
        callback: target => getItem(target).update({ disabled: true }),
        condition: target => this.isEditable && !getItem(target).disabled,
      },
      {
        name: "RYUUTAMA.ACTOR.CONTEXT.EFFECT.enable",
        icon: "fa-solid fa-fw fa-check",
        callback: target => getItem(target).update({ disabled: false }),
        condition: target => this.isEditable && getItem(target).disabled,
      },
    ];

    if (game.release.generation < 14) return options.map(k => ({ ...k, icon: `<i class="${k.icon}"></i>` }));
    return options;
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaBaseActorSheet
   * @param {Event} event
   * @param {string} query
   * @param {RegExp} regex
   * @param {HTMLElement} container
   */
  static #searchListings(event, query, regex, container) {
    const key = container.dataset.searchContainer;
    const entries = container.querySelectorAll(".entry[data-uuid]");
    const matches = this.search.search(key, query).map(item => item.uuid);
    for (const entry of entries) entry.classList.toggle("hidden", !matches.includes(entry.dataset.uuid));
  }

  /* -------------------------------------------------- */
  /*   Event Handlers                                   */
  /* -------------------------------------------------- */

  /**
   * @this RyuutamaBaseActorSheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static #advance(event, target) {
    this.document.system.advance();
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaBaseActorSheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static #castSpell(event, target) {
    const item = this.getEmbeddedDocument(target.closest("[data-uuid]").dataset.uuid);
    this.document.system.castSpell(item);
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaBaseActorSheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static #configure(event, target) {
    const options = { document: this.document };
    let application;
    switch (target.dataset.config) {
      case "ability":
        options.ability = target.dataset.ability;
        application = new ryuutama.applications.apps.AbilityConfig(options);
        break;
      case "attack":
        application = new ryuutama.applications.apps.AttackConfig(options);
        break;
      case "condition":
        application = new ryuutama.applications.apps.ConditionConfig(options);
        break;
      case "defense":
        application = new ryuutama.applications.apps.DefenseConfig(options);
        break;
      case "resource":
        options.resource = target.dataset.resource;
        application = new ryuutama.applications.apps.ResourceConfig(options);
        break;
    }
    if (!application) return;
    application.render({ force: true });
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaBaseActorSheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static #configurePrototypeToken(event, target) {
    new CONFIG.Token.prototypeSheetClass({
      prototype: this.document.prototypeToken,
      position: {
        left: Math.max(this.position.left - 560 - 10, 10),
        top: this.position.top,
      },
    }).render({ force: true });
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaBaseActorSheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static async #cycleCategorizationMode(event, target) {
    const key = target.closest("[data-search]").dataset.search;
    await this.search.cycleCategorizationMode(key);
    this.render();
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaBaseActorSheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static async #cycleSortMode(event, target) {
    const key = target.closest("[data-search]").dataset.search;
    await this.search.cycleSortMode(key);
    this.render();
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaBaseActorSheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static #deleteEffect(event, target) {
    const effect = this.getEmbeddedDocument(target.closest("[data-uuid]").dataset.uuid);
    effect.deleteDialog({ yes: { default: true } });
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaBaseActorSheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static #deleteItem(event, target) {
    const item = this.getEmbeddedDocument(target.closest("[data-uuid]").dataset.uuid);
    item?.deleteDialog();
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaBaseActorSheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static #renderItem(event, target) {
    const item = this.getEmbeddedDocument(target.dataset.uuid);
    item.sheet.render({ force: true, mode: 1 });
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaBaseActorSheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static #rollAttack(event, target) {
    this.document.system.rollAttack({}, { configure: !event.shiftKey }, {});
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaBaseActorSheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static #rollCheck(event, target) {
    const type = target.dataset.check;
    const configure = !event.shiftKey;
    this.document.system.rollCheck({ type }, { configure });
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaBaseActorSheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static #showPortrait(event, target) {
    const { img: src, uuid, name: title } = this.document;
    new foundry.applications.apps.ImagePopout({ src, uuid, window: { title } }).render({ force: true });
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaBaseActorSheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static #toggleFilterList(event, target) {
    const key = target.closest("[data-search]").dataset.search;
    if (this.#expandedFilters.has(key)) this.#expandedFilters.delete(key);
    else this.#expandedFilters.add(key);
    target.classList.toggle("expanded", this.#expandedFilters.has(key));
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaBaseActorSheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static #toggleFilterOption(event, target) {
    const { id, option } = target.dataset;
    const key = target.closest("[data-search]").dataset.search;
    const state = this.search.cycle(key, id, option, event.button === 2);
    target.classList.toggle("active", state === 1);
    target.classList.toggle("inactive", state === -1);
    this.#searchFilters.get(key).bind(this.element, false);
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaBaseActorSheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static #toggleSectionCollapse(event, target) {
    const section = target.closest("[data-collapse-section]").dataset.collapseSection;
    if (this.#collapsedSections.has(section)) this.#collapsedSections.delete(section);
    else this.#collapsedSections.add(section);
    target.closest(".collapsible-container").classList.toggle("collapsed", this.#collapsedSections.has(section));
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaBaseActorSheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static #toggleStatus(event, target) {
    const status = target.dataset.status;
    this.document.toggleStatusEffect(status);
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaBaseActorSheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static #unequipItem(event, target) {
    const item = this.getEmbeddedDocument(target.closest("[data-uuid]").dataset.uuid);
    this.document.update({ [`system.equipped.${item.type}`]: null });
  }
}
