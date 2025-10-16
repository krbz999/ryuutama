import AdvancementConfigurationDialog from "./advancement-configuration-dialog.mjs";

export default class StatsAdvancementDialog extends AdvancementConfigurationDialog {
  /** @override */
  static get INPUT_TEMPLATE() {
    return "systems/ryuutama/templates/apps/advancement/stats.hbs";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.typeOptions = Object.entries(this.options.advancementClass.STARTING_SCORES).map(([k, v]) => {
      return { value: k, label: game.i18n.localize(v.label) };
    });
    return context;
  }

  /* -------------------------------------------------- */

  /** @override */
  _configureSubmit(event, form, formData) {
    if (event instanceof SubmitEvent) {
      formData = foundry.utils.expandObject(formData.object);
      const update = {};
      for (const k in ryuutama.config.abilityScores) {
        // CONSIDER:
        // Remove the AbilityModel from the TravelerData model.
        // In prepareDerivedData, possibly as the last step (?), override the data to be a DataModel or other class.
        // Don't store anything in the schema?
        // Make this, StatIncrease, and Resource advancements into non-updates?
        // Alternatively, since some persisting updates (item creation) are done anyway,
        // consider having AbilityModel be instantiated manually in prepareDerivedData,
        // which would allow setting the maximum more easily, just once, and per actor type.
        update[`system.abilities.${k}.value`] = formData.choice.chosen[k];
      }

      update["system.resources.stamina.max"] = 2 * update["system.abilities.strength.value"];
      update["system.resources.mental.max"] = 2 * update["system.abilities.spirit.value"];
      return { result: update, type: "actor" };
    }

    else {
      const type = formData.get("choice.type");
      const set = [...this.options.advancementClass.STARTING_SCORES[type].stats];
      for (const k in ryuutama.config.abilityScores) {
        const value = Number(formData.get(`choice.chosen.${k}`));
        set.findSplice(v => v === value);
      }
      this.element.querySelector("[type=submit]").disabled = set.length > 0;
    }
  }
}
