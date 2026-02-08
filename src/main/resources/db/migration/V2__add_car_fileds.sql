ALTER TABLE public.car
    ADD COLUMN IF NOT EXISTS mileage integer,
    ADD COLUMN IF NOT EXISTS release_year integer,
    ADD COLUMN IF NOT EXISTS owner varchar(200);

ALTER TABLE public.car
    ADD CONSTRAINT car_mileage_non_negative CHECK (mileage IS NULL OR mileage >= 0);

ALTER TABLE public.car
    ADD CONSTRAINT car_release_year_range CHECK (
        release_year IS NULL
            OR (release_year >= 1900 AND release_year <= EXTRACT(YEAR FROM now())::int + 1)
        );
