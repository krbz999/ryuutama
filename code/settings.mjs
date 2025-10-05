const { ForeignDocumentField, SchemaField, SetField, StringField } = foundry.data.fields;

export default function registerSettings() {
  // Storing the primary party's id.
  game.settings.register(ryuutama.id, "primaryParty", {
    name: "Primary Party",
    scope: "world",
    requiresReload: false,
    type: PrimaryPartyModel,
    default: null,
    config: false,
    onChange: () => ui.actors.render(),
  });

  // Current habitat.
  game.settings.register(ryuutama.id, "currentHabitat", {
    name: "Current Habitat",
    scope: "world",
    requiresReload: false,
    type: new SchemaField({
      terrain: new SetField(new StringField({ choices: () => ryuutama.config.terrainTypes })),
      weather: new SetField(new StringField({ choices: () => ryuutama.config.weatherTypes })),
    }),
    default: { terrain: [], weather: [] },
    config: false,
    onChange: value => onChangeHabitat(value),
  });
}

/* -------------------------------------------------- */

class PrimaryPartyModel extends foundry.abstract.DataModel {
  /** @inheritdoc */
  static defineSchema() {
    return {
      actor: new ForeignDocumentField(foundry.documents.BaseActor, {
        blank: true,
        validate: id => !game.actors || (game.actors.get(id)?.type === "party"),
        validationError: "This is not a valid id for a Party-type actor.",
      }),
    };
  }
}

/* -------------------------------------------------- */

/**
 * Create a button above the Players to configure the current habitat.
 */
Hooks.once("renderPlayers", (players) => {
  if (!game.user.isGM) return;

  /** @type {HTMLButtonElement} */
  const element = players.element.ownerDocument.createElement("BUTTON");
  element.type = "button";
  element.classList.add("faded-ui");
  element.id = "ryuutama-current-habitat";

  const value = game.settings.get(ryuutama.id, "currentHabitat");
  onChangeHabitat(value, element);

  players.element.insertAdjacentElement("beforebegin", element);

  element.addEventListener("click", configureHabitat);
});

/* -------------------------------------------------- */

/**
 * Prompt a dialog to configure the habitat setting.
 * @returns {Promise<void>}
 */
async function configureHabitat() {
  const fields = [];
  const current = game.settings.get(ryuutama.id, "currentHabitat");
  for (const field of game.settings.settings.get("ryuutama.currentHabitat").type) {
    fields.push(field.toFormGroup({}, { value: current[field.name], type: "checkboxes" }));
  }

  let habitat = await foundry.applications.api.Dialog.input({
    content: fields.map(field => field.outerHTML).join(""),
  });
  if (!habitat) return;

  habitat = foundry.utils.expandObject(habitat)[ryuutama.id].currentHabitat;

  game.settings.set(ryuutama.id, "currentHabitat", habitat);
}

/* -------------------------------------------------- */

/**
 * Respond to the habitat setting being changed, or the creation of the button.
 * @param {{ terrain: string, weather: string}} value   Value to derive a label from.
 * @param {HTMLButtonElement} [button]                  The button, if being created.
 */
function onChangeHabitat(value, button = null) {
  button ??= document.getElementById("ryuutama-current-habitat");

  let { terrain, weather } = value;

  let text = `<span>${game.i18n.localize("RYUUTAMA.HABITAT.currentHabitat")}</span>`;
  const formatter = game.i18n.getListFormatter();

  terrain = terrain.map(key => ryuutama.config.terrainTypes[key]?.label).filter(_ => _);
  if (terrain.size) text += `<span>${formatter.format(terrain)}</span>`;

  weather = weather.map(key => ryuutama.config.weatherTypes[key]?.label).filter(_ => _);
  if (weather.size) text += `<span>${formatter.format(weather)}</span>`;

  button.innerHTML = text;
}
