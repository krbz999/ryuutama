export default class RyuutamaActorDirectory extends foundry.applications.sidebar.tabs.ActorDirectory {
  /** @inheritdoc */
  _getEntryContextOptions() {
    const options = super._getEntryContextOptions();
    const getActor = li => game.actors.get(li.dataset.entryId);
    options.push({
      name: "RYUUTAMA.SIDEBAR.ACTORS.contextMenuAssignPrimaryParty",
      icon: "<i class='fa-solid fa-fw fa-medal'></i>",
      condition: (li) => {
        const actor = getActor(li);
        return game.user.isGM && (actor.type === "party") && (actor !== game.actors.party);
      },
      callback: (li) => game.actors.setParty(getActor(li)),
      group: "system",
    }, {
      name: "RYUUTAMA.SIDEBAR.ACTORS.contextMenuRemovePrimaryParty",
      icon: "<i class='fa-solid fa-fw fa-times'></i>",
      condition: (li) => game.user.isGM && (getActor(li) === game.actors.party),
      callback: (li) => game.actors.unsetParty(),
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
