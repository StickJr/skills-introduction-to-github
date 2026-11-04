class_name Player
extends CharacterBody3D
## Third-person groundskeeper controller. Every feel number is exported
## so it can be tuned in the Inspector while the game runs.

const GROUP: StringName = &"player"
const BODY_RADIUS: float = 0.4
const BODY_HEIGHT: float = 1.8
const BRIM_SIZE: Vector3 = Vector3(0.36, 0.06, 0.3)
const BRIM_POSITION: Vector3 = Vector3(0.0, 1.62, -0.42)
const MIN_FACING_SPEED: float = 0.1

@export_group("Speed")
@export var walk_speed: float = 5.0
@export var sprint_speed: float = 8.5

@export_group("Acceleration")
## Units/s^2 when speeding up or turning on the ground.
@export var ground_acceleration: float = 45.0
## Units/s^2 when letting go of the stick on the ground.
@export var ground_deceleration: float = 60.0
@export var air_acceleration: float = 14.0
@export var air_deceleration: float = 4.0
## Scales acceleration by current speed (x = speed / max speed, 0..1).
## A falling curve gives a quick launch that eases into top speed.
@export var acceleration_curve: Curve

@export_group("Jump")
@export var jump_velocity: float = 5.5
## Gravity multiplier while falling. Above 1 makes jumps feel less floaty.
@export var fall_gravity_multiplier: float = 1.7
## Upward speed is multiplied by this when jump is released early.
@export var jump_cut_multiplier: float = 0.5
## Grace time to still jump after walking off a ledge.
@export var coyote_time: float = 0.12
## Jump pressed this long before landing still counts.
@export var jump_buffer_time: float = 0.12
@export var max_fall_speed: float = 30.0

@export_group("Turning")
## How fast the body turns to face movement. Higher = snappier.
@export var turn_sharpness: float = 14.0

@export_group("Safety")
## Fall below this height and you respawn at the start point.
@export var respawn_height: float = -20.0

var is_sprinting: bool = false
var _gravity: float = 0.0
var _coyote_timer: float = 0.0
var _jump_buffer_timer: float = 0.0
var _spawn_transform: Transform3D

@onready var camera_rig: CameraRig = $CameraRig
@onready var tool_belt: ToolBelt = $ToolBelt
@onready var model: Node3D = $Model


func _ready() -> void:
	add_to_group(GROUP)
	_gravity = float(ProjectSettings.get_setting("physics/3d/default_gravity"))
	_spawn_transform = global_transform
	_build_model()
	camera_rig.setup(self)


func get_max_speed() -> float:
	var base: float = sprint_speed if is_sprinting else walk_speed
	return base * tool_belt.get_speed_multiplier()


func get_horizontal_speed() -> float:
	return Vector2(velocity.x, velocity.z).length()


func _physics_process(delta: float) -> void:
	_update_timers(delta)
	_apply_gravity(delta)
	_handle_jump()
	_apply_horizontal(delta)
	move_and_slide()
	_face_movement(delta)
	camera_rig.set_sprint_amount(_sprint_fraction())
	if global_position.y < respawn_height:
		_respawn()


func _update_timers(delta: float) -> void:
	if is_on_floor():
		_coyote_timer = coyote_time
	else:
		_coyote_timer = maxf(_coyote_timer - delta, 0.0)
	if Input.is_action_just_pressed("jump"):
		_jump_buffer_timer = jump_buffer_time
	else:
		_jump_buffer_timer = maxf(_jump_buffer_timer - delta, 0.0)


func _apply_gravity(delta: float) -> void:
	if is_on_floor():
		return
	var multiplier: float = fall_gravity_multiplier if velocity.y < 0.0 else 1.0
	velocity.y = maxf(velocity.y - _gravity * multiplier * delta, -max_fall_speed)


func _handle_jump() -> void:
	if _jump_buffer_timer > 0.0 and _coyote_timer > 0.0:
		velocity.y = jump_velocity
		_jump_buffer_timer = 0.0
		_coyote_timer = 0.0
	elif Input.is_action_just_released("jump") and velocity.y > 0.0:
		velocity.y *= jump_cut_multiplier


func _apply_horizontal(delta: float) -> void:
	var input := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	is_sprinting = Input.is_action_pressed("sprint") and not input.is_zero_approx()
	var max_speed: float = get_max_speed()
	var wish: Vector2 = MovementMath.input_to_world(input, camera_rig.get_yaw())
	var target: Vector2 = wish * max_speed

	var current := Vector2(velocity.x, velocity.z)
	var on_floor: bool = is_on_floor()
	var accel: float = ground_acceleration if on_floor else air_acceleration
	var decel: float = ground_deceleration if on_floor else air_deceleration
	if acceleration_curve != null and max_speed > 0.0:
		accel *= acceleration_curve.sample_baked(clampf(current.length() / max_speed, 0.0, 1.0))

	var next: Vector2 = MovementMath.step_horizontal(current, target, accel, decel, delta)
	velocity.x = next.x
	velocity.z = next.y


func _face_movement(delta: float) -> void:
	var flat := Vector2(velocity.x, velocity.z)
	if flat.length() < MIN_FACING_SPEED:
		return
	var goal_yaw: float = atan2(-flat.x, -flat.y)
	var t: float = MovementMath.smooth_factor(turn_sharpness, delta)
	model.rotation.y = lerp_angle(model.rotation.y, goal_yaw, t)


func _sprint_fraction() -> float:
	if not is_sprinting or sprint_speed <= walk_speed:
		return 0.0
	return clampf((get_horizontal_speed() - walk_speed) / (sprint_speed - walk_speed), 0.0, 1.0)


func _respawn() -> void:
	global_transform = _spawn_transform
	velocity = Vector3.ZERO
	reset_physics_interpolation()


## Greybox body: a capsule with a cap brim so facing is readable.
func _build_model() -> void:
	var body_mat := StandardMaterial3D.new()
	body_mat.albedo_color = Palette.ACCENT
	var cap_mat := StandardMaterial3D.new()
	cap_mat.albedo_color = Palette.CREAM

	var body_mesh := CapsuleMesh.new()
	body_mesh.radius = BODY_RADIUS
	body_mesh.height = BODY_HEIGHT
	body_mesh.material = body_mat
	var body := MeshInstance3D.new()
	body.mesh = body_mesh
	body.position.y = BODY_HEIGHT * 0.5
	model.add_child(body)

	var brim_mesh := BoxMesh.new()
	brim_mesh.size = BRIM_SIZE
	brim_mesh.material = cap_mat
	var brim := MeshInstance3D.new()
	brim.mesh = brim_mesh
	brim.position = BRIM_POSITION
	model.add_child(brim)
