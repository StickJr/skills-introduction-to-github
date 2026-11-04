class_name ToolBelt
extends Node
## Holds the player's tools and which one is equipped.
## M1: no tools yet, so it only reports "None". Tools arrive in M2/M3.

const NO_TOOL: StringName = &"None"

var current_tool_name: StringName = NO_TOOL


## Movement multiplier from the equipped tool (heavy tools slow you down).
func get_speed_multiplier() -> float:
	return 1.0
