-- Database schema snapshot (REFERENCE ONLY - NOT A MIGRATION)
-- Generated: 2026-05-19T16:58:12.927Z
-- This is a point-in-time snapshot of your database schema.
-- Use this as a reference, backup, or for documenting schema changes.
-- DO NOT run this as a migration — use actual migration files instead.

-- To use this to recreate a database from scratch:
--   psql -d <new_db> -f backups/2026-05-19_schema_snapshot.sql


--
-- PostgreSQL database dump
--

\restrict ZShPJ15VZOXYJg6XcLssFKoIaSmLVjfmf9UWzo9zs21YllzH7DUkUDjU9xpmfIy

-- Dumped from database version 17.8 (9c8634e)
-- Dumped by pg_dump version 18.4 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: device_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.device_status AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'REVOKED'
);


ALTER TYPE public.device_status OWNER TO neondb_owner;

--
-- Name: create_user_stats(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.create_user_stats() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO user_stats (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.create_user_stats() OWNER TO neondb_owner;

--
-- Name: update_user_tally(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.update_user_tally() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE user_stats SET
            all_time_kwh = all_time_kwh + NEW.impact_kwh,
            all_time_kg = all_time_kg + NEW.weight_grams / 1000.0,
            all_time_co2_kg = all_time_co2_kg + NEW.impact_co2_kg,
            donation_count = donation_count + 1,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE user_stats SET
            all_time_kwh = GREATEST(0, all_time_kwh - OLD.impact_kwh),
            all_time_kg = GREATEST(0, all_time_kg - OLD.weight_grams / 1000.0),
            all_time_co2_kg = GREATEST(0, all_time_co2_kg - OLD.impact_co2_kg),
            donation_count = GREATEST(0, donation_count - 1),
            updated_at = NOW()
        WHERE user_id = OLD.user_id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_user_tally() OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: devices; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.devices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    serial_number character varying(100) NOT NULL,
    api_key_hash text,
    location_id uuid,
    status public.device_status DEFAULT 'ACTIVE'::public.device_status,
    last_seen_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.devices OWNER TO neondb_owner;

--
-- Name: donations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.donations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    device_id uuid NOT NULL,
    location_id uuid NOT NULL,
    weight_grams numeric(10,2) NOT NULL,
    impact_kwh numeric(10,4),
    impact_co2_kg numeric(10,4),
    event_id character varying(100),
    "timestamp" timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.donations OWNER TO neondb_owner;

--
-- Name: locations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.locations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    partner_id uuid,
    name character varying(64),
    address text,
    city character varying(32),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.locations OWNER TO neondb_owner;

--
-- Name: partners; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.partners (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    contact_email character varying(120),
    contact_phone character varying(20),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.partners OWNER TO neondb_owner;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.refresh_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    token_hash text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    revoked boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.refresh_tokens OWNER TO neondb_owner;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    description text
);


ALTER TABLE public.roles OWNER TO neondb_owner;

--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.schema_migrations (
    version text NOT NULL,
    executed_at timestamp with time zone DEFAULT now() NOT NULL,
    execution_time_ms integer,
    status text DEFAULT 'success'::text
);


ALTER TABLE public.schema_migrations OWNER TO neondb_owner;

--
-- Name: survey_answers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.survey_answers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    response_id uuid NOT NULL,
    question_id uuid NOT NULL,
    answer_text text,
    answer_json jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.survey_answers OWNER TO neondb_owner;

--
-- Name: survey_questions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.survey_questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    survey_id uuid NOT NULL,
    question_order integer DEFAULT 0 NOT NULL,
    question_text text NOT NULL,
    question_type text NOT NULL,
    options jsonb,
    is_optional boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT survey_questions_question_type_check CHECK ((question_type = ANY (ARRAY['multiple-choice'::text, 'open-ended'::text])))
);


ALTER TABLE public.survey_questions OWNER TO neondb_owner;

--
-- Name: survey_responses; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.survey_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    survey_id uuid NOT NULL,
    user_id uuid,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb
);


ALTER TABLE public.survey_responses OWNER TO neondb_owner;

--
-- Name: surveys; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.surveys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.surveys OWNER TO neondb_owner;

--
-- Name: user_stats; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_stats (
    user_id uuid NOT NULL,
    all_time_kg numeric(12,4) DEFAULT 0,
    all_time_kwh numeric(12,4) DEFAULT 0,
    all_time_co2_kg numeric(12,4) DEFAULT 0,
    donation_count integer DEFAULT 0,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_stats OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username character varying(32) NOT NULL,
    name character varying(64),
    email character varying(254) NOT NULL,
    password_hash text NOT NULL,
    role_id uuid,
    is_anonymous boolean DEFAULT false,
    phone_number character varying(32),
    created_at timestamp without time zone DEFAULT now(),
    password_salt character varying(32) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: devices devices_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_pkey PRIMARY KEY (id);


--
-- Name: devices devices_serial_number_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_serial_number_key UNIQUE (serial_number);


--
-- Name: donations donations_event_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_event_id_key UNIQUE (event_id);


--
-- Name: donations donations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_pkey PRIMARY KEY (id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: partners partners_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: survey_answers survey_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.survey_answers
    ADD CONSTRAINT survey_answers_pkey PRIMARY KEY (id);


--
-- Name: survey_questions survey_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.survey_questions
    ADD CONSTRAINT survey_questions_pkey PRIMARY KEY (id);


--
-- Name: survey_responses survey_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.survey_responses
    ADD CONSTRAINT survey_responses_pkey PRIMARY KEY (id);


--
-- Name: surveys surveys_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.surveys
    ADD CONSTRAINT surveys_pkey PRIMARY KEY (id);


--
-- Name: user_stats user_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_stats
    ADD CONSTRAINT user_stats_pkey PRIMARY KEY (user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_phone_number_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_number_key UNIQUE (phone_number);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_donations_user_date; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_donations_user_date ON public.donations USING btree (user_id, created_at);


--
-- Name: idx_schema_migrations_executed_at; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_schema_migrations_executed_at ON public.schema_migrations USING btree (executed_at DESC);


--
-- Name: idx_survey_answers_question_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_survey_answers_question_id ON public.survey_answers USING btree (question_id);


--
-- Name: idx_survey_questions_survey_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_survey_questions_survey_id ON public.survey_questions USING btree (survey_id);


--
-- Name: idx_survey_responses_survey_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_survey_responses_survey_id ON public.survey_responses USING btree (survey_id);


--
-- Name: donations after_donation_change; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER after_donation_change AFTER INSERT OR DELETE ON public.donations FOR EACH ROW EXECUTE FUNCTION public.update_user_tally();


--
-- Name: users after_user_insert; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER after_user_insert AFTER INSERT ON public.users FOR EACH ROW EXECUTE FUNCTION public.create_user_stats();


--
-- Name: devices devices_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- Name: donations donations_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(id);


--
-- Name: donations donations_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- Name: donations donations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: locations locations_partner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.partners(id);


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: survey_answers survey_answers_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.survey_answers
    ADD CONSTRAINT survey_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.survey_questions(id) ON DELETE CASCADE;


--
-- Name: survey_answers survey_answers_response_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.survey_answers
    ADD CONSTRAINT survey_answers_response_id_fkey FOREIGN KEY (response_id) REFERENCES public.survey_responses(id) ON DELETE CASCADE;


--
-- Name: survey_questions survey_questions_survey_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.survey_questions
    ADD CONSTRAINT survey_questions_survey_id_fkey FOREIGN KEY (survey_id) REFERENCES public.surveys(id) ON DELETE CASCADE;


--
-- Name: survey_responses survey_responses_survey_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.survey_responses
    ADD CONSTRAINT survey_responses_survey_id_fkey FOREIGN KEY (survey_id) REFERENCES public.surveys(id) ON DELETE CASCADE;


--
-- Name: user_stats user_stats_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_stats
    ADD CONSTRAINT user_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict ZShPJ15VZOXYJg6XcLssFKoIaSmLVjfmf9UWzo9zs21YllzH7DUkUDjU9xpmfIy

