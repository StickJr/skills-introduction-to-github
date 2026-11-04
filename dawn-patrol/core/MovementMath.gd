class_name MovementMath
extends RefCounted
## Pure movement helpers used by Player. Kept free of nodes so they can
## be unit tested.


## Moves the current horizontal velocity toward the target velocity.
## Uses accel when speeding up or turning, decel when slowing down
## (no input, or above the target speed, e.g. after releasing sprint).
static func step_horizontal(
		current: Vector2, target: Vector2, accel: float, decel: float, delta: float
) -> Vector2:
	var shorter: bool = target.length_squared() < current.length_squared()
	var slowing: bool = shorter and target.dot(current) >= 0.0
	var no_input: bool = target.is_zero_approx()
	var rate: float = decel if (no_input or slowing) else accel
	return current.move_toward(target, rate * delta)


## Converts 2D stick/WASD input into a world-space XZ direction relative
## to a camera yaw (radians). Input y is "back" positive, like
## Input.get_vector(left, right, forward, back).
static func input_to_world(input: Vector2, yaw: float) -> Vector2:
	var forward := Vector2(-sin(yaw), -cos(yaw))
	var right := Vector2(cos(yaw), -sin(yaw))
	return right * input.x - forward * input.y


## Frame-rate independent smoothing factor for lerp().
static func smooth_factor(sharpness: float, delta: float) -> float:
	if sharpness <= 0.0:
		return 1.0
	return 1.0 - exp(-sharpness * delta)
