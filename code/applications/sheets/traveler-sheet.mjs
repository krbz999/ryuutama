import RyuutamaActorSheet from "./actor-sheet.mjs";

/**
 * Ryuutama Traveler Sheet.
 * @extends RyuutamaActorSheet
 */
export default class RyuutamaTravelerSheet extends RyuutamaActorSheet {
  /** @override */
  static PARTS = {
    header: {
      template: "systems/ryuutama/templates/sheets/shared/header.hbs",
      templates: ["templates/generic/tab-navigation.hbs"],
    },
    attributes: {
      template: "systems/ryuutama/templates/sheets/traveler-sheet/attributes.hbs",
      classes: ["tab", "standard-form", "scrollable"],
    },
    details: {
      template: "systems/ryuutama/templates/sheets/traveler-sheet/details.hbs",
      classes: ["tab", "standard-form", "scrollable"],
    },
    spells: {
      template: "systems/ryuutama/templates/sheets/traveler-sheet/spells.hbs",
      classes: ["tab", "standard-form", "scrollable"],
    },
    inventory: {
      template: "systems/ryuutama/templates/sheets/traveler-sheet/inventory.hbs",
      classes: ["tab", "standard-form", "scrollable"],
    },
    notes: {
      template: "systems/ryuutama/templates/sheets/traveler-sheet/notes.hbs",
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
        { id: "spells" },
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
        { id: "herbs" },
        { id: "containers" },
      ],
      initial: "arsenal",
      labelPrefix: "RYUUTAMA.ACTOR.INVENTORY_TABS",
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _getTabsConfig(group) {
    const config = foundry.utils.deepClone(super._getTabsConfig(group)) ?? null;
    const actor = this.document;
    if ((group === "primary") && !actor.items.documentsByType.spell.length && !actor.system.type.types.magic) {
      config.tabs.findSplice(tab => tab.id === "spells");
    }
    return config;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _configureRenderParts(options) {
    const parts = super._configureRenderParts(options);

    const actor = this.document;
    if (!actor.items.documentsByType.spell.length && !actor.system.type.types.magic) {
      delete parts.spells;
    }

    return parts;
  }

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
      {
        id: "herbs",
        cssClass: context.inventoryTabs.herbs.cssClass,
        groups: inventorySection("herb"),
      },
      {
        id: "containers",
        cssClass: context.inventoryTabs.containers.cssClass,
        groups: inventorySection("container"),
      },
    ];

    const rollData = this.document.getRollData();
    const enrichment = { relativeTo: this.document, rollData };
    context.enriched = {
      appearance: await CONFIG.ux.TextEditor.enrichHTML(this.document.system.background.appearance, enrichment),
      hometown: await CONFIG.ux.TextEditor.enrichHTML(this.document.system.background.hometown, enrichment),
      notes: await CONFIG.ux.TextEditor.enrichHTML(this.document.system.background.notes, enrichment),
    };

    context.equipped = {};
    for (const type of ["weapon", "shield", "armor", "hat", "cape", "shoes", "accessory", "staff"]) {
      const item = this.document.system.equipped[type];
      context.equipped[type] = {
        item,
        img: item ? item.img : foundry.documents.Item.implementation.DEFAULT_ICON,
        label: game.i18n.localize(`TYPES.Item.${type}`),
        options: this.document.items.documentsByType[type].map(item => ({ value: item.id, label: item.name })),
        value: this.document.system._source.equipped[type],
      };
    }
    if (this.document.system.equipped.weapon?.system.grip === 2) delete context.equipped.shield;
    context.weaponImage = this.document.system.equipped.weapon?.img ?? ryuutama.config.unarmedConfiguration.icon;

    // Capacity
    context.capacityPenalty = game.i18n.format("RYUUTAMA.ACTOR.capacityPenalty", {
      penalty: `&ndash;${this.document.system.capacity.penalty}`,
    });
    context.capacityOverflow = this.document.system.capacity.penalty > 0;

    // Tip-top shape / out of shape.
    const condition = this.document.system.condition.value;
    context.conditionShape = {
      active: true,
      ability: ryuutama.config.abilityScores[this.document.system.condition.shape.high]?.label ?? "",
    };
    if (condition >= 10) context.conditionShape.high = true;
    else if (condition <= 2) context.conditionShape.low = true;
    else context.conditionShape.active = false;

    // Spells.
    context.spells = {};
    if (options.parts.includes("spells")) {
      context.spells.items = this.document.items.documentsByType.spell.map(spell => ({ document: spell }));
    }

    // Header tags.
    context.tags = [];
    for (const [k, v] of Object.entries(this.document.system.type.types)) {
      const label = ryuutama.config.travelerTypes[k]?.label;
      if (!v || !label) continue;
      const tag = label + (v > 1 ? " &times; 2" : "");
      context.tags.push({
        tag,
        tooltip: game.i18n.format("RYUUTAMA.ACTOR.TAGS.type", { type: label }),
      });
    }
    for (const k of this.document.system.mastered.weapons) {
      const label = ryuutama.config.weaponCategories[k]?.labelPlural;
      if (label) context.tags.push({
        tag: label,
        tooltip: game.i18n.format("RYUUTAMA.ACTOR.TAGS.masteredWeapon", { weapon: label }),
      });
    }
    const levelTag = game.i18n.format("RYUUTAMA.ACTOR.TAGS.level", { level: this.document.system.details.level });
    context.tags.unshift({ tag: levelTag, tooltip: levelTag });

    return context;
  }
}
