import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message || 'Login failed');
    } else {
      toast.success('Welcome back!');
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Return to Home Button */}
      <div className="absolute top-6 left-6 z-50">
        <Link 
          to="/" 
          className="flex items-center gap-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-all duration-300 bg-background/50 backdrop-blur-md px-4 py-2 rounded-full border border-border shadow-sm hover:shadow hover:bg-background"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Home
        </Link>
      </div>

      {/* Background */}
      <div className="absolute inset-0 temple-gradient opacity-[0.07]" />
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle at 20% 50%, hsl(30 90% 48% / 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, hsl(38 92% 50% / 0.06) 0%, transparent 50%)'
      }} />

      <div
        className="relative w-full max-w-md mx-4"
        style={{ animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Temple icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-full temple-gradient flex items-center justify-center shadow-lg mb-4">
            <span className="text-3xl">🕉</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Sri Ramalayam
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Temple Administration Portal
          </p>
        </div>

        {/* Login card */}
        <div className="bg-card rounded-xl shadow-xl border border-border p-8">
          <h2 className="font-display text-xl font-semibold text-center mb-6 text-foreground">
            Sign In
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@temple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 temple-gradient text-primary-foreground font-medium shadow-md hover:shadow-lg transition-shadow active:scale-[0.97]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Access restricted to authorized temple administrators
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
