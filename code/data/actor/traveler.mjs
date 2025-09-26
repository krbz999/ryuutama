import LocalDocumentField from "../fields/local-document-field.mjs";

const { ColorField, HTMLField, NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

export default class TravelerData extends foundry.abstract.TypeDataModel {
  /** @override */
  static defineSchema() {
    const makeAbility = () => {
      return new SchemaField({
        value: new NumberField({ step: 2, min: 4, max: 8, nullable: false, initial: 4 }),
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

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    if ((await super._preCreate(data, options, user)) === false) return false;

    const update = {};
    if (!foundry.utils.hasProperty(data, "prototypeToken.actorLink"))
      foundry.utils.setProperty(update, "prototypeToken.actorLink", true);

    if (!foundry.utils.hasProperty(data, "prototypeToken.sight.enabled"))
      foundry.utils.setProperty(update, "prototypeToken.sight.enabled", true);

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
  }

  /* -------------------------------------------------- */

  async rollSkill(abilities) {
    const formula = `1d@abilities.${abilities[0]}.value + 1d@abilities.${abilities[1]}.value`;
    const rollData = this.parent.getRollData();
    const roll = foundry.dice.Roll.create(formula, rollData, { type: "skill" });
    await roll.toMessage({ flavor: "" });
    return roll;
  }
}
