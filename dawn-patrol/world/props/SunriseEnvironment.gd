class_name SunriseEnvironment
extends Node3D
## Sky, ambient light and a low warm sun. A first pass; the full
## lighting/fog pass happens in M8.

@export var sun_rotation_degrees: Vector3 = Vector3(-28.0, -50.0, 0.0)
@export var sun_energy: float = 1.2
@export var ambient_energy: float = 0.8
@export var shadow_max_distance: float = 80.0


func _ready() -> void:
	var sky_mat := ProceduralSkyMaterial.new()
	sky_mat.sky_top_color = Palette.SKY_TOP
	sky_mat.sky_horizon_color = Palette.SKY_HORIZON
	sky_mat.ground_horizon_color = Palette.SKY_HORIZON
	sky_mat.ground_bottom_color = Palette.GRASS_DARK
	var sky := Sky.new()
	sky.sky_material = sky_mat

	var env := Environment.new()
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.ambient_light_energy = ambient_energy
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC

	var world_env := WorldEnvironment.new()
	world_env.environment = env
	add_child(world_env)

	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = sun_rotation_degrees
	sun.light_energy = sun_energy
	sun.light_color = Palette.SKY_HORIZON
	sun.shadow_enabled = true
	sun.directional_shadow_max_distance = shadow_max_distance
	add_child(sun)
