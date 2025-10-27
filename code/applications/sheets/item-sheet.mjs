import RyuutamaDocumentSheet from "../api/document-sheet.mjs";

export default class RyuutamaItemSheet extends RyuutamaDocumentSheet {
  /** @override */
  static PARTS = {
    navigation: {
      template: "templates/generic/tab-navigation.hbs",
    },
    details: {
      template: "systems/ryuutama/templates/sheets/item-sheet/details.hbs",
      classes: ["tab", "scrollable", "standard-form"],
      scrollable: [""],
    },
    effects: {
      template: "systems/ryuutama/templates/sheets/item-sheet/effects.hbs",
      classes: ["tab", "scrollable", "standard-form"],
      scrollable: [""],
    },
  };

  /* -------------------------------------------------- */

  /** @override */
  static TABS = {
    primary: {
      tabs: [
        { id: "details" },
        { id: "effects" },
      ],
      initial: "details",
      labelPrefix: "RYUUTAMA.ITEM.TABS",
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const modifierOptions = this.#prepareModifiers();

    Object.assign(context, {
      isAnimal: this.document._source.type === "animal",
      isContainer: this.document._source.type === "container",
      isHerb: this.document._source.type === "herb",
      isSpell: this.document._source.type === "spell",
      isWeapon: this.document._source.type === "weapon",
      hasDurability: this.document.system.schema.has("durability"),
      hasPrice: this.document.system.schema.has("price"),
      hasModifiers: modifierOptions.length > 0,
      modifierOptions: modifierOptions,
      isGear: this.document.system.schema.has("gear"),
      hasArmor: this.document.system.schema.has("armor"),
      enriched: {
        description: await CONFIG.ux.TextEditor.enrichHTML(
          this.document.system.description.value,
          { rollData: this.document.getRollData(), relativeTo: this.document },
        ),
      },
    });

    if (context.isHerb) {
      context.enriched.effect = await CONFIG.ux.TextEditor.enrichHTML(
        this.document.system.description.effect,
        { rollData: this.document.getRollData(), relativeTo: this.document },
      );

      const herbLevelOptions = Array.fromRange(5, 1).map(n => {
        return { value: n, label: game.i18n.localize(`RYUUTAMA.ITEM.HERB.terrainLevel${n}`) };
      });
      const herbTypes = [
        { value: "", label: game.i18n.localize("RYUUTAMA.ITEM.HERB.anyTerrain") },
      ];
      for (const k in ryuutama.config.terrainTypes) {
        const { label, level } = ryuutama.config.terrainTypes[k];
        if (level === this.document.system.terrain.level) herbTypes.push({
          label,
          value: k,
          group: game.i18n.localize("RYUUTAMA.ITEM.HERB.specificTerrain"),
        });
      }
      context.herbTypes = herbTypes;
      context.herbLevelOptions = herbLevelOptions;
    }

    if (context.isSpell) {
      context.spell = {};
      const duration = context.spell.duration = {};
      duration.type = context.disabled
        ? context.document.system.spell.duration.type
        : context.source.system.spell.duration.type;
      duration.units = !!ryuutama.config.spellDurationTypes[context.spell.duration.type]?.units;
      duration.special = duration.type === "special";

      const seasonal = game.i18n.localize("RYUUTAMA.ITEM.SPELL.CATEGORIES.seasonal");
      context.spell.magicOptions = Object.entries(ryuutama.config.spellCategories).map(([k, v]) => {
        return { value: k, label: v.label, group: k === "incantation" ? undefined : seasonal };
      });
    }

    if (context.isAnimal) {
      const config = ryuutama.config.animalTypes[this.document.system.category.value];
      context.animal = {
        defaultRiding: config.ride,
        defaultCapacity: config.capacity,
      };
    }

    // Effects.
    context.effects = this.#prepareEffects(context);

    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare the options for the item's modifiers.
   * @returns {{ value: string, label: string}[]}
   */
  #prepareModifiers() {
    if (!this.document.system.schema.has("modifiers")) return [];
    const config = this.document.type === "animal" ? ryuutama.config.animalModifiers : ryuutama.config.itemModifiers;

    const isEditable = this.isEditable && this.isEditMode;
    const options = {};

    for (const [k, v] of Object.entries(config)) {
      if (v.hidden && isEditable && !this.document.system._source.modifiers.includes(k)) continue;
      if (v.hidden && !isEditable && !this.document.system.modifiers.has(k)) continue;
      options[k] = { value: k, label: v.label };
    }

    // 'Well-Traveled' applies only to Riding Animals.
    if ((this.document.type === "animal") && !["riding", "ridingLarge"].includes(this.document.system.category.value)) {
      delete options.wellTraveled;
    }

    for (const k of this.document.system._source.modifiers) {
      if (!(k in options)) options[k] = { value: k, label: k };
    }

    return Object.values(options);
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
      enabledEffects: enabled.map(effect => ({ document: effect })),
      disabledEffects: disabled.map(effect => ({ document: effect, classes: ["inactive"] })),
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);

    // Manage effects.
    this._createContextMenu(
      RyuutamaItemSheet.#createActiveEffectContextOptions.bind(this),
      ".document-listing .document-list .entry[data-document-name=ActiveEffect]",
      { hookName: "Get{}ActiveEffectContextOptions", parentClassHooks: false, fixed: true },
    );
  }

  /* -------------------------------------------------- */

  /**
   * Create context menu options for effects.
   * @this RyuutamaItemSheet
   * @returns {ContextMenuEntry[]}
   */
  static #createActiveEffectContextOptions() {
    const getItem = target => this.getEmbeddedDocument(target.closest("[data-uuid]").dataset.uuid);

    /** @type {ContextMenuEntry[]} */
    const options = [
      {
        name: "RYUUTAMA.ITEM.CONTEXT.EFFECT.edit",
        icon: "fa-solid fa-fw fa-edit",
        callback: target => getItem(target).sheet.render({ force: true }),
      },
      {
        name: "RYUUTAMA.ITEM.CONTEXT.EFFECT.delete",
        icon: "fa-solid fa-fw fa-trash",
        callback: target => getItem(target).deleteDialog(),
        condition: () => this.isEditable,
      },
      {
        name: "RYUUTAMA.ITEM.CONTEXT.EFFECT.disable",
        icon: "fa-solid fa-fw fa-times",
        callback: target => getItem(target).update({ disabled: true }),
        condition: target => this.isEditable && !getItem(target).disabled,
      },
      {
        name: "RYUUTAMA.ITEM.CONTEXT.EFFECT.enable",
        icon: "fa-solid fa-fw fa-check",
        callback: target => getItem(target).update({ disabled: false }),
        condition: target => this.isEditable && getItem(target).disabled,
      },
    ];

    if (game.release.generation < 14) return options.map(k => ({ ...k, icon: `<i class="${k.icon}"></i>` }));
    return options;
  }
}
