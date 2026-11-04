extends GutTest
## Tests for the pure save/load logic.


func test_default_data_has_current_version() -> void:
	var data: Dictionary = SaveSerializer.default_data()
	assert_eq(data[SaveSerializer.KEY_VERSION], SaveSerializer.SAVE_VERSION)
	assert_eq(data[SaveSerializer.KEY_MONEY], 0)


func test_round_trip_keeps_values() -> void:
	var data: Dictionary = SaveSerializer.default_data()
	data[SaveSerializer.KEY_MONEY] = 250
	data[SaveSerializer.KEY_UPGRADES] = {"mower_deck": 2}
	data[SaveSerializer.KEY_BEST_GRADES] = {"hole_01": "Birdie"}
	var settings: Dictionary = data[SaveSerializer.KEY_SETTINGS]
	settings["invert_y"] = true

	var loaded: Dictionary = SaveSerializer.deserialize(SaveSerializer.serialize(data))

	assert_eq(loaded[SaveSerializer.KEY_MONEY], 250)
	assert_eq(loaded[SaveSerializer.KEY_UPGRADES], {"mower_deck": 2})
	assert_eq(loaded[SaveSerializer.KEY_BEST_GRADES], {"hole_01": "Birdie"})
	var loaded_settings: Dictionary = loaded[SaveSerializer.KEY_SETTINGS]
	assert_true(loaded_settings["invert_y"])


func test_money_is_int_after_load() -> void:
	var loaded: Dictionary = SaveSerializer.deserialize('{"money": 42.0}')
	assert_typeof(loaded[SaveSerializer.KEY_MONEY], TYPE_INT)


func test_garbage_text_gives_defaults() -> void:
	var loaded: Dictionary = SaveSerializer.deserialize("not json {{{")
	assert_eq(loaded, SaveSerializer.default_data())


func test_negative_money_clamped() -> void:
	var loaded: Dictionary = SaveSerializer.deserialize('{"money": -10}')
	assert_eq(loaded[SaveSerializer.KEY_MONEY], 0)


func test_wrong_setting_type_ignored() -> void:
	var loaded: Dictionary = SaveSerializer.deserialize(
		'{"settings": {"invert_y": "yes", "sfx_volume": 0.5}}')
	var settings: Dictionary = loaded[SaveSerializer.KEY_SETTINGS]
	assert_false(settings["invert_y"])
	assert_almost_eq(float(settings["sfx_volume"]), 0.5, 0.0001)


func test_missing_version_migrates() -> void:
	var migrated: Dictionary = SaveSerializer.migrate({"money": 5})
	assert_eq(migrated[SaveSerializer.KEY_VERSION], 1)
