/**
 * @import { ApplicationConfiguration } from "@client/applications/_types.mjs";
 * @import FormDataExtended from "@client/applications/ux/form-data-extended.mjs";
 * @import RyuutamaActor from "../../../documents/actor.mjs";
 */

/**
 * @typedef {"accuracy"|"check"|"condition"|"damage"|"initiative"|"journey"|"magic"} CheckType
 */

/**
 * @typedef {"camping"|"direction"|"travel"} JourneySubtype
 */

/**
 * @typedef CheckRollConfig
 * @property {string[]} [abilities]                     Keys from `ryuutama.CONST.ABILITIES` or number-like strings
 *                                                      representing die faces.
 * @property {string} [formula]                         An explicit formula can be provided, in which case
 *                                                      abilities are ignored for the formula creation. Modifiers
 *                                                      are still added on top.
 * @property {CheckType} [type]                         The check type.
 * @property {JourneySubtype} [journeyId]               If a journey check, the type of check.
 * @property {number} [modifier]                        A modifier to the roll that cannot be changed via the UI,
 *                                                      e.g., the accuracy or damage modifier from a weapon.
 * @property {number} [situationalBonus]
 * @property {object} [critical]
 * @property {boolean} [critical.allowed]               Can the roll be critical?
 * @property {boolean} [critical.isCritical]            Roll double the dice?
 * @property {object} [concentration]
 * @property {boolean} [concentration.allowed]          If explicitly `false`, options are not shown.
 * @property {boolean} [concentration.consumeMental]    Consume half the traveler's current MP (rounded up)?
 * @property {boolean} [concentration.consumeFumble]    Consume a Fumble point?
 * @property {object} [condition]
 * @property {boolean} [condition.updateScore]          Update the traveler's condition score with
 *                                                      the total of the check?
 * @property {boolean} [condition.removeStatuses]       Remove status effects whose strength is lower than the
 *                                                      traveler's condition score?
 * @property {object} [accuracy]
 * @property {string} [accuracy.weapon]                 The id of the weapon being used for the check.
 * @property {boolean} [accuracy.consumeStamina]        Consume HP due to using a non-Mastered weapon?
 * @property {object} [initiative]
 * @property {boolean} [initiative.delayed]                 The rolled initiative is stored on the Combatant
 *                                                          document to be applied as initiative on the next turn.
 * @property {boolean} [initiative.upgrade=true]            Use the rolled value only if a combatant has not rolled
 *                                                          initiative or if the new value is higher.
 * @property {object} [magic]
 * @property {boolean} [magic.consumeMental]            Consume the MP for casting the spell?
 * @property {string} [magic.item]                      The id of the spell being cast.
 * @property {Record<string, boolean>} [rollOptions]    Options for the roll. The effect of these depends on
 *                                                      the type of check being performed.
 * @property {object} [travel]
 * @property {boolean} [travel.performChanges=true]   If a travel check, perform the relevant changes
 *                                                    depending on the result.
 */

/* -------------------------------------------------- */

/**
 * @typedef CheckDialogConfig
 * @property {boolean} [configure]    Should a configuration dialog be created?
 */

/* -------------------------------------------------- */

/**
 * @typedef CheckMessageConfig
 * @property {boolean} [create]                 Should a chat message be created?
 * @property {object} [data]                    Data to be used for the chat message.
 *                                              This does not include `rolls` or `content`.
 * @property {string} [messageId]               The id of a message (of type `standard`) to append to
 *                                              rather than create a new message. The `create` option is ignored.
 * @property {string} [requestId]               The id of a message (of type `standard`) that requested this check,
 *                                              in combination with the id of the `request` part. The message will
 *                                              be updated to show the result in a compact format.
 * @property {boolean} [returnNumeric=false]    Return a numeric value rather than a chat message or message data.
 */

/**
 * @typedef _CheckConfigurationDialogConfiguration
 * @property {CheckRollConfig} rollConfig
 * @property {CheckDialogConfig} dialogConfig
 * @property {CheckMessageConfig} messageConfig
 * @property {RyuutamaActor} document
 * @property {string} [parentWindow]    Id of the parent window to attach this application to.
 */

/**
 * @typedef {ApplicationConfiguration & _CheckConfigurationDialogConfiguration} CheckConfigurationDialogConfiguration
 */

const { HandlebarsApplicationMixin, Application } = foundry.applications.api;

/**
 * A dialog responsible for configuring checks. Configurations are passed in and mutated inplace.
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
    const parentWindow = foundry.applications.instances.get(options.parentWindow);
    if (parentWindow) parentWindow.renderChild(application);
    else application.render({ force: true });
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
      handler: CheckConfigurationDialog.#onSubmit,
      closeOnSubmit: true,
      submitOnChange: false,
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
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

  /**
   * The value to be returned by the form when submitted.
   * @type {boolean}
   */
  get config() {
    return this.#config;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get title() {
    return _loc("RYUUTAMA.ROLL.title", {
      type: _loc(`RYUUTAMA.ROLL.TYPES.${this.#configurations.rollConfig.type}`),
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

    context.abilityOptions = ryuutama.CONST.ABILITIES._toConfig;
    const [abi1, abi2] = this.#configurations.rollConfig.abilities ?? [];
    context.abilities = { abi1, abi2 };
    context.displayAbilities = [abi1, abi2].every(abi => Object.values(ryuutama.CONST.ABILITIES).includes(abi));

    context.buttons = [{ label: "COMMON.Confirm", type: "submit", icon: "fa-solid fa-check" }];
    context.roll = this.actor.system._constructCheckRoll(
      this.#configurations.rollConfig,
      this.#configurations.dialogConfig,
      this.#configurations.messageConfig,
    );

    const roll = this.#configurations.rollConfig;
    context.showConcentration = roll.concentration?.allowed !== false;
    context.allowConsumeFumble = this.actor.system.schema.has("fumbles");
    context.showMagic = roll.type === "magic";
    const magicItem = this.actor.items.get(roll.magic?.item);
    context.magicCost = magicItem?.system.spell.activation.mental;

    const weapon = this.actor.items.get(roll.accuracy?.weapon) ?? null;

    context.showAccuracy =
      ((roll.type === "accuracy") && (this.actor.type === "traveler"))
      && ((weapon?.system.isMastered === false) || (!weapon && !this.actor.system.mastered.weapons.has("unarmed")));

    if (!context.showAccuracy) foundry.utils.setProperty(roll, "accuracy.consumeStamina", false);
    context.showCondition = roll.type === "condition";
    context.showAbilities = !roll.formula && context.displayAbilities;

    const combatant = game.combat?.combatants.find(c => c.actor === this.actor);

    switch (roll.type) {
      case "damage":
      case "accuracy":
        if (this.actor.type === "traveler") {
          if (weapon && weapon.system.isUsable) context.subtitle = weapon.name;
          else if (weapon) context.subtitle = _loc("RYUUTAMA.ROLL.weaponBroken", { weapon: weapon.name });
          else context.subtitle = ryuutama.config.weaponUnarmedTypes.unarmed.label;
        }
        break;
      case "initiative":
        context.showInitiative = !!combatant && (combatant.initiative !== null);
        context.initiative = { upgrade: roll.initiative?.upgrade !== false };
        break;
      case "journey":
        context.subtitle = ryuutama.config.checkTypes.journey.subtypes[roll.journeyId].label;
        break;
      case "magic":
        context.subtitle = magicItem?.name;
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
    this.render({ parts: ["formula", "inputs"] });
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
