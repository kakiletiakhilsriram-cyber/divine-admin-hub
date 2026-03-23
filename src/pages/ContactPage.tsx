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
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import contactImage from '../assets/contact/contact.jpg';

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
        <section 
          className="relative py-32 px-4 flex items-center justify-center min-h-[40vh] bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${contactImage})` }}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 mt-8">
            <ScrollReveal>
              <h1 className="font-display text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-md">
                Contact Us
              </h1>
              <p className="text-xl md:text-2xl text-white/95 font-medium drop-shadow">
                We're Here to Help You
              </p>
            </ScrollReveal>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-5 gap-8">
              {/* Contact info */}
              <div className="md:col-span-2 space-y-6">
                <ScrollReveal>
                  <div className="bg-card rounded-xl p-6 shadow-md space-y-6">
                    <div>
                      <h2 className="font-display text-2xl font-semibold text-foreground mb-2">Get in Touch</h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Whether you have questions about temple timings, want to organize a special puja, or simply wish to learn more about our activities, we're here to assist you.
                      </p>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full temple-gradient flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Temple Address</p>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                          Sri Ramalayam Temple<br />
                          Main Street, Yenugupalli Village<br />
                          Andhra Pradesh, India<br />
                          PIN: 533240
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full temple-gradient flex items-center justify-center shrink-0">
                        <Phone className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Phone</p>
                        <p className="text-xs text-muted-foreground mt-1">+91 9XXXXXXXXX</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full temple-gradient flex items-center justify-center shrink-0">
                        <Mail className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Email</p>
                        <p className="text-xs text-muted-foreground mt-1">ramalayamkyp@gmail.com</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full temple-gradient flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Temple Timings</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          Morning: 6:00 AM - 12:00 PM<br />
                          Evening: 4:00 PM - 8:00 PM
                        </p>
                        <p className="text-xs text-primary mt-1 italic">(Open all days of the week)</p>
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

          {/* Interactive Map */}
          <ScrollReveal delay={200}>
            <div className="mt-12 rounded-xl overflow-hidden shadow-md">
              <iframe
                title="Sri Ramalayam Temple Location"
                src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3820.5!2d81.899167!3d16.547111!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTbCsDMyJzQ5LjYiTiA4McKwNTMnNTcuMCJF!5e0!3m2!1sen!2sin!4v1711100000000"
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </ScrollReveal>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default ContactPage;
