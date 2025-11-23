import CreatureData from "./templates/creature.mjs";

const { HTMLField, NumberField, SchemaField, StringField } = foundry.data.fields;

export default class MonsterData extends CreatureData {
  /** @override */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      abilities: new SchemaField(Object.keys(ryuutama.config.abilityScores).reduce((acc, ability) => {
        acc[ability] = new SchemaField({ value: new ryuutama.data.fields.AbilityScoreField({ restricted: false }) });
        return acc;
      }, {})),
      attack: new SchemaField({
        accuracy: new ryuutama.data.fields.FormulaField(),
        damage: new ryuutama.data.fields.FormulaField(),
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

  /**
   * What is the default attack type of this monster?
   * The sum of its abilities determine whether it is best suited for using
   * STR + DEX or INT + SPI.
   * @type {"physical"|"mental"}
   */
  get _defaultAttackType() {
    const { abilities } = this._source;
    const phys = abilities.strength.value + abilities.dexterity.value;
    const ment = abilities.intelligence.value + abilities.spirit.value;
    return phys >= ment ? "physical" : "mental";
  }

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
  prepareBaseData() {
    // Apply status immunities prior to super call.
    const imm = ryuutama.config.monsterCategories[this.details.category]?.statusImmunities;
    if (imm) {
      for (const [statusId, { category }] of Object.entries(ryuutama.config.statusEffects)) {
        if (["all", category].includes(imm)) this.condition.immunities.add(statusId);
      }
    }

    super.prepareBaseData();
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    this.#prepareAttack();
    this.#prepareDefense();
    this.#prepareResources();
  }

  /* -------------------------------------------------- */

  /**
   * Prepare accuracy and damage.
   */
  #prepareAttack() {
    const isPhysical = this._defaultAttackType === "physical";
    const accuracy = isPhysical ? "@stats.strength + @stats.dexterity" : "@stats.intelligence + @stats.spirit";
    const damage = isPhysical ? "@stats.strength" : "@stats.spirit";

    if (!this.attack.accuracy) this.attack.accuracy = accuracy;
    if (!this.attack.damage) this.attack.damage = damage;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare defense.
   */
  #prepareDefense() {
    this.defense.total = this.defense.armor ?? 0;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare resources.
   */
  #prepareResources() {
    const setupResource = (key, allowNegative = false) => {
      const resource = this.resources[key];
      const src = this._source.resources[key];

      resource.max = src.max
        + resource.bonuses.flat
        + resource.bonuses.level * this.details.level;
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

    setupResource("stamina", true);
    setupResource("mental");
  }
}
