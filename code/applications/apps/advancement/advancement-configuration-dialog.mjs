import RyuutamaActor from "../../../documents/actor.mjs";

const { HandlebarsApplicationMixin, Application } = foundry.applications.api;

/**
 * Dialog for configuring an advancement prior to submitting it to the character.
 * @extends Application
 * @mixes HandlebarsApplicationMixin
 */
export default class AdvancementConfigurationDialog extends HandlebarsApplicationMixin(Application) {
  /** @override */
  static DEFAULT_OPTIONS = {
    window: {
      contentClasses: ["standard-form"],
    },
    position: {
      width: 420,
    },
    tag: "form",
    form: {
      submitOnChange: true,
      closeOnSubmit: false,
      handler: AdvancementConfigurationDialog.#onSubmitForm,
    },
    advancementClass: null,
    document: null,
  };

  /* -------------------------------------------------- */

  /** @override */
  static PARTS = {
    form: {
      template: "",
      classes: ["standard-form"],
    },
    footer: {
      template: "templates/generic/form-footer.hbs",
    },
  };

  /* -------------------------------------------------- */

  /**
   * Template used for rendering the configurable data of the advancement.
   * @type {string}
   */
  static get INPUT_TEMPLATE() {
    return "";
  }

  /* -------------------------------------------------- */

  /**
   * Create an asynchronous instance of this dialog.
   * @param {object} options
   * @param {typeof Advancement} options.advancementClass
   * @param {RyuutamaActor} options.actor
   * @returns {Promise}
   */
  static async create({ advancementClass, actor }) {
    const application = new this({ advancementClass, document: actor });
    const { promise, resolve } = Promise.withResolvers();
    application.addEventListener("close", () => resolve(application.result), { once: true });
    application.render({ force: true });
    return promise;
  }

  /* -------------------------------------------------- */

  /**
   * The actor configuring advancements.
   * @type {RyuutamaActor}
   */
  get actor() {
    return this.options.document;
  }

  /* -------------------------------------------------- */

  /** @override */
  get title() {
    return game.i18n.format("RYUUTAMA.PSEUDO.ADVANCEMENT.configureTitle", {
      name: game.i18n.localize(`TYPES.Advancement.${this.options.advancementClass.TYPE}`),
    });
  }

  /* -------------------------------------------------- */

  /**
   * The result to be returned from the dialog.
   * @type {any|null}
   */
  #result = null;
  get result() {
    return this.#result;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _configureRenderParts(options) {
    const parts = super._configureRenderParts(options);
    parts.form.template = this.constructor.INPUT_TEMPLATE;
    return parts;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    const Cls = this.options.advancementClass;
    Object.assign(context, {
      fields: Cls.schema.fields,
    });

    context.buttons = [{
      label: "Confirm",
      icon: "fa-solid fa-check",
      disabled: true,
      type: "submit",
    }];
    return context;
  }

  /* -------------------------------------------------- */

  /**
   * @this AdvancementConfigurationDialog
   * @param {Event|SubmitEvent} event     The initiating event or submit event.
   * @param {HTMLFormElement} form        The form element.
   * @param {FormDataExtended} formData   The form data.
   */
  static #onSubmitForm(event, form, formData) {
    const result = this._configureSubmit(event, form, formData);
    if ((result !== undefined) && (event instanceof SubmitEvent)) {
      this.#result = result;
      this.close();
    }
  }

  /* -------------------------------------------------- */

  /**
   * Handle change events and submissions.
   * If the event is a SubmitEvent and this method returns anything but `undefined`,
   * the application will be submitted and closed.
   * @param {Event|SubmitEvent} event     The initiating event or submit event.
   * @param {HTMLFormElement} form        The form element.
   * @param {FormDataExtended} formData   The form data.
   */
  _configureSubmit(event, form, formData) {}
}
