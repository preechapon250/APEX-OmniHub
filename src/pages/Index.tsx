import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { Header } from '@/components/Header';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        navigate('/login');
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate]);

  useEffect(() => {
    // Load Google Identity Services SDK
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Placeholder images for the grid
  const gridImages = Array.from({ length: 9 }, (_, i) => ({
    id: i + 1,
    alt: `Profile picture example ${i + 1}`
  }));

  const trainingImages = Array.from({ length: 3 }, (_, i) => ({
    id: i + 1,
    alt: `Training image ${i + 1}`
  }));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="px-4 py-16 md:py-20 lg:py-24 pt-20 md:pt-24 lg:pt-28">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Left Column - Content */}
            <div className="max-w-[560px] space-y-6 lg:space-y-8">
              {/* Eyebrow */}
              <p className="text-sm font-medium text-[hsl(var(--navy))] tracking-wide uppercase">
                APEX Business Systems
              </p>

              {/* H1 */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-[hsl(var(--ink))]">
                Create your perfect{' '}
                <span className="text-[hsl(var(--orange))]">profile picture</span>{' '}
                with AI.
              </h1>

              {/* Support Copy */}
              <p className="text-lg text-muted-foreground">
                Transform your photos into professional profile pictures with AI technology. 
                Upload your photos and get stunning results in minutes.
              </p>

              {/* Benefits List */}
              <ul className="space-y-3">
                {[
                  'Professional quality in minutes',
                  'Multiple styles to choose from',
                  'Secure and private processing'
                ].map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-[hsl(var(--orange))] mt-0.5 flex-shrink-0" />
                    <span className="text-[hsl(var(--ink))]">{benefit}</span>
                  </li>
                ))}
              </ul>

              {/* CTAs */}
              <div className="space-y-4 pt-2">
                <Button 
                  size="lg" 
                  className="w-full md:w-auto bg-[hsl(var(--navy))] hover:bg-[hsl(var(--navy-600))] text-white px-8"
                >
                  Get Started
                </Button>

                {/* Google Sign-in Button */}
                <div className="w-full md:w-auto">
                  <div 
                    id="g_id_onload"
                    data-client_id="YOUR_GOOGLE_CLIENT_ID"
                    data-context="signin"
                    data-ux_mode="popup"
                    data-auto_prompt="false"
                  ></div>
                  <div 
                    className="g_id_signin"
                    data-type="standard"
                    data-shape="rectangular"
                    data-theme="outline"
                    data-text="signin_with"
                    data-size="large"
                    data-logo_alignment="left"
                    data-width="250"
                  ></div>
                </div>
              </div>

              {/* Social Proof Row */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  One-time payment. No subscription.
                </p>
                <div className="sm:ml-auto">
                  <a 
                    href="https://www.producthunt.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <img 
                      src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=YOUR_POST_ID&theme=light" 
                      alt="Product Hunt"
                      width="250"
                      height="54"
                      loading="lazy"
                    />
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column - Visual Collage */}
            <div className="relative">
              <div className="relative max-w-[500px] mx-auto">
                {/* Training Set Overlay - Top Left */}
                <div className="absolute -top-8 -left-8 z-10 bg-white p-3 rounded-lg shadow-lg border border-border">
                  <div className="flex gap-2 mb-2">
                    {trainingImages.map((img) => (
                      <div 
                        key={img.id}
                        className="w-12 h-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground"
                      >
                        {img.id}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-[hsl(var(--ink))]">Training set</p>
                  {/* Arrow pointing to main grid */}
                  <svg 
                    className="absolute -right-6 top-1/2 -translate-y-1/2 w-8 h-8" 
                    viewBox="0 0 32 32" 
                    fill="none"
                  >
                    <path 
                      d="M4 16 C 8 8, 12 24, 20 16" 
                      stroke="hsl(var(--orange))" 
                      strokeWidth="2" 
                      fill="none"
                      strokeLinecap="round"
                    />
                    <path 
                      d="M20 16 L 16 14 M 20 16 L 16 18" 
                      stroke="hsl(var(--orange))" 
                      strokeWidth="2" 
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                {/* Main 3x3 Grid */}
                <div className="grid grid-cols-3 gap-3 rounded-xl overflow-hidden shadow-xl border border-border bg-white p-3">
                  {gridImages.map((img) => (
                    <div 
                      key={img.id}
                      className="aspect-square rounded-lg bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-muted-foreground hover:scale-105 transition-transform"
                    >
                      <span className="text-2xl font-bold">{img.id}</span>
                    </div>
                  ))}
                </div>

                {/* Bottom Right Caption */}
                <div className="absolute -bottom-8 -right-8 bg-white p-4 rounded-lg shadow-lg border border-border max-w-[180px]">
                  <p className="text-sm font-medium text-[hsl(var(--ink))]">
                    Turn yourself into anything you want
                  </p>
                  {/* Curved arrow pointing back to grid */}
                  <svg 
                    className="absolute -left-6 top-0 w-8 h-8" 
                    viewBox="0 0 32 32" 
                    fill="none"
                  >
                    <path 
                      d="M4 8 C 8 8, 12 -4, 20 8" 
                      stroke="hsl(var(--orange))" 
                      strokeWidth="2" 
                      fill="none"
                      strokeLinecap="round"
                    />
                    <path 
                      d="M20 8 L 18 4 M 20 8 L 16 8" 
                      stroke="hsl(var(--orange))" 
                      strokeWidth="2" 
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
