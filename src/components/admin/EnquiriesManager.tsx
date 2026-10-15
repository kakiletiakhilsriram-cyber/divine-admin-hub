import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertCircle, Mail, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { dateBoundary, emailSummary, ENQUIRY_STATUSES, needsAttention, notificationSummary, replyLink,
  type EmailEvent, type Enquiry, type EnquiryStatus } from '@/lib/enquiries';

const selectClass = 'h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const dateTime = (value: string) => new Date(value).toLocaleString();
const PAGE_SIZE = 25;

export function EnquiriesManager() {
  const client = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [delivery, setDelivery] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Enquiry | null>(null);
  const [nextStatus, setNextStatus] = useState<EnquiryStatus>('new');
  const invalidDates = Boolean(from && to && from > to);
  useEffect(() => {
    const timer = window.setTimeout(() => { setDebouncedSearch(search.trim()); setPage(0); }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);
  const list = useQuery({
    queryKey: ['admin-enquiries', debouncedSearch, status, delivery, from, to, page],
    enabled: !invalidDates,
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_contact_enquiries', {
        p_search: debouncedSearch, p_status: status, p_delivery: delivery,
        p_from: dateBoundary(from), p_to: dateBoundary(to, true), p_offset: page * PAGE_SIZE, p_limit: PAGE_SIZE,
      });
      if (error) throw error;
      return data as unknown as { total: number; items: Enquiry[] };
    },
  });
  const history = useQuery({
    queryKey: ['admin-enquiry-history', selected?.id], enabled: Boolean(selected), refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase.from('contact_email_events').select('id,kind,outcome,detail,created_at')
        .eq('message_id', selected!.id).order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      return data as EmailEvent[];
    },
  });
  const update = useMutation({
    mutationFn: async ({ row, newStatus }: { row: Enquiry; newStatus?: EnquiryStatus }) => {
      const { data, error } = await supabase.from('messages')
        .update(newStatus ? { enquiry_status: newStatus, is_read: true } : { is_read: true })
        .eq('id', row.id).eq('enquiry_status', row.enquiry_status).select('id,enquiry_status,is_read').single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      setSelected(current => current?.id === data.id ? { ...current, enquiry_status: data.enquiry_status as EnquiryStatus, is_read: data.is_read } : current);
      client.invalidateQueries({ queryKey: ['admin-enquiries'] });
      client.invalidateQueries({ queryKey: ['admin-enquiry-history', data.id] });
      if (variables.newStatus) toast.success('Enquiry status updated');
    },
    onError: () => {
      toast.error('Could not update the enquiry. Refresh and try again; it may have changed elsewhere.');
      client.invalidateQueries({ queryKey: ['admin-enquiries'] });
    },
  });
  const open = (row: Enquiry) => {
    setSelected(row); setNextStatus(row.enquiry_status);
    if (!row.is_read) update.mutate({ row });
  };
  const reset = () => { setSearch(''); setStatus(''); setDelivery(''); setFrom(''); setTo(''); setPage(0); };
  return <section className="space-y-5" aria-label="Contact enquiries">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="font-display text-xl font-semibold">Contact enquiries</h2>
        <p className="text-sm text-muted-foreground mt-1">Track follow-up separately from email delivery. Updates every 30 seconds.</p></div>
      <Button variant="outline" onClick={() => list.refetch()} disabled={list.isFetching || invalidDates}>
        <RefreshCw aria-hidden="true" className="mr-2 h-4 w-4" />Refresh
      </Button>
    </div>
    <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 xl:grid-cols-5">
      <div><Label htmlFor="enquiry-search">Search</Label><Input id="enquiry-search" value={search} maxLength={254}
        placeholder="Name, email, subject or reference" onChange={e => setSearch(e.target.value)} /></div>
      <div><Label htmlFor="enquiry-status">Enquiry status</Label><select id="enquiry-status" className={selectClass} value={status}
        onChange={e => { setStatus(e.target.value); setPage(0); }}><option value="">All statuses</option>
        {Object.entries(ENQUIRY_STATUSES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      <div><Label htmlFor="email-status">Email tracking</Label><select id="email-status" className={selectClass} value={delivery}
        onChange={e => { setDelivery(e.target.value); setPage(0); }}><option value="">All email states</option>
        <option value="attention">Needs attention</option><option value="sent">Gmail accepted an email</option>
        <option value="untracked">Automation not recorded</option></select></div>
      <div><Label htmlFor="enquiry-from">From date</Label><Input id="enquiry-from" type="date" value={from}
        onChange={e => { setFrom(e.target.value); setPage(0); }} /></div>
      <div><Label htmlFor="enquiry-to">Through date</Label><Input id="enquiry-to" type="date" value={to}
        onChange={e => { setTo(e.target.value); setPage(0); }} /></div>
      <Button className="justify-self-start" variant="ghost" size="sm" onClick={reset}>Clear filters</Button>
    </div>
    <p className="text-xs text-muted-foreground">Gmail acceptance does not confirm inbox delivery or that a visitor has read the email.
      Older n8n replies show “Automation not recorded” until tracking is connected.</p>
    {invalidDates ? <p role="alert" className="text-destructive">From date must be on or before Through date.</p>
      : list.isError ? <div role="alert" className="rounded-lg border border-destructive p-4">
        <p>Enquiries could not be loaded. Please retry. If this is the first deployment, the enquiry-tracking migration must be applied.</p>
        <Button className="mt-2" variant="outline" onClick={() => list.refetch()}>Retry loading enquiries</Button></div>
      : list.isPending ? <p role="status">Loading enquiries…</p>
      : <>
        <p role="status" className="text-sm text-muted-foreground">{list.data?.total || 0} matching enquiries</p>
        {!list.data?.items.length && <div className="rounded-xl border border-dashed p-10 text-center">
          <Mail aria-hidden="true" className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p>No enquiries match these filters.</p></div>}
        <div className="space-y-3">{list.data?.items.map(row => <article key={row.id} className="rounded-xl border bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1 break-words"><h3 className="font-medium">{row.subject}</h3>
              <p className="text-sm text-muted-foreground">{row.name} · {row.email}</p></div>
            <div className="flex flex-wrap gap-2"><Badge variant="outline">{ENQUIRY_STATUSES[row.enquiry_status]}</Badge>
              {!row.is_read && <Badge>Unread</Badge>}</div>
          </div>
          <p className="mt-3 line-clamp-2 whitespace-pre-wrap break-words text-sm">{row.message}</p>
          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
            <p>{notificationSummary(row)}</p><p>{emailSummary(row)}</p>
            {needsAttention(row) && <p className="flex items-center gap-1 font-medium text-destructive"><AlertCircle className="h-4 w-4" aria-hidden="true" />
              Check Gmail Sent before any manual retry.</p>}
            <p>Received {dateTime(row.created_at)}</p>
          </div>
          <Button className="mt-3" variant="outline" onClick={() => open(row)} aria-label={`Open enquiry from ${row.name}: ${row.subject}`}>View enquiry</Button>
        </article>)}</div>
        <nav aria-label="Enquiry pages" className="flex items-center justify-between gap-2">
          <Button variant="outline" disabled={page === 0 || list.isFetching} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm">Page {page + 1}</span>
          <Button variant="outline" disabled={list.isFetching || (page + 1) * PAGE_SIZE >= (list.data?.total || 0)} onClick={() => setPage(p => p + 1)}>Next</Button>
        </nav>
      </>}
    <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) setSelected(null); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{selected?.subject}</DialogTitle>
          <DialogDescription>Full enquiry, follow-up status and recorded email history.</DialogDescription></DialogHeader>
        {selected && <div className="space-y-5 min-w-0">
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm break-all">
            <dt>Name</dt><dd>{selected.name}</dd><dt>Email</dt><dd>{selected.email}</dd>
            <dt>Phone</dt><dd>{selected.phone || 'Not provided'}</dd><dt>Received</dt><dd>{dateTime(selected.created_at)}</dd>
            <dt>Reference</dt><dd>{selected.id}</dd></dl>
          <p className="whitespace-pre-wrap break-words rounded-lg bg-muted p-4 text-sm">{selected.message}</p>
          <div className="space-y-2"><Label htmlFor="follow-up-status">Follow-up status</Label>
            <div className="flex flex-wrap gap-2"><select id="follow-up-status" className={`${selectClass} sm:w-auto`} value={nextStatus}
              onChange={e => setNextStatus(e.target.value as EnquiryStatus)} disabled={update.isPending}>
              {Object.entries(ENQUIRY_STATUSES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
              <Button disabled={update.isPending || nextStatus === selected.enquiry_status}
                onClick={() => update.mutate({ row: selected, newStatus: nextStatus })}>Save status</Button></div>
            <p className="text-xs text-muted-foreground">Set “Replied” only after you send a personal reply in Gmail. Opening an email draft does not change the status.
              “Closed” keeps the enquiry and its history; change it back to reopen.</p>
            <Button asChild variant="outline"><a href={replyLink(selected)}>Open email reply</a></Button>
          </div>
          <section aria-label="Email and status history"><h3 className="font-medium mb-2">Email and status history</h3>
            <p className="text-xs text-muted-foreground mb-3">{notificationSummary(selected)}. {emailSummary(selected)}.</p>
            {history.isError ? <div role="alert">History could not be loaded. <button className="underline" onClick={() => history.refetch()}>Retry history</button></div>
              : history.isPending ? <p role="status">Loading history…</p>
              : !history.data?.length ? <p className="text-sm text-muted-foreground">No events recorded. Tracking does not reconstruct past emails.</p>
              : <ol className="space-y-3">{history.data.map(event => <li key={event.id} className="border-l-2 pl-3 text-sm">
                <p className="font-medium">{({ admin_notification: 'Website notification', faq_reply: 'FAQ answer', admin_review: 'Admin review', status_change: 'Follow-up status' } as Record<string, string>)[event.kind]} · {event.outcome}</p>
                <p className="break-words">{event.detail}</p><time className="text-xs text-muted-foreground" dateTime={event.created_at}>{dateTime(event.created_at)}</time>
              </li>)}</ol>}
            {history.data?.length === 100 && <p className="text-xs text-muted-foreground mt-2">Showing the latest 100 events.</p>}
          </section>
        </div>}
      </DialogContent>
    </Dialog>
  </section>;
}
