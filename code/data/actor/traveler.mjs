import LocalDocumentField from "../fields/local-document-field.mjs";

/**
 * @import { CheckRollConfig, CheckDialogConfig, CheckMessageConfig } from "./_types.mjs";
 * @import CheckRoll from "../../dice/check-roll.mjs";
 */

const { ColorField, HTMLField, NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

export default class TravelerData extends foundry.abstract.TypeDataModel {
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
          flat: new NumberField({ integer: true }),
          level: new NumberField({ integer: true }),
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
      bonuses: new SchemaField({
        accuracy: new NumberField({ integer: true }),
        damage: new NumberField({ integer: true }),
        initiative: new NumberField({ integer: true }),
      }),
      condition: new SchemaField({
        value: new NumberField({ nullable: true, initial: null, integer: true }),
      }),
      details: new SchemaField({
        age: new NumberField({ integer: true, nullable: false, initial: 20, min: 1 }),
        background: new HTMLField(),
        color: new SchemaField({
          value: new ColorField(),
        }),
        gender: new SchemaField({
          value: new StringField({ required: true, blank: true, choices: () => ryuutama.config.genders }),
          custom: new StringField({ required: true, blank: true }),
        }),
        level: new NumberField({ nullable: false, integer: true, initial: 1, max: 10 }),
      }),
      equipped: new SchemaField({
        weapon: new LocalDocumentField(foundry.documents.Item, { subtype: "weapon" }),
        armor: new LocalDocumentField(foundry.documents.Item, { subtype: "armor" }),
        shield: new LocalDocumentField(foundry.documents.Item, { subtype: "shield" }),
        shoes: new LocalDocumentField(foundry.documents.Item, { subtype: "shoes" }),
        cape: new LocalDocumentField(foundry.documents.Item, { subtype: "cape" }),
        staff: new LocalDocumentField(foundry.documents.Item, { subtype: "staff" }),
        hat: new LocalDocumentField(foundry.documents.Item, { subtype: "hat" }),
        accessory: new LocalDocumentField(foundry.documents.Item, { subtype: "accessory" }),
      }),
      exp: new SchemaField({
        value: new NumberField({ integer: true, nullable: false, initial: 0, min: 0 }),
      }),
      fumbles: new SchemaField({
        value: new NumberField({ nullable: false, min: 0, integer: true, initial: 0 }),
      }),
      gold: new SchemaField({
        value: new NumberField({ integer: true, nullable: false, initial: 0, min: 0 }),
      }),
      mastered: new SchemaField({
        weapons: new SetField(new StringField({ choices: () => ryuutama.config.weaponCategories })),
      }),
      resources: new SchemaField({
        mental: makeResource(),
        stamina: makeResource(),
      }),
      type: new SchemaField({
        value: new StringField({ choices: () => ryuutama.config.travelerTypes, blank: true, required: true }),
        additional: new StringField({ choices: () => ryuutama.config.travelerTypes, blank: true, required: true }),
      }),
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.TRAVELER",
  ];

  /* -------------------------------------------------- */

  /**
   * Is this character Technical and receives an additional +1 bonus when concentrating?
   * @type {boolean}
   */
  get isTechnical() {
    if (this.type.value === "technical") return true;
    if ((this.details.level >= 6) && (this.type.additional === "technical")) return true;
    return false;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    if ((await super._preCreate(data, options, user)) === false) return false;

    const update = {};
    if (!foundry.utils.hasProperty(data, "prototypeToken.actorLink"))
      foundry.utils.setProperty(update, "prototypeToken.actorLink", true);

    if (!foundry.utils.hasProperty(data, "prototypeToken.sight.enabled"))
      foundry.utils.setProperty(update, "prototypeToken.sight.enabled", true);

    if (!foundry.utils.hasProperty(data, "prototypeToken.disposition"))
      foundry.utils.setProperty(update, "prototypeToken.disposition", CONST.TOKEN_DISPOSITIONS.FRIENDLY);

    if (!foundry.utils.isEmpty(update)) this.parent.updateSource(update);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareBaseData() {
    super.prepareBaseData();

    this.capacity = { bonus: 0 };
    this.mastered.max = 1;
    this.habitats = { weather: new Set(), terrain: new Set() };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    if (this.mastered.weapons.size > this.mastered.max)
      this.mastered.weapons = new Set(Array.from(this.mastered.weapons).slice(0, this.mastered.max));

    const { stamina: hp, mental: mp } = this.resources;

    hp.spent = Math.min(hp.spent, hp.max);
    hp.value = hp.max - hp.spent;
    mp.spent = Math.min(mp.spent, mp.max);
    mp.value = mp.max - mp.spent;

    this.capacity.max = this.abilities.strength.value + 3 + this.capacity.bonus;
    this.capacity.penalty = Math.max(0, this.capacity.value - this.capacity.max);

    const gender = this.details.gender;
    gender.label = gender.custom ? gender.custom : ryuutama.config.genders[gender.value]?.label ?? "";

    if (this.equipped.weapon?.system.grip === 2) Object.defineProperty(this.equipped, "shield", { value: null });

    // Apply changes from status effects.
    const con = this.condition.value;
    this.condition.statuses = {};
    for (const status of this.parent.effects.documentsByType.status) {
      const id = status.statuses.first();
      const str = status.system.strength.value;
      if ((str < con) || (id in this.condition.statuses)) continue;
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
      this.condition.statuses[id] = status.system.strength.value;
    }
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

    if (rollConfig.condition?.removeStatuses) {
      const score = this.parent.system.condition.value;
      const deleteIds = [];
      for (const status of this.parent.effects.documentsByType.status) {
        const str = status.system.strength.value;
        if (str < score) deleteIds.push(status.id);
      }
      await this.parent.deleteEmbeddedDocuments("ActiveEffect", deleteIds);
    }

    if (messageConfig.create !== false) {
      const speaker = foundry.documents.ChatMessage.implementation.getSpeaker({ actor: this.parent });
      roll.toMessage({ speaker });
    }

    if (roll.isFumble) {
      // TODO: items lose durability
    }

    return roll;
  }

  /* -------------------------------------------------- */

  /**
   * Construct the configuration objects for a check.
   * @param {CheckRollConfig} [rollConfig={}]
   * @param {CheckDialogConfig} [dialogConfig={}]
   * @param {CheckMessageConfig} [messageConfig={}]
   * @returns {{ rollConfig: CheckRollConfig, dialogConfig: CheckDialogConfig, messageConfig: CheckMessageConfig }}
   */
  #constructCheckConfigs(rollConfig = {}, dialogConfig = {}, messageConfig = {}) {
    ({ rollConfig, dialogConfig, messageConfig } = foundry.utils.deepClone({ rollConfig, dialogConfig, messageConfig }));

    let roll = {};
    let dialog = { configure: true };
    let message = { create: true };

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
        roll.concentration = false;
        roll.condition = { updateScore: true, removeStatuses: true };
        break;

      case "damage": {
        const w = this.equipped.weapon;
        let abi;
        let bon;
        if (w) ({ ability: abi, bonus: bon } = weapon.system.damage);
        else ({ ability: abi, bonus: bon } = ryuutama.config.weaponCategories.unarmed.damage);
        roll.abilities = [abi];
        roll.modifer = bon;
        dialog.selectAbilities = false;
        roll.concentration = false;
        roll.critical = { allowed: true };
        break;
      }

      case "accuracy": {
        let abilities;
        let bonus;
        const w = this.equipped.weapon;
        if (w) {
          abilities = w.system.accuracy.abilities;
          bonus = w.system.accuracy.bonus;
        } else {
          const acc = ryuutama.config.weaponCategories.unarmed.accuracy;
          abilities = acc.abilities;
          bonus = acc.bonus;
        }

        roll.abilities = [...abilities];
        roll.modifier = bonus;
        dialog.selectAbilities = false;
        break;
      }

      case "initiative":
        roll.abilities = ["dexterity", "intelligence"];
        dialog.selectAbilities = false;
        roll.concentration = false;
        break;

      case "skill":
        if (!(rollConfig.skillId in ryuutama.config.skillCheckTypes)) {
          throw new Error(`Invalid skillId '${rollConfig.skillId}' for a skill check.`);
        }
        roll.abilities = [...ryuutama.config.skillCheckTypes[rollConfig.skillId].abilities];
        dialog.selectAbilities = true;
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

    // Consume a fumble point and MP due to concentration.
    const c = rollConfig.concentration ?? {};
    if (c.consumeFumble) {
      const value = this.fumbles.value - 1;
      if (value < 0) {
        ui.notifications.warn("RYUUTAMA.ROLL.WARNING.fumblesUnavailable", { format: { name: this.parent.name } });
        return false;
      }
      update["system.fumbles.value"] = value;
    }

    if (c.consumeMental) {
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
    }

    await this.parent.update(update);
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

    // Concentration
    const c = rollConfig.concentration ?? {};
    if (c.consumeFumble) bonus++;
    if (c.consumeMental) bonus++;
    if (this.isTechnical && (c.consumeFumble || c.consumeMental)) bonus++;

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
