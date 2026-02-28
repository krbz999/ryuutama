import BaseData from "./base.mjs";
import RyuutamaItem from "../../../documents/item.mjs";
import RyuutamaToken from "../../../canvas/placeables/token.mjs";

/**
 * @import { CheckRollConfig, CheckDialogConfig, CheckMessageConfig } from "../_types.mjs";
 * @import { DamageConfiguration } from "./_types.mjs";
 * @import BaseRoll from "../../../dice/base-roll.mjs";
 * @import CheckRoll from "../../../dice/check-roll.mjs";
 * @import RyuutamaActor from "../../../documents/actor.mjs";
 * @import RyuutamaChatMessage from "../../../documents/chat-message.mjs";
 */

const { BooleanField, NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

export default class CreatureData extends BaseData {
  /** @inheritdoc */
  static defineSchema() {
    const makeResource = () => {
      return new SchemaField({
        bonuses: new SchemaField({
          flat: new NumberField({ integer: true, initial: null, required: true }),
          level: new NumberField({ integer: true, initial: null, required: true }),
        }),
        max: new NumberField({ integer: true, nullable: true, initial: null, min: 0 }),
        spent: new NumberField({ integer: true, nullable: false, initial: 0, min: 0 }),
      });
    };

    return Object.assign(super.defineSchema(), {
      condition: new SchemaField({
        immunities: new SetField(new StringField({ choices: () => ryuutama.config.statusEffects })),
        rationing: new NumberField({ nullable: false, initial: 0, min: 0, integer: true }),
        shape: new SchemaField({
          high: new StringField({ required: true, blank: true, choices: () => ryuutama.config.abilityScores }),
        }),
        travel: new BooleanField(),
        value: new NumberField({ nullable: false, initial: 4, integer: true, min: 2 }),
      }),
      defense: new SchemaField({
        armor: new NumberField({ min: 0, initial: null, integer: true, nullable: true }),
        modifiers: new SchemaField({
          magical: new NumberField({ nullable: true, integer: true, initial: null }),
          physical: new NumberField({ nullable: true, integer: true, initial: null }),
        }),
      }),
      resources: new SchemaField({
        mental: makeResource(),
        stamina: makeResource(),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.ACTOR.CREATURE",
  ];

  /* -------------------------------------------------- */

  /**
   * The actor's defense value, the target number for a chance to hit them.
   * @type {number|null}
   */
  get defenseValue() {
    const combatant = game.combat?.combatants.find(c => c.actor === this.parent);
    return combatant ? combatant.initiative : null;
  }

  /* -------------------------------------------------- */

  /**
   * Display scrolling numbers when damaged or healed.
   * @param {RyuutamaActor} actor   The actor whose HP is modified.
   * @param {number} delta          The change to HP.
   */
  static #displayScrollingDamageNumbers(actor, delta) {
    if (!delta) return;

    const color = delta > 0 ? RyuutamaToken.RYUUTAMA_COLORS.hp : "#b8006d";
    const tokens = actor.isToken ? [actor.token?.object] : actor.getActiveTokens(true);
    const options = {
      duration: 3000,
      anchor: CONST.TEXT_ANCHOR_POINTS.CENTER,
      direction: CONST.TEXT_ANCHOR_POINTS[delta > 0 ? "TOP" : "BOTTOM"],
      stroke: 0x000000,
      strokeThickness: 4,
      jitter: 0,
      fill: foundry.utils.Color.from(color),
    };
    const text = delta.signedString();

    for (const token of tokens) if (token?.visible && !token.document.isSecret) {
      const center = token.center;
      canvas.interface.createScrollingText(center, text, options);
      token.ring?.flashColor(options.fill);
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    if ((await super._preCreate(data, options, user)) === false) return false;

    const update = {};
    if (!foundry.utils.hasProperty(data, "prototypeToken.displayName"))
      foundry.utils.setProperty(update, "prototypeToken.displayName", CONST.TOKEN_DISPLAY_MODES.HOVER);

    if (!foundry.utils.hasProperty(data, "prototypeToken.displayBars"))
      foundry.utils.setProperty(update, "prototypeToken.displayBars", CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER);

    if (!foundry.utils.isEmpty(update)) this.parent.updateSource(update);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preUpdate(changes, options, user) {
    if ((await super._preUpdate(changes, options, user)) === false) return false;

    // Store current HP for later comparison.
    if (foundry.utils.hasProperty(changes, "system.resources.stamina.spent")) {
      foundry.utils.setProperty(options, `${ryuutama.id}.hp`, { [this.parent.uuid]: this.resources.stamina.spent });
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);

    if (options[ryuutama.id]?.hp?.[this.parent.uuid]) {
      const delta = options[ryuutama.id].hp[this.parent.uuid] - this.resources.stamina.spent;
      CreatureData.#displayScrollingDamageNumbers(this.parent, delta);
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareBaseData() {
    super.prepareBaseData();

    this.#prepareStatuses();
    this._prepareAbilities();
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    for (const k in this.abilities) this.abilities[k] = new ryuutama.data.Ability(this.abilities[k].value);
  }

  /* -------------------------------------------------- */

  /**
   * Prepare condition and statuses.
   */
  #prepareStatuses() {
    const { value: condition, immunities } = this.condition;
    const statuses = this.condition.statuses = {};

    for (const [id, { _id }] of Object.entries(ryuutama.config.statusEffects)) {
      const effect = this.parent.effects.get(_id);
      const { value: strength, bypass } = effect?.system.strength ?? {};
      if (!effect || (!bypass && (strength < condition)) || (id in statuses) || immunities.has(id)) continue;
      statuses[id] = strength;
    }
  }

  /* -------------------------------------------------- */

  /**
   * Prepare abilities.
   */
  _prepareAbilities() {
    // In case of doubled data prep, ensure the object is entirely source data. An error is otherwise thrown.
    for (const k in this.abilities) this.abilities[k] = { ...this._source.abilities[k] };

    for (const id in this.condition.statuses) {
      let abilities;
      switch (id) {
        case "injury": abilities = ["dexterity"]; break;
        case "poison": abilities = ["strength"]; break;
        case "exhaustion": abilities = ["spirit"]; break;
        case "muddled": abilities = ["intelligence"]; break;
        case "shock":
        case "sickness": abilities = ["strength", "dexterity", "intelligence", "spirit"]; break;
      }
      if (!abilities) continue;
      for (const ability of abilities) this.schema.getField(`abilities.${ability}.value`).increase(this.parent, -1);
    }
  }

  /* -------------------------------------------------- */

  /**
   * Prepare roll data for this subtype.
   * @returns {object}
   */
  getRollData() {
    const rollData = { ...this };

    rollData.stats = new Proxy(this.abilities, {
      get: function(target, prop, receiver) {
        return Reflect.get(target, prop, receiver);
      },
    });

    return rollData;
  }

  /* -------------------------------------------------- */
  /*   Checks                                           */
  /* -------------------------------------------------- */

  /**
   * Perform a check.
   * @param {CheckRollConfig} [rollConfig={}]
   * @param {CheckDialogConfig} [dialogConfig={}]
   * @param {CheckMessageConfig} [messageConfig={}]
   * @returns {Promise<RyuutamaChatMessage|object|number|null>}
   */
  async #rollCheck(rollConfig = {}, dialogConfig = {}, messageConfig = {}) {
    ({ rollConfig, dialogConfig, messageConfig } = this.#constructCheckConfigs(rollConfig, dialogConfig, messageConfig));

    if (dialogConfig.configure !== false) {
      // The dialog modifies the three configurations inplace.
      const configured = await ryuutama.applications.apps.CheckConfigurationDialog.create({
        rollConfig, dialogConfig, messageConfig,
        document: this.parent,
      });
      if (!configured) return null;
    }

    const roll = this._constructCheckRoll(rollConfig, dialogConfig, messageConfig);
    await roll.evaluate();

    const consumed = await this.#performCheckUpdates(roll, rollConfig, dialogConfig, messageConfig);
    if (consumed === false) return null;

    let messageData = await this._createCheckMessage(roll, rollConfig, dialogConfig, messageConfig);

    // If a message id is passed through, check whether we need to create.
    append: if (messageConfig.messageId) {
      const origin = game.messages.get(messageConfig.messageId);
      if (origin?.type !== "standard") break append;
      messageData = await roll.toMessage(messageData, { create: false });
      const originData = origin.toObject();

      const { type } = Object.values(messageData.system.parts)[0];
      let part = Object.values(originData.system.parts).find(p => (p.type === type) && !p.rolls.length);
      if (part) Object.assign(part, Object.values(messageData.system.parts)[0]);
      else {
        originData.system.parts[foundry.utils.randomID()] = Object.values(messageData.system.parts)[0];
      }
      const message = await origin.update(originData);
      if (!messageConfig.returnNumeric) return message;
      return roll.total;
    }

    const message = await roll.toMessage(messageData, { create: messageConfig.create });
    if (!messageConfig.returnNumeric) return message;
    return roll.total;
  }

  /* -------------------------------------------------- */

  /**
   * Create the full message data for the check.
   * @param {CheckRoll} roll    The evaluated check.
   * @param {CheckRollConfig} [rollConfig={}]
   * @param {CheckDialogConfig} [dialogConfig={}]
   * @param {CheckMessageConfig} [messageConfig={}]
   * @returns {Promise<object>}
   */
  async _createCheckMessage(roll, rollConfig, dialogConfig, messageConfig) {
    const type = game.i18n.localize(`RYUUTAMA.ROLL.TYPES.${rollConfig.type}`);
    const abilities = game.i18n
      .getListFormatter()
      .format(rollConfig.abilities?.map(abi => ryuutama.config.abilityScores[abi].label) ?? []);
    const flavor = game.i18n.format(
      `RYUUTAMA.ROLL.messageFlavor${rollConfig.abilities?.length ? "Abilities" : ""}`,
      { type, abilities },
    );

    const messageData = foundry.utils.mergeObject({
      flavor,
      type: "standard",
      speaker: getDocumentClass("ChatMessage").getSpeaker({ actor: this.parent }),
    }, messageConfig.data ?? {}, { overwrite: false });

    // Append flag for check request messages.
    const [messageId, partId] = messageConfig.requestId?.split(".") ?? [];
    if (game.messages.get(messageId)?.system.parts?.[partId]?.type === "request") {
      foundry.utils.setProperty(messageData, `flags.${ryuutama.id}.requestId`, messageConfig.requestId);
    }

    return messageData;
  }

  /* -------------------------------------------------- */

  /**
   * Create the label for a roll configuration of a check.
   * @param {CheckRollConfig} rollConfig
   * @returns {string}
   */
  static _createCheckLabel(rollConfig) {
    const typeLabel = game.i18n.format(`RYUUTAMA.ROLL.TYPES.${rollConfig.type}`);
    const subtitle = (rollConfig.type === "journey")
      ? ryuutama.config.checkTypes.journey.subtypes[rollConfig.journeyId].label
      : null;
    return subtitle ? `${typeLabel} (${subtitle})` : typeLabel;
  }

  /* -------------------------------------------------- */

  /**
   * Construct the configuration objects for a check.
   * @param {CheckRollConfig} rollConfig
   * @param {CheckDialogConfig} [dialogConfig={}]
   * @param {CheckMessageConfig} [messageConfig={}]
   * @returns {{ rollConfig: CheckRollConfig, dialogConfig: CheckDialogConfig, messageConfig: CheckMessageConfig }}
   */
  #constructCheckConfigs(rollConfig, dialogConfig = {}, messageConfig = {}) {
    ({ rollConfig, dialogConfig, messageConfig } = foundry.utils.deepClone({ rollConfig, dialogConfig, messageConfig }));

    let roll = { accuracy: {}, condition: {}, concentration: {}, critical: {}, magic: {} };
    let dialog = {};
    let message = { create: true };

    switch (rollConfig.type) {
      case "accuracy": break;
      case "check":
        roll.abilities = ["strength", "strength"];
        break;

      case "condition":
        roll.abilities = ["strength", "spirit"];
        roll.concentration.allowed = false;
        break;

      case "damage": {
        roll.concentration.allowed = false;
        roll.critical.allowed = true;
        break;
      }

      case "initiative":
        roll.concentration.allowed = false;
        break;

      case "journey":
        switch (rollConfig.journeyId) {
          case "camping": roll.abilities = ["dexterity", "intelligence"]; break;
          case "direction": roll.abilities = ["intelligence", "intelligence"]; break;
          case "travel": roll.abilities = ["strength", "dexterity"]; break;
          default: throw new Error(`Invalid journeyId '${rollConfig.journeyId}' for a journey check.`);
        }
        break;

      case "magic":
        roll.abilities = ["intelligence", "spirit"];
        roll.magic.consumeMental = true;
        break;

      default:
        throw new Error(`Invalid check type '${rollConfig.type}' passed to rollConfig parameter.`);
    }

    const result = {
      rollConfig: foundry.utils.mergeObject(roll, rollConfig),
      dialogConfig: foundry.utils.mergeObject(dialog, dialogConfig),
      messageConfig: foundry.utils.mergeObject(message, messageConfig),
    };

    // Allow subclasses to perform changes.
    this._constructCheckConfigs(result.rollConfig, result.dialogConfig, result.messageConfig);

    // Final step: cleanup.
    if (result.rollConfig.formula) delete result.rollConfig.abilities;

    return result;
  }

  /* -------------------------------------------------- */

  /**
   * Allow subclasses to perform changes to check configs.
   * @param {CheckRollConfig} roll
   * @param {CheckDialogConfig} dialog
   * @param {CheckMessageConfig} message
   */
  _constructCheckConfigs(roll, dialog, message) {}

  /* -------------------------------------------------- */

  /**
   * Perform the updates related to a check.
   * @param {CheckRoll} roll    The evaluated check.
   * @param {CheckRollConfig} [rollConfig={}]
   * @param {CheckDialogConfig} [dialogConfig={}]
   * @param {CheckMessageConfig} [messageConfig={}]
   * @returns {Promise<boolean|void>}    Explicitly returning false if the changes were not possible.
   */
  async #performCheckUpdates(roll, rollConfig = {}, dialogConfig = {}, messageConfig = {}) {
    const update = {};
    const effectIds = [];
    const actor = this.parent;
    const isTraveler = actor.type === "traveler";
    const isTravelCheck = (rollConfig.type === "journey") && (rollConfig.journeyId === "travel");

    // Consume a fumble point and MP due to concentration.
    const c = rollConfig.concentration ?? {};
    const cAllowed = c.allowed !== false;
    if (cAllowed && c.consumeFumble) {
      const value = actor.system.fumbles.value - 1;
      if (value < 0) {
        ui.notifications.warn("RYUUTAMA.ROLL.WARNING.fumblesUnavailable", { format: { name: actor.name } });
        return false;
      }
      update["system.fumbles.value"] = value;
    }

    if (cAllowed && c.consumeMental) {
      const value = actor.system.resources.mental.value;
      if (!value) {
        ui.notifications.warn("RYUUTAMA.ROLL.WARNING.mentalUnavailable", { format: { name: actor.name } });
        return false;
      }
      const toSpend = Math.ceil(value / 2);
      update["system.resources.mental.spent"] = actor.system.resources.mental.spent + toSpend;
    }

    // Update condition score.
    if (rollConfig.condition?.updateScore) {
      update["system.condition.value"] = roll.total;
      update["system.condition.travel"] = false;

      // Remove statuses.
      if (rollConfig.condition?.removeStatuses) {
        const score = roll.total;
        for (const status of actor.effects.documentsByType.status) {
          const str = status.system.strength.value;
          if (str < score) effectIds.push(status.id);
        }
      }
    }

    // Consume HP due to unmastered weapon.
    if (rollConfig.accuracy?.consumeStamina) {
      const value = actor.system.resources.stamina.value;
      if (!value) {
        ui.notifications.warn("RYUUTAMA.ROLL.WARNING.staminaUnavailable", { format: { name: actor.name } });
        return false;
      }
      update["system.resources.stamina.spent"] = actor.system.resources.stamina.spent + 1;
    }

    // Consume MP from casting a spell.
    const magicItem = this.parent.items.get(rollConfig.magic?.item);
    if (rollConfig.magic?.consumeMental && magicItem) {
      const mp = magicItem.system.spell.activation.mental;
      update["system.resources.mental.spent"] ??= actor.system.resources.mental.spent;
      update["system.resources.mental.spent"] += mp;
      if (update["system.resources.mental.spent"] > actor.system.resources.mental.max) {
        ui.notifications.warn("RYUUTAMA.ROLL.WARNING.mentalUnavailable", { format: { name: actor.name } });
        return false;
      }
    }

    // If a travel check, change hp or condition, depending.
    if (isTraveler && isTravelCheck && rollConfig.travel?.performChanges) {
      const tn = ui.habitat.targetNumber;
      const hp = actor.system.resources.stamina;
      switch (true) {
        case roll.isCritical:
          update["system.condition.travel"] = true;
          break;
        case roll.isFumble:
          update["system.resources.stamina.spent"] = Math.ceil(hp.spent + hp.value * 3 / 4);
          break;
        case roll.total < tn:
          update["system.resources.stamina.spent"] = Math.ceil(hp.spent + hp.value / 2);
          break;
      }
    }

    // Deduct durability.
    if (roll.isFumble) {
      // iterate over rollConfig.items and deduct durability.
    }

    if (effectIds.length) await actor.deleteEmbeddedDocuments("ActiveEffect", effectIds);
    if (!foundry.utils.isEmpty(update)) await actor.update(update);

    // Apply (delayed) initiative.
    const combatant = game.combat?.combatants.find(c => c.actor === this.parent);
    if (combatant) {
      const total = (rollConfig.initiative?.upgrade === false)
        ? rollConfig.initiative.delayed
          ? roll.product
          : roll.total
        : rollConfig.initiative?.delayed
          ? `max(@combatant.initiative, ${roll.total})`
          : Math.max(combatant.initiative, roll.total);
      if (rollConfig.initiative?.delayed) await combatant.update({ "system.initiative.value": total });
      else await combatant.update({ initiative: total });
    }
  }

  /* -------------------------------------------------- */

  /**
   * Create a check roll.
   * @param {CheckRollConfig} [rollConfig={}]
   * @param {CheckDialogConfig} [dialogConfig={}]
   * @param {CheckMessageConfig} [messageConfig={}]
   * @returns {CheckRoll}
   */
  _constructCheckRoll(rollConfig = {}, dialogConfig = {}, messageConfig = {}) {
    let { parts, rollData } = this._prepareCheckModifiers(rollConfig, dialogConfig, messageConfig);

    if (rollConfig.formula) {
      parts.unshift(rollConfig.formula);
    } else {
      parts = [
        `@stats.${rollConfig.abilities[0]}`,
        (rollConfig.abilities.length > 1) ? `@stats.${rollConfig.abilities[1]}` : null,
      ].concat(parts);
    }

    const Cls = this.#determineRollClass(rollConfig, dialogConfig, messageConfig);
    const options = this.#constructRollOptions(rollConfig, dialogConfig, messageConfig);
    const roll = new Cls(parts.filterJoin(" + "), rollData, options);
    if (rollConfig.critical?.allowed && rollConfig.critical.isCritical) roll.alter(2, 0);
    return roll;
  }

  /* -------------------------------------------------- */

  /**
   * Determine roll class for the check.
   * @param {CheckRollConfig} [rollConfig={}]
   * @param {CheckDialogConfig} [dialogConfig={}]
   * @param {CheckMessageConfig} [messageConfig={}]
   * @returns {typeof BaseRoll}
   */
  #determineRollClass(rollConfig = {}, dialogConfig = {}, messageConfig = {}) {
    switch (rollConfig.type) {
      case "damage": return ryuutama.dice.DamageRoll;
    }
    return ryuutama.dice.CheckRoll;
  }

  /* -------------------------------------------------- */

  /**
   * Construct options for the Roll instance.
   * @param {CheckRollConfig} [rollConfig={}]
   * @param {CheckDialogConfig} [dialogConfig={}]
   * @param {CheckMessageConfig} [messageConfig={}]
   * @returns {Record<string, boolean>}
   */
  #constructRollOptions(rollConfig = {}, dialogConfig = {}, messageConfig = {}) {
    const options = {};
    const item = ["accuracy", "damage"].includes(rollConfig.type)
      ? this.parent.items.get(rollConfig.accuracy?.weapon)
      : (rollConfig.type === "magic")
        ? this.parent.items.get(rollConfig.magic?.item)
        : null;
    const rollOptions = item?.system.getRollOptions?.(rollConfig.type) ?? [];
    rollOptions.forEach(o => options[o] = true);
    return foundry.utils.mergeObject(options, rollConfig.rollOptions ?? {});
  }

  /* -------------------------------------------------- */

  /**
   * Construct additional bonuses and penalties for a check.
   * @param {CheckRollConfig} [rollConfig={}]
   * @param {CheckDialogConfig} [dialogConfig={}]
   * @param {CheckMessageConfig} [messageConfig={}]
   * @returns {{ parts: Array<string|number>, rollData: object }}
   */
  _prepareCheckModifiers(rollConfig = {}, dialogConfig = {}, messageConfig = {}) {
    const parts = [];
    const rollData = this.parent.getRollData();

    if (rollConfig.modifier) {
      parts.push("@modifier");
      rollData.modifier = rollConfig.modifier;
    }

    if (rollConfig.situationalBonus) {
      parts.push("@situationalBonus");
      rollData.situationalBonus = rollConfig.situationalBonus;
    }

    if (rollData.condition?.rationing) {
      parts.push("@rationPenalty");
      rollData.rationPenalty = -rollData.condition.rationing;
    }

    return { parts, rollData };
  }

  /* -------------------------------------------------- */

  /**
   * Roll a check.
   * @param {CheckRollConfig} [rollConfig={}]
   * @param {CheckDialogConfig} [dialogConfig={}]
   * @param {CheckMessageConfig} [messageConfig={}]
   * @returns {Promise<RyuutamaChatMessage|object|number|null>}
   */
  async rollCheck(rollConfig = {}, dialogConfig = {}, messageConfig = {}) {
    return this.#rollCheck(rollConfig, dialogConfig, messageConfig);
  }

  /* -------------------------------------------------- */

  /**
   * A bespoke method for accuracy and damage checks combined into one message.
   * @param {CheckRollConfig} [rollConfig={}]
   * @param {CheckDialogConfig} [dialogConfig={}]
   * @param {CheckMessageConfig} [messageConfig={}]
   * @returns {Promise<RyuutamaChatMessage|object|number|null>}
   */
  async rollAttack(rollConfig = {}, dialogConfig = {}, messageConfig = {}) {
    const create = messageConfig.create ?? true;
    messageConfig.create = false;
    rollConfig.type = "accuracy";
    const messageData = await this.rollCheck(rollConfig, dialogConfig, messageConfig);
    if (!messageData) return null;
    const Cls = getDocumentClass("ChatMessage");
    messageData.system.parts[foundry.utils.randomID()] = { type: "damage" };
    const message = new Cls(messageData);
    return create ? Cls.create(message.toObject()) : message.toObject();
  }

  /* -------------------------------------------------- */

  /**
   * A bespoke method for spellcasting in one message.
   * @param {RyuutamaItem} spell    The spell to cast.
   * @param {CheckRollConfig} [rollConfig={}]
   * @param {CheckDialogConfig} [dialogConfig={}]
   * @param {CheckMessageConfig} [messageConfig={}]
   * @returns {Promise<RyuutamaChatMessage|object|number|null>}
   */
  async castSpell(spell, rollConfig = {}, dialogConfig = {}, messageConfig = {}) {
    rollConfig = foundry.utils.mergeObject(rollConfig, {
      type: "magic",
      "magic.item": spell.id,
    }, { inplace: false });
    const create = messageConfig.create ?? true;
    messageConfig.create = false;
    const messageData = await this.rollCheck(rollConfig, dialogConfig, messageConfig);
    if (!messageData) return null;
    const Cls = getDocumentClass("ChatMessage");
    messageData.content = `<p>@Embed[${spell.uuid} caption=false]</p>`;

    // Insert more parts here according to how the spell is configured.
    Object.assign(messageData.system.parts, await spell.system.actions.toMessagePartData());

    const message = new Cls(messageData);
    return create ? Cls.create(message.toObject()) : message.toObject();
  }

  /* -------------------------------------------------- */

  /**
   * A bespoke method for initiative checks.
   * @param {CheckRollConfig} [rollConfig={}]
   * @param {CheckDialogConfig} [dialogConfig={}]
   * @param {CheckMessageConfig} [messageConfig={}]
   * @returns {Promise<number|null>}
   */
  async rollInitiative(rollConfig = {}, dialogConfig = {}, messageConfig = {}) {
    rollConfig = foundry.utils.mergeObject(rollConfig, {
      type: "initiative",
      initiative: {},
    }, { inplace: false });
    messageConfig = foundry.utils.mergeObject(messageConfig, {
      returnNumeric: true,
    }, { inplace: false });
    return this.rollCheck(rollConfig, dialogConfig, messageConfig);
  }

  /* -------------------------------------------------- */
  /*   Damage & Healing Application                     */
  /* -------------------------------------------------- */

  /**
   * Calculate the damage an actor will take.
   * @param {DamageConfiguration[]} [damages=[]]
   * @returns {{ hp: number, mp: number }}    The damage applied to HP and MP.
   */
  calculateDamage(damages = []) {
    damages = foundry.utils.deepClone(damages);

    let hp = 0;
    let mp = 0;

    /**
     * Does this damage ignore defense/armor?
     * @param {DamageConfiguration} damage
     * @returns {boolean}
     */
    const ignoreDefense = damage => {
      return damage.options?.ignoreArmor
        || ((this.details?.category === "undead") && (damage.options?.mythril || damage.options?.orichalcum));
    };

    for (const damage of damages) {
      if (damage.options?.magical) damage.value += this.defense.modifiers.magical;
      else {
        damage.value += this.defense.modifiers.physical;
        if (!ignoreDefense(damage)) damage.value -= this.defense.total;
      }
      damage.value = Math.max(0, damage.value);
      hp += damage.value;
      if (damage.options?.damageMental) mp += damage.value;
    }

    return { hp, mp };
  }

  /* -------------------------------------------------- */

  /**
   * Apply damage to the actor.
   * @param {DamageConfiguration[]} [damages=[]]
   * @returns {Promise<RyuutamaActor>}
   */
  async applyDamage(damages = []) {
    const { hp, mp } = this.calculateDamage(damages);
    const actor = this.parent;
    await actor.update({
      "system.resources.stamina.spent": this.resources.stamina.spent + hp,
      "system.resources.mental.spent": this.resources.mental.spent + mp,
    });
    return actor;
  }

  /* -------------------------------------------------- */

  /**
   * Calculate healing received.
   * @param {{ value: number }[]} healing
   * @returns {number}
   */
  calculateHealing(healing) {
    return healing.reduce((acc, h) => acc + Math.max(h.value, 0), 0);
  }

  /* -------------------------------------------------- */

  /**
   * Apply healing to this actor.
   * @param {{ value: number }[]} healing
   * @returns {Promise<RyuutamaActor>}
   */
  async applyHealing(healing = []) {
    const total = this.calculateHealing(healing);
    const actor = this.parent;
    await actor.update({ "system.resources.stamina.spent": actor.system.resources.stamina.spent - total });
    return actor;
  }
}
