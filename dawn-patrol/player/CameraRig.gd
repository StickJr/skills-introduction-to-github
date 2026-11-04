class_name CameraRig
extends Node3D
## Third-person orbit camera: yaw (this node) -> pitch node -> SpringArm3D -> Camera3D.
## Runs as top_level and follows the target's interpolated transform in
## _process, so it stays smooth at any monitor refresh rate.

@export_group("Follow")
## Point on the player the camera orbits around.
@export var pivot_offset: Vector3 = Vector3(0.0, 1.5, 0.0)
## Higher = tighter follow. 0 = rigid.
@export var follow_sharpness: float = 18.0

@export_group("Boom")
@export var spring_length: float = 5.0
@export var collision_margin: float = 0.25
## Sideways camera offset; positive = over the right shoulder.
@export var shoulder_offset: float = 0.0

@export_group("Look")
## Degrees per pixel of mouse motion (times the settings multiplier).
@export var mouse_sensitivity: float = 0.15
## Degrees per second at full stick tilt.
@export var stick_look_speed: float = 160.0
@export var min_pitch_degrees: float = -65.0
@export var max_pitch_degrees: float = 25.0
@export var start_pitch_degrees: float = -18.0

@export_group("FOV")
@export var base_fov: float = 70.0
## Extra FOV at full sprint.
@export var sprint_fov_boost: float = 8.0
@export var fov_sharpness: float = 6.0

var target: Node3D
var camera: Camera3D
var _pitch_node: Node3D
var _spring: SpringArm3D
var _yaw: float = 0.0
var _pitch: float = 0.0
var _sprint_amount: float = 0.0


func _ready() -> void:
	top_level = true
	# Moved in _process from interpolated data, so don't interpolate again.
	physics_interpolation_mode = Node.PHYSICS_INTERPOLATION_MODE_OFF
	_pitch = deg_to_rad(start_pitch_degrees)

	_pitch_node = Node3D.new()
	add_child(_pitch_node)

	_spring = SpringArm3D.new()
	_spring.spring_length = spring_length
	_spring.margin = collision_margin
	var probe := SphereShape3D.new()
	probe.radius = collision_margin
	_spring.shape = probe
	_spring.position.x = shoulder_offset
	_pitch_node.add_child(_spring)

	camera = Camera3D.new()
	camera.fov = base_fov
	camera.current = true
	_spring.add_child(camera)
	_apply_rotation()


## Called by the owner (Player) once it's ready.
func setup(follow_target: CollisionObject3D) -> void:
	target = follow_target
	_spring.add_excluded_object(follow_target.get_rid())
	global_position = follow_target.global_position + pivot_offset
	_yaw = follow_target.global_rotation.y
	_apply_rotation()


func get_yaw() -> float:
	return _yaw


## 0..1, how hard the player is sprinting. Drives the FOV kick.
func set_sprint_amount(amount: float) -> void:
	_sprint_amount = clampf(amount, 0.0, 1.0)


func _unhandled_input(event: InputEvent) -> void:
	if Input.mouse_mode != Input.MOUSE_MODE_CAPTURED:
		return
	var motion := event as InputEventMouseMotion
	if motion == null:
		return
	var sens: float = mouse_sensitivity * _settings_sensitivity()
	_yaw -= deg_to_rad(motion.relative.x * sens)
	_pitch -= deg_to_rad(motion.relative.y * sens) * _invert_sign()
	_apply_rotation()


func _process(delta: float) -> void:
	var stick := Input.get_vector("look_left", "look_right", "look_up", "look_down")
	if not stick.is_zero_approx():
		var step: float = deg_to_rad(stick_look_speed) * delta * _settings_sensitivity()
		_yaw -= stick.x * step
		_pitch -= stick.y * step * _invert_sign()
		_apply_rotation()

	if target != null:
		var goal: Vector3 = target.get_global_transform_interpolated().origin + pivot_offset
		global_position = global_position.lerp(goal, MovementMath.smooth_factor(follow_sharpness, delta))

	var goal_fov: float = base_fov + sprint_fov_boost * _sprint_amount
	camera.fov = lerpf(camera.fov, goal_fov, MovementMath.smooth_factor(fov_sharpness, delta))


func _apply_rotation() -> void:
	_pitch = clampf(_pitch, deg_to_rad(min_pitch_degrees), deg_to_rad(max_pitch_degrees))
	rotation = Vector3(0.0, _yaw, 0.0)
	_pitch_node.rotation = Vector3(_pitch, 0.0, 0.0)


func _settings_sensitivity() -> float:
	return float(GameState.settings.get("mouse_sensitivity", 1.0))


func _invert_sign() -> float:
	return -1.0 if bool(GameState.settings.get("invert_y", false)) else 1.0
