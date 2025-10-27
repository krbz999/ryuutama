import RyuutamaActorSheet from "./actor-sheet.mjs";

/**
 * Ryuutama Monster Sheet.
 * @extends RyuutamaActorSheet
 */
export default class RyuutamaMonsterSheet extends RyuutamaActorSheet {
  /** @override */
  static PARTS = {
    header: {
      template: "systems/ryuutama/templates/sheets/shared/header.hbs",
      templates: ["templates/generic/tab-navigation.hbs"],
    },
    attributes: {
      template: "systems/ryuutama/templates/sheets/monster-sheet/attributes.hbs",
      classes: ["tab", "standard-form", "scrollable"],
    },
    skills: {
      template: "systems/ryuutama/templates/sheets/monster-sheet/skills.hbs",
      classes: ["tab", "standard-form", "scrollable"],
    },
    details: {
      template: "systems/ryuutama/templates/sheets/monster-sheet/details.hbs",
      classes: ["tab", "standard-form", "scrollable"],
    },
    effects: {
      template: "systems/ryuutama/templates/sheets/shared/effects.hbs",
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
        { id: "details" },
        { id: "effects" },
      ],
      initial: "attributes",
      labelPrefix: "RYUUTAMA.ACTOR.TABS",
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.tabs = this._prepareTabs("primary");

    const rollData = this.document.getRollData();
    const enrichment = { relativeTo: this.document, rollData };
    context.enriched = {
      description: await CONFIG.ux.TextEditor.enrichHTML(this.document.system.description.value, enrichment),
    };

    context.attackImage = ryuutama.config.weaponUnarmedTypes.unarmed.icon;

    context.seasonOptions = Object.entries(ryuutama.config.seasons).map(([k, v]) => {
      return { value: k, label: v.label };
    });

    // Tags.
    context.tags = this.#prepareTags();

    // Skills (Special Abilities).
    context.skills = [];
    for (const skill of this.document.items.documentsByType.skill) {
      context.skills.push({ document: skill });
    }
    context.specialAbility = {
      item: this.document.items
        .get(this.document.getFlag(ryuutama.id, "specialAbility"))
        ?? context.skills[0]?.document,
    };
    if (context.specialAbility.item) {
      const item = context.specialAbility.item;
      context.specialAbility.description = await CONFIG.ux.TextEditor.enrichHTML(
        item.system.description.value,
        { rollData: item.getRollData(), relativeTo: item },
      );
    }

    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare tags.
   * @returns {{ tag: string, tooltip: string }[]}
   */
  #prepareTags() {
    const tags = [];

    // Level.
    let level = this.document.system.details.level;
    level = game.i18n.format("RYUUTAMA.ACTOR.TAGS.level", { level });
    tags.push({ tag: level, tooltip: level });

    // Category.
    if (this.document.system.details.category in ryuutama.config.monsterCategories) {
      const tag = ryuutama.config.monsterCategories[this.document.system.details.category].label;
      tags.push({
        tag,
        tooltip: game.i18n.format("RYUUTAMA.ACTOR.TAGS.category", { category: tag }),
      });
    }

    // Dragonica number.
    if (this.document.system.details.dragonica) {
      const tag = `#${this.document.system.details.dragonica.paddedString(3)}`;
      const tooltip = game.i18n.format("RYUUTAMA.ACTOR.TAGS.dragonica", { number: tag });
      tags.push({ tag, tooltip });
    }

    // Season.
    const label = ryuutama.config.seasons[this.document.system.environment.season]?.label;
    if (label) tags.push({
      tag: label,
      tooltip: game.i18n.format("RYUUTAMA.ACTOR.TAGS.season", { season: label }),
    });

    return tags;
  }
}
