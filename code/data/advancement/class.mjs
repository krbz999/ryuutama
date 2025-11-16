import Advancement from "./advancement.mjs";

const { DocumentUUIDField, SchemaField } = foundry.data.fields;

/**
 * A subclass of advancement responsible for assigning a class.
 */
export default class ClassAdvancement extends Advancement {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      choice: new SchemaField({
        chosen: new DocumentUUIDField({ type: "Item", embedded: false }),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.PSEUDO.ADVANCEMENT.CLASS",
  ];

  /* -------------------------------------------------- */

  /** @override */
  static TYPE = "class";

  /* -------------------------------------------------- */

  /** @override */
  static CONFIGURE_TEMPLATE = "systems/ryuutama/templates/apps/advancement/class.hbs";

  /* -------------------------------------------------- */

  /** @override */
  get isConfigured() {
    const item = fromUuidSync(this.choice.chosen);
    if (!item) return false;
    return item.uuid.startsWith("Compendium.") && (item.type === "class");
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareAdvancementContext(context, options) {
    await super._prepareAdvancementContext(context, options);
    context.classItem = await fromUuid(this.choice.chosen);
    if (!context.classItem?.inCompendium || (context.classItem?.type !== "class")) {
      context.classItem = null;
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _getAdvancementResults(actor) {
    const results = await super._getAdvancementResults(actor);

    const classItem = await fromUuid(this.choice.chosen);
    const skills = await Promise.all(classItem.system.skills.map(uuid => fromUuid(uuid)));
    const itemData = skills.map(item => {
      if (!item || (item.type !== "skill")) return null;
      const keepId = !actor.items.has(item.id);
      const options = { clearFolder: true, keepId };
      return game.items.fromCompendium(item, options);
    }).filter(_ => _);

    results.push({ type: "items", result: itemData });
    return results;
  }
}
