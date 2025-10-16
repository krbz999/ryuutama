import AdvancementConfigurationDialog from "./advancement-configuration-dialog.mjs";

export default class StatIncreaseAdvancementDialog extends AdvancementConfigurationDialog {
  /** @override */
  static get INPUT_TEMPLATE() {
    return "systems/ryuutama/templates/apps/advancement/stat-increase.hbs";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    const getScore = ability => {
      const base = this.actor.system._source.abilities[ability].value;
      return base;
    };

    context.abilityOptions = Object.entries(ryuutama.config.abilityScores)
      .filter(([k, v]) => getScore(k) < 12)
      .map(([k, v]) => ({ value: k, label: v.label }));
    context.buttons[0].disabled = false;
    return context;
  }

  /* -------------------------------------------------- */

  /** @override */
  _configureSubmit(event, form, formData) {
    if (event instanceof SubmitEvent) {
      formData = foundry.utils.expandObject(formData.object);
      const ability = formData.choice.chosen;

      const update = {
        [`system.abilities.${ability}.value`]: this.actor.system._source.abilities[ability].value + 2,
      };

      return {
        result: update,
        type: "actor",
      };
    }
  }
}
