/**
 * @import RyuutamaActor from "../../documents/actor.mjs";
 */

const { SchemaField, StringField } = foundry.data.fields;

export default class StandardData extends foundry.abstract.TypeDataModel {
  /** @override */
  static defineSchema() {
    return {
      expiration: new SchemaField({
        type: new StringField({ required: true, blank: true, choices: () => ryuutama.config.effectExpirationTypes }),
      }),
    };
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
