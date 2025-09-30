/**
 * @import RyuutamaItem from "../../documents/item.mjs";
 * @import DragDrop from "@client/applications/ux/drag-drop.mjs";
 * @import { ContextMenuEntry } from "@client/applications/ux/context-menu.mjs";
 */

import RyuutamaDocumentSheet from "../api/document-sheet.mjs";

/**
 * Base actor sheet.
 * @extends RyuutamaDocumentSheet
 */
export default class RyuutamaActorSheet extends RyuutamaDocumentSheet {
  /** @override */
  static DEFAULT_OPTIONS = {
    actions: {
      renderItem: RyuutamaActorSheet.#renderItem,
      rollCheck: RyuutamaActorSheet.#rollCheck,
    },
  };

  /* -------------------------------------------------- */

  /** @override */
  static PARTS = {
    navigation: {
      template: "templates/generic/tab-navigation.hbs",
    },
    attributes: {
      template: "systems/ryuutama/templates/sheets/actor-sheet/attributes.hbs",
      classes: ["tab", "standard-form", "scrollable"],
    },
    details: {
      template: "systems/ryuutama/templates/sheets/actor-sheet/details.hbs",
      classes: ["tab", "standard-form", "scrollable"],
    },
    inventory: {
      template: "systems/ryuutama/templates/sheets/actor-sheet/inventory.hbs",
      classes: ["tab", "standard-form", "scrollable"],
    },
    notes: {
      template: "systems/ryuutama/templates/sheets/actor-sheet/notes.hbs",
      classes: ["tab", "standard-form", "scrollable"],
    },
  };

  /* -------------------------------------------------- */

  /** @override */
  static TABS = {
    primary: {
      tabs: [
        { id: "attributes" },
        { id: "details" },
        { id: "inventory" },
        { id: "notes" },
      ],
      initial: "attributes",
      labelPrefix: "RYUUTAMA.ACTOR.TABS",
    },
    inventory: {
      tabs: [
        { id: "arsenal" },
        { id: "gear" },
      ],
      initial: "arsenal",
      labelPrefix: "RYUUTAMA.ACTOR.INVENTORY_TABS",
    },
  };

  /* -------------------------------------------------- */

  /**
   * A reference to the DragDrop instance, reused across re-renders.
   * @type {DragDrop}
   */
  #dragDrop;

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.tabs = this._prepareTabs("primary");
    context.inventoryTabs = this._prepareTabs("inventory");

    // Subsections on the inventory tab
    const inventorySection = (...types) => {
      const groups = [];
      for (const type of types) {
        const items = this.document.items.documentsByType[type];
        if (!items.length) continue;
        groups.push({
          label: game.i18n.localize(`TYPES.Item.${type}Pl`),
          items: items.map(item => ({ document: item })),
        });
      }
      return groups;
    };

    context.inventorySections = [
      {
        id: "arsenal",
        cssClass: context.inventoryTabs.arsenal.cssClass,
        groups: inventorySection("weapon", "shield", "armor"),
      },
      {
        id: "gear",
        cssClass: context.inventoryTabs.gear.cssClass,
        groups: inventorySection("hat", "cape", "shoes", "accessory", "staff"),
      },
    ];

    // Options for abilities.
    const abilityOptions = [4, 6, 8, 10, 12].map(n => ({ value: n, label: `d${n}` }));
    context.abilities = Object.keys(ryuutama.config.abilityScores).map(abi => {
      return {
        field: this.document.system.schema.getField(`abilities.${abi}.value`),
        disabled: context.disabled,
        options: abilityOptions,
        value: context.disabled
          ? this.document.system.abilities[abi].value
          : this.document.system._source.abilities[abi].value,
      };
    });

    const rollData = this.document.getRollData();
    const enrichment = { relativeTo: this.document, rollData };
    context.enriched = {
      appearance: await CONFIG.ux.TextEditor.enrichHTML(this.document.system.background.appearance, enrichment),
      hometown: await CONFIG.ux.TextEditor.enrichHTML(this.document.system.background.hometown, enrichment),
      notes: await CONFIG.ux.TextEditor.enrichHTML(this.document.system.background.notes, enrichment),
    };

