const { NumberField, SchemaField, StringField } = foundry.data.fields;

export default class AttackModel extends foundry.abstract.DataModel {
  /** @inheritdoc */
  static defineSchema() {
    const choices = () => {
      const options = {};
      const { groupA, groupF } = {
        groupA: _loc("RYUUTAMA.ACTOR.MONSTER.ATTACK.groupAbility"),
        groupF: _loc("RYUUTAMA.ACTOR.MONSTER.ATTACK.groupFaces"),
      };

      Object.values(ryuutama.CONST.ABILITIES).forEach(ability => {
        options[ability] = {
          label: ryuutama.config.abilityScores[ability].label,
          group: groupA,
        };
      });
      [2, 4, 6, 8, 10, 12, 20].forEach(faces => {
        options[faces] = {
          label: `d${faces}`,
          group: groupF,
        };
      });
      return options;
    };

    return {
      accuracy: new SchemaField({
        die1: new StringField({
          choices,
          required: true,
          initial: null,
          nullable: true,
        }),
        die2: new StringField({
          choices,
          required: true,
          initial: null,
          nullable: true,
        }),
        bonus: new NumberField({ nullable: true, initial: null }),
      }),
      damage: new SchemaField({
        die: new StringField({
          choices,
          required: true,
          initial: null,
          nullable: true,
        }),
        bonus: new NumberField({ nullable: true, initial: null }),
      }),
    };
  }

  /* -------------------------------------------------- */

  /**
   * What is the default attack type of this monster?
   * The sum of its abilities determine whether it is best suited for using
   * STR + DEX or INT + SPI.
   * @type {"physical"|"mental"}
   */
  get _defaultAttackType() {
    const { abilities } = this.parent._source;
    const physical = abilities.strength.value + abilities.dexterity.value;
    const mental = abilities.intelligence.value + abilities.spirit.value;
    return physical >= mental ? "physical" : "mental";
  }

  /* -------------------------------------------------- */

  /**
   * Set defaults for dice used unless overridden.
   */
  _prepareDefaults() {
    const type = this._defaultAttackType;
    this.accuracy.die1 ??= (type === "physical") ? "strength" : "intelligence";
    this.accuracy.die2 ??= (type === "physical") ? "dexterity" : "spirit";
    this.damage.die ??= (type === "physical") ? "strength" : "spirit";
  }

  /* -------------------------------------------------- */
  /*   Deprecations & Migrations                        */
  /* -------------------------------------------------- */

  /**
   * Migrate a accuracy and damage formulas to new model data.
   * @param {string} [accuracy]
   * @param {string} [damage]
   * @returns {object}
   */
  static _migrateFormulasToModelData(accuracy, damage) {
    const data = {
      accuracy: {
        die1: null,
        die2: null,
        bonus: null,
      },
      damage: {
        die: null,
        bonus: null,
      },
    };

    if (accuracy) {
      try {
        const roll = new Roll(accuracy);
        const abilities = [...accuracy.matchAll(/@stats\.(strength|dexterity|intelligence|spirit)/g) ?? []];

        let d1;
        let d2;

        if (abilities[0]?.[1]) d1 = abilities[0][1];
        if (abilities[1]?.[1]) d2 = abilities[1][1];
        d1 ??= roll.dice[0]?.faces ?? null;
        d2 ??= roll.dice[1]?.faces ?? null;

        data.accuracy.die1 = d1;
        data.accuracy.die2 = d2;
        const bonus = roll.terms.find(term => (term instanceof foundry.dice.terms.NumericTerm) && term.number);
        if (bonus) data.accuracy.bonus = bonus.number || null;
      } catch (err) {
        console.warn(`Failed to migrate monster 'Accuracy' data: ${accuracy}`);
      }
    }

    if (damage) {
      try {
        const roll = new Roll(damage);
        const ability = damage.match(/@stats\.(strength|dexterity|intelligence|spirit)/)?.[1];
        data.damage.die = ability ? ability : roll.dice[0]?.faces ?? null;
        const bonus = roll.terms.find(term => (term instanceof foundry.dice.terms.NumericTerm) && term.number);
        if (bonus) data.damage.bonus = bonus.number || null;
      } catch (err) {
        console.warn(`Failed to migrate monster 'Damage' data: ${damage}`);
      }
    }

    return data;
  }
}
