/**
 * @import { CheckRollConfig, CheckDialogConfig, CheckMessageConfig } from "../_types.mjs";
 * @import CheckRoll from "../../../dice/check-roll.mjs";
 */

const { NumberField, SchemaField } = foundry.data.fields;

export default class CreatureData extends foundry.abstract.TypeDataModel {
  /** @override */
  static defineSchema() {
    const makeAbility = () => {
      return new SchemaField({
        value: new NumberField({ step: 2, min: 4, max: 12, nullable: false, initial: 4 }),
      });
    };

    const makeResource = () => {
      return new SchemaField({
        bonuses: new SchemaField({
          flat: new NumberField({ integer: true, initial: null }),
          level: new NumberField({ integer: true, initial: null }),
        }),
        max: new NumberField({ integer: true, nullable: false, initial: 0, min: 0 }),
        spent: new NumberField({ integer: true, nullable: false, initial: 0, min: 0 }),
      });
    };

    return {
      abilities: new SchemaField({
        strength: makeAbility(),
        dexterity: makeAbility(),
        intelligence: makeAbility(),
        spirit: makeAbility(),
      }),
      condition: new SchemaField({
        value: new NumberField({ nullable: true, initial: null, integer: true }),
      }),
      resources: new SchemaField({
        mental: makeResource(),
        stamina: makeResource(),
      }),
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    this.#prepareAbilities();
    this.#prepareResources();
  }

  /* -------------------------------------------------- */

  /**
   * Prepare statuses and apply changes to abilities.
   */
  #prepareAbilities() {
    const con = this.condition.value;
    const statuses = this.condition.statuses = {};
    for (const status of this.parent.effects.documentsByType.status) {
      const id = status.statuses.first();
      const str = status.system.strength.value;
      if ((str < con) || (id in statuses)) continue;
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
      for (const abi of abilities) {
        this.abilities[abi].value = Math.max(4, this.abilities[abi].value - 2);
      }
      statuses[id] = status.system.strength.value;
    }
  }

  /* -------------------------------------------------- */

  /**
   * Prepare stamina and mental resources.
   */
  #prepareResources() {
    const { stamina: hp, mental: mp } = this.resources;
    const src = this._source.resources;

    hp.max = src.stamina.max + hp.bonuses.flat + (hp.gear ?? 0) + hp.bonuses.level * this.details.level;
    hp.spent = Math.min(hp.spent, hp.max);
    hp.value = hp.max - hp.spent;

