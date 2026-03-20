import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  LayoutDashboard, BookOpen, CalendarDays, Image, MessageSquare,
  LogOut, Plus, Trash2, Edit, X, Check, Menu,
} from 'lucide-react';

type Section = 'sevas' | 'events' | 'gallery' | 'messages';

const AdminDashboard = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [active, setActive] = useState<Section>('sevas');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const sections: { key: Section; label: string; icon: any }[] = [
    { key: 'sevas', label: 'Manage Sevas', icon: BookOpen },
    { key: 'events', label: 'Manage Events', icon: CalendarDays },
    { key: 'gallery', label: 'Manage Gallery', icon: Image },
    { key: 'messages', label: 'Messages', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-sidebar text-sidebar-foreground transform transition-transform md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full temple-gradient flex items-center justify-center text-lg">🕉</div>
            <div>
              <h2 className="font-display font-semibold text-sm text-sidebar-foreground">Admin Panel</h2>
              <p className="text-[10px] text-sidebar-foreground/50">Sri Ramalayam</p>
            </div>
          </div>
        </div>
        <nav className="p-3 space-y-1">
          {sections.map((s) => (
            <button
              key={s.key}
              onClick={() => { setActive(s.key); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active === s.key
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }`}
            >
              <s.icon className="w-4 h-4" />
              {s.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-foreground/20 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <main className="flex-1 min-w-0">
        <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-3 sticky top-0 z-20">
          <button className="md:hidden p-1.5 rounded-md hover:bg-muted" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-display font-semibold text-foreground">
            {sections.find((s) => s.key === active)?.label}
          </h1>
        </header>
        <div className="p-4 md:p-6">
          {active === 'sevas' && <SevasManager />}
          {active === 'events' && <EventsManager />}
          {active === 'gallery' && <GalleryManager />}
          {active === 'messages' && <MessagesViewer />}
        </div>
      </main>
    </div>
  );
};

/* ===== SEVAS MANAGER ===== */
const SevasManager = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: '', description: '', date: '' });

  const { data: sevas, isLoading } = useQuery({
    queryKey: ['admin-sevas'],
    queryFn: async () => {
      const { data } = await supabase.from('sevas').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing?.id) {
        await supabase.from('sevas').update({ title: form.title, description: form.description, date: form.date }).eq('id', editing.id);
      } else {
        await supabase.from('sevas').insert({ title: form.title, description: form.description, date: form.date });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sevas'] });
      queryClient.invalidateQueries({ queryKey: ['sevas'] });
      setEditing(null);
      setForm({ title: '', description: '', date: '' });
      toast.success(editing?.id ? 'Seva updated' : 'Seva added');
    },
    onError: () => toast.error('Failed to save seva'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('sevas').delete().eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sevas'] });
      toast.success('Seva deleted');
    },
  });

  const startEdit = (seva: any) => {
    setEditing(seva);
    setForm({ title: seva.title, description: seva.description || '', date: seva.date || '' });
  };

  const startAdd = () => {
    setEditing({});
    setForm({ title: '', description: '', date: '' });
  };

  return (
    <div className="space-y-4">
      {editing ? (
        <div className="bg-card rounded-xl p-6 shadow-md border border-border">
          <h3 className="font-display font-semibold text-foreground mb-4">{editing.id ? 'Edit Seva' : 'Add New Seva'}</h3>
          <div className="space-y-3">
            <div><Label className="text-xs">Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Seva title" /></div>
            <div><Label className="text-xs">Date</Label><Input value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} placeholder="e.g. Every Saturday" /></div>
            <div><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div className="flex gap-2">
              <Button onClick={() => saveMutation.mutate()} disabled={!form.title.trim() || saveMutation.isPending} className="temple-gradient text-primary-foreground">
                <Check className="w-4 h-4 mr-1" /> Save
              </Button>
              <Button variant="outline" onClick={() => setEditing(null)}><X className="w-4 h-4 mr-1" /> Cancel</Button>
            </div>
          </div>
        </div>
      ) : (
        <Button onClick={startAdd} className="temple-gradient text-primary-foreground"><Plus className="w-4 h-4 mr-1" /> Add Seva</Button>
      )}

      {isLoading ? <p className="text-muted-foreground text-sm">Loading...</p> : (
        <div className="space-y-3">
          {sevas?.map((seva: any) => (
            <div key={seva.id} className="bg-card rounded-lg p-4 shadow-sm border border-border flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h4 className="font-medium text-foreground text-sm">{seva.title}</h4>
                {seva.date && <p className="text-xs text-primary mt-0.5">{seva.date}</p>}
                {seva.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{seva.description}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(seva)}><Edit className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(seva.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ===== EVENTS MANAGER ===== */
const EventsManager = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: '', description: '', date: '', image_url: '' });

  const { data: events, isLoading } = useQuery({
    queryKey: ['admin-events'],
    queryFn: async () => {
      const { data } = await supabase.from('events').select('*').order('date', { ascending: true });
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { title: form.title, description: form.description, date: form.date || null, image_url: form.image_url || null };
      if (editing?.id) {
        await supabase.from('events').update(payload).eq('id', editing.id);
      } else {
        await supabase.from('events').insert(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setEditing(null);
      setForm({ title: '', description: '', date: '', image_url: '' });
      toast.success(editing?.id ? 'Event updated' : 'Event added');
    },
    onError: () => toast.error('Failed to save event'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('events').delete().eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      toast.success('Event deleted');
    },
  });

  const startEdit = (event: any) => {
    setEditing(event);
    setForm({ title: event.title, description: event.description || '', date: event.date || '', image_url: event.image_url || '' });
  };

  return (
    <div className="space-y-4">
      {editing ? (
        <div className="bg-card rounded-xl p-6 shadow-md border border-border">
          <h3 className="font-display font-semibold text-foreground mb-4">{editing.id ? 'Edit Event' : 'Add New Event'}</h3>
          <div className="space-y-3">
            <div><Label className="text-xs">Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Event title" /></div>
            <div><Label className="text-xs">Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div><Label className="text-xs">Image URL</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." /></div>
            <div><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div className="flex gap-2">
              <Button onClick={() => saveMutation.mutate()} disabled={!form.title.trim() || saveMutation.isPending} className="temple-gradient text-primary-foreground">
                <Check className="w-4 h-4 mr-1" /> Save
              </Button>
              <Button variant="outline" onClick={() => setEditing(null)}><X className="w-4 h-4 mr-1" /> Cancel</Button>
            </div>
          </div>
        </div>
      ) : (
        <Button onClick={() => { setEditing({}); setForm({ title: '', description: '', date: '', image_url: '' }); }} className="temple-gradient text-primary-foreground">
          <Plus className="w-4 h-4 mr-1" /> Add Event
        </Button>
      )}

      {isLoading ? <p className="text-muted-foreground text-sm">Loading...</p> : (
        <div className="space-y-3">
          {events?.map((event: any) => (
            <div key={event.id} className="bg-card rounded-lg p-4 shadow-sm border border-border flex items-start justify-between gap-4">
              <div className="min-w-0 flex gap-3">
                {event.image_url && <img src={event.image_url} alt="" className="w-16 h-12 rounded object-cover shrink-0" />}
                <div>
                  <h4 className="font-medium text-foreground text-sm">{event.title}</h4>
                  {event.date && <p className="text-xs text-primary mt-0.5">{new Date(event.date).toLocaleDateString()}</p>}
                  {event.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.description}</p>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(event)}><Edit className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(event.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ===== GALLERY MANAGER ===== */
const GalleryManager = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: '', media_url: '', media_type: 'image' });
  const [showForm, setShowForm] = useState(false);

  const { data: items, isLoading } = useQuery({
    queryKey: ['admin-gallery'],
    queryFn: async () => {
      const { data } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      await supabase.from('gallery').insert({ title: form.title || null, media_url: form.media_url, media_type: form.media_type });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gallery'] });
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      setForm({ title: '', media_url: '', media_type: 'image' });
      setShowForm(false);
      toast.success('Gallery item added');
    },
    onError: () => toast.error('Failed to add gallery item'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('gallery').delete().eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gallery'] });
      toast.success('Gallery item deleted');
    },
  });

  return (
    <div className="space-y-4">
      {showForm ? (
        <div className="bg-card rounded-xl p-6 shadow-md border border-border">
          <h3 className="font-display font-semibold text-foreground mb-4">Add Gallery Item</h3>
          <div className="space-y-3">
            <div><Label className="text-xs">Title (optional)</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Image title" /></div>
            <div><Label className="text-xs">Media URL (Google Drive or direct link)</Label><Input value={form.media_url} onChange={(e) => setForm({ ...form, media_url: e.target.value })} placeholder="https://..." /></div>
            <div className="flex gap-2">
              <Button onClick={() => addMutation.mutate()} disabled={!form.media_url.trim() || addMutation.isPending} className="temple-gradient text-primary-foreground">
                <Check className="w-4 h-4 mr-1" /> Add
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}><X className="w-4 h-4 mr-1" /> Cancel</Button>
            </div>
          </div>
        </div>
      ) : (
        <Button onClick={() => setShowForm(true)} className="temple-gradient text-primary-foreground"><Plus className="w-4 h-4 mr-1" /> Add Gallery Item</Button>
      )}

      {isLoading ? <p className="text-muted-foreground text-sm">Loading...</p> : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {items?.map((item: any) => (
            <div key={item.id} className="relative group rounded-lg overflow-hidden shadow-sm border border-border">
              <img src={item.media_url} alt={item.title || 'Gallery'} className="w-full aspect-square object-cover" />
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 bg-card/80 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => deleteMutation.mutate(item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              {item.title && <p className="text-xs p-2 text-muted-foreground truncate">{item.title}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ===== MESSAGES VIEWER ===== */
const MessagesViewer = () => {
  const { data: messages, isLoading } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: async () => {
      const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const queryClient = useQueryClient();
  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('messages').update({ is_read: true }).eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-messages'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('messages').delete().eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
      toast.success('Message deleted');
    },
  });

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading messages...</p>;

  return (
    <div className="space-y-3">
      {!messages?.length ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No messages yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 font-medium text-muted-foreground text-xs">Name</th>
                <th className="pb-2 font-medium text-muted-foreground text-xs">Email</th>
                <th className="pb-2 font-medium text-muted-foreground text-xs hidden md:table-cell">Subject</th>
                <th className="pb-2 font-medium text-muted-foreground text-xs hidden lg:table-cell">Message</th>
                <th className="pb-2 font-medium text-muted-foreground text-xs">Date</th>
                <th className="pb-2 font-medium text-muted-foreground text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((msg: any) => (
                <tr key={msg.id} className={`border-b border-border/50 ${!msg.is_read ? 'bg-primary/5' : ''}`}>
                  <td className="py-3 pr-3 font-medium text-foreground">{msg.name}</td>
                  <td className="py-3 pr-3 text-muted-foreground">{msg.email}</td>
                  <td className="py-3 pr-3 text-muted-foreground hidden md:table-cell">{msg.subject}</td>
                  <td className="py-3 pr-3 text-muted-foreground hidden lg:table-cell max-w-xs truncate">{msg.message}</td>
                  <td className="py-3 pr-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(msg.created_at).toLocaleDateString()}</td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      {!msg.is_read && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => markRead.mutate(msg.id)} title="Mark as read">
                          <Check className="w-3.5 h-3.5 text-primary" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(msg.id)} title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
