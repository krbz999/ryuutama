/**
 * @import { CheckRollConfig, CheckDialogConfig, CheckMessageConfig } from "../_types.mjs";
 * @import CheckRoll from "../../../dice/check-roll.mjs";
 * @import { DamageConfiguration } from "./_types.mjs";
 * @import RyuutamaActor from "../../../documents/actor.mjs";
 * @import BaseRoll from "../../../dice/base-roll.mjs";
 */

const { NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

export default class CreatureData extends foundry.abstract.TypeDataModel {
  /** @override */
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

    return {
      condition: new SchemaField({
        immunities: new SetField(new StringField({ choices: () => ryuutama.config.statusEffects })),
        shape: new SchemaField({
          high: new StringField({ required: true, blank: true, choices: () => ryuutama.config.abilityScores }),
        }),
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
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.CREATURE",
  ];

  /* -------------------------------------------------- */

  /**
   * Storage of previous HP values.
   * @type {Map<string, number>}
   */
  static #staminaChange = new Map();

  /* -------------------------------------------------- */

  /**
   * Display scrolling numbers when damaged or healed.
   * @param {RyuutamaActor} actor   The actor whose HP is modified.
   * @param {number} delta          The change to HP.
   */
  static #displayScrollingDamageNumbers(actor, delta) {
    if (!delta) return;

    const color = delta > 0 ? "#4BA72F" : "#b8006d";
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
  async _preUpdate(changes, options, user) {
    if ((await super._preUpdate(changes, options, user)) === false) return false;

    // Store current HP for later comparison.
    if (foundry.utils.hasProperty(changes, "system.resources.stamina.spent")) {
      CreatureData.#staminaChange.set(this.parent.uuid, this.resources.stamina.spent);
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);

    if (CreatureData.#staminaChange.has(this.parent.uuid)) {
      const delta = CreatureData.#staminaChange.get(this.parent.uuid) - this.resources.stamina.spent;
      CreatureData.#staminaChange.delete(this.parent.uuid);
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
   * @returns {Promise<CheckRoll|null>}
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

    if (messageConfig.create !== false) {
      messageConfig.data ??= {};
      messageConfig.data.flavor ??= game.i18n.format(
        `RYUUTAMA.ROLL.messageFlavor${rollConfig.abilities?.length ? "Abilities" : ""}`,
        {
          type: game.i18n.localize(`RYUUTAMA.ROLL.TYPES.${rollConfig.type}`),
          abilities: game.i18n
            .getListFormatter()
            .format(rollConfig.abilities?.map(abi => ryuutama.config.abilityScores[abi].label) ?? []),
        }),
      roll.toMessage(messageConfig.data);
    }

    return roll;
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

    let roll = { condition: {}, concentration: {}, critical: {} };
    let dialog = { configure: true };
    let message = { create: true, data: {
      speaker: getDocumentClass("ChatMessage").getSpeaker({ actor: this.parent }),
    } };

    switch (rollConfig.type) {
      case "journey":
        switch (rollConfig.journeyId) {
          case "travel": roll.abilities = ["strength", "dexterity"]; break;
          case "camping": roll.abilities = ["intelligence", "intelligence"]; break;
          case "direction": roll.abilities = ["dexterity", "intelligence"]; break;
          default: throw new Error(`Invalid journeyId '${rollConfig.journeyId}' for a journey check.`);
        }
        break;

      case "condition":
        roll.abilities = ["strength", "spirit"];
        roll.concentration.allowed = false;
        roll.condition = { updateScore: true, removeStatuses: true };
        break;

      case "damage": {
        message.data.type = "damage";
        switch (this.parent.type) {
          case "traveler": {
            const w = this.equipped.weapon;
            let abi;
            if (w?.system.isUsable) abi = w.system.damage.ability;
            else abi = ryuutama.config.weaponUnarmedTypes.unarmed.damage.ability; // unarmed
            roll.abilities = [abi];
            break;
          }
          case "monster": {
            roll.formula = this.attack.damage;
            break;
          }
        }
        roll.concentration.allowed = false;
        roll.critical = { allowed: true };
        break;
      }

      case "accuracy": {
        switch (this.parent.type) {
          case "traveler": {
            let abilities;
            const w = this.equipped.weapon;
            if (w?.system.isUsable) {
              abilities = [...w.system.accuracy.abilities];
              roll.accuracy = { weapon: w, consumeStamina: !w.system.isMastered };
            } else {
              // unarmed
              abilities = [...ryuutama.config.weaponUnarmedTypes.unarmed.accuracy.abilities];
              roll.accuracy = { consumeStamina: !this.mastered.weapons.unarmed };
            }
            roll.abilities = abilities;
            break;
          }
          case "monster": {
            roll.formula = this.attack.accuracy;
            break;
          }
        }
        break;
      }

      case "initiative":
        switch (this.parent.type) {
          case "traveler": {
            roll.abilities = ["dexterity", "intelligence"];
            break;
          }
          case "monster": {
            roll.formula = "@initiative.value";
            break;
          }
        }
        roll.concentration.allowed = false;
        break;

      case "check":
        roll.abilities = ["strength", "strength"];
        break;

      default:
        throw new Error(`Invalid check type '${rollConfig.type}' passed to rollConfig parameter.`);
    }

    const result = {
      rollConfig: foundry.utils.mergeObject(roll, rollConfig),
      dialogConfig: foundry.utils.mergeObject(dialog, dialogConfig),
      messageConfig: foundry.utils.mergeObject(message, messageConfig),
    };

    // Final step: cleanup.
    if (result.rollConfig.formula) {
      delete result.rollConfig.abilities;
    }

    return result;
  }

  /* -------------------------------------------------- */

  /**
   * Perform the updates related to a check.
   * @param {CheckRoll} roll    The evaluated check.
   * @param {CheckRollConfig} [rollConfig={}]
   * @param {CheckDialogConfig} [dialogConfig={}]
   * @param {CheckMessageConfig} [messageConfig={}]
   * @returns {Promise<boolean|void>}    Explicitly returning false if consumption was not possible.
   */
  async #performCheckUpdates(roll, rollConfig = {}, dialogConfig = {}, messageConfig = {}) {
    const update = {};
    const effectIds = [];
    const actor = this.parent;

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

    // Deduct durability.
    if (roll.isFumble) {
      // iterate over rollConfig.items and deduct durability.
    }

    const dodge = actor.system.defense?.dodge ?? Infinity;
    if (effectIds.length) await actor.deleteEmbeddedDocuments("ActiveEffect", effectIds);
    if (!foundry.utils.isEmpty(update)) await actor.update(update);
    if (rollConfig.initiative?.shield && (roll.total < dodge)) {
      const _id = ryuutama.utils.staticId("shielddodge");

      await actor.effects.get(_id)?.delete();
      await getDocumentClass("ActiveEffect").create({
        _id,
        img: "icons/equipment/shield/buckler-wooden-boss-lightning.webp",
        name: game.i18n.localize("RYUUTAMA.SHIELD.shieldDefense"),
        system: {
          expiration: {
            type: "combatEnd",
          },
        },
        changes: [
          { key: `flags.${ryuutama.id}.shieldDodge`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: "true" },
        ],
      }, { keepId: true, parent: actor });
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
    switch (rollConfig.type) {
      case "damage": foundry.utils.mergeObject(options, { magical: false }); break;
    }
    return foundry.utils.mergeObject(options, messageConfig.rollOptions ?? {});
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

    return { parts, rollData };
  }

  /* -------------------------------------------------- */

  /**
   * Roll a check.
   * @param {CheckRollConfig} [rollConfig={}]
   * @param {CheckDialogConfig} [dialogConfig={}]
   * @param {CheckMessageConfig} [messageConfig={}]
   * @returns {Promise<CheckRoll|null>}
   */
  async rollCheck(rollConfig = {}, dialogConfig = {}, messageConfig = {}) {
    return this.#rollCheck(rollConfig, dialogConfig, messageConfig);
  }

  /* -------------------------------------------------- */
  /*   Damage Application                               */
  /* -------------------------------------------------- */

  /**
   * Calculate the damage an actor will take.
   * @param {DamageConfiguration[]} [damages=[]]
   * @returns {number}
   */
  calculateDamage(damages = []) {
    damages = foundry.utils.deepClone(damages);

    const { modifiers } = this.defense;
    for (const damage of damages) {
      if (damage.magical) damage.value += modifiers.magical;
      else {
        damage.value += modifiers.physical;
        damage.value -= this.defense.total;
      }
      damage.value = Math.max(0, damage.value);
    }

    return damages.reduce((acc, damage) => acc + damage.value, 0);
  }

  /* -------------------------------------------------- */

  /**
   * Apply damage to the actor.
   * @param {DamageConfiguration[]} [damages=[]]
   * @returns {Promise<RyuutamaActor>}
   */
  async applyDamage(damages = []) {
    const total = this.calculateDamage(damages);

    const { value, spent } = this.resources.stamina;
    const damage = Math.min(value, total);

    const actor = this.parent;
    await actor.update({ "system.resources.stamina.spent": spent + damage });
    return actor;
  }
}
