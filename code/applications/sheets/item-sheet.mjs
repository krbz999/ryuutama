const { HandlebarsApplicationMixin, DocumentSheet } = foundry.applications.api;

export default class RyuutamaItemSheet extends HandlebarsApplicationMixin(DocumentSheet) {
  /** @override */
  static DEFAULT_OPTIONS = {
    form: {
      submitOnChange: true,
      closeOnSubmit: false,
    },
    position: {
      width: 560,
    },
    mode: 1,
    actions: {
      toggleEditMode: RyuutamaItemSheet.#toggleEditMode,
      configureHabitat: RyuutamaItemSheet.#configureHabitat,
    },
  };

  /* -------------------------------------------------- */

  /** @override */
  static PARTS = {
    details: {
      template: "systems/ryuutama/templates/sheets/item-sheet/details.hbs",
      templates: [
        "systems/ryuutama/templates/sheets/item-sheet/weapon.hbs",
        "systems/ryuutama/templates/sheets/item-sheet/gear.hbs",
        "systems/ryuutama/templates/sheets/item-sheet/defense.hbs",
      ],
      classes: ["scrollable", "standard-form"],
      scrollable: [""],
    },
  };

  /* -------------------------------------------------- */

  /**
   * Different sheet modes.
   * @enum {number}
   */
  static SHEET_MODES = Object.freeze({ EDIT: 0, PLAY: 1 });

  /* -------------------------------------------------- */

  /**
   * Is the sheet in edit mode?
   * @type {boolean}
   */
  get isEditMode() {
    return this._sheetMode === RyuutamaItemSheet.SHEET_MODES.EDIT;
  }

  /* -------------------------------------------------- */

  /**
   * The current sheet mode.
   * @type {0|1}
   */
  _sheetMode = this.options.mode;

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _renderFrame(options) {
    const frame = await super._renderFrame(options);
    this.window.controls.insertAdjacentHTML("afterend", `
      <button type="button" class="header-control icon fa-solid fa-user-lock" data-action="toggleEditMode" data-tooltip="RYUUTAMA.SHEET.toggleEditMode"></button>`);
    return frame;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    const isEditable = context.editable && this.isEditMode;

    const modifierOptions = {};
    for (const [k, v] of Object.entries(ryuutama.config.itemModifiers)) {
      if (v.hidden && isEditable && !this.document.system._source.modifiers.includes(k)) continue;
      if (v.hidden && !isEditable && !this.document.system.modifiers.has(k)) continue;
      modifierOptions[k] = { value: k, label: v.label };
    }
    for (const k of this.document.system._source.modifiers) {
      if (!(k in modifierOptions)) modifierOptions[k] = { value: k, label: k };
    }

    return Object.assign(context, {
      isEditable,
      disabled: !isEditable,
      hasDurability: this.document.system.schema.has("durability"),
      isGear: this.document.system.schema.has("gear"),
      isWeapon: this.document._source.type === "weapon",
      hasArmor: this.document.system.schema.has("armor"),
      modifierOptions: Object.values(modifierOptions),
      document: this.document,
      systemFields: this.document.system.schema.fields,
      source: this.document._source,
      enriched: await foundry.applications.ux.TextEditor.implementation.enrichHTML(
        this.document.system.description.value,
        { rollData: this.document.getRollData(), relativeTo: this.document },
      ),
    });
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaItemSheet
   */
  static #toggleEditMode(event, target) {
    const modes = RyuutamaItemSheet.SHEET_MODES;
    this._sheetMode = (this.isEditMode || !this.isEditable) ? modes.PLAY : modes.EDIT;
    this.render();
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaItemSheet
   */
  static #configureHabitat(event, target) {
    const application = new ryuutama.applications.apps.HabitatConfig({ document: this.document });
    application.render({ force: true });
  }
}
