# KajChole planner

KajChole creates one feasible plan for a day from known power-cut periods and a set of jobs. It is a planning tool, not an outage forecast or utility schedule.

## Language

**Planning day**:
The single 24-hour period from 00:00 through 24:00 in which jobs are placed.
_Avoid_: Calendar, shift

**Outage window**:
A user-entered period during the planning day when grid power is unavailable. A window whose end time is earlier than its start crosses midnight and is split at the day boundary.
_Avoid_: Forecast, official schedule, blackout prediction

**Job**:
A named piece of work with a duration and one declared power need.
_Avoid_: Task, event, appliance

**Power need**:
The power source a job requires: grid power, generator power, or no power.
_Avoid_: Priority, energy type

**Placement**:
The start and end minute assigned to a job within the planning day.
_Avoid_: Booking, recommendation

**Planned job**:
A job with a placement that satisfies its power constraint and does not overlap another planned job.
_Avoid_: Completed job, scheduled outage

**Unplaced job**:
A job that cannot fit inside the remaining planning day without breaking its power constraint.
_Avoid_: Failed job, invalid job

**Generator minutes**:
The sum of the durations of all generator-powered jobs, whether or not they overlap an outage window.
_Avoid_: Fuel use, generator runtime estimate

