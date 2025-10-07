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
        value: new NumberField({ min: 0, initial: null, integer: true, nullable: true }),
      }),
      description: new SchemaField({
        value: new HTMLField(),
        special: new SchemaField({
          value: new HTMLField(),
          name: new StringField({ required: true }),
        }),
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
        season: new StringField({ required: true, blank: true, initial: "", choices: () => ryuutama.config.seasons }),
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

    this.attack.accuracy ||= "@stats.strength + @stats.dexterity";
    this.attack.damage ||= "@stats.strength";

    const habitat = this.environment.habitat;
    const habitats = habitat.map(h => ryuutama.config.monsterTerrains[h]?.label).filter(_ => _);
    if (habitat.has("ALL")) this.environment.habitatLabel = game.i18n.localize("RYUUTAMA.MONSTER.allHabitats");
    else if (!habitats.size) this.environment.habitatLabel = game.i18n.localize("RYUUTAMA.MONSTER.noHabitats");
    else this.environment.habitatLabel = game.i18n.getListFormatter().format(habitats);
  }
}
