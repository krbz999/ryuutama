/**
 * @import Advancement from "../../data/advancement/advancement.mjs";
 * @import RyuutamaActor from "../../documents/actor.mjs";
 * @import AdvancementChain from "./chain.mjs";
 */

/**
 * A node of an advancement chain.
 */
export default class AdvancementNode {
  /**
   * A node of an advancement chain.
   * @param {object} config
   * @param {AdvancementChain} config.chain
   * @param {string} config.type
   * @param {AdvancementNode} [config.parent]
   */
  constructor({ chain, type, parent = null }) {
    this.#chain = chain;
    this.#type = type;
    this.#parent = parent;
    parent?.children.add(this);

    this.initializeNode();
  }

  /* -------------------------------------------------- */

  /**
   * The actor advancing.
   * @type {RyuutamaActor}
   */
  get actor() {
    return this.chain.actor;
  }

  /* -------------------------------------------------- */

  /**
   * The advancement of this node.
   * @type {Advancement}
   */
  #advancement;
  get advancement() {
    return this.#advancement;
  }

  /* -------------------------------------------------- */

  /**
   * The containing advancement chain.
   * @type {AdvancementChain}
   */
  #chain;
  get chain() {
    return this.#chain;
  }

  /* -------------------------------------------------- */

  /**
   * Advancement nodes that have this node as a parent.
   * @type {Set<AdvancementNode>}
   */
  children = new Set();

  /* -------------------------------------------------- */

  /**
   * The depth of this node.
   * @type {number}
   */
  get depth() {
    let depth = 0;
    let parent = this.parent;
    while (parent) {
      depth++;
      parent = parent.parent;
    }
    return depth;
  }

  /* -------------------------------------------------- */

  /**
   * Unique id to identify this node.
   * @type {string}
   */
  get id() {
    return this.#advancement.id;
  }

  /* -------------------------------------------------- */

  /**
   * Has this node been initialized?
   * @type {boolean}
   */
  _initialized = false;

  /* -------------------------------------------------- */

  /**
   * Is this node fully configured?
   * @type {boolean}
   */
  get isConfigured() {
    return this.advancement.isConfigured;
  }

  /* -------------------------------------------------- */

  /**
   * The level the actor is advancing to.
   * @type {number}
   */
  get level() {
    return this.chain.level;
  }

  /* -------------------------------------------------- */

  /**
   * A parent node that resulted in the creation of this node.
   * @type {AdvancementNode|null}
   */
  #parent;
  get parent() {
    return this.#parent;
  }

  /* -------------------------------------------------- */

  /**
   * The advancement subtype.
   * @type {string}
   */
  #type;
  get type() {
    return this.#type;
  }

  /* -------------------------------------------------- */

  /**
   * Initialize the node, setting up the advancement.
   * @returns {Advancement}
   */
  initializeNode() {
    if (this._initialized) {
      throw new Error("You cannot re-initialize a node.");
    }
    const Cls = ryuutama.data.advancement.Advancement.TYPES[this.type];
    const advancement = new Cls({ level: this.level, type: this.type }, {
      chain: this.chain,
      isEphemeral: true,
      parent: this.actor,
    });
    advancement.id = foundry.utils.randomID();
    this.#advancement = advancement;
    this._initialized = true;
    return this.advancement;
  }

  /* -------------------------------------------------- */

  /**
   * When this advancement is modified, reconstruct relevant parts of the chain.
   * @returns {Promise<void>}
   */
  async _initializeLeafNodes() {
    this.children.clear();
    if (!this.isConfigured) return;
    for (const c of await this.advancement._getChildNodeConfigurations()) {
      /** @type {AdvancementNode} */
      const node = new this.constructor({ type: c.type, chain: this.chain, parent: this });
      this.children.add(node);
      await node._initializeLeafNodes();
    }
  }

  /* -------------------------------------------------- */

  /**
   * Traverse descendant nodes.
   * @param {boolean} [activeOnly]    Only yield initialized nodes?
   * @yields {AdvancementNode}
   */
  * descendants(activeOnly = false) {
    for (const child of this.children) {
      if (!activeOnly || child._initialized) {
        yield child;
        yield* child.descendants(activeOnly);
      }
    }
  }
}
