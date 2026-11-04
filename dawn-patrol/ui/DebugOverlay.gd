class_name DebugOverlay
extends CanvasLayer
## F3 overlay: FPS, frame times, player velocity, floor state, current tool.

const MS_PER_SECOND: float = 1000.0
const LAYER_ON_TOP: int = 100

@export var start_visible: bool = false
@export var refresh_interval: float = 0.1
@export var font_size: int = 16
@export var margin: Vector2 = Vector2(16.0, 16.0)

var _label: Label
var _panel: PanelContainer
var _refresh_timer: float = 0.0
var _tool_name: StringName = ToolBelt.NO_TOOL


func _ready() -> void:
	layer = LAYER_ON_TOP
	_panel = PanelContainer.new()
	_panel.position = margin
	_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_panel)
	_label = Label.new()
	_label.add_theme_font_size_override("font_size", font_size)
	_panel.add_child(_label)
	_panel.visible = start_visible
	Events.tool_changed.connect(_on_tool_changed)


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("toggle_debug"):
		_panel.visible = not _panel.visible
		get_viewport().set_input_as_handled()


func _process(delta: float) -> void:
	if not _panel.visible:
		return
	_refresh_timer -= delta
	if _refresh_timer > 0.0:
		return
	_refresh_timer = refresh_interval
	_label.text = _build_text()


func _build_text() -> String:
	var lines: PackedStringArray = []
	lines.append("FPS: %d" % Engine.get_frames_per_second())
	lines.append("Frame: %.2f ms  Physics: %.2f ms" % [
		Performance.get_monitor(Performance.TIME_PROCESS) * MS_PER_SECOND,
		Performance.get_monitor(Performance.TIME_PHYSICS_PROCESS) * MS_PER_SECOND,
	])
	var player := get_tree().get_first_node_in_group(Player.GROUP) as Player
	if player != null:
		var v: Vector3 = player.velocity
		lines.append("Velocity: (%.2f, %.2f, %.2f)" % [v.x, v.y, v.z])
		lines.append("Speed: %.2f / %.2f m/s%s" % [
			player.get_horizontal_speed(), player.get_max_speed(),
			"  SPRINT" if player.is_sprinting else ""])
		lines.append("On floor: %s" % ("yes" if player.is_on_floor() else "no"))
		lines.append("Tool: %s" % player.tool_belt.current_tool_name)
	else:
		lines.append("Tool: %s" % _tool_name)
	return "\n".join(lines)


func _on_tool_changed(tool_name: StringName) -> void:
	_tool_name = tool_name
