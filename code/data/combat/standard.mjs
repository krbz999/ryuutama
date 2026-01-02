/**
 * @import RegionDocument from "@client/documents/region.mjs";
 * @import RyuutamaCombat from "../../documents/combat.mjs";
 * @import RyuutamaCombatant from "../../documents/combatant.mjs";
 */

const { BooleanField, ForeignDocumentField, SchemaField, StringField, TypedObjectField } = foundry.data.fields;

export default class StandardData extends foundry.abstract.TypeDataModel {
  /** @override */
  static defineSchema() {
    return {
      battlefield: new SchemaField({
        backAlly: new ForeignDocumentField(foundry.documents.RegionDocument, { idOnly: true }),
        backEnemy: new ForeignDocumentField(foundry.documents.RegionDocument, { idOnly: true }),
        front: new ForeignDocumentField(foundry.documents.RegionDocument, { idOnly: true }),
      }),
      objects: new TypedObjectField(new SchemaField({
        name: new StringField({ required: true }),
        disabled: new BooleanField(),
      }), { validateKey: key => foundry.data.validators.isValidId(key) }),
    };
  }

  /* -------------------------------------------------- */

  /** @override */
  static LOCALIZATION_PREFIXES = [
    "RYUUTAMA.COMBAT.STANDARD",
  ];

  /* -------------------------------------------------- */

  /**
   * The back area for allies.
   * @type {RegionDocument|null}
   */
  get allyBackArea() {
    return this.parent.scene?.regions.get(this.battleField.backAlly) ?? null;
  }

  /* -------------------------------------------------- */

  /**
   * The back area for enemies.
   * @type {RegionDocument|null}
   */
  get enemyBackArea() {
    return this.parent.scene?.regions.get(this.battleField.backEnemy) ?? null;
  }

  /* -------------------------------------------------- */

  /**
   * The front area.
   * @type {RegionDocument|null}
   */
  get frontArea() {
    return this.parent.scene?.regions.get(this.battleField.front) ?? null;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    if ((await super._preCreate(data, options, user)) === false) return false;
    if (!("scene" in data)) this.parent.updateSource({ scene: canvas?.scene?.id });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    Object.entries(this.objects).forEach(([id, o]) => {
      o.name ||= game.i18n.localize("RYUUTAMA.COMBAT.STANDARD.FIELDS.objects.element.name.placeholder");
      Object.defineProperty(o, "id", { value: id, writable: false, enumerable: false });
    });
  }

  /* -------------------------------------------------- */

  /**
   * Configure and then add a number of objects.
   * @param {number} [count=5]    How many to add.
   * @returns {Promise<RyuutamaCombat|null>}
   */
  async addObjects(count = 5) {
    const ids = Array.fromRange(count).map(() => foundry.utils.randomID());

    const content = document.createElement("DIV");
    for (const id of ids) {
      const nameField = this.schema.getField("objects.element.name");
      content.insertAdjacentElement("beforeend", nameField.toFormGroup(
        {},
        {
          name: `system.objects.${id}.name`,
          placeholder: game.i18n.localize("RYUUTAMA.COMBAT.STANDARD.FIELDS.objects.element.name.placeholder"),
          autofocus: ids[0] === id,
        },
      ));
    }
    const configuration = await foundry.applications.api.Dialog.input({ content });
    if (!configuration) return null;

    const update = foundry.utils.expandObject(configuration);
    for (const id of ids) update.system.objects[id].name ||= "";
    return this.parent.update(update);
  }

  /* -------------------------------------------------- */

  /**
   * Toggle the disabled state of an object.
   * @param {string} id   The id of the object to toggle.
   * @returns {Promise<RyuutamaCombat>}
   */
  async toggleObject(id) {
    const object = this.objects[id];
    if (!object) throw new Error(`No object with id '${id}' exists in this combat.`);
    return this.parent.update({ [`system.objects.${id}.disabled`]: !object.disabled });
  }

  /* -------------------------------------------------- */

  /**
   * Remove an object from the encounter.
   * @param {string} id   The id of the object to remove.
   * @returns {Promise<RyuutamaCombat>}
   */
  async removeObject(id) {
    return this.parent.update({ [`system.objects.-=${id}`]: null });
  }

  /* -------------------------------------------------- */

  /**
   * Perform post-render modifications of the combat tracker.
   * @param {HTMLElement} element   The rendered element.
   * @returns {Promise<void>}
   */
  async _onRender(element) {
    const header = element.querySelector("[data-application-part=header]");
    if (header.querySelector(".ryuutama.objects")) return;
    this.#insertObjects(header);

    for (const input of element.querySelectorAll(".initiative-input")) {
      const combatant = this.parent.combatants.get(input.closest("[data-combatant-id]").dataset.combatantId);
      const delayed = combatant.system.initiative.value;
      if (delayed) this.#insertDelayedInitiative(input, combatant);
    }
  }

  /* -------------------------------------------------- */

  /**
   * Insert the objects of the combat in the tracker.
   * @param {HTMLElement} element   The combat tracker's rendered element.
   */
  #insertObjects(element) {
    const div = element.ownerDocument.createElement("DIV");
    div.classList.add(ryuutama.id, "objects");
    const isGM = game.user.isGM;

    const header = foundry.utils.parseHTML(`<h4 class="divider">
      <span>${game.i18n.localize("RYUUTAMA.COMBAT.STANDARD.objects")}<span>
    </h4>`);
    if (isGM) {
      header.insertAdjacentHTML("beforeend",
        "<button class='icon inline-control fa-solid fa-plus' data-action='addObjects'></button>",
      );
    }

    div.insertAdjacentElement("beforeend", header);
    const objects = foundry.utils.parseHTML("<div class='objects-list'></div>");
    div.insertAdjacentElement("beforeend", objects);
    for (const object of Object.values(this.objects)) {
      const dataset = Object.entries({
        "object-id": object.id,
        action: isGM ? "toggleObject" : null,
        "tooltip-text": object.name,
      }).filter(k => k[1]).map(([k, v]) => `data-${k}="${v}"`).join(" ");

      objects.insertAdjacentHTML("beforeend", `
        <button type="button" ${dataset} ${object.disabled ? "disabled" : ""}>
          <i class="fa-solid fa-box" inert></i>
        </button>`,
      );
    }

    if (isGM || element.childElementCount) element.insertAdjacentElement("beforeend", div);
  }

  /* -------------------------------------------------- */

  /**
   * Insert an element that displays a delayed initiative value.
   * @param {HTMLInputElement} input
   * @param {RyuutamaCombatant} combatant
   */
  #insertDelayedInitiative(input, combatant) {
    const next = new ryuutama.dice.BaseRoll(
      combatant.system.initiative.value,
      combatant.getRollData(),
    ).evaluateSync().total;
    if (next === combatant.initiative) return;
    const element = input.ownerDocument.createElement("SPAN");
    element.classList.add("initiative-delayed");
    element.textContent = String(next);
    input.insertAdjacentElement("afterend", element);
  }
}
