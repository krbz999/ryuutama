import RyuutamaDocumentSheet from "../api/document-sheet.mjs";

export default class RyuutamaItemSheet extends RyuutamaDocumentSheet {
  /** @override */
  static DEFAULT_OPTIONS = {
    position: { width: 400 },
  };

  /* -------------------------------------------------- */

  /** @override */
  static PARTS = {
    navigation: {
      template: "templates/generic/tab-navigation.hbs",
    },
    identity: {
      template: "systems/ryuutama/templates/sheets/item-sheet/identity.hbs",
      classes: ["tab", "scrollable", "standard-form"],
      scrollable: [""],
    },
    details: {
      template: null,
      classes: ["tab", "scrollable", "standard-form"],
      scrollable: [""],
    },
    actions: {
      template: "systems/ryuutama/templates/sheets/item-sheet/actions.hbs",
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
        { id: "identity" },
        { id: "details" },
        { id: "actions" },
        { id: "effects" },
      ],
      initial: "identity",
      labelPrefix: "RYUUTAMA.ITEM.TABS",
    },
  };

  /* -------------------------------------------------- */

  /** @override */
  get title() {
    return this.document.name;
  }

  /* -------------------------------------------------- */

  /** @override */
  _configureRenderParts(options) {
    const details = this.document.system.constructor.DETAILS_TEMPLATE;
    const parts = foundry.utils.deepClone(this.constructor.PARTS);
    parts.details.template = details;
    if (!this.document.system.schema.has("actions")) delete parts.actions;
    Object.values(parts).forEach(p => p.templates ??= []);
    return parts;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _prepareTabs(group) {
    const tabs = super._prepareTabs(group);
    if (!this.document.system.schema.has("actions")) delete tabs.actions;
    return tabs;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    Object.assign(context, {
      enriched: {
        description: await CONFIG.ux.TextEditor.enrichHTML(
          this.document.system.description.value,
          { rollData: this.document.getRollData(), relativeTo: this.document },
        ),
      },
    });

    // Effects.
    context.effects = this.#prepareEffects();

    // Subtype specific context modification.
    await this.document.system._prepareSubtypeContext(this, context, options);

    if (this.document.system.schema.has("actions")) this.#prepareActions(context);

    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare actions.
   * @param {object} context    Rendering context. **will be mutated**
   */
  #prepareActions(context) {
    context.actions = {
      document: this.document.system.actions,
      source: this.document.system.actions._source,
      fields: this.document.system.actions.schema.fields,
    };

    context.actions.damageOptions = Object.keys(ryuutama.config.damageRollProperties)
      .filter(key => !ryuutama.config.damageRollProperties[key].hidden)
      .map(key => ({ value: key, label: ryuutama.config.damageRollProperties[key].label }));
  }

  /* -------------------------------------------------- */

  /**
   * Prepare effects.
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
