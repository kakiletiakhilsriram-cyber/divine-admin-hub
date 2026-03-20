import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScrollReveal } from '@/components/ScrollReveal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Send, MapPin, Phone, Mail } from 'lucide-react';

const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error('Please enter a valid email');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('messages').insert({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      subject: form.subject.trim(),
      message: form.message.trim(),
    });
    setLoading(false);

    if (error) {
      toast.error('Failed to send message. Please try again.');
    } else {
      toast.success('Message sent successfully! We will get back to you soon.');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-16">
        <section className="py-24 px-4 temple-gradient-subtle">
          <div className="container mx-auto max-w-4xl text-center">
            <ScrollReveal>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4" style={{ lineHeight: '1.1' }}>
                Contact Us
              </h1>
              <p className="text-muted-foreground">Reach out to us for any queries or information</p>
            </ScrollReveal>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-5xl">
            <div className="grid md:grid-cols-5 gap-8">
              {/* Contact info */}
              <div className="md:col-span-2 space-y-6">
                <ScrollReveal>
                  <div className="bg-card rounded-xl p-6 shadow-md space-y-5">
                    <h2 className="font-display text-xl font-semibold text-foreground">Get in Touch</h2>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Address</p>
                        <p className="text-xs text-muted-foreground">Yenugupalli Village, Konaseema, Andhra Pradesh</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Email</p>
                        <p className="text-xs text-muted-foreground">info@sriramalayam.org</p>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              </div>

              {/* Form */}
              <div className="md:col-span-3">
                <ScrollReveal delay={100}>
                  <div className="bg-card rounded-xl p-8 shadow-md">
                    <h2 className="font-display text-xl font-semibold text-foreground mb-6">Send us a Message</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="name" className="text-xs font-medium">Name *</Label>
                          <Input id="name" name="name" value={form.name} onChange={handleChange} placeholder="Your name" required />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="email" className="text-xs font-medium">Email *</Label>
                          <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="your@email.com" required />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="phone" className="text-xs font-medium">Phone</Label>
                          <Input id="phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="subject" className="text-xs font-medium">Subject *</Label>
                          <Input id="subject" name="subject" value={form.subject} onChange={handleChange} placeholder="Subject" required />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="message" className="text-xs font-medium">Message *</Label>
                        <Textarea id="message" name="message" value={form.message} onChange={handleChange} placeholder="Your message..." rows={5} required />
                      </div>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full temple-gradient text-primary-foreground font-medium shadow-md hover:shadow-lg transition-shadow active:scale-[0.97]"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                            Sending...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Send className="w-4 h-4" /> Send Message
                          </span>
                        )}
                      </Button>
                    </form>
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default ContactPage;
