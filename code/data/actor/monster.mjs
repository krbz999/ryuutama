import CreatureData from "./templates/creature.mjs";

const { EmbeddedDataField, HTMLField, NumberField, SchemaField, StringField } = foundry.data.fields;

export default class MonsterData extends CreatureData {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      attack: new EmbeddedDataField(ryuutama.data.AttackModel),
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
    "RYUUTAMA.ACTOR.MONSTER",
  ];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    if ((await super._preCreate(data, options, user)) === false) return false;

    const update = foundry.utils.mergeObject({
      prototypeToken: {
        actorLink: false,
        disposition: CONST.TOKEN_DISPOSITIONS.HOSTILE,
        sight: {
          enabled: false,
        },
      },
    }, data, { insertKeys: false, insertValues: false, overwrite: true });
    this.parent.updateSource(update);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareBaseData() {
    // Apply status immunities prior to super call.
    const imm = ryuutama.config.monsterCategories[this.details.category]?.statusImmunities;
    if (imm) {
      Object.values(ryuutama.CONST.STATUS_EFFECTS).forEach(status => {
        const category = ryuutama.config.statusEffects[status].category;
        if (["all", category].includes(imm)) this.condition.immunities.add(status);
      });
    }

    super.prepareBaseData();
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    this.attack._prepareDefaults();
    this.#prepareDefense();
    this.#prepareResources();
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
    this.resources.stamina.min = -this.condition.value;
    this.resources.mental.min = 0;

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

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _constructCheckConfigs(roll, dialog, message) {
    super._constructCheckConfigs(roll, dialog, message);
    switch (roll.type) {
      case "accuracy":
        roll.abilities = [this.attack.accuracy.die1, this.attack.accuracy.die2];
        roll.modifier ??= 0;
        roll.modifier += this.attack.accuracy.bonus;
        break;
      case "condition":
        roll.condition.updateScore = false;
        break;
      case "damage":
        roll.abilities = [this.attack.damage.die];
        roll.modifier ??= 0;
        roll.modifier += this.attack.damage.bonus;
        break;
      case "initiative":
        roll.formula = "@initiative.value";
        dialog.configure ??= false;
        break;
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static migrateData(source, options, _state) {
    if (typeof source.attack?.accuracy === "string") {
      const { accuracy, damage } = source.attack;
      const data = ryuutama.data.AttackModel._migrateFormulasToModelData(accuracy, damage);
      source.attack = data;
    }
    return super.migrateData(source, options, _state);
  }
}
