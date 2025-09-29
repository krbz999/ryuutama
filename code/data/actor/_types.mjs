/**
 * @typedef CheckRollConfig
 * @property {string[]} [abilities]
 * @property {string} [type]
 * @property {string} [skillId]                             If a skill check, the type of skill from `skillCheckTypes`.
 * @property {"travel"|"direction"|"camping"} [journeyId]   If a journey check, the type of check from `journeyCheckTypes`.
 * @property {number} [modifier]                            A modifier to the roll that cannot be changed via the UI,
 *                                                          e.g., the accuracy or damage modifier from a weapon.
 * @property {number} [situationalBonus]
 * @property {object} [critical]
 * @property {boolean} [critical.allowed]                   Can the roll be critical?
 * @property {boolean} [critical.isCritical]                Roll double the dice?
 * @property {object|false} [concentration]                 If explicitly `false`, options are not shown in the dialog.
 * @property {boolean} [concentration.consumeMental]        Consume half the traveler's current MP (rounded up)?
 * @property {boolean} [concentration.consumeFumble]        Consume a Fumble point?
 * @property {object} [condition]
 * @property {boolean} [condition.updateScore]              Update the traveler's condition score with
 *                                                          the total of the check?
 * @property {boolean} [condition.removeStatuses]           Remove status effects whose strength is lower than the
 *                                                          traveler's condition score?
 */

/* -------------------------------------------------- */

/**
 * @typedef CheckDialogConfig
 * @property {boolean} [configure]        Should a configuration dialog be created?
 * @property {boolean} [selectAbilities]  Allow for selecting the abilities?
 */

/* -------------------------------------------------- */

/**
 * @typedef CheckMessageConfig
 * @property {boolean} [create]   Should a chat message be created?
 */
