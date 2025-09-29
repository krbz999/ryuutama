import RyuutamaDocumentSheet from "../api/document-sheet.mjs";

export default class RyuutamaActorSheet extends RyuutamaDocumentSheet {
  /** @override */
  static DEFAULT_OPTIONS = {
    actions: {
      renderItem: RyuutamaActorSheet.#renderItem,
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
        { id: "weapon" },
        { id: "shield" },
        { id: "armor" },
        { id: "hat" },
        { id: "cape" },
        { id: "shoes" },
        { id: "accessory" },
        { id: "staff" },
      ],
      initial: "weapon",
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _getTabsConfig(group) {
    const tabs = super._getTabsConfig(group);
    if (group !== "inventory") return tabs;
    return {
      ...tabs,
      tabs: tabs.tabs.map(tab => ({ id: tab.id, label: `TYPES.Item.${tab.id}Pl` })),
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.tabs = this._prepareTabs("primary");
    context.inventoryTabs = this._prepareTabs("inventory");

    for (const type of ["weapon", "shield", "armor", "hat", "cape", "shoes", "accessory", "staff"]) {
      context.itemTypes ??= [];
      const items = this.document.items.documentsByType[type];
      context.itemTypes.push({
        type,
        cssClass: context.inventoryTabs[type].cssClass,
        section: game.i18n.localize(`TYPES.Item.${type}Pl`),
        items: items.map(item => ({ document: item })),
      });
    }

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

    new CONFIG.ux.DragDrop({
      dragSelector: null,
      dropSelector: null,
      permissions: {},
      callbacks: {
        drop: RyuutamaActorSheet.#onDrop.bind(this),
      },
    }).bind(this.element);
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
}
