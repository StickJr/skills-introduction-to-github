extends Node
## Audio buses and volume control. Sounds arrive in M8; for now this
## makes sure the Music and SFX buses exist and applies saved volumes.

const MASTER_BUS: StringName = &"Master"
const MUSIC_BUS: StringName = &"Music"
const SFX_BUS: StringName = &"SFX"


func _ready() -> void:
	_ensure_bus(MUSIC_BUS)
	_ensure_bus(SFX_BUS)
	apply_settings(GameState.settings)


func apply_settings(settings: Dictionary) -> void:
	set_bus_volume(MASTER_BUS, float(settings.get("master_volume", 1.0)))
	set_bus_volume(MUSIC_BUS, float(settings.get("music_volume", 1.0)))
	set_bus_volume(SFX_BUS, float(settings.get("sfx_volume", 1.0)))


## linear is 0.0..1.0
func set_bus_volume(bus_name: StringName, linear: float) -> void:
	var index: int = AudioServer.get_bus_index(bus_name)
	if index < 0:
		return
	AudioServer.set_bus_volume_db(index, linear_to_db(clampf(linear, 0.0, 1.0)))


func _ensure_bus(bus_name: StringName) -> void:
	if AudioServer.get_bus_index(bus_name) >= 0:
		return
	AudioServer.add_bus()
	var index: int = AudioServer.bus_count - 1
	AudioServer.set_bus_name(index, bus_name)
	AudioServer.set_bus_send(index, MASTER_BUS)
