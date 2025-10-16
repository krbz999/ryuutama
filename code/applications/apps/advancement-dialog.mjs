/**
 * @import RyuutamaActor from "../../documents/actor.mjs";
 * @import Advancement from "../../data/advancement/advancement.mjs";
 */

/**
 * @typedef AdvancementApplicationPartResult
 * @property {boolean} valid
 * @property {typeof Advancement} advancementClass
 * @property {object} [result]
 */

const { Application, HandlebarsApplicationMixin } = foundry.applications.api;

export default class AdvancementDialog extends HandlebarsApplicationMixin(Application) {
  /** @override */
  static DEFAULT_OPTIONS = {
    tag: "form",
    form: {
      submitOnChange: false,
      closeOnSubmit: true,
      handler: AdvancementDialog.#onSubmit,
    },
    window: {
      contentClasses: ["standard-form"],
    },
    position: {
      width: 580,
      height: "auto",
    },
    actions: {},
    level: null,
    actor: null,
  };

  /* -------------------------------------------------- */

  /** @override */
  static PARTS = {};

  /* -------------------------------------------------- */

  /**
   * The actor advancing.
   * @type {RyuutamaActor}
   */
  get actor() {
    return this.options.actor;
  }

  /* -------------------------------------------------- */

  /**
   * @type {Array<typeof Advancement>}
   */
  get advancementClasses() {
    const level = this.options.level;
    const types = ryuutama.config.advancement[level];
    return Array.from(types)
      .map(type => ryuutama.data.advancement.Advancement.documentConfig[type])
      .filter(_ => _);
  }

  /* -------------------------------------------------- */

  /**
   * The data that will be submitted.
   * @type {object[]|null}
   */
  #config = null;
  get config() {
    return this.#config;
  }

  /* -------------------------------------------------- */

  /** @override */
  get title() {
    return game.i18n.format("RYUUTAMA.PSEUDO.ADVANCEMENT.title", {
      name: this.actor.name,
      nth: this.options.level.ordinalString(),
    });
  }

  /* -------------------------------------------------- */

  /**
   * For each rendered part, whether the configuration is valid.
   * @type {Map<string, AdvancementApplicationPartResult>}
   */
  #validity = new Map();

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.actor = this.actor;
    context.buttons = [{ label: "Confirm", icon: "fa-solid fa-check", type: "submit" }];
    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);
    await this.advancementClasses.find(cls => cls.TYPE === partId)?._prepareAdvancementContext(context, options);
    context.rootId = [this.id, partId].join("-");
    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _configureRenderParts(options) {
    const parts = {};

    for (const advancementClass of this.advancementClasses) {
      parts[advancementClass.TYPE] = {
        template: advancementClass.CONFIGURE_TEMPLATE,
        templates: [],
        classes: ["standard-form"],
        id: advancementClass.TYPE,
        forms: {
          form: {
            submitOnChange: true,
            closeOnSubmit: false,
          },
        },
      };
    }

    parts.footer = {
      template: "templates/generic/form-footer.hbs",
    };

    return parts;
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
      if (input.classList.contains("delta")) {
        input.addEventListener("change", () => ryuutama.utils.parseInputDelta(input, this.document));
      }
    }

    this._toggleSubmitButton();
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _attachPartListeners(partId, htmlElement, options) {
    super._attachPartListeners(partId, htmlElement, options);
    if (partId === "footer") return;

    const advancementClass = this.advancementClasses.find(Cls => Cls.TYPE === partId);
    const formData = new foundry.applications.ux.FormDataExtended(htmlElement);
    const valid = advancementClass._determineValidity(formData);
    const result = advancementClass._determineResult(this.actor, formData);
    this.#validity.set(partId, { advancementClass, valid, result });
    advancementClass._attachPartListeners.call(this, partId, htmlElement, options);
  }

  /* -------------------------------------------------- */

  /**
   * Refresh the disabled state of the submit button.
   */
  _toggleSubmitButton() {
    this.element.querySelector("[type=submit]").disabled = Array.from(this.#validity.values()).some(v => !v.valid);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onChangeForm(formConfig, event) {
    super._onChangeForm(formConfig, event);
    if (event.currentTarget.id === this.element.id) return;

    const form = event.currentTarget;
    const partId = form.dataset.applicationPart;
    const advancementClass = this.advancementClasses.find(Cls => Cls.TYPE === partId);
    const formData = new foundry.applications.ux.FormDataExtended(form);
    const valid = advancementClass._determineValidity(formData);
    const result = advancementClass._determineResult(this.actor, formData);
    this.#validity.set(partId, { advancementClass, valid, result });
    this._toggleSubmitButton();
  }

  /* -------------------------------------------------- */

  /**
   * Create an instance of this application the result of which can be awaited.
   * @param {RyuutamaActor} actor
   * @param {object} [options={}]
   * @param {number} [options.level]
   * @returns {Promise}
   */
  static async create(actor, { level } = {}) {
    level ??= actor.system.details.level + 1;
    const { promise, resolve } = Promise.withResolvers();
    const application = new this({ actor, level });
    application.addEventListener("close", () => resolve(application.config), { once: true });
    application.render({ force: true });
    return promise;
  }

  /* -------------------------------------------------- */

  /**
   * Submit the form.
   * @this AdvancementDialog
   */
  static #onSubmit(event, form, formData) {
    this.#config = [];
    for (let [partId, { valid, advancementClass, result }] of this.#validity.entries()) {
      if (!valid) {
        this.#config = null;
        return;
      }

      if (!result) {
        const element = this.querySelector(`form[id="${partId}"]`);
        const formData = new foundry.applications.ux.FormDataExtended(element);
        result = advancementClass._determineResult(this.actor, formData);
      }

      this.#config.push(result);
    }
  }
}
