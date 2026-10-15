import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EnquiriesManager } from './EnquiriesManager';
import type { Enquiry } from '@/lib/enquiries';
const { rpc, from, update, eq, select, single } = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(), update: vi.fn(), eq: vi.fn(), select: vi.fn(), single: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc, from } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const row: Enquiry = {id:'a507a3c5-056b-48ee-8c38-67fefe8ba320',name:'Test visitor',email:'visitor@example.com',phone:null,
  subject:'Accessibility enquiry',message:'Is wheelchair access available?',created_at:'2026-10-15T10:00:00Z',is_read:true,
  enquiry_status:'awaiting_admin',notification:{status:'sent',attempts:1,sent_at:null,next_attempt_at:'2026-10-15T10:00:00Z',locked_until:null},
  automation:{route:'admin',state:'uncertain',started_at:'2026-10-15T10:00:00Z',finished_at:null}};
function mount() {
  const client = new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}});
  render(<QueryClientProvider client={client}><EnquiriesManager /></QueryClientProvider>);
}
beforeEach(()=>{
  vi.clearAllMocks(); rpc.mockResolvedValue({data:{total:1,items:[row]},error:null});
  const chain = {update,eq,select,single,order:vi.fn().mockReturnThis(),limit:vi.fn().mockResolvedValue({data:[],error:null})};
  from.mockReturnValue(chain); update.mockReturnValue(chain);eq.mockReturnValue(chain);select.mockReturnValue(chain);
  single.mockResolvedValue({data:{id:row.id,enquiry_status:'replied',is_read:true},error:null});
});
afterEach(cleanup);
describe('admin enquiry workflow',()=>{
  it('opens the entire enquiry on mobile and never marks a mail draft as replied', async()=>{
    mount(); fireEvent.click(await screen.findByRole('button',{name:/Open enquiry from/}));
    expect(within(screen.getByRole('dialog')).getByText(row.message)).toBeInTheDocument();
    expect(screen.getByRole('link',{name:'Open email reply'})).toHaveAttribute('href',expect.stringContaining(encodeURIComponent(row.id)));
    expect(update).not.toHaveBeenCalled();
    expect(within(screen.getByRole('dialog')).getByText(/delivery unconfirmed/)).toBeInTheDocument();
  });
  it('saves an explicit status with a guard against concurrent changes',async()=>{
    mount(); fireEvent.click(await screen.findByRole('button',{name:/Open enquiry from/}));
    fireEvent.change(screen.getByLabelText('Follow-up status'),{target:{value:'replied'}});
    fireEvent.click(screen.getByRole('button',{name:'Save status'}));
    await waitFor(()=>expect(update).toHaveBeenCalledWith({enquiry_status:'replied',is_read:true}));
    expect(eq).toHaveBeenCalledWith('enquiry_status','awaiting_admin');
  });
  it('filters on the server and resets pagination',async()=>{
    mount();await screen.findByRole('button',{name:/Open enquiry from/});
    fireEvent.change(screen.getByLabelText('Email tracking'),{target:{value:'attention'}});
    await waitFor(()=>expect(rpc).toHaveBeenLastCalledWith('admin_contact_enquiries',expect.objectContaining({p_delivery:'attention',p_offset:0,p_limit:25})));
    fireEvent.change(screen.getByLabelText('Search'),{target:{value:'visitor@example.com'}});
    await waitFor(()=>expect(rpc).toHaveBeenLastCalledWith('admin_contact_enquiries',expect.objectContaining({p_search:'visitor@example.com'})));
  });
  it('shows fetch failures instead of an empty inbox',async()=>{
    rpc.mockResolvedValue({data:null,error:{message:'permission denied'}});mount();
    expect(await screen.findByRole('alert')).toHaveTextContent('Enquiries could not be loaded');
    expect(screen.queryByText('No enquiries match these filters.')).not.toBeInTheDocument();
  });
});
