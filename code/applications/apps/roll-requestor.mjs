/**
 * @import FormDataExtended from "@client/applications/ux/form-data-extended.mjs";
 * @import { CheckRollConfig, CheckDialogConfig, CheckMessageConfig } from "../../data/actor/_types.mjs";
 */

import RyuutamaActor from "../../documents/actor.mjs";

const { Application, HandlebarsApplicationMixin } = foundry.applications.api;

export default class RollRequestor extends HandlebarsApplicationMixin(Application) {
  /** @override */
  static DEFAULT_OPTIONS = {
    tag: "form",
    classes: ["requestor"],
    window: {
      title: "RYUUTAMA.REQUESTOR.title",
      icon: "fa-solid fa-bell",
      contentClasses: ["standard-form"],
    },
    position: {
      width: 400,
    },
    actions: {
      request: RollRequestor.#request,
      requestAll: RollRequestor.#requestAll,
    },
    form: {
      submitOnChange: false,
      closeOnSubmit: true,
      handler: RollRequestor.#onSubmit,
    },
    actorUuids: null,
    configs: null,
  };

  /* -------------------------------------------------- */

  /** @override */
  static PARTS = {
    requests: {
      root: true,
      template: "systems/ryuutama/templates/apps/requestor/requests.hbs",
    },
    footer: {
      template: "templates/generic/form-footer.hbs",
    },
  };

  /* -------------------------------------------------- */

  /**
   * Roll configurations used for the queries.
   * @type {{ roll?: CheckRollConfig, dialog?: CheckDialogConfig, message?: CheckMessageConfig }}
   */
  get configs() {
    return this.options.configs ?? {};
  }

  /* -------------------------------------------------- */

  /**
   * The rolled results.
   * @type {Record<string, { value: number|null }>}
   */
  #results = {};

  /* -------------------------------------------------- */

