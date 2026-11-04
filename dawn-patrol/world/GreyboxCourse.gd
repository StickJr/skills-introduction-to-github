extends Node3D
## M1 greybox course chunk: flat rough with a fairway, green, bunkers,
## pond, tee box, cart path, trees and a few jump-test props.
## Built in code; it gets replaced by the real Hole 01 in M6.

const PLAYER_SCENE: PackedScene = preload("res://player/Player.tscn")
const MAIN_MENU_PATH: String = "res://ui/MainMenu.tscn"

## Thin lift for flat patches so they don't z-fight with the ground.
const PATCH_LIFT: float = 0.01
const GROUND_THICKNESS: float = 1.0

@export var ground_size: Vector2 = Vector2(160.0, 110.0)
@export var player_spawn: Vector3 = Vector3(0.0, 0.5, 38.0)

var _materials: Dictionary = {}


func _ready() -> void:
	add_child(SunriseEnvironment.new())
	_build_course()
	var player: Player = PLAYER_SCENE.instantiate()
	player.position = player_spawn
	add_child(player)
	add_child(DebugOverlay.new())
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("pause"):
		if Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
			Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
		else:
			Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
			get_tree().change_scene_to_file(MAIN_MENU_PATH)
		get_viewport().set_input_as_handled()
	elif event.is_action_pressed("use_tool") and Input.mouse_mode != Input.MOUSE_MODE_CAPTURED:
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
		get_viewport().set_input_as_handled()


func _build_course() -> void:
	# Rough: the walkable ground everything sits on.
	_add_box(Vector3(ground_size.x, GROUND_THICKNESS, ground_size.y),
		Vector3(0.0, -GROUND_THICKNESS * 0.5, 0.0), Palette.GRASS_DARK)

	# Fairway runs from the tee (south, +Z) to the green (north, -Z).
	_add_patch(Vector2(22.0, 70.0), Vector3(0.0, PATCH_LIFT, 0.0), Palette.GRASS)
	_add_disc(9.0, Vector3(4.0, PATCH_LIFT * 2.0, -40.0), Palette.GRASS.lightened(0.15))
	_add_disc(4.0, Vector3(-9.0, PATCH_LIFT * 2.0, -34.0), Palette.SAND)
	_add_disc(3.2, Vector3(12.0, PATCH_LIFT * 2.0, -8.0), Palette.SAND)
	_add_disc(7.0, Vector3(-22.0, PATCH_LIFT * 2.0, 2.0), Palette.WATER)

	# Cart path along the east side.
	_add_patch(Vector2(2.5, 80.0), Vector3(18.0, PATCH_LIFT, 0.0), Palette.CREAM.darkened(0.25))

	# Tee box: a low step you can walk onto.
	_add_box(Vector3(6.0, 0.15, 5.0), Vector3(0.0, 0.075, 42.0), Palette.GRASS.lightened(0.1))

	# Flag on the green.
	_add_box(Vector3(0.06, 2.4, 0.06), Vector3(4.0, 1.2, -40.0), Palette.CREAM, false)
	_add_box(Vector3(0.8, 0.5, 0.04), Vector3(4.42, 2.15, -40.0), Palette.ACCENT, false)

	# Jump and camera-collision test props near the spawn.
	_add_box(Vector3(2.0, 0.6, 2.0), Vector3(-6.0, 0.3, 30.0), Palette.CREAM.darkened(0.1))
	_add_box(Vector3(2.0, 1.2, 2.0), Vector3(-9.0, 0.6, 30.0), Palette.CREAM.darkened(0.2))
	_add_box(Vector3(2.0, 1.8, 2.0), Vector3(-12.0, 0.9, 30.0), Palette.CREAM.darkened(0.3))
	var ramp_color: Color = Palette.CREAM.darkened(0.15)
	var ramp: StaticBody3D = _add_box(Vector3(3.0, 0.3, 8.0), Vector3(7.0, 0.9, 28.0), ramp_color)
	ramp.rotation_degrees.x = 13.0
	_add_box(Vector3(10.0, 3.0, 0.6), Vector3(-6.0, 1.5, 22.0), Palette.INK.lightened(0.4))

	# Tree lines on both sides of the hole.
	for i: int in range(8):
		var z: float = 35.0 - float(i) * 10.0
		_add_tree(Vector3(-30.0 - float(i % 2) * 4.0, 0.0, z))
		_add_tree(Vector3(28.0 + float((i + 1) % 2) * 4.0, 0.0, z - 5.0))


func _material(color: Color) -> StandardMaterial3D:
	if _materials.has(color):
		return _materials[color]
	var mat := StandardMaterial3D.new()
	mat.albedo_color = color
	mat.roughness = 1.0
	_materials[color] = mat
	return mat


## Solid box with collision. Pass collide = false for decoration.
func _add_box(size: Vector3, pos: Vector3, color: Color, collide: bool = true) -> StaticBody3D:
	var body := StaticBody3D.new()
	body.position = pos
	add_child(body)

	var mesh := BoxMesh.new()
	mesh.size = size
	mesh.material = _material(color)
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	body.add_child(mi)

	if collide:
		var shape := BoxShape3D.new()
		shape.size = size
		var cs := CollisionShape3D.new()
		cs.shape = shape
		body.add_child(cs)
	return body


## Flat rectangle with no collision (sits on the ground).
func _add_patch(size: Vector2, pos: Vector3, color: Color) -> void:
	var mesh := PlaneMesh.new()
	mesh.size = size
	mesh.material = _material(color)
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	mi.position = pos
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mi)


## Flat disc with no collision.
func _add_disc(radius: float, pos: Vector3, color: Color) -> void:
	var mesh := CylinderMesh.new()
	mesh.top_radius = radius
	mesh.bottom_radius = radius
	mesh.height = PATCH_LIFT
	mesh.radial_segments = 32
	mesh.material = _material(color)
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	mi.position = pos
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mi)


## Low-poly tree: trunk with collision plus a cone canopy.
func _add_tree(pos: Vector3) -> void:
	var trunk_height: float = 2.0
	var trunk: StaticBody3D = _add_box(Vector3(0.5, trunk_height, 0.5),
		pos + Vector3(0.0, trunk_height * 0.5, 0.0), Palette.INK.lightened(0.25))

	var cone := CylinderMesh.new()
	cone.top_radius = 0.0
	cone.bottom_radius = 2.2
	cone.height = 4.5
	cone.radial_segments = 7
	cone.material = _material(Palette.GRASS_DARK.darkened(0.25))
	var canopy := MeshInstance3D.new()
	canopy.mesh = cone
	canopy.position.y = trunk_height * 0.5 + cone.height * 0.5 - 0.3
	trunk.add_child(canopy)
