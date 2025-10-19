import RyuutamaActorSheet from "./actor-sheet.mjs";

/**
 * @import { InventoryElementEntry } from "../elements/_types.mjs";
 */

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
    skills: {
      template: "systems/ryuutama/templates/sheets/traveler-sheet/skills.hbs",
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
    effects: {
      template: "systems/ryuutama/templates/sheets/shared/effects.hbs",
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
        { id: "skills" },
        { id: "spells" },
        { id: "inventory" },
        { id: "effects" },
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
    if ((group === "primary") && !actor.items.documentsByType.spell.length && !actor.system.details.type.magic) {
      config.tabs.findSplice(tab => tab.id === "spells");
    }
    return config;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _configureRenderParts(options) {
    const parts = super._configureRenderParts(options);

    const actor = this.document;
    if (!actor.items.documentsByType.spell.length && !actor.system.details.type.magic) {
      delete parts.spells;
    }

    return parts;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    // Skills.
    context.skills = this.document.items.documentsByType.skill.map(skill => ({ document: skill }));

    context.tabs = this._prepareTabs("primary");
    context.inventoryTabs = this._prepareTabs("inventory");

    // Subsections on the inventory tab.
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
    if (options.parts.includes("spells")) context.spells = this.#prepareSpells(context);

    // Tags.
    context.tags = this.#prepareTags(context);

    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare spells.
   * @param {object} context    Rendering context. **will be mutated**
   * @returns {object[]}
   */
  #prepareSpells(context) {
    const {
      incantation, spring, summer, autumn, winter,
    } = Object.groupBy(this.document.items.documentsByType.spell, spell => {
      return spell.system.category.value;
    });

    const groups = [];

    for (const type of [incantation, spring, summer, autumn, winter]) {
      if (!type?.length) continue;

      const label = game.i18n.localize(`RYUUTAMA.ACTOR.magicGroup${type[0].system.category.value.capitalize()}`);
      groups.push({ label, documents: type.map(spell => ({ document: spell })) });
    }

    return groups;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare the header tags.
   * @param {object} context    Rendering context. **will be mutated**
   * @returns {{ tag: string, tooltip: string }[]}
   */
  #prepareTags(context) {
    const tags = [];

    // Traveler Types.
    for (const [k, v] of Object.entries(this.document.system.details.type)) {
      const label = ryuutama.config.travelerTypes[k]?.label;
      if (!v || !label) continue;
      const tag = label + (v > 1 ? ` &times; ${v}` : "");
      tags.push({
        tag,
        tooltip: game.i18n.format("RYUUTAMA.ACTOR.TAGS.type", { type: label }),
      });
    }

    // Mastered Weapons.
    for (const [k, v] of Object.entries(this.document.system.mastered.weapons)) {
      const label = ryuutama.config.weaponCategories[k]?.labelPlural;
      if (!v || !label) continue;
      const tag = label + (v > 1 ? ` &times; ${v}` : "");
      tags.push({
        tag,
        tooltip: game.i18n.format("RYUUTAMA.ACTOR.TAGS.masteredWeapon", { weapon: label }),
      });
    }

    // Specialized Terrains.
    for (const k of this.document.system.mastered.terrain) {
      const label = ryuutama.config.terrainTypes[k]?.label;
      if (!label) continue;
      tags.push({
        tag: label,
        tooltip: game.i18n.format("RYUUTAMA.ACTOR.TAGS.habitatSpecialty", { habitat: label }),
      });
    }

    // Specialized Weather Conditions.
    for (const k of this.document.system.mastered.weather) {
      const label = ryuutama.config.weatherTypes[k]?.label;
      if (!label) continue;
      tags.push({
        tag: label,
        tooltip: game.i18n.format("RYUUTAMA.ACTOR.TAGS.habitatSpecialty", { habitat: label }),
      });
    }

    // Level up button.
    const levelTag = game.i18n.format("RYUUTAMA.ACTOR.TAGS.level", { level: this.document.system.details.level });
    if (this.document.system.details.level < 10) {
      context.levelUp = { tag: levelTag, tooltip: levelTag };
      if (this.document.system.details.exp.pct === 100) context.levelUp.glow = true;
    } else {
      tags.unshift({ tag: levelTag, tooltip: levelTag });
    }

    return tags;
  }
}
