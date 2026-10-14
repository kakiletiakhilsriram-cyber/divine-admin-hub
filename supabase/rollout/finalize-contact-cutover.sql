-- Manual final release step, deliberately outside automatic migrations.
-- Run only after the production contact form uses submit-contact and a real
-- enquiry has been confirmed in the dashboard and temple Gmail inbox.
-- This prevents visitors from bypassing validation via direct database inserts.
DROP POLICY IF EXISTS "Anyone can insert messages" ON public.messages;
