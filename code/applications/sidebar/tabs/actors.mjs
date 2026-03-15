export default class RyuutamaActorDirectory extends foundry.applications.sidebar.tabs.ActorDirectory {
  /** @inheritdoc */
  _getEntryContextOptions() {
    const options = super._getEntryContextOptions();
    const getActor = target => game.actors.get(target.dataset.entryId);
    options.push({
      label: "RYUUTAMA.SIDEBAR.ACTORS.contextMenuAssignPrimaryParty",
      icon: "fa-solid fa-fw fa-medal",
      visible: target => {
        const actor = getActor(target);
        return game.user.isGM && (actor.type === "party") && (actor !== game.actors.party);
      },
      onClick: (event, target) => game.actors.setParty(getActor(target)),
      group: "system",
    }, {
      label: "RYUUTAMA.SIDEBAR.ACTORS.contextMenuRemovePrimaryParty",
      icon: "fa-solid fa-fw fa-times",
      visible: target => game.user.isGM && (getActor(target) === game.actors.party),
      onClick: () => game.actors.unsetParty(),
      group: "system",
    });
    return options;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    const party = game.actors.party;
    if (!party) return;
    const element = this.element.querySelector(`[data-entry-id="${party.id}"]`);
    if (element) element.classList.add("primary-party");
  }
}
