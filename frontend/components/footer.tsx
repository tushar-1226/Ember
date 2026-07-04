import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative w-full overflow-hidden bg-background pt-24 pb-0 text-foreground border-t border-border-soft">
      <div className="w-full px-6 lg:px-12 xl:px-24">
        
        {/* Top Section */}
        <div className="grid grid-cols-1 gap-12 pb-16 lg:grid-cols-4 lg:gap-8">
          
          {/* Brand Info */}
          <div className="flex flex-col gap-6 lg:col-span-1">
            <Link href="/" className="group flex items-center gap-2">
              <span className="relative grid h-6 w-6 place-items-center">
                <span className="absolute h-2 w-2 rounded-full bg-ember-amber" />
                <span className="absolute h-6 w-6 rounded-full border border-ember-amber/25" />
              </span>
              <span className="font-display text-xl font-semibold tracking-tight text-foreground">
                Ember
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-muted max-w-xs">
              Ember builds AI-native reflection and memory infrastructure across platforms.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <a href="mailto:hi@ember.ai" className="text-sm font-medium text-foreground hover:text-ember-amber transition-colors">
                hi@ember.ai
              </a>
              <p className="text-xs text-faint">
                © {new Date().getFullYear()} ember.ai All rights reserved.
              </p>
            </div>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-3 lg:pl-16">
            
            {/* Product */}
            <div className="flex flex-col gap-4">
              <h4 className="font-medium text-foreground">Product</h4>
              <ul className="flex flex-col gap-3">
                {['About', 'Features', 'Blog', 'Integrations', 'FAQs', 'Contact'].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-sm text-muted hover:text-foreground transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div className="flex flex-col gap-4">
              <h4 className="font-medium text-foreground">Legal</h4>
              <ul className="flex flex-col gap-3">
                {['Terms Of Service', 'Privacy Policy', 'Cookie Policy', 'Refund & Cancellation Policy', 'Grievance Redressal Policy', 'License'].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-sm text-muted hover:text-foreground transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Others */}
            <div className="flex flex-col gap-4">
              <h4 className="font-medium text-foreground">Others</h4>
              <ul className="flex flex-col gap-3">
                {['Request A Demo', 'Contact Sales'].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-sm text-muted hover:text-foreground transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

      </div>

      {/* Giant "ember" Text Background Fade */}
      <div className="relative mt-24 flex w-full justify-center overflow-hidden">
        <h1 
          className="font-display font-black leading-none tracking-tight bg-clip-text text-transparent"
          style={{
            fontSize: "clamp(120px, 32vw, 600px)",
            backgroundImage: "linear-gradient(180deg, var(--color-ember-amber) 20%, transparent 120%)",
            opacity: 0.75,
            transform: "scaleX(1.15)",
            userSelect: "none"
          }}
        >
          ember
        </h1>
        {/* Soft bottom glow to fade into the bottom */}
        <div className="absolute bottom-0 h-16 w-full bg-gradient-to-t from-background to-transparent" />
      </div>
    </footer>
  );
}
