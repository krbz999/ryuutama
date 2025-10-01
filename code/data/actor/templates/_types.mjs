/**
 * @typedef AbilityData
 * @property {number} value   The die size of the ability.
 */

/**
 * @typedef ResourceData
 * @property {object} bonuses
 * @property {number|null} bonuses.flat     A flat bonus to the resource.
 * @property {number|null} bonuses.level    A bonus to the resource for each level of the creature.
 * @property {number} max                   The base resource maximum.
 * @property {number} spent                 How much of the resource has been spent.
 */

/**
 * @typedef CreatureModel
 * @property {object} abilities
 * @property {AbilityData} abilities.strength
 * @property {AbilityData} abilities.dexterity
 * @property {AbilityData} abilities.intelligence
 * @property {AbilityData} abilities.spirit
 * @property {object} condition
 * @property {string[]} condition.immunities    The status effects the creature is immune to.
 * @property {number} condition.value           The creature's current condition.
 * @property {object} resources
 * @property {ResourceData} resources.mental    The creature's MP.
 * @property {ResourceData} resources.stamina   The creature's HP.
 */

/**
 * @typedef {CreatureModel} MonsterModel
 * @property {object} attack
 * @property {string[]} attack.accuracy         The two abilities used for accuracy checks.
 * @property {string} attack.damage             The ability used for damage checks.
 * @property {object} armor
 * @property {number} armor.value               Armor value.
 * @property {object} details
 * @property {string} details.category          The monster category.
 * @property {number} details.dragonica         The monster's entry number in the magical monster encyclopedia.
 * @property {number} details.level             The monster level.
 * @property {object} environment
 * @property {string[]} environment.habitat     The terrain where the species is commonly found.
 * @property {string} environment.season        The time of year during which the monster is most active.
 * @property {object} initiative
 * @property {number} initiative.value
 */

/**
 * @typedef {CreatureModel} TravelerModel
 * @property {object} background
 * @property {string} background.appearance
 * @property {string} background.hometown
 * @property {string} background.notes
 * @property {object} details
 * @property {string|null} details.color    The character's image color.
 * @property {number} details.level         The character's level.
 * @property {object} equipped              Equipped items.
 * @property {string|null} equipped.weapon
 * @property {string|null} equipped.armor
 * @property {string|null} equipped.shield
 * @property {string|null} equipped.shoes
 * @property {string|null} equipped.cape
 * @property {string|null} equipped.staff
 * @property {string|null} equipped.hat
 * @property {string|null} equipped.accessory
 * @property {object} exp
 * @property {number} exp.value             Accumulated experience points.
 * @property {object} fumbles
 * @property {number} fumbles.value         Accumulated fumble points.
 * @property {object} gold
 * @property {number} gold.value            Accumulated gold.
 * @property {object} mastered
 * @property {string[]} mastered.habitats   Habitats in which this character receive a bonus to checks.
 * @property {string[]} mastered.weapons    Mastered weapon types.
 * @property {object} type
 * @property {string} type.value            The traveler's type.
 * @property {string} type.additional       An additional type chosen at later levels.
 */
