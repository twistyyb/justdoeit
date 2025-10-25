-- Database schema for Just Doe It application
-- This file contains the table definitions for the application

create table public.locations (
  id uuid not null default gen_random_uuid (),
  name character varying(255) not null,
  shortloc character varying(100) not null,
  summary text null,
  coordinate_x numeric null,
  coordinate_y numeric null,
  constraint locations_pkey primary key (id),
  constraint locations_id_key unique (id)
) TABLESPACE pg_default;

create table public.sessions (
  id uuid not null default gen_random_uuid (),
  locationid uuid not null,
  inputtime timestamp with time zone not null,
  duration integer not null,
  rating numeric(3, 1) not null,
  cleanliness integer not null,
  comment text null,
  outletavailability boolean not null,
  creators uuid[] null,
  constraint sessions_pkey primary key (id),
  constraint sessions_cleanliness_check check (
    (
      (cleanliness >= 1)
      and (cleanliness <= 10)
    )
  )
) TABLESPACE pg_default;