  /**
   * The uuids of actors being requested to roll. A designated user will perform the roll, prioritizing non-GMs.
   * @type {Set<string>}
   */
  get actorUuids() {
    const uuids = this.options.actorUuids ?? [];
    return new Set(uuids);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _initializeApplicationOptions(options) {
    const appOptions = super._initializeApplicationOptions(options);
    appOptions.classes.push(ryuutama.id);
    return appOptions;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _configureRenderParts(options) {
    const parts = super._configureRenderParts(options);
    for (const uuid of this.actorUuids) {
      parts[uuid] = {
        template: "systems/ryuutama/templates/apps/requestor/request.hbs",
        templates: [],
      };
    }
    if (!options.isFirstRender) delete parts.requests;
    return parts;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preparePartContext(partId, context, options) {
    await super._preparePartContext(partId, context, options);
    switch (partId) {
      case "requests": await this.#prepareRequestsPart(context, options); break;
      case "footer": await this.#prepareFooterPart(context, options); break;
      default: await this.#prepareActorPart(partId, context, options); break;
    }
    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare context for the root request part.
   * @param {object} context    Rendering context. **will be mutated**
   * @param {object} options
   * @returns {Promise<void>}
   */
  async #prepareRequestsPart(context, options) {
    context.ctx = { actorUuids: this.actorUuids };
  }

  /* -------------------------------------------------- */

  /**
   * Prepare context for the root footer part.
   * @param {object} context    Rendering context. **will be mutated**
   * @param {object} options
   * @returns {Promise<void>}
   */
  async #prepareFooterPart(context, options) {
    context.ctx = {};
    context.buttons = [
      { type: "button", label: "RYUUTAMA.REQUESTOR.requestAll", icon: "fa-solid fa-bell", action: "requestAll" },
      { type: "submit", label: "RYUUTAMA.REQUESTOR.ok", icon: "fa-solid fa-check" },
    ];
  }

  /* -------------------------------------------------- */

  /**
   * Prepare context for an actor request.
   * @param {object} context    Rendering context. **will be mutated**
   * @param {object} options
   * @returns {Promise<void>}
   */
  async #prepareActorPart(actorUuid, context, options) {
    const actor = fromUuidSync(actorUuid);
    if (!actor) throw new Error("actor not found");
    context.ctx = {
      actor,
      showBar: options.animateBars && options.parts.includes(actorUuid),
      value: this.#results[actorUuid]?.value ?? "&mdash;",
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    if (options.animateBars) {
      options.parts
        .filter(partId => !Object.keys(this.constructor.PARTS).includes(partId))
        .forEach(partId => {
          const bar = this.element.querySelector(`[data-application-part="${partId}"] .progress-bar-fill`);
          bar.animate([{ right: "0%" }, { right: "100%" }], { duration: 10_000 });
        });
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _syncPartState(partId, newElement, priorElement, state) {
    super._syncPartState(partId, newElement, priorElement, state);

    const newBar = newElement.querySelector(".progress-bar-fill");
    const priorBar = priorElement.querySelector(".progress-bar-fill");
    if (!newBar || priorBar) return;
    newBar.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
  }

  /* -------------------------------------------------- */
  /*   Event Handlers                                   */
  /* -------------------------------------------------- */

  /**
   * @this RollRequestor
   * @param {SubmitEvent} event
   * @param {HTMLFormElement} form
   * @param {FormDataExtended} formData
   * @param {object} [submitOptions]
   */
  static #onSubmit(event, form, formData, submitOptions) {
    return Object.entries(this.#results)
      .map(([uuid, { value }]) => ({ actor: fromUuidSync(uuid), value }))
      .filter(e => e.actor);
  }

  /* -------------------------------------------------- */

  /**
   * @this RollRequestor
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing element that defined the [data-action].
   */
  static async #request(event, target) {
    const actor = fromUuidSync(target.closest("[data-actor-uuid]").dataset.actorUuid);
    this.#results[actor.uuid] = { value: null, bar: true };
    await this.render({ parts: [actor.uuid], animateBars: true });
    const { roll, dialog, message } = this.configs;

    let result;
    try {
      result = await RollRequestor.request(actor, roll, dialog, message);
    } catch (err) {
      result = null;
    }
    this.#results[actor.uuid] = { value: result };
    this.render({ parts: [actor.uuid] });
  }

  /* -------------------------------------------------- */

  /**
   * @this RollRequestor
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing element that defined the [data-action].
   */
  static async #requestAll(event, target) {
    target.disabled = true;
    for (const uuid of this.actorUuids) {
      const actor = fromUuidSync(uuid);
      this.#results[actor.uuid] = { value: null, bar: true };
    }
    await this.render({ parts: [...this.actorUuids], animateBars: true });
    const { roll, dialog, message } = this.configs;

    const promises = Array.from(this.actorUuids).map(async (uuid) => {
      const actor = fromUuidSync(uuid);
      let result;
      try {
        result = await RollRequestor.request(actor, roll, dialog, message);
      } catch (err) {
        result = null;
      }
      this.#results[actor.uuid] = { value: result };
      await this.render({ parts: [actor.uuid] });
    });
    await Promise.all(promises);
    target.disabled = false;
  }

  /* -------------------------------------------------- */
  /*   API                                              */
  /* -------------------------------------------------- */

  /**
   * Request a roll for an actor.
   * @param {RyuutamaActor} actor
   * @param {CheckRollConfig} roll
   * @param {CheckDialogConfig} dialog
   * @param {CheckMessageConfig} message
   * @returns {Promise<number>}
   * @throws
   */
  static async request(actor, roll, dialog, message) {
    const user = game.users.getDesignatedUser(user => {
      return actor.testUserPermission(user, "OWNER") && user.active;
    }) ?? game.users.activeGM;
    return user.query(
      ryuutama.id,
      { type: "check", actorUuid: actor.uuid, configs: { roll, dialog, message } },
      { timeout: 10_000 },
    );
  }
}