    context.equipped = {};
    for (const type of ["weapon", "shield", "armor", "hat", "cape", "shoes", "accessory", "staff"]) {
      context.equipped[type] = {
        label: game.i18n.localize(`TYPES.Item.${type}`),
        options: this.document.items.documentsByType[type].map(item => ({ value: item.id, label: item.name })),
        value: this.document.system._source.equipped[type],
      };
    }
    if (this.document.system.equipped.weapon?.system.grip === 2) delete context.equipped.shield;

    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);

    this._createContextMenu(RyuutamaActorSheet.#createItemContextOptions.bind(this), "inventory-element .entry", {
      hookName: "get{}ItemContextOptions",
      parentClassHooks: false,
      fixed: true,
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    this.#dragDrop ??= new CONFIG.ux.DragDrop({
      dragSelector: "inventory-element .entry",
      dropSelector: null,
      permissions: {
        dragstart: RyuutamaActorSheet.#canDragstart.bind(this),
        drop: RyuutamaActorSheet.#canDrop.bind(this),
      },
      callbacks: {
        dragstart: RyuutamaActorSheet.#onDragstart.bind(this),
        drop: RyuutamaActorSheet.#onDrop.bind(this),
      },
    });
    this.#dragDrop.bind(this.element);
  }

  /* -------------------------------------------------- */

  /**
   * Create context menu options for items.
   * @this RyuutamaActorSheet
   * @returns {ContextMenuEntry[]}
   */
  static #createItemContextOptions() {
    /** @type {ContextMenuEntry[]} */
    const options = [
      {
        name: "RYUUTAMA.ACTOR.CONTEXT.ITEM.view",
        icon: "fa-solid fa-fw fa-eye",
        callback: target => this.document.items.get(target.dataset.itemId).sheet.render({ force: true, mode: 1 }),
      },
      {
        name: "RYUUTAMA.ACTOR.CONTEXT.ITEM.edit",
        icon: "fa-solid fa-fw fa-edit",
        callback: target => this.document.items.get(target.dataset.itemId).sheet.render({ force: true, mode: 0 }),
      },
      {
        name: "RYUUTAMA.ACTOR.CONTEXT.ITEM.delete",
        icon: "fa-solid fa-fw fa-trash",
        callback: target => this.document.items.get(target.dataset.itemId).deleteDialog(),
        condition: () => this.isEditable,
      },
    ];

    if (game.release.generation < 14) return options.map(k => ({ ...k, icon: `<i class="${k.icon}"></i>` }));
    return options;
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaActorSheet
   */
  static #canDragstart(selector) {
    return true;
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaActorSheet
   */
  static #canDrop(selector) {
    if (!this.isEditable) return false;
    return true;
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaActorSheet
   */
  static #onDragstart(event) {
    const target = event.currentTarget;
    if ("link" in event.target.dataset) return;

    /** @type {RyuutamaItem} */
    const item = this.document.items.get(target.dataset.itemId);
    const data = item.toDragData();
    event.dataTransfer.setData("text/plain", JSON.stringify(data));
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaActorSheet
   */
  static async #onDrop(event) {
    const { type, uuid } = CONFIG.ux.TextEditor.getDragEventData(event);
    if (type !== "Item") return;
    const item = await fromUuid(uuid);
    if (item.parent === this.document) return; // TODO: sort?

    const keepId = !this.document.items.has(item.id);
    const itemData = game.items.fromCompendium(item, { keepId });
    getDocumentClass("Item").create(itemData, { parent: this.document, keepId });
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaActorSheet
   */
  static #renderItem(event, target) {
    const item = this.document.items.get(target.dataset.itemId, { strict: true });
    item.sheet.render({ force: true, mode: 0 });
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaActorSheet
   */
  static #rollCheck(event, target) {
    const type = target.dataset.check;
    this.document.system.rollCheck({ type });
  }
}
