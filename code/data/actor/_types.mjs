/**
 * @typedef CheckRollConfig
 * @property {string[]} [abilities]
 * @property {string} [type]
 * @property {string} [skillId]   If a skill check, the type of skill from `config.checks`.
 * @property {"travel"|"direction"|"camping"} [journeyId]   If a journey check, the type of check.
 * @property {number} [situationalBonus]
 * @property {object|false} [concentration]
 * @property {boolean} [concentration.consumeMental]
 * @property {boolean} [concentration.consumeFumble]
 */

/* -------------------------------------------------- */

/**
 * @typedef CheckDialogConfig
 * @property {boolean} [configure]        Should a configuration dialog be created?
 * @property {boolean} [selectAbilities]  Allow for selecting the abilities?
 * @property {boolean} [selectSubtype]    Allow for selecting the subtype?
 */

/* -------------------------------------------------- */

/**
 * @typedef CheckMessageConfig
 * @property {boolean} [create]   Should a chat message be created?
 */
