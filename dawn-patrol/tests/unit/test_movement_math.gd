extends GutTest

const EPS: float = 0.0001


func test_accelerates_toward_target() -> void:
	var v: Vector2 = MovementMath.step_horizontal(Vector2.ZERO, Vector2(5, 0), 10.0, 20.0, 0.1)
	assert_almost_eq(v.x, 1.0, EPS)


func test_does_not_overshoot() -> void:
	var v: Vector2 = MovementMath.step_horizontal(Vector2(4.9, 0), Vector2(5, 0), 10.0, 20.0, 0.1)
	assert_almost_eq(v.x, 5.0, EPS)


func test_no_input_uses_decel() -> void:
	var v: Vector2 = MovementMath.step_horizontal(Vector2(5, 0), Vector2.ZERO, 10.0, 20.0, 0.1)
	assert_almost_eq(v.x, 3.0, EPS)


func test_above_target_speed_uses_decel() -> void:
	var v: Vector2 = MovementMath.step_horizontal(Vector2(8, 0), Vector2(5, 0), 10.0, 20.0, 0.1)
	assert_almost_eq(v.x, 6.0, EPS)


func test_reversing_uses_accel() -> void:
	var v: Vector2 = MovementMath.step_horizontal(Vector2(5, 0), Vector2(-5, 0), 10.0, 20.0, 0.1)
	assert_almost_eq(v.x, 4.0, EPS)


func test_forward_input_at_zero_yaw_points_minus_z() -> void:
	var d: Vector2 = MovementMath.input_to_world(Vector2(0, -1), 0.0)
	assert_almost_eq(d.x, 0.0, EPS)
	assert_almost_eq(d.y, -1.0, EPS)


func test_right_input_at_zero_yaw_points_plus_x() -> void:
	var d: Vector2 = MovementMath.input_to_world(Vector2(1, 0), 0.0)
	assert_almost_eq(d.x, 1.0, EPS)
	assert_almost_eq(d.y, 0.0, EPS)


func test_forward_follows_yaw() -> void:
	# Yaw of +90 deg (turned left) means forward is -X.
	var d: Vector2 = MovementMath.input_to_world(Vector2(0, -1), PI / 2.0)
	assert_almost_eq(d.x, -1.0, EPS)
	assert_almost_eq(d.y, 0.0, EPS)


func test_smooth_factor_zero_sharpness_is_instant() -> void:
	assert_eq(MovementMath.smooth_factor(0.0, 0.016), 1.0)


func test_smooth_factor_in_range() -> void:
	var f: float = MovementMath.smooth_factor(10.0, 0.016)
	assert_between(f, 0.0, 1.0)
