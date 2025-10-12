const { HandlebarsApplicationMixin, DocumentSheet } = foundry.applications.api;

/**
 * Base document sheet.
 * @extends DocumentSheet
 * @mixes HandlebarsApplicationMixin
 */
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
   * Is the user able to perform actions such as rolls?
   * @type {boolean}
   */
  get isInteractive() {
    return this.isEditable && !this.document.inCompendium;
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
  _initializeApplicationOptions(options) {
    options = super._initializeApplicationOptions(options);
    options.classes.push(ryuutama.id);
    switch (options.document.documentName) {
      case "Actor": options.classes.push("actor"); break;
      case "Item": options.classes.push("item"); break;
    }
    return options;
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
      isInteractive: this.isInteractive,
      disabled: !isEditable,
      document: this.document,
      systemFields: this.document.system.schema.fields,
      source: this.document._source,
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    for (const input of this.element.querySelectorAll("input[type=number], input[type=text].delta")) {
      input.addEventListener("focus", () => input.select());
      if (input.classList.contains("delta")) {
        input.addEventListener("change", () => ryuutama.utils.parseInputDelta(input, this.document));
      }
    }
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
