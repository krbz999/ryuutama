/**
 * @import { ApplicationConfiguration } from "@client/applications/_types.mjs";
 * @import Actor from "@client/documents/actor.mjs";
 * @import { CheckRollConfig, CheckDialogConfig, CheckMessageConfig } from "../../data/actor/_types.mjs";
 * @import FormDataExtended from "@client/applications/ux/form-data-extended.mjs";
 */

/**
 * @typedef {ApplicationConfiguration & { document: Actor, rollConfig: CheckRollConfig, dialogConfig: CheckDialogConfig, messageConfig: CheckMessageConfig }} CheckConfigurationDialogConfiguration
 */

const { HandlebarsApplicationMixin, Application } = foundry.applications.api;

export default class CheckConfigurationDialog extends HandlebarsApplicationMixin(Application) {
  /**
   * Factory method for asynchronous behavior.
   * @param {CheckConfigurationDialogConfiguration} options
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
      // abilities, situationalBonus, critical, concentration, accuracy
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
  constructor(options) {
    super(options);
    this.#configurations.rollConfig = options.rollConfig;
    this.#configurations.dialogConfig = options.dialogConfig;
    this.#configurations.messageConfig = options.messageConfig;
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
      name: this.options.document.name,
    });
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

    context.formula = this.options.document.system._constructCheckRoll(
      this.#configurations.rollConfig,
      this.#configurations.dialogConfig,
      this.#configurations.messageConfig,
    ).formula;

    const roll = this.#configurations.rollConfig;
    context.showConcentration = roll.concentration !== false;
    context.showAccuracy = (roll.accuracy?.weapon?.system.isMastered === false) || (roll.accuracy?.consumeStamina);

    const wCats = ryuutama.config.weaponCategories;
    switch (this.#configurations.rollConfig.type) {
      case "damage":
      case "accuracy":
        context.subtitle =
          this.options.document.system.equipped.weapon?.name ?? game.i18n.localize("RYUUTAMA.WEAPON.CATEGORIES.unarmed");
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