    mp.max = src.mental.max + mp.bonuses.flat + (mp.gear ?? 0) + mp.bonuses.level * this.details.level;
    mp.spent = Math.min(mp.spent, mp.max);
    mp.value = mp.max - mp.spent;
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
      messageConfig.data.flavor ??= game.i18n.format("RYUUTAMA.ROLL.messageFlavor", {
        type: game.i18n.localize(`RYUUTAMA.ROLL.TYPES.${rollConfig.type}`),
        abilities: game.i18n.getListFormatter().format(rollConfig.abilities.map(abi => ryuutama.config.abilityScores[abi].label)),
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
        dialog.selectAbilities = false;
        break;

      case "condition":
        roll.abilities = ["strength", "spirit"];
        dialog.selectAbilities = false;
        roll.concentration.allowed = false;
        roll.condition = { updateScore: true, removeStatuses: true };
        roll.modifier = (this.cursePenalty ?? 0) * -1;
        break;

      case "damage": {
        let abi;
        let bon;
        switch (this.parent.type) {
          case "traveler": {
            const w = this.equipped.weapon;
            if (w) ({ ability: abi, bonus: bon } = w.system.damage);
            else {
              // Unarmed
              abi = "strength";
              bon = -2;
            }
            break;
          }
          case "monster": {
            bon = 0;
            abi = this.attack.damage;
            break;
          }
        }
        roll.abilities = [abi];
        roll.modifer = bon;
        dialog.selectAbilities = false;
        roll.concentration.allowed = false;
        roll.critical = { allowed: true };
        break;
      }

      case "accuracy": {
        let abilities;
        let bonus;
        switch (this.parent.type) {
          case "traveler": {
            const w = this.equipped.weapon;
            if (w) {
              abilities = [...w.system.accuracy.abilities];
              bonus = w.system.accuracy.bonus;
              roll.accuracy = { weapon: w, consumeStamina: !w.system.isMastered };
            } else {
              abilities = ["dexterity", "strength"]; // unarmed
              bonus = -2; // unarmed has -2, an improvised weapon has -1
            }
            break;
          }
          case "monster": {
            abilities = [...this.attack.accuracy];
            bonus = 0;
            break;
          }
        }

        roll.abilities = abilities;
        roll.modifier = bonus;
        dialog.selectAbilities = false;
        break;
      }

      case "initiative":
        roll.abilities = ["dexterity", "intelligence"];
        dialog.selectAbilities = false;
        roll.concentration.allowed = false;
        break;

      case "check":
        roll.abilities = ["strength", "strength"];
        dialog.selectAbilities = true;
        break;

      default:
        throw new Error(`Invalid check type '${rollConfig.type}' passed to rollConfig parameter.`);
    }

    return {
      rollConfig: foundry.utils.mergeObject(roll, rollConfig),
      dialogConfig: foundry.utils.mergeObject(dialog, dialogConfig),
      messageConfig: foundry.utils.mergeObject(message, messageConfig),
    };
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

    // Consume a fumble point and MP due to concentration.
    const c = rollConfig.concentration ?? {};
    const cAllowed = c.allowed !== false;
    if (cAllowed && c.consumeFumble) {
      const value = this.fumbles.value - 1;
      if (value < 0) {
        ui.notifications.warn("RYUUTAMA.ROLL.WARNING.fumblesUnavailable", { format: { name: this.parent.name } });
        return false;
      }
      update["system.fumbles.value"] = value;
    }

    if (cAllowed && c.consumeMental) {
      const value = this.resources.mental.value;
      if (!value) {
        ui.notifications.warn("RYUUTAMA.ROLL.WARNING.mentalUnavailable", { format: { name: this.parent.name } });
        return false;
      }
      const toSpend = Math.ceil(value / 2);
      update["system.resources.mental.spent"] = this.resources.mental.spent + toSpend;
    }

    // Update condition score.
    if (rollConfig.condition?.updateScore) {
      update["system.condition.value"] = roll.total;

      // Remove statuses.
      if (rollConfig.condition?.removeStatuses) {
        const score = this.parent.system.condition.value;
        for (const status of this.parent.effects.documentsByType.status) {
          const str = status.system.strength.value;
          if (str < score) effectIds.push(status.id);
        }
      }
    }

    // Consume HP due to unmastered weapon.
    if (rollConfig.accuracy?.consumeStamina) {
      const value = this.resources.stamina.value;
      if (!value) {
        ui.notifications.warn("RYUUTAMA.ROLL.WARNING.staminaUnavailable", { format: { name: this.parent.name } });
        return false;
      }
      update["system.resources.stamina.spent"] = this.resources.stamina.spent + 1;
    }

    // Deduct durability.
    if (roll.isFumble) {
      // iterate over rollConfig.items and deduct durability.
    }

    if (effectIds.length) await this.parent.deleteEmbeddedDocuments("ActiveEffect", effectIds);
    if (!foundry.utils.isEmpty(update)) await this.parent.update(update);
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
    let bonus = 0;

    const isTech = this.isTechnical;

    // Concentration: Do this first to easily determine Technical Type bonus.
    const c = rollConfig.concentration ?? {};
    if (c.consumeFumble) bonus++;
    if (c.consumeMental) bonus++;
    if (bonus && isTech) bonus++;

    // Situational bonus.
    if (rollConfig.situationalBonus) bonus += rollConfig.situationalBonus;

    const formula = [
      "1d@ability1",
      (rollConfig.abilities.length > 1) ? "1d@ability2" : null,
      rollConfig.modifier ? "@modifier" : null,
      bonus ? "@bonus" : null,
    ].filterJoin(" + ");
    const rollData = {
      bonus,
      modifier: rollConfig.modifier,
      ability1: this.abilities[rollConfig.abilities[0]].value,
      ability2: this.abilities[rollConfig.abilities[1]]?.value,
    };

    /** @type {CheckRoll} */
    const roll = new CONFIG.Dice.CheckRoll(formula, rollData);
    if (rollConfig.critical?.allowed && rollConfig.critical.isCritical) roll.alter(2, 0);
    return roll;
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
}
