import Advancement from "../advancement/advancement.mjs";
import LocalDocumentField from "../fields/local-document-field.mjs";
import CreatureData from "./templates/creature.mjs";

/**
 * @import RyuutamaActor from "../../documents/actor.mjs";
 */

const { ColorField, HTMLField, NumberField, SchemaField } = foundry.data.fields;

export default class TravelerData extends CreatureData {
  /** @override */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      abilities: new SchemaField(Object.keys(ryuutama.config.abilityScores).reduce((acc, ability) => {
        acc[ability] = new SchemaField({ value: new ryuutama.data.fields.AbilityScoreField({ restricted: true }) });
        return acc;
      }, {})),
      advancements: new ryuutama.data.fields.PseudoDocumentCollectionField(Advancement),
      background: new SchemaField({
        appearance: new HTMLField(),
        hometown: new HTMLField(),
        notes: new HTMLField(),
      }),
      details: new SchemaField({
        color: new ColorField(),
        exp: new SchemaField({
          value: new NumberField({ integer: true, nullable: false, initial: 0, min: 0 }),
        }),
        level: new NumberField({ nullable: false, integer: true, initial: 0, min: 0, max: 10 }),
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
      fumbles: new SchemaField({
        value: new NumberField({ nullable: true, min: 0, integer: true, initial: null }),
      }),
      gold: new SchemaField({
        value: new NumberField({ integer: true, nullable: false, initial: 0, min: 0 }),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.TRAVELER",
    "RYUUTAMA.ACTOR.TRAVELER",
  ];

  /* -------------------------------------------------- */

  /**
   * Can the character equip and make use of a shield?
   * @type {boolean}
   */
  get canEquipShield() {
    const weapon = this.equipped.weapon;
    if (!weapon) return true;
    return weapon.system.grip !== 2;
  }

  /* -------------------------------------------------- */

  /**
   * The number of cursed equipment the character has equipped.
   * @type {number}
   */
  get cursePenalty() {
    let penalty = 0;
    for (const key of Object.keys(this._source.equipped)) {
      if (this.equipped[key]?.system.modifiers.has("cursed")) penalty++;
    }
    return penalty;
  }

  /* -------------------------------------------------- */

  /** @override */
  get defenseValue() {
    const combatant = game.combat?.combatants.find(c => c.actor === this.parent);
    if (!combatant || (combatant.initiative === null)) return null;
    return Math.max(combatant.initiative, this.defense.dodge);
  }

  /* -------------------------------------------------- */

  /**
   * How many incantation spells can the actor learn?
   * @type {number}
   */
  get incantationSpells() {
    let max = 0;
    for (const advancement of this.advancements.documentsByType.type) {
      const chosen = advancement.choice.chosen;
      if (chosen !== "magic") continue;
      const levels = Math.max(0, this.details.level - advancement.level + 1);
      max = max + 2 * levels;
    }
    return max;
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
    this.capacity = { bonus: 0 };
    this.classes = Object.fromEntries(this.parent.items.documentsByType.class.map(cls => [cls.identifier, cls]));
    this.details.type = Object.fromEntries(Object.keys(ryuutama.config.travelerTypes).map(k => [k, 0]));
    this.magic = { seasons: new Set() };
    this.mastered = {
      weapons: Object.fromEntries(Object.keys(ryuutama.config.weaponTypes).map(k => [k, 0])),
      terrain: new Set(), weather: new Set(),
    };

    // Specific implementation of unarmed.
    this.mastered.weapons.unarmed = 0;

    // Status immunities are prepared prior to statuses in CreatureData.
    for (const si of this.advancements) {
      if (si.isConfigured && (si.type === "statusImmunity")) this.#prepareStatusImmunityAdvancement(si);
    }

    super.prepareBaseData();

    // Types, Habitat, Status Immunities, and Mastered Weapons.
    for (const advancement of this.advancements) {
      if (!advancement.isConfigured) continue;
      switch (advancement.type) {
        case "type": this.#prepareTypeAdvancement(advancement); break;
        case "habitat": this.#prepareHabitatAdvancement(advancement); break;
        case "weapon": this.#prepareWeaponAdvancement(advancement); break;
      }
    }
  }

  /* -------------------------------------------------- */

  /**
   * Prepare the benefits of a Type advancement.
   * @param {Advancement} advancement
   */
  #prepareTypeAdvancement(advancement) {
    this.details.type[advancement.choice.chosen]++;

    if (advancement.choice.chosen === "magic") {
      this.magic.seasons.add(advancement.choice.magic);
    }
  }

  /* -------------------------------------------------- */

  /**
   * Prepare the benefits of a Habitat advancement.
   * @param {Advancement} advancement
   */
  #prepareHabitatAdvancement(advancement) {
    const type = advancement.choice.type;
    this.mastered[type].add(advancement.choice.chosen[type]);
  }

  /* -------------------------------------------------- */

  /**
   * Prepare the benefits of a Status Immunity advancement.
   * @param {Advancement} advancement
   */
  #prepareStatusImmunityAdvancement(advancement) {
    this.condition.immunities.add(advancement.choice.chosen);
  }

