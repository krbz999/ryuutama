import DocumentConfig from "../api/document-config.mjs";

export default class AttackConfig extends DocumentConfig {
  /** @inheritdoc */
  static PARTS = {
    form: {
      template: "systems/ryuutama/templates/apps/attack-config/form.hbs",
      classes: ["standard-form"],
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get title() {
    return _loc("RYUUTAMA.ACTOR.MONSTER.ATTACK.title", { name: this.document.name });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    const isPhysical = this.document.system.attack._defaultAttackType === "physical";
    context.accuracyPlaceholder1 = _loc("RYUUTAMA.ACTOR.MONSTER.ATTACK.defaultAbility", {
      ability: isPhysical
        ? ryuutama.config.abilityScores.strength.abbreviation
        : ryuutama.config.abilityScores.intelligence.abbreviation,
    });
    context.accuracyPlaceholder2 = _loc("RYUUTAMA.ACTOR.MONSTER.ATTACK.defaultAbility", {
      ability: isPhysical
        ? ryuutama.config.abilityScores.dexterity.abbreviation
        : ryuutama.config.abilityScores.spirit.abbreviation,
    });

    context.accuracyValue1 = context.disabled
      ? this.document.system.attack.accuracy.die1
      : this.document.system._source.attack.accuracy.die1;

    context.accuracyValue2 = context.disabled
      ? this.document.system.attack.accuracy.die2
      : this.document.system._source.attack.accuracy.die2;

    context.accuracyBonus = context.disabled
      ? this.document.system.attack.accuracy.bonus
      : this.document.system._source.attack.accuracy.bonus;

    context.damagePlaceholder = _loc("RYUUTAMA.ACTOR.MONSTER.ATTACK.defaultAbility", {
      ability: isPhysical
        ? ryuutama.config.abilityScores.strength.abbreviation
        : ryuutama.config.abilityScores.spirit.abbreviation,
    });

    context.damageValue = context.disabled
      ? this.document.system.attack.damage.die
      : this.document.system._source.attack.damage.die;

    context.damageBonus = context.disabled
      ? this.document.system.attack.damage.bonus
      : this.document.system._source.attack.damage.bonus;

    return context;
  }
}
