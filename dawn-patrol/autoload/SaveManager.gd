extends Node
## Reads and writes user://save.json. The format logic lives in
## SaveSerializer; this node only handles files.

const SAVE_PATH: String = "user://save.json"


func _ready() -> void:
	load_game()


func save_game() -> bool:
	var file: FileAccess = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		push_error("Could not write save: %s" % error_string(FileAccess.get_open_error()))
		return false
	file.store_string(SaveSerializer.serialize(GameState.to_save_data()))
	return true


func load_game() -> void:
	if not FileAccess.file_exists(SAVE_PATH):
		GameState.apply_save_data(SaveSerializer.default_data())
		return
	var text: String = FileAccess.get_file_as_string(SAVE_PATH)
	GameState.apply_save_data(SaveSerializer.deserialize(text))
