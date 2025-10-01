import CreatureData from "./templates/creature.mjs";

const { ArrayField, HTMLField, NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

export default class MonsterData extends CreatureData {
  /** @override */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      attack: new SchemaField({
        accuracy: new ArrayField(new StringField(), { min: 2, max: 2, initial: ["dexterity", "strength"] }),
        damage: new StringField(),
      }),
      armor: new SchemaField({
        value: new NumberField(),
      }),
      biography: new SchemaField({
        value: new HTMLField(),
      }),
      details: new SchemaField({
        category: new StringField(),
        dragonica: new NumberField(),
        level: new NumberField(),
      }),
      environment: new SchemaField({
        habitat: new SetField(new StringField()),
        season: new StringField(),
      }),
      initiative: new SchemaField({
        value: new NumberField(),
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
}
