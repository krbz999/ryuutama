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

    const itemData = [];

    const classId = actor.items.has(classItem.id) ? foundry.utils.randomID() : classItem.id;
    const classItemData = game.items.fromCompendium(classItem, { keepId: false, clearFolder: true });
    classItemData._id = classId;

    // Don't create a class multiple times.
    if (!this.document.system.classes[classItem.identifier]) itemData.push(classItemData);
    else results.push({ type: "itemUpdates", result: [{
      _id: this.document.system.classes[classItem.identifier].id,
      "system.tier": 2,
    }] });

    for (const skill of skills) {
      if (!skill || (skill.type !== "skill")) continue;

      // Don't create the skill if it already exists from a lower level and belonging to the same class.
      const existingSkill = actor.items.documentsByType.skill.find(item => {
        return (item.identifier === skill.identifier) && (item.system.originClass?.identifier === classItem.identifier);
      });
      if (existingSkill) continue;

      const keepId = !actor.items.has(skill.id);
      const data = game.items.fromCompendium(skill, { clearFolder: true, keepId });
      foundry.utils.setProperty(data, `flags.${ryuutama.id}.originClass`, classItem.identifier);
      itemData.push(data);
    }

    results.push({ type: "items", result: itemData });
    return results;
  }
}
