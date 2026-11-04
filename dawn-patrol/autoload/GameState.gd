extends Node
## Runtime game state: money, upgrade levels, best grades, settings.
## SaveManager reads and writes this through to_save_data / apply_save_data.

var money: int = 0:
	set(value):
		money = maxi(value, 0)
		Events.money_changed.emit(money)

## upgrade_id (String) -> level (int)
var upgrades: Dictionary = {}
## hole_id (String) -> grade name (String)
var best_grades: Dictionary = {}
var settings: Dictionary = SaveSerializer.DEFAULT_SETTINGS.duplicate()


func add_money(amount: int) -> void:
	money += amount


func get_upgrade_level(upgrade_id: String) -> int:
	return int(upgrades.get(upgrade_id, 0))


func is_zen_mode() -> bool:
	return bool(settings.get("zen_mode", false))


func to_save_data() -> Dictionary:
	return {
		SaveSerializer.KEY_MONEY: money,
		SaveSerializer.KEY_UPGRADES: upgrades.duplicate(),
		SaveSerializer.KEY_BEST_GRADES: best_grades.duplicate(),
		SaveSerializer.KEY_SETTINGS: settings.duplicate(),
	}


func apply_save_data(data: Dictionary) -> void:
	upgrades = data[SaveSerializer.KEY_UPGRADES]
	best_grades = data[SaveSerializer.KEY_BEST_GRADES]
	settings = data[SaveSerializer.KEY_SETTINGS]
	money = int(data[SaveSerializer.KEY_MONEY])
