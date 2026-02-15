import RyuutamaBaseActorSheet from "./base.mjs";

/**
 * @import RyuutamaActor from "../../../documents/actor.mjs";
 */

export default class RyuutamaPartySheet extends RyuutamaBaseActorSheet {
  /** @override */
  static DEFAULT_OPTIONS = {
    actions: {
      placeMembers: RyuutamaPartySheet.#placeMembers,
      removeMember: RyuutamaPartySheet.#removeMember,
      showMember: RyuutamaPartySheet.#showMember,
    },
  };

  /* -------------------------------------------------- */

  /** @override */
  static PARTS = {
    header: {
      template: "systems/ryuutama/templates/sheets/actors/party/header.hbs",
    },
    navigation: {
      template: "templates/generic/tab-navigation.hbs",
    },
    members: {
      template: "systems/ryuutama/templates/sheets/actors/party/members.hbs",
      classes: ["tab"],
      scrollable: [".contents"],
    },
    details: {
      template: "systems/ryuutama/templates/sheets/actors/party/details.hbs",
      classes: ["tab"],
      scrollable: [".contents"],
    },
  };

  /* -------------------------------------------------- */

  /** @override */
  static TABS = {
    primary: {
      tabs: [
        { id: "members" },
        { id: "details" },
      ],
      initial: "members",
      labelPrefix: "RYUUTAMA.ACTOR.TABS",
    },
  };

  /* -------------------------------------------------- */

  /**
   * External actors who re-render this application.
   * @type {Set<RyuutamaActor>}
   */
  #appActors = new Set();

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.header = await this.#prepareHeader();
    context.members = await this.#prepareMembers();
    context.details = await this.#prepareDetails();

    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare details context.
   * @returns {Promise<object>}
   */
  async #prepareDetails() {
    const value = this.document.system._source.description.value;
    const enriched = await CONFIG.ux.TextEditor.enrichHTML(value, {
      rollData: this.document.getRollData(),
      relativeTo: this.document,
    });
    return {
      isOwner: this.document.isOwner,
      description: { value, enriched },
    };
  }

  /* -------------------------------------------------- */

  /**
   * Prepare header context.
   * @returns {Promise<object>}
   */
  async #prepareHeader() {
    const { value, max } = this.document.system.members.reduce((acc, { actor }) => {
      const { value, max } = actor.system.resources.stamina;
      return { value: acc.value + value, max: acc.max + max };
    }, { value: 0, max: 0 });
    const pct = Math.floor(value / max * 100);
    return {
      canPlaceMembers: game.user.isGM && canvas?.ready,
      hp: {
        value, max,
        pct: Math.clamp(pct, -100, 100),
        fill: Math.abs(pct),
        id: this.id,
        negative: pct < 0,
      },
    };
  }

  /* -------------------------------------------------- */

  /**
   * Prepare members context.
   * @returns {Promise<object[]>}
   */
  async #prepareMembers() {
    const members = [];
    for (const member of this.document.system.members) {
      const ctx = { ...member };
      const { stamina: hp, mental: mp } = member.actor.system.resources;
      Object.assign(ctx, {
        hp, mp,
        rootId: [this.id, member.actor.id].join("-"),
        canView: member.actor.testUserPermission(game.user, "OBSERVER"),
      });
      members.push(ctx);
    }
    return members;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);
    for (const actor of this.#appActors) delete actor.apps[this.id];
    this.#appActors.clear();
    for (const { actor } of this.document.system.members) {
      actor.apps[this.id] = this;
      this.#appActors.add(actor);
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onClose(options) {
    for (const actor of this.#appActors) delete actor.apps[this.id];
    this.#appActors.clear();
    return super._onClose(options);
  }

  /* -------------------------------------------------- */

  /** @override */
  async _onDropActor(event, actor) {
    await this.document.system.addMembers([actor]);
    return true;
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaPartySheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static async #placeMembers(event, target) {
    const isMaximized = this.rendered && !this.minimized;
    if (isMaximized) await this.minimize();
    await this.document.system.placeMembers();
    if (isMaximized) this.maximize();
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaPartySheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static #removeMember(event, target) {
    const id = target.closest("[data-member-id]").dataset.memberId;
    const actor = game.actors.get(id);
    this.document.system.removeMembers([actor]);
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaPartySheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static #showMember(event, target) {
    const id = target.closest("[data-member-id]").dataset.memberId;
    const actor = game.actors.get(id);
    actor.sheet.render({ force: true });
  }
}
