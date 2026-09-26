--
-- PostgreSQL database dump
--

\restrict 2ZSARorPbXf7jH7ESA4Hmn7N4mVUSBl4iSPmqtOi4Yjjt2IW3dkcNbPBt8Z0toB

-- Dumped from database version 17.10
-- Dumped by pg_dump version 17.10

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id uuid NOT NULL,
    product_id character varying(100) NOT NULL,
    product_name character varying(255) NOT NULL,
    amount numeric(12,2) NOT NULL,
    currency character varying(10) NOT NULL,
    usd_price numeric(12,2),
    tx_ref character varying(255) NOT NULL,
    status character varying(30) DEFAULT 'pending'::character varying NOT NULL,
    download_token character varying(128),
    download_token_expires_at timestamp with time zone,
    download_used boolean DEFAULT false NOT NULL,
    download_used_at timestamp with time zone,
    paid_at timestamp with time zone,
    paychangu_reference character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, product_id, product_name, amount, currency, usd_price, tx_ref, status, download_token, download_token_expires_at, download_used, download_used_at, paid_at, paychangu_reference, created_at, updated_at) FROM stdin;
7abbe90e-23a9-4bff-8e51-b58ea34c9c40	caveman-cake-slice-1	Caveman Cake — Slice 1	100.00	MWK	10.00	CAVEMAN-1790132294224-54E6C42E40	paid	905e2b257b46b61ddcc0027df1cebba786a53ef83ef3ec4ec2201584b662a7f4	2026-09-22 20:29:07.255-07	t	2026-09-22 19:59:14.963785-07	2026-09-22 19:59:07.256116-07	94162507897	2026-09-22 19:58:14.426258-07	2026-09-22 19:59:14.963785-07
63246e48-95f1-4021-9b46-c23fca12f663	caveman-cake-slice-1	Caveman Cake — Slice 1	100.00	MWK	10.00	CAVEMAN-1790152349027-64D68B6059	pending	\N	\N	f	\N	\N	\N	2026-09-23 01:32:29.299109-07	2026-09-23 01:32:29.299109-07
e71995ee-45ed-4df0-b68d-19e380651f6d	caveman-cake-slice-1	Caveman Cake — Slice 1	100.00	MWK	10.00	CAVEMAN-1790153417051-C6E58F356F	paid	a496d0cc2aabb671c9371879eb804640c8e49cdefc6a95c6dd8780e5a1a324f3	2026-09-23 02:21:10.114-07	t	2026-09-23 01:51:12.878674-07	2026-09-23 01:51:10.115578-07	10152399259	2026-09-23 01:50:17.131714-07	2026-09-23 01:51:12.878674-07
d6428e6f-fae7-4b66-baa3-8e7b11e9aef5	caveman-cake-slice-1	Caveman Cake — Slice 1	1500.00	MWK	10.00	CAVEMAN-1790159311753-6B16BEDB9D	pending	\N	\N	f	\N	\N	\N	2026-09-23 03:28:32.078758-07	2026-09-23 03:28:32.078758-07
\.


--
-- Name: orders orders_download_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_download_token_key UNIQUE (download_token);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: orders orders_tx_ref_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_tx_ref_key UNIQUE (tx_ref);


--
-- Name: idx_orders_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_created_at ON public.orders USING btree (created_at);


--
-- Name: idx_orders_download_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_download_token ON public.orders USING btree (download_token);


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO caveman_app;


--
-- Name: TABLE orders; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.orders TO caveman_app;


--
-- PostgreSQL database dump complete
--

\unrestrict 2ZSARorPbXf7jH7ESA4Hmn7N4mVUSBl4iSPmqtOi4Yjjt2IW3dkcNbPBt8Z0toB

