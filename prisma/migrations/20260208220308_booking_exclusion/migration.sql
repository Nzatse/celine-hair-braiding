-- Prevent overlapping appointments at the database level.
-- NOTE: We store Appointment.endAt as the *busy end* (service duration + buffer)
-- so this exclusion constraint also enforces buffers.

ALTER TABLE "Appointment"
ADD CONSTRAINT "Appointment_end_after_start"
CHECK ("endAt" > "startAt");

ALTER TABLE "Appointment"
ADD CONSTRAINT "Appointment_no_overlap_confirmed"
EXCLUDE USING gist (
	tstzrange("startAt", "endAt", '[)') WITH &&
)
WHERE (status = 'CONFIRMED');