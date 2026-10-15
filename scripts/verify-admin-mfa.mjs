// Isolated PostgreSQL: no hosted DB, credentials, auth accounts or mail.
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { PGlite } = require(
  process.env.CONTACT_TEST_PGLITE || "@electric-sql/pglite",
);
const db = new PGlite();
let checks = 0;
const q = async (sql, args = []) => (await db.query(sql, args)).rows;
const eq = (actual, expected) => {
  assert.deepEqual(actual, expected);
  checks++;
};
const denied = async (sql, args = []) => {
  await assert.rejects(db.query(sql, args));
  checks++;
};
const root = new URL("../supabase/migrations/", import.meta.url);
await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
CREATE TABLE auth.mfa_factors(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,status text);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS 'SELECT nullif(current_setting(''test.uid'',true),'''')::uuid';
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql AS 'SELECT coalesce(nullif(current_setting(''test.jwt'',true),''''),''{}'')::jsonb';
GRANT USAGE ON SCHEMA auth TO anon,authenticated,service_role;
CREATE SCHEMA storage; CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean);
CREATE TABLE storage.objects(id uuid DEFAULT gen_random_uuid(),bucket_id text,name text); ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;`);
for (const file of [
  "20260320183504_83fe7230-1351-4198-8df0-c28ceafca714.sql",
  "20260322065214_76605780-d796-442f-b6ee-3a0fa2350c17.sql",
  "20260322071401_ad60257d-056e-4627-86ee-9d1d3ac7f81d.sql",
  "20261014000100_messages_phone_digits_only.sql",
  "20261014000200_contact_email_outbox.sql",
  "20261015000100_contact_enquiry_tracking.sql",
  "20261015000200_admin_mfa_assurance.sql",
])
  await db.exec(await readFile(new URL(file, root), "utf8"));
await db.exec(`GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public,storage TO anon,authenticated,service_role;
GRANT USAGE ON SCHEMA storage TO anon,authenticated,service_role;
INSERT INTO auth.users VALUES ('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002');
INSERT INTO public.user_roles(user_id,role) VALUES ('00000000-0000-4000-8000-000000000001','admin');
INSERT INTO public.messages(name,email,subject,message) VALUES ('Visitor','visitor@example.com','Question','Keep me');`);
const admin = "00000000-0000-4000-8000-000000000001";
async function identity(uid, aal) {
  await db.exec("RESET ROLE");
  await q(
    "SELECT set_config('test.uid',$1,false),set_config('test.jwt',$2,false)",
    [uid, aal ? JSON.stringify({ aal }) : "{}"],
  );
  await db.exec("SET ROLE authenticated");
}
const has = async () =>
  (await q("SELECT public.has_role(auth.uid(),'admin') allowed"))[0].allowed;
await identity(admin, "aal1");
eq(await has(), true);
eq((await q("SELECT * FROM public.messages")).length, 1);
await db.exec("RESET ROLE");
await q(
  "INSERT INTO auth.mfa_factors(user_id,status) VALUES ($1,'unverified')",
  [admin],
);
await identity(admin, "aal1");
eq(await has(), true);
await db.exec("RESET ROLE; UPDATE auth.mfa_factors SET status='verified'");
for (const aal of ["aal1", null]) {
  await identity(admin, aal);
  eq(await has(), false);
  eq((await q("SELECT * FROM public.messages")).length, 0);
  eq(
    (await q("SELECT * FROM public.user_roles WHERE user_id=auth.uid()"))
      .length,
    1,
  );
  await denied("SELECT public.admin_contact_enquiries()");
  for (const table of ["sevas", "events"])
    await denied(`INSERT INTO public.${table}(title) VALUES ('Blocked')`);
  await denied("INSERT INTO public.gallery(media_url) VALUES ('blocked.jpg')");
  await denied(
    "INSERT INTO storage.objects(bucket_id,name) VALUES ('gallery-images','blocked.jpg')",
  );
  await denied(
    "INSERT INTO storage.objects(bucket_id,name) VALUES ('seva-images','blocked.jpg')",
  );
  await denied(
    "INSERT INTO public.user_roles(user_id,role) VALUES ('00000000-0000-4000-8000-000000000002','admin')",
  );
}
await identity(admin, "aal2");
eq(await has(), true);
eq((await q("SELECT * FROM public.messages")).length, 1);
eq((await q("SELECT public.admin_contact_enquiries() data"))[0].data.total, 1);
await q("INSERT INTO public.events(title) VALUES ('Allowed')");
checks++;
await q(
  "INSERT INTO storage.objects(bucket_id,name) VALUES ('gallery-images','allowed.jpg')",
);
checks++;
await identity("00000000-0000-4000-8000-000000000002", "aal2");
eq(await has(), false);
eq((await q("SELECT * FROM public.messages")).length, 0);
await denied("SELECT public.admin_contact_enquiries()");
eq(
  (await q("SELECT public.has_role($1,'admin') allowed", [admin]))[0].allowed,
  false,
);
await db.exec("RESET ROLE; SET ROLE anon");
eq((await q("SELECT * FROM public.messages")).length, 0);
await denied("SELECT public.admin_contact_enquiries()");
await db.exec(
  "RESET ROLE; SET ROLE service_role; SET request.jwt.claim.role='service_role'",
);
const ref = "00000000-0000-4000-8000-000000000003";
await q("SELECT public.enqueue_contact_enquiry($1,$2,$3,$4,$5,$6)", [
  ref,
  "Visitor",
  "visitor@example.com",
  null,
  "Question",
  "Hours?",
]);
checks++;
eq(
  (
    await q("SELECT public.begin_contact_automation($1,$2,$3,$4) allowed", [
      ref,
      ref,
      "faq",
      "visitor@example.com",
    ])
  )[0].allowed,
  true,
);
eq(
  (
    await q("SELECT public.finish_contact_automation($1,$2,$3,$4) recorded", [
      ref,
      ref,
      "sent",
      "mock-id",
    ])
  )[0].recorded,
  true,
);
await db.exec("RESET ROLE");
eq((await q("SELECT count(*)::int n FROM public.user_roles"))[0].n, 1);
eq(
  (
    await q(
      "SELECT message FROM public.messages WHERE name='Visitor' ORDER BY created_at",
    )
  )[0].message,
  "Keep me",
);
await db.close();
console.log(
  `${checks} isolated MFA/RLS checks passed; no live accounts or mail used.`,
);
