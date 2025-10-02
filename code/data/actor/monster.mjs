import CreatureData from "./templates/creature.mjs";

const { HTMLField, NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

export default class MonsterData extends CreatureData {
  /** @override */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      attack: new SchemaField({
        accuracy: new StringField({ required: true, initial: "" }),
        damage: new StringField({ required: true, initial: "" }),
      }),
      armor: new SchemaField({
        value: new NumberField({ required: true, min: 0, initial: 0, integer: true, nullable: false }),
      }),
      description: new SchemaField({
        value: new HTMLField(),
      }),
      details: new SchemaField({
        category: new StringField({
          required: true, blank: true, initial: "",
          choices: () => ryuutama.config.monsterCategories,
        }),
        dragonica: new NumberField({ required: true, min: 0, initial: null, integer: true, nullable: true }),
        level: new NumberField({ required: true, min: 0, initial: 0, integer: true, nullable: false }),
      }),
      environment: new SchemaField({
        habitat: new SetField(new StringField()),
        season: new StringField(),
      }),
      initiative: new SchemaField({
        value: new NumberField({ required: true, min: 0, initial: 0, integer: true, nullable: false }),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.MONSTER",
  ];

  /* -------------------------------------------------- */

  /** @override */
  static MINIMUM_ABILITY = 2;

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    if ((await super._preCreate(data, options, user)) === false) return false;

    const update = {};
    if (!foundry.utils.hasProperty(data, "prototypeToken.actorLink"))
      foundry.utils.setProperty(update, "prototypeToken.actorLink", false);

    if (!foundry.utils.hasProperty(data, "prototypeToken.sight.enabled"))
      foundry.utils.setProperty(update, "prototypeToken.sight.enabled", false);

    if (!foundry.utils.hasProperty(data, "prototypeToken.disposition"))
      foundry.utils.setProperty(update, "prototypeToken.disposition", CONST.TOKEN_DISPOSITIONS.HOSTILE);

    if (!foundry.utils.isEmpty(update)) this.parent.updateSource(update);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    this.attack.accuracy ||= "@dex + @str";
    this.attack.damage ||= "@str";
  }
}
