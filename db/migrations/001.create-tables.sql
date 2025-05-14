create table public.profiles (
                                 id uuid not null,
                                 username character varying(255) null,
                                 age integer null,
                                 height double precision null,
                                 goal_weight double precision null,
                                 goal character varying(255) null,
                                 show_rest_time boolean null default false,
                                 monthly_progress_level integer null default 1,
                                 created_at timestamp with time zone null default CURRENT_TIMESTAMP,
                                 updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
                                 onboarding_completed boolean null default false,
                                 constraint profiles_pkey primary key (id),
                                 constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
                                 constraint profiles_monthly_progress_level_fkey foreign KEY (monthly_progress_level) references progress_levels (level_id)
) TABLESPACE pg_default;

create index IF not exists idx_profiles_username on public.profiles using btree (username) TABLESPACE pg_default;

create table public.progress_levels (
                                        level_id serial not null,
                                        level_name character varying(255) not null,
                                        workouts_required integer not null,
                                        minutes_required integer not null,
                                        calories_required integer not null,
                                        constraint progress_levels_pkey primary key (level_id)
) TABLESPACE pg_default;

create table public.user_weights (
                                     id uuid not null default gen_random_uuid (),
                                     user_id uuid not null,
                                     weight double precision not null,
                                     measured_at timestamp with time zone null default CURRENT_TIMESTAMP,
                                     constraint user_weights_pkey primary key (id),
                                     constraint user_weights_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.workoutcardio (
                                      workout_cardio_id serial not null,
                                      workoutid integer null,
                                      type character varying(50) not null,
                                      duration integer null,
                                      distance double precision null,
                                      notes text null,
                                      constraint workoutcardio_pkey primary key (workout_cardio_id),
                                      constraint workoutcardio_workoutid_fkey foreign KEY (workoutid) references workouts (workoutid) on delete CASCADE,
                                      constraint workoutcardio_type_check check (
                                          (
                                              (type)::text = any (
                                          (
                                          array[
                                          'running'::character varying,
                                          'indoor rowing'::character varying,
                                          'stair stepper'::character varying,
                                          'indoor bicycle'::character varying
                                          ]
                                          )::text[]
                                          )
)
    )
  ) TABLESPACE pg_default;

create table public.workoutexercises (
                                         workout_exercise_id serial not null,
                                         workoutid integer null,
                                         exercise_name character varying(255) not null,
                                         sets integer not null,
                                         reps character varying(255) not null,
                                         weight double precision not null,
                                         notes text null,
                                         constraint workoutexercises_pkey primary key (workout_exercise_id),
                                         constraint workoutexercises_workoutid_fkey foreign KEY (workoutid) references workouts (workoutid) on delete CASCADE,
                                         constraint workoutexercises_sets_check check ((sets > 0))
) TABLESPACE pg_default;

create table public.workouts (
                                 workoutid serial not null,
                                 profileid uuid null,
                                 workout_date timestamp with time zone null default CURRENT_TIMESTAMP,
                                 workout_name character varying(255) null,
                                 notes text null,
                                 created_at timestamp with time zone null default CURRENT_TIMESTAMP,
                                 updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
                                 constraint workouts_pkey primary key (workoutid),
                                 constraint workouts_profileid_fkey foreign KEY (profileid) references profiles (id)
) TABLESPACE pg_default;

create index IF not exists idx_workouts_profileid on public.workouts using btree (profileid) TABLESPACE pg_default;