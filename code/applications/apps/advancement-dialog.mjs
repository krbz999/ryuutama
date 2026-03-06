/**
 * @import Node from "../../data/advancement/components/node.mjs";
 * @import RyuutamaActor from "../../documents/actor.mjs";
 */

const { Application } = foundry.applications.api;

export default class AdvancementDialog extends Application {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["advancement-dialog"],
    tag: "form",
    form: {
      submitOnChange: false,
      closeOnSubmit: true,
      handler: AdvancementDialog.#submit,
    },
    window: {},
    position: {
      width: 580,
      height: "auto",
    },
    actions: {},
    actor: null,
    level: null,
    nodes: null,
  };

  /* -------------------------------------------------- */

  /**
   * The actor advancing.
   * @type {RyuutamaActor}
   */
  get actor() {
    return this.options.actor;
  }

  /* -------------------------------------------------- */

  /**
   * A clone of the actor used as reference for the progress.
   * @type {RyuutamaActor}
   */
  get clone() {
    return this.actor.clone({}, { keepId: true });
  }

  /* -------------------------------------------------- */

  /**
   * The data that will be submitted.
   * @type {Node[]|null}
   */
  #config = null;
  get config() {
    return this.#config;
  }

  /* -------------------------------------------------- */

  /** @override */
  get title() {
    return _loc("RYUUTAMA.PSEUDO.ADVANCEMENT.title", {
      name: this.actor.name,
      nth: this.options.level.ordinalString(),
    });
  }

  /* -------------------------------------------------- */

  /** @override */
  async _prepareContext(options) {
    for (const node of this.options.nodes) await node.setupChoices();
    const roots = this.options.nodes;

    // Utility method to iterate through the node tree.
    const loop = (acc, nodes) => {
      if (!nodes) return acc;
      for (const n of nodes) {
        acc.push(n);
        if (n.selected) loop(acc, n.children);
      }
      return acc;
    };

    // Whether the submit button is disabled.
    let configured = true;

    const elements = [];
    const nodes = [];
    for (const node of roots) {
      const html = node._toHTML();
      const header = foundry.utils.parseHTML(`<h4>${node.label}</h4>`);
      const frame = foundry.utils.parseHTML("<section></section>");
      frame.insertAdjacentElement("afterbegin", header);
      frame.insertAdjacentElement("beforeend", html);

      node._addEventListeners(this, html);
      elements.push(frame);

      configured = configured && node.isConfigured;
      nodes.push(node);

      const children = loop([], node.children);
      for (const c of children) {
        const h = c._toHTML();
        c._addEventListeners(this, h);
        frame.insertAdjacentElement("beforeend", h);
        configured = configured && c.isConfigured;
        nodes.push(c);
      }
    }

    if (configured) {
      // Iterate through same-type nodes to determine disabled state.
      const types = ryuutama.data.advancement.components.Node.TYPES;
      const grouped = Object.groupBy(nodes, node => {
        const Cls = node.constructor;
        const type = Object.entries(types).find(e => e[1] === Cls)[0];
        return type;
      });
      for (const [type, nodes] of Object.entries(grouped)) {
        if (!configured || (nodes.length < 2)) continue;
        // Safe to filter here cus unconfigured nodes have already done their job.
        const values = nodes.map(n => n.selected?.value).filter(_ => _);
        configured = configured && (values.length === new Set(values).size);
      }
    }

    return {
      elements,
      nodes,
      roots,
      disabled: !configured,
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _initializeApplicationOptions(options) {
    options = super._initializeApplicationOptions(options);
    options.classes.push(ryuutama.id);
    return options;
  }

  /* -------------------------------------------------- */

  /** @override */
  _replaceHTML(result, content, options) {
    content.replaceChildren(...result);
  }

  /* -------------------------------------------------- */

  /** @override */
  async _renderHTML(context, options) {
    const { disabled, elements } = context;

    const footer = foundry.utils.parseHTML(`
      <footer class="form-footer">
        <button type="submit">${_loc("RYUUTAMA.ADVANCEMENT.confirm")}</button>
      </footer>`,
    );
    footer.querySelector("[type=submit]").disabled = disabled;
    elements.push(footer);

    return elements;
  }

  /* -------------------------------------------------- */

  /**
   * @this AdvancementDialog
   */
  static #submit() {
    this.#config = this.options.nodes;
  }

  /* -------------------------------------------------- */

  /**
   * Create an instance of this application the result of which can be awaited.
   * @param {object} options
   * @param {RyuutamaActor} options.actor   The actor advancing.
   * @param {number} [options.level]          The level to which the actor is advancing.
   * @returns {Promise<object[]|null>}      A promise that resolves to data used for advancement injection,
   *                                        or `null` if the dialog was cancelled.
   */
  static async create({ actor, level }) {
    level ??= actor.system.details.level + 1;
    const nodes = [];
    for (const type of ryuutama.config.advancement[level]) {
      const Cls = ryuutama.data.advancement.components.Node.TYPES[type];
      nodes.push(new Cls({ actor }));
    }

    const { promise, resolve } = Promise.withResolvers();
    const application = new this({ actor, level, nodes });

    application.addEventListener("close", () => resolve(application.config), { once: true });
    application.render({ force: true });
    return promise;
  }
}
