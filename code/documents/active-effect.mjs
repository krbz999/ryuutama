export default class RyuutamaActiveEffect extends foundry.documents.ActiveEffect {
  /** @inheritdoc */
  static async _fromStatusEffect(statusId, effectData, options) {
    // Select the strength of the status.
    if (Object.values(ryuutama.CONST.STATUS_EFFECTS).includes(statusId)) {
      effectData.type = "status";
      if (!("strength" in options)) {
        const fields = CONFIG.ActiveEffect.dataModels.status.schema.fields.strength.fields;

        const rootId = [foundry.utils.randomID(), statusId].join("-");

        const result = await foundry.applications.api.Dialog.input({
          window: {
            title: `${_loc("RYUUTAMA.EFFECT.STATUS.HUD_APPLY.title")}: ${effectData.name}`,
          },
          position: {
            width: 420,
          },
          content: [
            fields.value.toFormGroup({ rootId }, { autofocus: true, value: 4 }).outerHTML,
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
  static migrateData(source, options, _state) {
    const prefix = "system.mastered.weapons.";
    (source.changes ?? source.system?.changes ?? []).forEach(change => {
      if (!change.key?.startsWith?.(prefix)) return;
      change.value = change.key.slice(prefix.length);
      change.key = prefix.slice(0, prefix.length - 1);
      change.type = "add";
    });
    return super.migrateData(source, options, _state);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    if ((await super._preCreate(data, options, user)) === false) return false;
    if (this.parent?.type === "party") return false;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _initializeSource(data = {}, options = {}) {
    if (!data.type || (data.type === "base")) data.type = "standard";
    return super._initializeSource(data, options);
  }
}
