export default class RyuutamaActiveEffect extends foundry.documents.ActiveEffect {
  /** @inheritdoc */
  static async _fromStatusEffect(statusId, effectData, options) {
    // Select the strength of the status.
    if (statusId in ryuutama.config.statusEffects) {
      effectData.type = "status";
      if (!("strength" in options)) {
        const fields = CONFIG.ActiveEffect.dataModels.status.schema.fields.strength.fields;

        const rootId = [foundry.utils.randomID(), statusId].join("-");

        const result = await foundry.applications.api.Dialog.input({
          window: {
            title: `${game.i18n.localize("RYUUTAMA.EFFECT.STATUS.HUD_APPLY.title")}: ${effectData.name}`,
          },
          position: {
            width: 420,
          },
          content: [
            fields.value.toFormGroup({ rootId }, { autofocus: true, value: 4, placeholder: "4" }).outerHTML,
            fields.bypass.toFormGroup({ rootId }, {}).outerHTML,
          ].join(""),
        });
        if (!result) throw new Error("No status effect strength was selected.");
        foundry.utils.mergeObject(effectData, result);
      } else {
        foundry.utils.setProperty(effectData, "system.strength.value", options.strength);
      }
    }

    return super._fromStatusEffect(statusId, effectData, options);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static migrateData(source) {
    for (const change of source.changes ?? []) {
      if (change.key.startsWith("system.mastered.weapons.")) {
        const weapon = change.key.slice("system.mastered.weapons.".length);
        change.key = "system.mastered.weapons";
        change.mode = CONST.ACTIVE_EFFECT_MODES.ADD,
        change.value = weapon || "";
      }
    }
    return super.migrateData(source);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _initializeSource(data = {}, options = {}) {
    if (!data.type || (data.type === "base")) data.type = "standard";
    return super._initializeSource(data, options);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _applyAdd(actor, change, current, delta, changes) {
    switch (foundry.utils.getType(current)) {
      case "Set": current.add(delta); break;
      default: return super._applyAdd(actor, change, current, delta, changes);
    }
  }
}
