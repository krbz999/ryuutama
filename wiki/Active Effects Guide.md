# Active Effects

Effects can perform changes to characters and monsters. The most commonly used attribute keys and their value choices are listed here.

## Abilities

For example `system.abilities.strength.value | ADD | 1` to increase the die size of the Strength stat to the next size up, to a maximum of 12. The system handles validating that the stats remain within 4 to 12; `Unit` can be either `-1` or `1` to decrease or increase the size, respectively.

The `OVERRIDE` mode can be used to force the ability to be any of the valid die sizes; 2, 4, 6, 8, 10, 12, and 20.

The valid ability keys are `strength`, `dexterity`, `intelligence`, and `spirit`.

Attribute Key | Mode | Value
:- | :-: | :-:
`system.abilities.<ability>.value` | ADD | Unit
`system.abilities.<ability>.value` | OVERRIDE | Faces



## Capacity

Increase the actor's capacity by an amount.

Attribute Key | Mode | Value
:- | :-: | :-:
`system.capacity.bonus` | ADD | Integer

## Condition and Statuses

Override the actor's current condition to be equal to the provided integer value, or grant immunity to a given status. The available possible values are `injury`, `poison`, `sickness`, `exhaustion`, `muddled`, and `shock`.

Attribute Key | Mode | Value
:- | :-: | :-:
`system.condition.value` | OVERRIDE | Integer
`system.condition.immunities` | ADD | Status

## Defense & Armor

Add a base defense value. Any equipped armor is added onto this, or add damage reduction (or increase) to physical damage or magical damage.

Attribute Key | Mode | Value
:- | :-: | :-:
`system.defense.armor` | ADD | Integer
`system.defense.modifiers.physical` | ADD | Integer
`system.defense.modifiers.magical` | ADD | Integer

## Resources (HP & MP)

Add a flat bonus to the resource (`stamina` or `mental`) or a bonus that is multiplied by the level of the character.

Attribute Key | Mode | Value
:- | :-: | :-:
`system.resources.<resource>.bonuses.flat` | ADD | Integer
`system.resources.<resource>.bonuses.level` | ADD | Integer

## Types

Add a Type to a character. Each time a character gains a type (`attack`, `technical`, or `magic`), the benefit of that type increases.

Attribute Key | Mode | Value
:- | :-: | :-:
`system.details.type.<type>` | ADD | Integer
