class_name SaveSerializer
extends RefCounted
## Pure save-data logic: converts game state to/from JSON text.
## No scene-tree or file access here, so it can be unit tested.

const SAVE_VERSION: int = 1

const KEY_VERSION: String = "save_version"
const KEY_MONEY: String = "money"
const KEY_UPGRADES: String = "upgrades"
const KEY_BEST_GRADES: String = "best_grades"
const KEY_SETTINGS: String = "settings"

const DEFAULT_SETTINGS: Dictionary = {
	"master_volume": 1.0,
	"music_volume": 0.8,
	"sfx_volume": 1.0,
	"mouse_sensitivity": 1.0,
	"invert_y": false,
	"zen_mode": false,
}


## Returns a fresh save dictionary with every field at its default.
static func default_data() -> Dictionary:
	return {
		KEY_VERSION: SAVE_VERSION,
		KEY_MONEY: 0,
		KEY_UPGRADES: {},
		KEY_BEST_GRADES: {},
		KEY_SETTINGS: DEFAULT_SETTINGS.duplicate(),
	}


static func serialize(data: Dictionary) -> String:
	var out: Dictionary = data.duplicate(true)
	out[KEY_VERSION] = SAVE_VERSION
	return JSON.stringify(out, "\t")


## Parses JSON text into a complete save dictionary.
## Missing or invalid fields fall back to defaults, so a corrupt or old
## save never crashes the game.
static func deserialize(text: String) -> Dictionary:
	var result: Dictionary = default_data()
	var parsed: Variant = JSON.parse_string(text)
	if not (parsed is Dictionary):
		return result
	var src: Dictionary = parsed
	src = migrate(src)

	# JSON numbers come back as floats, so cast explicitly.
	var money: Variant = src.get(KEY_MONEY, 0)
	if money is float or money is int:
		result[KEY_MONEY] = maxi(int(money), 0)

	var upgrades: Variant = src.get(KEY_UPGRADES, {})
	if upgrades is Dictionary:
		var clean_upgrades: Dictionary = {}
		var upgrades_dict: Dictionary = upgrades
		for key: Variant in upgrades_dict:
			var level: Variant = upgrades_dict[key]
			if level is float or level is int:
				clean_upgrades[str(key)] = int(level)
		result[KEY_UPGRADES] = clean_upgrades

	var grades: Variant = src.get(KEY_BEST_GRADES, {})
	if grades is Dictionary:
		var clean_grades: Dictionary = {}
		var grades_dict: Dictionary = grades
		for key: Variant in grades_dict:
			clean_grades[str(key)] = str(grades_dict[key])
		result[KEY_BEST_GRADES] = clean_grades

	var settings: Variant = src.get(KEY_SETTINGS, {})
	if settings is Dictionary:
		var merged: Dictionary = result[KEY_SETTINGS]
		var settings_dict: Dictionary = settings
		for key: String in DEFAULT_SETTINGS:
			if settings_dict.has(key) and typeof(settings_dict[key]) == typeof(DEFAULT_SETTINGS[key]):
				merged[key] = settings_dict[key]
		result[KEY_SETTINGS] = merged

	return result


## Upgrades older save layouts to the current one. Add a step here
## every time SAVE_VERSION goes up.
static func migrate(src: Dictionary) -> Dictionary:
	var version: int = int(src.get(KEY_VERSION, 0))
	var out: Dictionary = src.duplicate(true)
	if version < 1:
		# Version 0 had no version field; layout is otherwise the same.
		out[KEY_VERSION] = 1
	return out
