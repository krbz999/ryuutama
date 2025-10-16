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
        exp: new NumberField({ integer: true, nullable: false, initial: 0, min: 0 }),
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
    };

    this.#prepareAdvancements();
  }

  /* -------------------------------------------------- */

  /**
   * Prepare advancements.
   */
  #prepareAdvancements() {
    for (const advancement of this.advancements) {
      advancement.prepareBaseData();
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    // Equipped items are prepared first to add a `gear` bonus to resources, which are prepared
    // in `super`, as well as to ignore shields (depending) prior to `capacity`.
    this.#prepareEquipped();

    super.prepareDerivedData();
    this.#prepareCapacity();

    // Prepare defense.
    this.defense.shieldDodge = this.parent.getFlag(ryuutama.id, "shieldDodge") ?? false;
    this.defense.dodge = this.equipped.shield?.system.armor.dodge ?? null;
    this.defense.total = Math.max(this.defense.armor + this.defense.gear, this.defense.shieldDodge ? this.defense.dodge : 0);

    for (const advancement of this.advancements) advancement.prepareDerivedData();
  }

  /* -------------------------------------------------- */

  /**
   * Prepare equipped items.
   */
  #prepareEquipped() {
    // Remove shield if using 2-handed weapon.
    if (this.equipped.weapon?.system.grip === 2) Object.defineProperty(this.equipped, "shield", { value: null });

    let bonus = 0;
    this.defense.gear = 0;
    for (const key of Object.keys(this._source.equipped)) {
      const item = this.equipped[key];

      // Orichalcum items grant +2 HP and MP.
      if (item?.system.modifiers.has("orichalcum")) bonus += 2;

      // Set defense value from gear.
      if (["armor", "shield"].includes(key) && item) this.defense.gear += item.system.armor.defense;
    }
    this.resources.stamina.gear = this.resources.mental.gear = bonus;

  }

  /* -------------------------------------------------- */

  /**
   * Prepare capacity.
   */
  #prepareCapacity() {
    const { capacity, abilities, details, equipped } = this;
    const techBonus = this.details.type.technical ?? 0;

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

    const advancementTypes = ryuutama.config.advancement[level + 1] ?? new Set();
    const advancementClasses = advancementTypes.map(type => ryuutama.data.advancement.Advancement.documentConfig[type]);
    const results = [];

    for (const advancementClass of advancementClasses) {
      const result = await advancementClass.configure(actor);
      if (!result) {
        actor._advancing = false;
        return null;
      }
      results.push(result);
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

    actor._advancing = false;
    return actor;
  }
}
