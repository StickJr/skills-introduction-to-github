extends Control
## Title screen. Built in code to keep the .tscn tiny.

const TEST_SCENE_PATH: String = "res://world/TestScene.tscn"

@export var title_font_size: int = 72
@export var subtitle_font_size: int = 22
@export var button_font_size: int = 28
@export var button_min_size: Vector2 = Vector2(280.0, 56.0)
@export var spacing: int = 18

var _play_button: Button


func _ready() -> void:
	_build()
	_play_button.grab_focus()  # lets gamepad/keyboard users start right away


func _build() -> void:
	var bg := ColorRect.new()
	bg.color = Palette.SKY_TOP
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(center)

	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", spacing)
	box.alignment = BoxContainer.ALIGNMENT_CENTER
	center.add_child(box)

	var title := Label.new()
	title.text = "Dawn Patrol"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", title_font_size)
	title.add_theme_color_override("font_color", Palette.CREAM)
	title.add_theme_color_override("font_shadow_color", Palette.INK)
	title.add_theme_constant_override("shadow_offset_y", 3)
	box.add_child(title)

	var subtitle := Label.new()
	subtitle.text = "Get the course ready before the first tee time."
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	subtitle.add_theme_font_size_override("font_size", subtitle_font_size)
	subtitle.add_theme_color_override("font_color", Palette.INK)
	box.add_child(subtitle)

	_play_button = _make_button("Start Shift", _on_play_pressed)
	box.add_child(_play_button)
	box.add_child(_make_button("Quit", _on_quit_pressed))


func _make_button(label: String, callback: Callable) -> Button:
	var button := Button.new()
	button.text = label
	button.custom_minimum_size = button_min_size
	button.add_theme_font_size_override("font_size", button_font_size)
	button.pressed.connect(callback)
	return button


func _on_play_pressed() -> void:
	get_tree().change_scene_to_file(TEST_SCENE_PATH)


func _on_quit_pressed() -> void:
	SaveManager.save_game()
	get_tree().quit()
