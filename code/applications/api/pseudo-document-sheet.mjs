const { HandlebarsApplicationMixin, Application } = foundry.applications.api;

/**
 * @import Document from "@common/abstract/document.mjs";
 * @import PseudoDocument from "../../data/pseudo-document.mjs";
 * @import { ApplicationConfiguration } from "@client/applications/_types.mjs";
 * @import { DatabaseUpdateOperation } from "@common/abstract/_types.mjs";
 * @import FormDataExtended from "@client/applications/ux/form-data-extended.mjs";
 */

/**
 * Generic sheet class to represent a {@linkcode PseudoDocument}.
 * @template {PseudoDocument} TPseudo The type of Pseudodocument this covers.
 * @abstract
 */
export default class RyuutamaPseudoDocumentSheet extends HandlebarsApplicationMixin(Application) {
  /**
   * @param {ApplicationConfiguration} options
   */
  constructor(options = {}) {
    if (!(options.document instanceof ryuutama.data.PseudoDocument)) {
      throw new Error("A PseudoDocumentSheet was constructed without a PseudoDocument.");
    }

    super(options);
    this.#pseudoDocument = options.document;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    id: "{id}",
    document: null,
    actions: {
      copyUuid: {
        handler: RyuutamaPseudoDocumentSheet.#copyUuid,
        buttons: [0, 2],
      },
    },
    form: {
      handler: RyuutamaPseudoDocumentSheet.#onSubmitDocumentForm,
      submitOnChange: true,
    },
    position: {
      width: 500,
      height: "auto",
    },
    tag: "form",
    window: {
      contentClasses: ["standard-form"],
    },
  };

  /* -------------------------------------------------- */

  /**
   * The pseudo document.
   * @type {PseudoDocument}
   */
  #pseudoDocument;

  /* -------------------------------------------------- */

  /**
   * The pseudo-document. This can be null if a parent pseudo-document is removed.
   * @type {TPseudo|null}
   */
  get pseudoDocument() {
    return this.#pseudoDocument;
  }

  /* -------------------------------------------------- */

  /**
   * The parent document.
   * @type {Document}
   */
  get document() {
    return this.#pseudoDocument.document;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get title() {
    const { documentName, name } = this.pseudoDocument;
    return `${game.i18n.localize(`DOCUMENT.${documentName}`)}: ${name}`;
  }

  /* -------------------------------------------------- */

