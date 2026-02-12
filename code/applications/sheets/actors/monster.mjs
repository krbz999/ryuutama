import RyuutamaBaseActorSheet from "./base.mjs";

/**
 * Ryuutama Monster Sheet.
 * @extends RyuutamaBaseActorSheet
 */
export default class RyuutamaMonsterSheet extends RyuutamaBaseActorSheet {
  /** @override */
  static DEFAULT_OPTIONS = {
    window: {
      resizable: false,
    },
  };

  /* -------------------------------------------------- */

  /** @override */
  static PARTS = {
    header: {
      template: "systems/ryuutama/templates/sheets/monster-sheet/header.hbs",
      templates: ["templates/generic/tab-navigation.hbs"],
    },
    attributes: {
      template: "systems/ryuutama/templates/sheets/monster-sheet/attributes.hbs",
      classes: ["tab", "standard-form", "scrollable"],
      scrollable: [""],
    },
    skills: {
      template: "systems/ryuutama/templates/sheets/monster-sheet/skills.hbs",
      classes: ["tab", "standard-form", "scrollable"],
      scrollable: [""],
    },
    details: {
      template: "systems/ryuutama/templates/sheets/monster-sheet/details.hbs",
      classes: ["tab", "standard-form", "scrollable"],
      scrollable: [""],
    },
    effects: {
      template: "systems/ryuutama/templates/sheets/monster-sheet/effects.hbs",
      classes: ["tab", "standard-form", "scrollable"],
      scrollable: [""],
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
      context.skills.push({ document: skill, dataset: { "item-context": "" } });
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

    // Abilities.
    context.abilities = Object.keys(ryuutama.config.abilityScores).map(abi => {
      return {
        ability: abi,
        icon: ryuutama.config.abilityScores[abi].icon,
        label: ryuutama.config.abilityScores[abi].abbreviation,
        value: this.document.system.abilities[abi],
      };
    });

    // Status effects.
    const immunities = this.document.system.condition.immunities;
    const affected = this.document.system.condition.statuses;
    context.statuses = Object.entries(ryuutama.config.statusEffects).map(([status, data]) => {
      const { img, name, _id } = data;
      const immune = immunities.has(status);
      const effect = this.document.effects.get(_id);
      const strength = affected[status] ?? 0;
      const suppressed = !!effect && !strength;
      return {
        img, name, status, immune, effect, strength, suppressed,
        active: strength > 0,
        label: suppressed
          ? game.i18n.format("RYUUTAMA.ACTOR.statusSuppressed", { strength: effect.system.strength.value })
          : immune
            ? game.i18n.localize("RYUUTAMA.ACTOR.statusImmune")
            : strength,
      };
    });

    // Armor.
    const modifiers = this.document.system.defense.modifiers;
    context.armor = {
      total: this.document.system.defense.total,
      hasTags: !!modifiers.physical || !!modifiers.magical,
      tags: {
        physical: modifiers.physical ? modifiers.physical.signedString() : null,
        magical: modifiers.magical ? modifiers.magical.signedString() : null,
      },
    };

    // Effects.
    context.effects = this.#prepareEffects(context);

    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare effects.
   * @param {object} context    Rendering context. **will be mutated**
   * @returns {{ enabledEffects: object[], disabledEffects: object[] }}
   */
  #prepareEffects(context) {
    const { enabled = [], disabled = [] } = Object.groupBy(this.document.effects.contents, effect => {
      if (effect.type !== "standard") return "status";
      return effect.disabled ? "disabled" : "enabled";
    });

    return {
      enabledEffects: enabled.map(effect => ({ document: effect, dataset: { "effect-context": "" } })),
      disabledEffects: disabled.map(effect => ({ document: effect, dataset: { "effect-context": "" }, classes: ["inactive"] })),
    };
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
