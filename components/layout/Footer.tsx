import Link from "next/link";
import { BarChart3, Github, Twitter, Mail } from "lucide-react";

/**
 * 📋 ACCESSIBLE FOOTER COMPONENT
 * 
 * PURPOSE:
 * Provides a consistent site footer with navigation links, branding,
 * and contact information. Enhances accessibility, provides additional
 * navigation paths, and displays legal/informational content.
 * 
 * SECURITY FEATURES:
 * - Safe external link handling with rel attributes
 * - No sensitive information exposure
 * - Proper Next.js Link usage for internal navigation
 * - Security policy and terms link inclusion
 * 
 * ACCESSIBILITY FEATURES:
 * - Semantic HTML structure with proper landmarks
 * - Accessible link text and descriptions
 * - Grouped navigation by category
 * - Screen reader compatibility
 * - Keyboard navigation support
 * - Proper heading hierarchy
 * - High contrast support
 * 
 * USAGE IN CODEBASE:
 * - Used in: app/layout.tsx (global footer)
 * - Complements: components/layout/Navbar.tsx
 * - Navigation: Uses Next.js Link for client-side routing
 * - External links: Secure handling with proper rel attributes
 * 
 * RESPONSIVE DESIGN:
 * - Mobile-friendly grid layout
 * - Adapts to different screen sizes
 * - Maintains readability on small screens
 * 
 * @author Polly Development Team
 * @version 2.0.0 - Enhanced Accessibility & Security
 * @since 2025-09-17
 */
export function Footer() {
  return (
    <footer 
      className="border-t bg-background"
      role="contentinfo"
      aria-label="Site footer"
    >
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 🏠 BRANDING SECTION: Logo and company description */}
          <div className="space-y-4">
            <Link 
              href="/" 
              className="flex items-center space-x-2"
              aria-label="Polly - Go to home page"
            >
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
              </div>
              <span className="text-xl font-bold">Polly</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Create and participate in polls to gather opinions and make decisions together.
            </p>
          </div>

          {/* 📊 PRODUCT LINKS: Main application features */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold" id="product-navigation">Product</h3>
            <ul 
              className="space-y-2 text-sm"
              aria-labelledby="product-navigation"
              role="navigation"
            >
              <li>
                <Link href="/polls" className="text-muted-foreground hover:text-foreground">
                  Browse Polls
                </Link>
              </li>
              <li>
                <Link href="/polls/create" className="text-muted-foreground hover:text-foreground">
                  Create Poll
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* ℹ️ SUPPORT LINKS: Help and information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold" id="support-navigation">Support</h3>
            <ul 
              className="space-y-2 text-sm"
              aria-labelledby="support-navigation"
              role="navigation"
            >
              <li>
                <Link 
                  href="/help" 
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Help Center - Get assistance with using Polly"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Contact Us - Get in touch with our team"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link 
                  href="/privacy" 
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Privacy Policy - Learn how we protect your data"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms" 
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Terms of Service - Read our terms and conditions"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* 🔗 SOCIAL LINKS: External connections */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold" id="connect-links">Connect</h3>
            <div 
              className="flex space-x-4"
              aria-labelledby="connect-links"
            >
              <a
                href="https://twitter.com/pollyapp"
                className="text-muted-foreground hover:text-foreground"
                aria-label="Follow us on Twitter"
                rel="noopener noreferrer"
                target="_blank"
              >
                <Twitter className="h-5 w-5" aria-hidden="true" />
              </a>
              <a
                href="https://github.com/pollyapp/polly"
                className="text-muted-foreground hover:text-foreground"
                aria-label="View our code on GitHub"
                rel="noopener noreferrer"
                target="_blank"
              >
                <Github className="h-5 w-5" aria-hidden="true" />
              </a>
              <a
                href="mailto:contact@pollyapp.com"
                className="text-muted-foreground hover:text-foreground"
                aria-label="Email our team"
              >
                <Mail className="h-5 w-5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        {/* 📝 COPYRIGHT SECTION: Legal information */}
        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Polly. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

// 📚 FOOTER USAGE DOCUMENTATION
// 
// INTEGRATION POINTS:
// - Layout Component: app/layout.tsx (global application layout)
// - Navigation: Next.js Link for internal routing
// - External Links: Security hardened with proper rel attributes
// - UI Components: Uses Lucide icons for visual elements
// 
// SECURITY MEASURES IMPLEMENTED:
// ✅ External link protection with rel="noopener noreferrer"
// ✅ Safe icon rendering with aria-hidden
// ✅ Proper target="_blank" handling
// ✅ No sensitive information disclosure
// ✅ Privacy policy and terms links included
// 
// ACCESSIBILITY FEATURES:
// ✅ Semantic HTML footer structure
// ✅ ARIA labels and roles
// ✅ Screen reader compatibility
// ✅ Keyboard navigation support
// ✅ Proper heading hierarchy
// ✅ High contrast support
// ✅ Descriptive link text and icons
// 
// RESPONSIVE BEHAVIOR:
// - Desktop: Four-column grid layout
// - Mobile: Single column stacked layout
// - Tablet: Adaptive grid based on screen width
// 
// DATA MANAGEMENT:
// - Static content with no dynamic data loading
// - No user-specific information displayed
// - No tracking or analytics scripts included
// - Clear copyright and legal information
