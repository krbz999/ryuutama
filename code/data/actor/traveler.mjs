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
    this.details.type = Object.fromEntries(Object.keys(ryuutama.config.travelerTypes).map(k => [k, 0]));
    this.mastered = {
      weapons: Object.fromEntries(Object.keys(ryuutama.config.weaponCategories).map(k => [k, 0])),
      terrain: new Set(), weather: new Set(),
    };

    // Types, Status Immunities, and Mastered Weapons.
    const { habitat, weapon, statusImmunity, type } = this.advancements.documentsByType;
    for (const a of weapon) a.prepareBaseData();
    for (const a of statusImmunity) a.prepareBaseData();
    for (const a of type) a.prepareBaseData();
    for (const a of habitat) a.prepareBaseData();
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
      if (ability in this.abilities) this.abilities[ability].increases++;
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
    this.defense.gear = (armor?.system.armor.defense ?? 0) + (shield?.system.armor.defense ?? 0);

    this.defense.shieldDodge = this.parent.getFlag(ryuutama.id, "shieldDodge") ?? false;
    this.defense.dodge = shield?.system.armor.dodge ?? null;
    this.defense.total = Math.max(this.defense.armor + this.defense.gear, this.defense.shieldDodge ? this.defense.dodge : 0);
  }

  /* -------------------------------------------------- */

  /**
   * Prepare resources.
   */
  #prepareResources() {
    const { stamina: hp, mental: mp } = this.resources;
    const orichalcum = Object.keys(this._source.equipped)
      .map(key => this.equipped[key])
      .filter(item => item?.system.modifiers.has("orichalcum"))
      .length;
    hp.gear = mp.gear = orichalcum * 2;

    const setupResource = (key, typeBonus) => {
      const resource = this.resources[key];
      const src = this._source.resources[key];

      resource.max = src.max
        + resource.bonuses.flat
        + resource.gear
        + resource.bonuses.level * this.details.level
        + typeBonus;
      resource.spent = Math.min(resource.spent, resource.max);
      resource.value = resource.max - resource.spent;
      resource.pct = Math.clamp(Math.round(resource.value / resource.max * 100), 0, 100) || 0;
    };

    setupResource("stamina", 4 * this.details.type.attack);
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

      if (item.type === "container") {
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
    for (const { result, type } of results) {
      switch (type) {
        case "advancement":
          await ryuutama.data.advancement.Advancement.create(result.toObject(), { parent: actor });
          break;
        case "actor":
          foundry.utils.mergeObject(actorUpdate, result);
          break;
        case "items":
          for (const item of result) {
            const keepId = !actor.items.has(item.id);
            itemData.push(game.items.fromCompendium(item, { keepId }));
          }
          break;
      }
    }

    foundry.utils.setProperty(actorUpdate, "system.details.level", level + 1);
    await actor.update(actorUpdate);
    await actor.createEmbeddedDocuments("Item", itemData, { keepId: true });

    delete actor._advancing;
    return actor;
  }
}
