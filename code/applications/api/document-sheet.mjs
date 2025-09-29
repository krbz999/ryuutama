const { HandlebarsApplicationMixin, DocumentSheet } = foundry.applications.api;

export default class RyuutamaDocumentSheet extends HandlebarsApplicationMixin(DocumentSheet) {
  /** @override */
  static DEFAULT_OPTIONS = {
    form: {
      submitOnChange: true,
      closeOnSubmit: false,
    },
    position: {
      width: 560,
    },
    window: {
      contentClasses: ["standard-form"],
    },
    mode: 1,
    actions: {
      toggleEditMode: RyuutamaDocumentSheet.#toggleEditMode,
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
    return this._sheetMode === RyuutamaDocumentSheet.SHEET_MODES.EDIT;
  }

  /* -------------------------------------------------- */

  /**
   * The current sheet mode.
   * @type {0|1}
   */
  _sheetMode = this.options.mode;

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    if (("mode" in options) && this.isEditable) this._sheetMode = options.mode;
  }

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
    return Object.assign(context, {
      isEditable,
      disabled: !isEditable,
      document: this.document,
      systemFields: this.document.system.schema.fields,
      source: this.document._source,
    });
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaDocumentSheet
   */
  static #toggleEditMode(event, target) {
    const modes = RyuutamaDocumentSheet.SHEET_MODES;
    this._sheetMode = (this.isEditMode || !this.isEditable) ? modes.PLAY : modes.EDIT;
    this.render();
  }
}
