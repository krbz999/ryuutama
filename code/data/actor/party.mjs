/**
 * @import RyuutamaActor from "../../documents/actor.mjs";
 * @import RyuutamaTokenDocument from "../../documents/token.mjs";
 */

const { HTMLField, SchemaField, TypedObjectField } = foundry.data.fields;

export default class PartyData extends foundry.abstract.TypeDataModel {
  /** @inheritdoc */
  static defineSchema() {
    return {
      description: new SchemaField({
        value: new HTMLField(),
      }),
      members: new TypedObjectField(
        new SchemaField({}),
        { validateKey: key => foundry.data.validators.isValidId(key) },
      ),
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.ACTOR.PARTY",
  ];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    if ((await super._preCreate(data, options, user)) === false) return false;

    const update = foundry.utils.mergeObject({
      prototypeToken: {
        actorLink: true,
        disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
        sight: {
          enabled: false,
        },
      },
    }, data, { insertKeys: false, insertValues: false, overwrite: true });
    this.parent.updateSource(update);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareBaseData() {
    super.prepareBaseData();

    Object.defineProperty(this, "members", {
      enumerable: true,
      get() {
        return Object.entries(this._source.members).reduce((acc, [id, data]) => {
          const actor = game.actors.get(id);
          if (this.validMember(actor)) acc.set(actor.id, { ...data, actor });
          return acc;
        }, new foundry.utils.Collection());
      },
    });
  }

  /* -------------------------------------------------- */

  /**
   * Is a given actor valid to be a member of this party?
   * @param {RyuutamaActor} actor
   * @returns {boolean}
   */
  validMember(actor) {
    return (actor instanceof foundry.documents.Actor) && ["traveler"].includes(actor.type)
      && !actor.inCompendium && !actor.isToken;
  }

  /* -------------------------------------------------- */

  /**
   * Add members to the party.
   * @param {RyuutamaActor[]} [actors]    The actors to add.
   * @returns {Promise<RyuutamaActor>}    A promise that resolves to the updated party actor.
   */
  async addMembers(actors = []) {
    actors = new Set(actors.filter(this.validMember)).filter(actor => !this.members.has(actor.id));
    const ids = [...this.members.keys(), ...actors.map(a => a.id)];
    const update = Object.entries(this.toObject().members).reduce((acc, [id, src]) => {
      if (ids.includes(id)) acc[id] = src;
      return acc;
    }, {});
    ids.forEach(id => update[id] = {});
    await this.parent.update({ "system.members": _replace(update) });
    return this.parent;
  }

  /* -------------------------------------------------- */

  /**
   * Remove members from the party.
   * @param {RyuutamaActor[]} [actors]    The actors to remove.
   * @returns {Promise<RyuutamaActor>}    A promise that resolves to the updated party actor.
   */
  async removeMembers(actors = []) {
    const update = {};
    actors.forEach(actor => {
      if (this.validMember(actor) && this.members.has(actor.id)) update[actor.id] = _del;
    });
    await this.parent.update({ "system.members": update });
    return this.parent;
  }

  /* -------------------------------------------------- */

  /**
   * Place down the members of this party.
   * @param {object} [options]
   * @param {boolean} [options.configure=true]      Display a configuration dialog?
   * @returns {Promise<RyuutamaTokenDocument[]>}    A promise that resolves to the created tokens.
   */
  async placeMembers({ configure = true, ...configuration } = {}) {
    const sheet = this.parent.sheet;

    configuration = foundry.utils.mergeObject({
      createCombatants: !!game.combat,
      members: this.members.filter(m => !m.actor.getActiveTokens().length).map(m => m.actor.id),
    }, configuration);

    if (configure) {
      const configured = await ryuutama.applications.apps.PlaceMembersDialog.create({
        configuration, document: this.parent,
      });
      if (!configured) return null;
    }

    if (!configuration.members.length) return [];

    const isMaximized = sheet.rendered && !sheet.minimized;
    if (isMaximized) await sheet.minimize();

    const promises = configuration.members.map(
      id => this.members.get(id).actor.getTokenDocument({}, { parent: canvas.scene }),
    );
    let tokens = await Promise.all(promises);
    const data = tokens.map(token => token.toObject());
    tokens = await canvas.tokens.placeTokens(data, { create: true });

    if (tokens.length && configuration.createCombatants) {
      await getDocumentClass("Token").createCombatants(tokens, { combat: game.combat });
    }

    if (isMaximized) await sheet.maximize();

    return tokens;
  }

  /* -------------------------------------------------- */

  /**
   * Grant every party member a fumble point.
   * @returns {Promise<RyuutamaActor[]>}    A promise that resolves to the updated actors.
   */
  async grantFumblePoint() {
    const actors = this.members
      .map(m => m.actor)
      .filter(a => a.type === "traveler");
    const updates = actors.map(actor => {
      return { _id: actor.id, "system.fumbles.value": actor.system.fumbles.value + 1 };
    });
    return getDocumentClass("Actor").updateDocuments(updates);
  }
}
