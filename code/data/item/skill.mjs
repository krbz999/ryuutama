const { HTMLField, SchemaField, SetField, StringField } = foundry.data.fields;

export default class SkillData extends foundry.abstract.TypeDataModel {
  /** @override */
  static defineSchema() {
    return {
      abilities: new SetField(new StringField({ choices: () => ryuutama.config.abilityScores })),
      activation: new StringField({ required: true }),
      description: new SchemaField({
        value: new HTMLField(),
      }),
      target: new SchemaField({
        custom: new StringField({ required: true }),
      }),
    };
  }

  /* -------------------------------------------------- */

  /**
   *
   */
  async use() {
    const actor = this.parent.actor;
    if (!actor) {
      throw new Error("An unowned item cannot perform a Skill Check.");
    }

    const abilities = this.abilities.size === 1
      ? [this.abilities.first(), this.abilities.first()]
      : [...this.abilities].slice(0, 2);

    if (abilities.length !== 2) {
      throw new Error("This skill is not able to perform a Skill Check.");
    }
    return actor.rollSkill({ abilities });
  }
}
