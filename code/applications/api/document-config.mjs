const { HandlebarsApplicationMixin, DocumentSheet } = foundry.applications.api;

export default class DocumentConfig extends HandlebarsApplicationMixin(DocumentSheet) {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    form: {
      submitOnChange: true,
      closeOnSubmit: false,
    },
    position: {
      width: 480,
      height: "auto",
    },
    sheetConfig: false,
    ownershipConfig: false,
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    return {
      ...await super._prepareContext(options),
      document: this.document,
      source: this.document._source,
      fields: this.document.schema.fields,
      systemFields: this.document.system.schema.fields,
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _initializeApplicationOptions(options) {
    options = super._initializeApplicationOptions(options);
    options.classes.push(ryuutama.id);
    return options;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    for (const input of this.element.querySelectorAll("input[type=number], input[type=text].delta")) {
      input.addEventListener("focus", () => input.select());
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _syncPartState(partId, newElement, priorElement, state) {
    super._syncPartState(partId, newElement, priorElement, state);
    newElement.querySelector("[type=number]:focus, .delta:focus")?.select();
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onChangeForm(formConfig, event) {
    if (event.target.classList.contains("delta") && event.target.name) {
      DocumentConfig.#onChangeDelta.call(this, event, event.target);
    }

    super._onChangeForm(formConfig, event);
  }

  /* -------------------------------------------------- */

  /**
   * @this DocumentConfig
   * @param {Event} event           The initiating change event.
   * @param {HTMLElement} target    The capturing element that defined the [data-change].
   */
  static #onChangeDelta(event, target) {
    const name = target.name;
    const delta = target.value;
    const object = name.endsWith(".value") || name.endsWith(".spent")
      ? foundry.utils.getProperty(this.document, name.slice(0, name.length - 6))
      : foundry.utils.getProperty(this.document, name);

    const { value, min, max } = (typeof object === "object") ? object : { value: object };
    const newValue = ryuutama.utils.parseDelta(String(delta), { value, min, max });
    target.value = newValue;
  }
}