  /* -------------------------------------------------- */

  /**
   * Prepare the benefits of a Weapon advancement.
   * @param {Advancement} advancement
   */
  #prepareWeaponAdvancement(advancement) {
    this.mastered.weapons[advancement.choice.chosen] = 1;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    // Equipped items are prepared first to ignore shields (depending) prior to `capacity`, `resources`, and `defense`.
    this.#prepareEquipped();
    this.#prepareDefense();
    this.#prepareResources();
    this.#prepareCapacity();
    this.#prepareExp();

    for (const advancement of this.advancements) advancement.prepareDerivedData();
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _prepareAbilities() {
    super._prepareAbilities();

    if (this.condition.value >= 10) {
      const ability = this.condition.shape.high;
      if (ability in this.abilities) this.schema.getField(`abilities.${ability}.value`).increase(this.parent, 1);
    }
  }

  /* -------------------------------------------------- */

  /**
   * Prepare equipped items.
   */
  #prepareEquipped() {
    // Remove shield if using 2-handed weapon.
    if (!this.canEquipShield) Object.defineProperty(this.equipped, "shield", { value: null });
  }

  /* -------------------------------------------------- */

  /**
   * Prepare defense.
   */
  #prepareDefense() {
    const { armor, shield } = this.equipped;
    this.defense.gear =
      (armor?.system.isUsable ? armor.system.armor.defense : 0)
      + (shield?.system.isUsable ? shield.system.armor.defense : 0);

    this.defense.dodge = shield?.system.isUsable ? shield.system.armor.dodge : 0;
    this.defense.total = this.defense.armor + this.defense.gear;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare resources.
   */
  #prepareResources() {
    const { stamina: hp, mental: mp } = this.resources;
    const orichalcum = Object.keys(this._source.equipped)
      .map(key => this.equipped[key])
      .filter(item => item?.system.modifiers.has("orichalcum") && item.system.isUsable)
      .length;
    hp.gear = mp.gear = orichalcum * 2;

    const setupResource = (key, typeBonus, allowNegative = false) => {
      const resource = this.resources[key];
      const src = this._source.resources[key];

      resource.typeBonus = typeBonus;
      resource.advancement = this.advancements.documentsByType.resource
        .reduce((acc, advancement) => acc + advancement.choice.chosen[key], 0);

      resource.max = src.max
        + resource.bonuses.flat
        + resource.gear
        + resource.bonuses.level * this.details.level
        + resource.typeBonus
        + resource.advancement;
      resource.spent = allowNegative ? resource.spent : Math.min(resource.spent, resource.max);
      resource.value = resource.max - resource.spent;

      if (allowNegative && (resource.value < 0)) {
        resource.pct = Math.clamp(Math.round(Math.abs(resource.value) / this.condition.value * 100), 0, 100) || 0;
        resource.negative = true;
      } else {
        resource.pct = Math.clamp(Math.round(resource.value / resource.max * 100), 0, 100) || 0;
        resource.negative = false;
      }
    };

    setupResource("stamina", 4 * this.details.type.attack, true);
    setupResource("mental", 4 * this.details.type.magic);
  }

  /* -------------------------------------------------- */

  /**
   * Prepare capacity.
   */
  #prepareCapacity() {
    const { capacity, abilities, details, equipped } = this;
    const techBonus = this.details.type.technical;

    capacity.value = 0;
    capacity.container = 0;
    this.parent.items.forEach(item => {
      if (equipped[item.type] === item) return;
      const size = item.system.weight ?? 0;
      capacity.value += size;

      if (["animal", "container"].includes(item.type)) {
        capacity.container += item.system.capacity.max;
      }
    });

    capacity.max =
      abilities.strength.faces
      + 3
      + capacity.bonus
      + (details.level - 1)
      + techBonus * 3
      + capacity.container;

    capacity.penalty = Math.max(0, capacity.value - capacity.max);
    capacity.pct = Math.clamp(Math.round(capacity.value / capacity.max * 100), 0, 100);
  }

  /* -------------------------------------------------- */

  /**
   * Prepare EXP.
   */
  #prepareExp() {
    const { exp, level } = this.details;

    const prev = ryuutama.config.experienceLevels[level - 1] ?? 0;
    const next = ryuutama.config.experienceLevels[level] ?? ryuutama.config.experienceLevels.at(-1);

    exp.max = next;
    exp.value = Math.min(this._source.details.exp.value, ryuutama.config.experienceLevels.at(-1));
    // if (exp.value < prev) exp.pct = Math.clamp(Math.round(exp.value / next * 100), 0, 100);
    exp.pct = Math.clamp(Math.round((exp.value - prev) / (next - prev) * 100), 0, 100);
    if (isNaN(exp.pct) || !ryuutama.config.experienceLevels[level]) exp.pct = 100;
  }

  /* -------------------------------------------------- */
  /*   Advancement                                      */
  /* -------------------------------------------------- */

  /**
   * Advance to the next level.
   * @returns {Promise<RyuutamaActor|null>}   A promie that resolves to the advanced actor.
   */
  async advance() {
    const level = this.details.level;
    if (level >= 10) {
      throw new Error("You cannot advance beyond 10th level.");
    }

    const actor = this.parent;
    if (actor._advancing) {
      throw new Error("Actor is already in the process of advancing!");
    }
    actor._advancing = true;

    const results = await ryuutama.applications.apps.AdvancementDialog.create(actor, { level: level + 1 });
    if (!results) {
      delete actor._advancing;
      return null;
    }

    const actorUpdate = {};
    const itemData = [];
    const itemUpdates = [];
    for (const { result, type } of results) {
      switch (type) {
        case "advancement":
          await ryuutama.data.advancement.Advancement.create(result.toObject(), { parent: actor, advancement: true });
          break;
        case "actor":
          foundry.utils.mergeObject(actorUpdate, result);
          break;
        case "items":
          itemData.push(...result);
          break;
        case "itemUpdates":
          itemUpdates.push(...result);
          break;
      }
    }

    foundry.utils.setProperty(actorUpdate, "system.details.level", level + 1);
    await actor.update(actorUpdate, { advancement: true });
    await actor.createEmbeddedDocuments("Item", itemData, { keepId: true, advancement: true });
    await actor.updateEmbeddedDocuments("Item", itemUpdates, { advancement: true });

    delete actor._advancing;
    return actor;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _prepareCheckModifiers(rollConfig = {}, dialogConfig = {}, messageConfig = {}) {
    const { parts, rollData } = super._prepareCheckModifiers(rollConfig, dialogConfig, messageConfig);

    // Penalties from capacity apply to all checks.
    if (this.capacity.penalty) {
      parts.push("@capacityPenalty");
      rollData.capacityPenalty = -this.capacity.penalty;
    }

    // Penalties from cursed items apply to condition checks.
    if ((rollConfig.type === "condition") && this.cursePenalty) {
      parts.push("@cursePenalty");
      rollData.cursePenalty = -this.cursePenalty;
    }

    // Technical types gain a +1 bonus to initiative.
    if ((rollConfig.type === "initiative") && this.details.type.technical) {
      parts.push("@details.type.technical");
    }

    // Heavier armors and shields add penalties to initiative and travel checks.
    if ((rollConfig.type === "initiative") || ((rollConfig.type === "journey") && (rollConfig.journeyId === "travel"))) {
      const armorPenalty = this.equipped.armor?.system.armor.penalty;
      const shieldPenalty = this.equipped.shield?.system.armor.penalty;

      if (armorPenalty) {
        parts.push("@armorPenalty");
        rollData.armorPenalty = -armorPenalty;
      }

      if (shieldPenalty) {
        parts.push("@shieldPenalty");
        rollData.shieldPenalty = -shieldPenalty;
      }
    }

    // If consuming a fumble point or MP, add +1 for each, plus an additional +1 if Technical type.
    let concentrationBonus = 0;
    if (rollConfig.concentration?.consumeFumble) concentrationBonus++;
    if (rollConfig.concentration?.consumeMental) concentrationBonus++;
    if (concentrationBonus && this.details.type.technical) concentrationBonus++;
    if (concentrationBonus && !["condition", "initiative", "damage"].includes(rollConfig.type)) {
      parts.push("@concentrationBonus");
      rollData.concentrationBonus = concentrationBonus;
    }

    const weapon = this.equipped.weapon;
    const isUsable = weapon?.system.isUsable;
    const unarmed = ryuutama.config.weaponUnarmedTypes.unarmed;
    let weaponBonus = 0;
    if (rollConfig.type === "accuracy") {
      if (isUsable) {
        weaponBonus = weapon.system.accuracy.bonus;

        // Mastering the same weapon twice (only possible via a class) grants a +1 to Accuracy checks with that weapon.
        if (weapon.system.isMastered && (this.mastered.weapons[weapon.system.category.value] > 1)) weaponBonus++;
      } else {
        // Fall back to 'Unarmed'.
        weaponBonus = unarmed.accuracy.bonus;
        // TODO: Grant +1 if Unarmed is mastered twice?
      }

      if (weaponBonus) {
        parts.push("@weaponBonus");
        rollData.weaponBonus = weaponBonus;
      }
    }

    if (rollConfig.type === "damage") {
      if (isUsable) {
        weaponBonus = weapon.system.damage.bonus;
      } else {
        // TODO: if using an improvised weapon, this should be -1 instead of -2.
        weaponBonus = unarmed.damage.bonus;
      }

      if (weaponBonus) {
        parts.push("@weaponBonus");
        rollData.weaponBonus = weaponBonus;
      }

      // Attack type adds +1 to damage rolls during combat.
      if (this.details.type.attack) parts.push("@details.type.attack");
    }

    return { parts, rollData };
  }
}
