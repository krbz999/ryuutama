import RyuutamaDocumentSheet from "../api/document-sheet.mjs";

/**
 * @import RyuutamaItem from "../../documents/item.mjs";
 */

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
    Object.values(parts).forEach(p => p.templates ??= []);
    return parts;
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
    context.effects = this.#prepareEffects(context);

    // Subtype specific context modification.
    await this.document.system._prepareSubtypeContext(this, context, options);

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
