# Enrichers

Enrichers can be written in description fields of actors or in items to perform various checks or other useful functions.

## Check Enricher

The `[[/check]]` enricher helps request and perform checks of various kinds. It has one important property, `type`, and several optional properties.

Example uses:
- `[[/check accuracy]]` - displays as 'Accuracy Check' and will perform an accuracy check when clicked.
- `[[/check type=damage]]` - displays as 'Damage Check' and will perform a damage check when clicked.

The valid check types are: "accuracy", "check" (for a generic check), "condition", "damage", "initiative", "journey", and "magic".

### Options

The `type` property is required, though will default to `check` for a generic check if omitted.

When making a "journey" check, the `subtype` option is required, which can be one of three values: "camping", "direction", or "travel". For example, `[[/check type=journey subtype=camping]]`, or just `[[/check journey camping]]`, which will display as 'Camping Check'.

Every type of check also supports the `formula` option if one wishes to fully replace the default that is derived from the actor's abilities. For example, `[[/check accuracy formula="2d4 + 1"]]`.
To otherwise set default abilities, you can use the `abilities` property or write long or shorthand abilities. Each of these methods will produce an enricher for an [INT + INT] check:

- `[[/check int intelligence]]`
- `[[/check abilities="intelligence|intelligence"]]`
- `[[/check formula="@stats.intelligence + @stats.intelligence"]]{[INT + INT]}`

In addition, damage checks support additional options for damage-specific properties that modify how the resulting damage is applied. These are:

| Key | Effect |
| --- | --- |
| `damageMental` | The damage will be applied both to HP and MP. |
| `ignoreArmor` | The damage calculation will ignore armor and defense. |
| `magical` | The damage is considered magical and is not negated by armor. |
| `mythril` | The damage originates from a Mythril item and will ignore armor and defense of Undead targets. |
| `orichalcum` | The damage originates from an Orichalcum item and will ignore armor and defense of Undead targets. |

### Requests

By using the `request=true` option (or just `request`), the displayed enricher will have a small icon that can be clicked to create a Request message.

For example, to request that players make a Condition check, `[[/check condition request]]` will display an icon that creates a chat message that all users can click. Their results are then displayed in the initial chat message when they perform the check.

## Damage Enricher

The `[[/damage]]` enricher serves to make quick damage rolls that are specifically *not* damage checks. Like with damage checks, the damage-specific properties are supported, and the `formula` option is required.

Example: `[[/damage 2d4 damageMental]]` or the long form syntax `[[/damage formula="2d4" damageMental=true]]`.

## Status Enricher

The `[[status]]` enricher serves to help apply one of the six statuses with a given strength, for example `[[status sickness 6]]` or the long form `[[status id=sickness strength=6]]` will display as '[Sickness: 6]', and when clicked will apply Sickness with the given strength to all controlled tokens.

The available keys for `id` are `exhaustion`, `injury`, `muddled`, `poison`, `shock`, and `sickness`.
