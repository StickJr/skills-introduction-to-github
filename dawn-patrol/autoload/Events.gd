extends Node
## Global signal bus. Systems emit and listen here so they never need
## direct references to each other.
##
## The bus itself never emits these signals, so the "unused signal"
## warning is silenced per signal.

@warning_ignore("unused_signal")
signal tool_changed(tool_name: StringName)

## category is one of: grass, sand, leaves, divots, trash, pond.
@warning_ignore("unused_signal")
signal item_cleaned(category: StringName, value: float)

## percent is 0.0..1.0 for the given category.
@warning_ignore("unused_signal")
signal surface_progress_changed(category: StringName, percent: float)

@warning_ignore("unused_signal")
signal timer_tick(seconds_left: float)

## result holds the scorecard data for the finished hole.
@warning_ignore("unused_signal")
signal hole_finished(result: Dictionary)

@warning_ignore("unused_signal")
signal money_changed(new_amount: int)
