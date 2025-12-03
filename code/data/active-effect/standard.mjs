/**
 * @import RyuutamaActor from "../../documents/actor.mjs";
 */

export default class StandardData extends foundry.abstract.TypeDataModel {
  /** @override */
  static defineSchema() {
    return {};
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.EFFECT.STANDARD",
  ];

  /* -------------------------------------------------- */

  /**
   * Getter for the actor this effect lives on, if any.
   * @type {RyuutamaActor|null}
   */
  get actor() {
    const effect = this.parent;
    if (!effect.parent) return null;
    if (effect.parent instanceof foundry.documents.Actor) return effect.parent;
    if (effect.parent.parent instanceof foundry.documents.Actor) return effect.parent.parent;
    return null;
  }

  /* -------------------------------------------------- */

  /**
   * Is this effect prevented from affecting the actor?
   * @type {boolean}
   */
  get isSuppressed() {
    const effect = this.parent;
    // TODO: might not be on any parent in v14.
    if (effect.parent instanceof foundry.documents.Actor) return false;
    if (effect.parent instanceof foundry.documents.Item) {
      return !!effect.parent.system.action?.effects?.ids.has(effect.id);
    }
    return false;
  }

  /* -------------------------------------------------- */

  /**
   * Create data for an enriched tooltip.
   * @returns {Promise<HTMLElement[]>}
   */
  async richTooltip() {
    const enriched = await CONFIG.ux.TextEditor.enrichHTML(this.parent.description, {
      rollData: this.parent.getRollData?.() ?? {}, relativeTo: this.parent,
    });
    const context = {
      effect: this.parent,
      actor: this.actor,
      enriched,
    };
    const htmlString = await foundry.applications.handlebars.renderTemplate(
      "systems/ryuutama/templates/ui/effects/tooltip.hbs",
      context,
    );

    const div = document.createElement("DIV");
    div.innerHTML = htmlString;
    return div.children;
  }
}
