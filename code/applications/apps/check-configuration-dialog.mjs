/**
 * @import RyuutamaActor from "../../documents/actor.mjs";
 * @import { CheckRollConfig, CheckDialogConfig, CheckMessageConfig } from "../../data/actor/_types.mjs";
 * @import FormDataExtended from "@client/applications/ux/form-data-extended.mjs";
 * @import { CheckConfigurationDialogConfiguration } from "./_types.mjs";
 */

const { HandlebarsApplicationMixin, Application } = foundry.applications.api;

/**
 * @extends Application
 * @mixes HandlebarsApplicationMixin
 */
export default class CheckConfigurationDialog extends HandlebarsApplicationMixin(Application) {
  /**
   * Factory method for asynchronous behavior.
   * @param {CheckConfigurationDialogConfiguration} options
   * @returns {Promise<boolean>}    A promise that resolves once the dialog has been closed.
   */
  static async create(options) {
    const { promise, resolve } = Promise.withResolvers();
    const application = new this(options);
    application.addEventListener("close", () => resolve(application.config), { once: true });
    application.render({ force: true });
    return promise;
  }

  /* -------------------------------------------------- */

  /** @override */
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
      handler: CheckConfigurationDialog.#onSubmit,
      closeOnSubmit: true,
      submitOnChange: false,
    },
  };

  /* -------------------------------------------------- */

  /** @override */
  static PARTS = {
    formula: {
      template: "systems/ryuutama/templates/apps/check-configuration-dialog/formula.hbs",
    },
    inputs: {
      template: "systems/ryuutama/templates/apps/check-configuration-dialog/inputs.hbs",
      forms: {
        form: {
          handler: CheckConfigurationDialog.#onChangeInputs,
          submitOnChange: true,
          closeOnSubmit: false,
        },
      },
    },
    footer: {
      template: "templates/generic/form-footer.hbs",
    },
  };

  /* -------------------------------------------------- */

  /**
   * @param {CheckConfigurationDialogConfiguration} options
   */
  constructor({ rollConfig, dialogConfig, messageConfig, ...options }) {
    super(options);
    this.#configurations.rollConfig = rollConfig;
    this.#configurations.dialogConfig = dialogConfig;
    this.#configurations.messageConfig = messageConfig;
  }

  /* -------------------------------------------------- */

  /**
   * @type {{ rollConfig: CheckRollConfig, dialogConfig: CheckDialogConfig, messageConfig: CheckMessageConfig }}
   */
  #configurations = {};

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

  /** @override */
  get title() {
    return game.i18n.format("RYUUTAMA.ROLL.title", {
      type: game.i18n.localize(`RYUUTAMA.ROLL.TYPES.${this.#configurations.rollConfig.type}`),
      name: this.actor.name,
    });
  }

  /* -------------------------------------------------- */

  /**
   * The traveler performing the check.
   * @type {RyuutamaActor}
   */
  get actor() {
    return this.options.document;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);
    this.actor.apps[this.id] = this;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onClose(options) {
    super._onClose(options);
    delete this.actor.apps[this.id];
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.configurations = this.#configurations;

    context.abilityOptions = foundry.utils.deepClone(ryuutama.config.abilityScores);
    const [abi1, abi2] = this.#configurations.rollConfig.abilities ?? [];
    context.abilities = { abi1, abi2 };

    context.buttons = [{ label: "Confirm", type: "submit", icon: "fa-solid fa-check" }];
    context.roll = this.actor.system._constructCheckRoll(
      this.#configurations.rollConfig,
      this.#configurations.dialogConfig,
      this.#configurations.messageConfig,
    );

    const roll = this.#configurations.rollConfig;
    context.showConcentration = roll.concentration?.allowed !== false;
    context.allowConsumeFumble = this.actor.system.schema.has("fumbles");
    context.showAccuracy = (roll.accuracy?.weapon?.system.isMastered === false) || (roll.accuracy?.consumeStamina);
    context.showCondition = roll.type === "condition";
    context.showAbilities = !roll.formula;

    switch (this.#configurations.rollConfig.type) {
      case "damage":
      case "accuracy":
        if (this.actor.type === "traveler") context.subtitle =
          this.actor.system.equipped.weapon?.name ?? game.i18n.localize("RYUUTAMA.WEAPON.CATEGORIES.unarmed");
        break;
      case "journey":
        context.subtitle = ryuutama.config.journeyCheckTypes[this.#configurations.rollConfig.journeyId].label;
        break;
    }

    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Handle changes to inputs.
   * @this CheckConfigurationDialog
   * @param {SubmitEvent} event
   * @param {HTMLFormElement} form
   * @param {FormDataExtended} formData
   */
  static #onChangeInputs(event, form, formData) {
    foundry.utils.mergeObject(this.#configurations.rollConfig, formData.object);
    if (foundry.utils.getType(this.#configurations.rollConfig.abilities) === "Object") {
      this.#configurations.rollConfig.abilities = Object.values(this.#configurations.rollConfig.abilities);
    }
    this.render();
  }

  /* -------------------------------------------------- */

  /**
   * Handle final form submission.
   * @this CheckConfigurationDialog
   * @param {SubmitEvent} event
   * @param {HTMLFormElement} form
   * @param {FormDataExtended} formData
   */
  static #onSubmit(event, form, formData) {
    this.#config = true;
  }
}
