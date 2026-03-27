/**
 * @import RyuutamaActor from "../../documents/actor.mjs";
 * @import { ApplicationConfiguration } from "@client/applications/_types.mjs";
 */

const { HandlebarsApplicationMixin, Application } = foundry.applications.api;

/**
 * @extends Application
 * @mixes HandlebarsApplicationMixin
 */
export default class PlaceMembersDialog extends HandlebarsApplicationMixin(Application) {
  /**
   * Factory method for asynchronous behavior.
   * @param {ApplicationConfiguration & { configuration?: object, document: RyuutamaActor }} options
   * @returns {Promise<object>}   A promise that resolves once the dialog has been closed.
   */
  static async create(options) {
    const { promise, resolve } = Promise.withResolvers();
    const application = new this(options);
    application.addEventListener("close", () => resolve(application.config), { once: true });
    application.render({ force: true });
    return promise;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    document: null,
    tag: "form",
    position: {
      width: 420,
    },
    window: {
      contentClasses: ["standard-form"],
    },
    form: {
      handler: PlaceMembersDialog.#onSubmit,
      closeOnSubmit: false,
      submitOnChange: true,
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    form: {
      template: "systems/ryuutama/templates/apps/place-members-dialog/form.hbs",
    },
    footer: {
      template: "templates/generic/form-footer.hbs",
    },
  };

  /* -------------------------------------------------- */

  /**
   * @param {ApplicationConfiguration & { configuration?: object, document: RyuutamaActor }} options
   */
  constructor({ configuration = {}, ...options }) {
    if (!(options.document instanceof foundry.documents.Actor) || (options.document.type !== "party")) {
      throw new Error("PlaceMembersDialog must be constructed with a Party actor.");
    }
    super(options);
    this.#configuration = configuration;
  }

  /* -------------------------------------------------- */

  /**
   * The value to be returned by the form when submitted.
   * @type {boolean}
   */
  #config = false;
  get config() {
    return this.#config;
  }

  /* -------------------------------------------------- */

  /**
   * The mutatable configuration.
   * @type {object}
   */
  #configuration;

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get title() {
    return _loc("RYUUTAMA.ACTOR.PARTY.PLACE_MEMBERS.title", { name: this.document.name });
  }

  /* -------------------------------------------------- */

  /**
   * The party actor placing members.
   * @type {RyuutamaActor}
   */
  get document() {
    return this.options.document;
  }

  /* -------------------------------------------------- */

  /**
   * The party actor placing members.
   * @type {RyuutamaActor}
   */
  get party() {
    return this.document;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.combat = game.combat;
    context.rootId = `${this.party.uuid.replaceAll(".", "-")}-${this.id}`;
    context.buttons = [{ label: "COMMON.Confirm", type: "submit", icon: "fa-solid fa-check" }];
    context.inputs = (field, params) => foundry.applications.fields[field](params.hash).outerHTML;
    context.configuration = this.#configuration;
    context.memberOptions = this.party.system.members.map(m => ({ value: m.actor.id, label: m.actor.name }));
    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Handle changes to inputs.
   * @this PlaceMembersDialog
   * @param {SubmitEvent} event
   * @param {HTMLFormElement} form
   * @param {FormDataExtended} formData
   */
  static #onChangeInputs(event, form, formData) {
    foundry.utils.mergeObject(this.#configuration, formData.object);
    this.render();
  }

  /* -------------------------------------------------- */

  /**
   * Handle final form submission.
   * @this PlaceMembersDialog
   * @param {SubmitEvent} event
   * @param {HTMLFormElement} form
   * @param {FormDataExtended} formData
   */
  static #onSubmit(event, form, formData) {
    if (!event.submitter) PlaceMembersDialog.#onChangeInputs.call(this, event, form, formData);
    else {
      this.#config = true;
      this.close();
    }
  }
}
