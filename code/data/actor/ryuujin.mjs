export default class RyuujinData extends foundry.abstract.TypeDataModel {
  /** @override */
  static defineSchema() {
    return {};
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.ACTOR.RYUUJIN",
  ];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    if ((await super._preCreate(data, options, user)) === false) return false;

    const update = {};
    if (!foundry.utils.hasProperty(data, "prototypeToken.actorLink"))
      foundry.utils.setProperty(update, "prototypeToken.actorLink", true);

    if (!foundry.utils.hasProperty(data, "prototypeToken.sight.enabled"))
      foundry.utils.setProperty(update, "prototypeToken.sight.enabled", false);

    if (!foundry.utils.hasProperty(data, "prototypeToken.disposition"))
      foundry.utils.setProperty(update, "prototypeToken.disposition", CONST.TOKEN_DISPOSITIONS.FRIENDLY);

    if (!foundry.utils.isEmpty(update)) this.parent.updateSource(update);
  }
}
