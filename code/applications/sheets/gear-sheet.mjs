const { HandlebarsApplicationMixin, DocumentSheet } = foundry.applications.api;

export default class RyuutamaGearSheet extends HandlebarsApplicationMixin(DocumentSheet) {
  /** @override */
  static DEFAULT_OPTIONS = {
    form: {
      submitOnChange: true,
      closeOnSubmit: false,
    },
    mode: 1,
    actions: {
      toggleEditMode: RyuutamaGearSheet.#toggleEditMode,
    },
  };

  /* -------------------------------------------------- */

  /** @override */
  static PARTS = {
    details: {
      template: "systems/ryuutama/templates/sheets/item-sheet/details.hbs",
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
    return this._sheetMode === RyuutamaGearSheet.SHEET_MODES.EDIT;
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

    const weatherOptions = [];
    for (const [k, v] of Object.entries(ryuutama.config.weatherTypes)) {
      weatherOptions.push({
        value: k, label: v.label,
        group: ryuutama.config.weatherCategories[v.category].label,
      });
    }

    const modifierOptions = [];
    for (const [k, v] of Object.entries(ryuutama.config.itemModifiers)) {
      if (v.hidden && (isEditable || !this.document.system.modifiers.has(k))) continue;
      modifierOptions.push({ value: k, label: v.label });
    }

    return Object.assign(context, {
      isEditable,
      disabled: !isEditable,
      weatherOptions,
      modifierOptions,
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
   * @this RyuutamaGearSheet
   */
  static #toggleEditMode(event, target) {
    const modes = RyuutamaGearSheet.SHEET_MODES;
    this._sheetMode = (this.isEditMode || !this.isEditable) ? modes.PLAY : modes.EDIT;
    this.render();
  }
}