  /**
   * Is this pseudo-document sheet editable?
   * @type {boolean}
   */
  get isEditable() {
    const document = this.document;
    if (document.pack) {
      const pack = game.packs.get(document.pack);
      if (pack.locked) return false;
    }
    return document.testUserPermission(game.user, "OWNER");
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _initializeApplicationOptions({ document, ...options }) {
    options = super._initializeApplicationOptions(options);
    options.classes.push(ryuutama.id);
    options.uniqueId = `${this.constructor.name}-${document.uuid.replaceAll(".", "-")}`;
    return options;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    // Update header title.
    if (
      options.renderContext &&
      foundry.utils.getProperty(options, `renderData.${this.pseudoDocument.fieldPath}.${this.pseudoDocument.id}.name`)
    ) {
      options.window = Object.assign(options.window ?? {}, { title: this.title });
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);
    this.document.apps[this.id] = this;
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

  /** @inheritdoc */
  _onClose(options) {
    super._onClose(options);
    delete this.document.apps[this.id];
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _renderFrame(options) {
    const frame = await super._renderFrame(options);
    const copyLabel = game.i18n.localize("SHEETS.CopyUuid");

    const properties = Object.entries({
      type: "button",
      class: "header-control fa-solid fa-passport icon",
      "data-action": "copyUuid",
      "data-tooltip": "",
      "aria-label": copyLabel,
    }).map(([k, v]) => `${k}="${v}"`).join(" ");
    const copyId = `<button ${properties}></button>`;
    this.window.close.insertAdjacentHTML("beforebegin", copyId);
    return frame;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _canRender(options) {
    if (!this.pseudoDocument.isSource) {
      if (this.rendered) this.close();
      return false;
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    const document = this.pseudoDocument;
    const isEditable = this.isEditable;
    Object.assign(context, {
      document,
      source: document._source,
      fields: document.schema.fields,
      isEditable, disabled: !isEditable, editable: isEditable,
      rootId: this.id,
      user: game.user,
    });

    return context;
  }

  /* -------------------------------------------------- */
  /*   Form submission                                  */
  /* -------------------------------------------------- */

  /**
   * Process form submission for the sheet.
   * @this {RyuutamaPseudoDocumentSheet}
   * @param {SubmitEvent} event             The originating form submission event.
   * @param {HTMLFormElement} form          The form element that was submitted.
   * @param {FormDataExtended} formData     Processed data for the submitted form.
   * @param {object} [options]              Additional options provided by a manual submit call. All options
   *                                        except `options.updateData` are forwarded along to _processSubmitData.
   * @param {object} [options.updateData]   Additional data passed in if this form is submitted manually which
   *                                        should be merged with prepared formData.
   * @returns {Promise<void>}
   */
  static async #onSubmitDocumentForm(event, form, formData, options = {}) {
    if (!this.isEditable) return;
    const { updateData, ...updateOptions } = options;
    const submitData = this._prepareSubmitData(event, form, formData, updateData);
    await this._processSubmitData(event, form, submitData, updateOptions);
  }

  /* -------------------------------------------------- */

  /**
   * Prepare data used to update the PseudoDocument upon form submission.
   * This data is cleaned and validated before being returned for further processing.
   * @param {SubmitEvent} event           The originating form submission event.
   * @param {HTMLFormElement} form        The form element that was submitted.
   * @param {FormDataExtended} formData   Processed data for the submitted form
   * @param {object} [updateData]         Additional data passed in if this form is submitted manually which
   *                                      should be merged with prepared formData.
   * @returns {object}                    Prepared submission data as an object.
   * @throws {Error}                      Subclasses may throw validation errors here to prevent form submission.
   * @protected
   */
  _prepareSubmitData(event, form, formData, updateData) {
    const submitData = this._processFormData(event, form, formData);
    if (updateData) {
      foundry.utils.mergeObject(submitData, updateData, { performDeletions: true });
      foundry.utils.mergeObject(submitData, updateData, { performDeletions: false });
    }
    this.pseudoDocument.validate({ changes: submitData, clean: true, fallback: false });
    return submitData;
  }

  /* -------------------------------------------------- */

  /**
   * Customize how form data is extracted into an expanded object.
   * @param {SubmitEvent|null} event      The originating form submission event.
   * @param {HTMLFormElement} form        The form element that was submitted.
   * @param {FormDataExtended} formData   Processed data for the submitted form.
   * @returns {object}                    An expanded object of processed form data.
   * @throws {Error}                      Subclasses may throw validation errors here to prevent form submission.
   * @protected
   */
  _processFormData(event, form, formData) {
    return foundry.utils.expandObject(formData.object);
  }

  /* -------------------------------------------------- */

  /**
   * Submit a document update or creation request based on the processed form data.
   * @param {SubmitEvent} event                             The originating form submission event.
   * @param {HTMLFormElement} form                          The form element that was submitted.
   * @param {object} submitData                             Processed and validated form data to be
   *                                                        used for a document update.
   * @param {Partial<DatabaseUpdateOperation>} [options]    Additional options altering the request.
   * @returns {Promise<void>}
   * @protected
   */
  async _processSubmitData(event, form, submitData, options = {}) {
    const document = this.pseudoDocument;
    if (document.collection?.has(document.id)) {
      await document.update(submitData, options);
    }
    else {
      throw new Error(`Document creation from ${this.constructor.name} is not supported.`);
    }
  }

  /* -------------------------------------------------- */
  /*   Event handlers                                   */
  /* -------------------------------------------------- */

  /**
   * Copies the ID or UUID for the pseudo document.
   * @this {RyuutamaPseudoDocumentSheet}
   * @param {PointerEvent} event      The originating click event.
   */
  static #copyUuid(event) {
    event.preventDefault(); // Don't open context menu
    event.stopPropagation(); // Don't trigger other events
    if (event.detail > 1) return; // Ignore repeated clicks
    const pseudo = this.pseudoDocument;
    const id = (event.button === 2) ? pseudo.id : pseudo.uuid;
    const type = (event.button === 2) ? "id" : "uuid";
    const label = game.i18n.localize(`DOCUMENT.${pseudo.documentName}`);
    game.clipboard.copyPlainText(id);
    ui.notifications.info("DOCUMENT.IdCopiedClipboard", { format: { label, type, id } });
  }
}
