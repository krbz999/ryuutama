/**
 * @import RyuutamaActor from "../../../documents/actor.mjs";
 * @import AdvancementDialog from "../../../applications/apps/advancement-dialog.mjs";
 */

export default class Node {
  constructor(config = {}) {
    if (config.parent instanceof Node) {
      this.#parent = config.parent;
      this.#actor = this.#parent.actor;
    } else {
      this.#actor = config.actor;
    }

    if (!this.#actor) {
      throw new Error("A Node was constructed without a reference to an Actor.");
    }
  }

  /* -------------------------------------------------- */

  /**
   * Node subtypes.
   * @type {object}
   */
  static get TYPES() {
    return this.#TYPES ??= Object.freeze({
      class: ryuutama.data.advancement.components.ClassNode,
      dragonFavor: ryuutama.data.advancement.components.DragonFavorNode,
      habitat: ryuutama.data.advancement.components.HabitatNode,
      resource: ryuutama.data.advancement.components.ResourceNode,
      skill: ryuutama.data.advancement.components.SkillNode,
      spellCategory: ryuutama.data.advancement.components.SpellCategoryNode,
      statIncrease: ryuutama.data.advancement.components.StatIncreaseNode,
      statusImmunity: ryuutama.data.advancement.components.StatusImmunityNode,
      terrain: ryuutama.data.advancement.components.TerrainNode,
      type: ryuutama.data.advancement.components.TypeNode,
      weapon: ryuutama.data.advancement.components.WeaponNode,
      weather: ryuutama.data.advancement.components.WeatherNode,
    });
  }
  static #TYPES;

  /* -------------------------------------------------- */

  /**
   * Choices to choose from.
   * @type {foundry.utils.Collection<string, object>|void}
   */
  choices;

  /* -------------------------------------------------- */

  /**
   * Child nodes.
   * @type {Node[]|null}
   */
  #childNodes;
  get children() {
    return this.#childNodes;
  }

  /* -------------------------------------------------- */

  /**
   * The actor advancing.
   * @type {RyuutamaActor}
   */
  #actor;
  get actor() {
    if (this.parent) return this.parent.actor;
    return this.#actor;
  }

  /* -------------------------------------------------- */

  /**
   * Has this node been initialized, its choices (if any) gathered?
   * @type {boolean}
   */
  #initialized = false;

  /* -------------------------------------------------- */

  /**
   * The id of the currently selected choice.
   * @type {string|null}
   */
  _selected = null;

  /* -------------------------------------------------- */

  /**
   * Is this node fully configured?
   * @type {boolean}
   */
  get isConfigured() {
    if (this.choices?.size === 0) return true;
    return !!this.selected;
  }

  /* -------------------------------------------------- */

  /**
   * Displayed header label of this node in an AdvancementDialog.
   * @type {string}
   */
  get label() {
    return "";
  }

  /* -------------------------------------------------- */

  /**
   * A parent node.
   * @type {Node|void}
   */
  #parent;
  get parent() {
    return this.#parent ?? null;
  }

  /* -------------------------------------------------- */

  /**
   * Currently selected choice.
   * @type {object|null}
   */
  get selected() {
    return this.choices?.get(this._selected) ?? null;
  }

  /* -------------------------------------------------- */

  /**
   * Select one of the choices.
   * @param {string|null} choiceId    The id of the choice, or `null` to reset.
   * @returns {Promise<void>}
   */
  async select(choiceId) {
    const isReset = choiceId === null;

    if (!this.choices && !isReset) {
      throw new Error("This node does not have choices to make, or the choices have not been configured.");
    }

    if (!this.choices?.has(choiceId) && !isReset) {
      throw new Error(`The choices collection does not match the id '${choiceId}'.`);
    }

    this._selected = choiceId;

    this.#childNodes = null;
    if (isReset) return;
    const children = await this._createChildNodes();
    if (!children) return;

    this.#childNodes = children;
    for (const node of children) await node.setupChoices();
  }

  /* -------------------------------------------------- */

  /**
   * Create child nodes.
   * @returns {Promise<Node[]|null>}
   */
  async _createChildNodes() {
    return null;
  }

  /* -------------------------------------------------- */

  /**
   * Create the set of choices.
   * @returns {Promise<object[]>}
   */
  async _gatherChoices() {
    return [];
  }

  /* -------------------------------------------------- */

  /**
   * Render this node as HTML. It is not required to have any inputs.
   * @returns {HTMLElement|null}
   */
  _toHTML() {
    return null;
  }

  /* -------------------------------------------------- */

  /**
   * Add event listeners when this Node is rendered in an AdvancementDialog.
   * @param {AdvancementDialog} application
   * @param {HTMLElement} element
   */
  _addEventListeners(application, element) {}

  /* -------------------------------------------------- */

  /**
   * Set up choices.
   * @returns {Promise<void>}
   */
  async setupChoices() {
    if (this.#initialized) return;
    const options = await this._gatherChoices();
    const choices = new foundry.utils.Collection();
    options.forEach(opt => choices.set(foundry.utils.randomID(), opt));
    Object.assign(this, { choices });
    this.#initialized = true;
  }

  /* -------------------------------------------------- */

  /**
   * Convert this node and its configuration to data that will be added to the actor.
   * @returns {Promise<{ type: "ActiveEffect"|"Item", data: object }|null>}
   */
  async _toData() {
    return null;
  }
}
