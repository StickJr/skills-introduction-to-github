extends Node3D
## Empty test scene for M0: a lit ground plane and a fixed camera.
## Replaced by the greybox course chunk in M1.

const MAIN_MENU_PATH: String = "res://ui/MainMenu.tscn"

@export var ground_size: Vector2 = Vector2(40.0, 40.0)
@export var camera_position: Vector3 = Vector3(0.0, 8.0, 14.0)
@export var sun_rotation_degrees: Vector3 = Vector3(-35.0, -40.0, 0.0)
@export var sun_energy: float = 1.2


func _ready() -> void:
	_build_environment()
	_build_ground()
	_build_camera()
	_build_hint()


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("pause"):
		get_tree().change_scene_to_file(MAIN_MENU_PATH)


func _build_environment() -> void:
	var sky_mat := ProceduralSkyMaterial.new()
	sky_mat.sky_top_color = Palette.SKY_TOP
	sky_mat.sky_horizon_color = Palette.SKY_HORIZON
	sky_mat.ground_horizon_color = Palette.SKY_HORIZON
	var sky := Sky.new()
	sky.sky_material = sky_mat

	var env := Environment.new()
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC

	var world_env := WorldEnvironment.new()
	world_env.environment = env
	add_child(world_env)

	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = sun_rotation_degrees
	sun.light_energy = sun_energy
	sun.light_color = Palette.SKY_HORIZON
	sun.shadow_enabled = true
	add_child(sun)


func _build_ground() -> void:
	var plane := PlaneMesh.new()
	plane.size = ground_size
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Palette.GRASS
	plane.material = mat
	var ground := MeshInstance3D.new()
	ground.mesh = plane
	add_child(ground)


func _build_camera() -> void:
	var cam := Camera3D.new()
	add_child(cam)
	cam.position = camera_position
	cam.look_at(Vector3.ZERO)


func _build_hint() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)
	var label := Label.new()
	label.text = "M0 test scene - press Esc / Start to return to the menu"
	label.position = Vector2(24.0, 24.0)
	label.add_theme_color_override("font_color", Palette.INK)
	layer.add_child(label)
