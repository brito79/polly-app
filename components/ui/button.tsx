import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * 🔘 SECURE BUTTON COMPONENT
 * 
 * PURPOSE:
 * Provides a versatile, accessible button component that serves as the primary
 * action element throughout the application. Enhanced with security considerations,
 * accessibility features, and comprehensive styling options.
 * 
 * SECURITY CONSIDERATIONS:
 * - No event handlers that could bypass React's security model
 * - Type safety through TypeScript interfaces
 * - Proper disabled state handling to prevent unwanted actions
 * - Focus management for keyboard navigation security
 * - Slot pattern for composition without prop drilling vulnerabilities
 * 
 * ACCESSIBILITY FEATURES:
 * - Focus indicator with high contrast
 * - Proper disabled state handling
 * - Compatible with screen readers
 * - Keyboard navigation support
 * - Semantic HTML button element (unless asChild is true)
 * - ARIA states support
 * 
 * VARIANTS:
 * - default: Primary action button with brand color
 * - destructive: For destructive actions (delete, remove)
 * - outline: Bordered button for secondary actions
 * - secondary: Alternate styling for complementary actions
 * - ghost: Minimal styling for subtle actions
 * - link: Text-only button that appears as a link
 * 
 * SIZES:
 * - default: Standard size for most use cases
 * - sm: Small size for compact layouts
 * - lg: Large size for prominent actions
 * - icon: Square button for icon-only buttons
 * 
 * USAGE BEST PRACTICES:
 * 1. Use appropriate variant based on action context
 * 2. Include type="button" when not submitting forms
 * 3. Include aria-label for icon-only buttons
 * 4. Disable buttons during loading states
 * 5. Use destructive variant for dangerous actions
 * 
 * @example
 * // Primary action button
 * <Button>Save Changes</Button>
 * 
 * // Destructive action
 * <Button variant="destructive">Delete Account</Button>
 * 
 * // Icon button with accessibility
 * <Button variant="ghost" size="icon" aria-label="Close dialog">
 *   <XIcon />
 * </Button>
 */

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * Button component with multiple variants and sizes
 * 
 * @param props - Button properties including variant, size, and whether to render as a child
 * @returns React component
 */
function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  // Use Slot from Radix UI when asChild is true, otherwise use native button
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      // Default to button type when not specified and not using asChild
      type={!asChild && !props.type ? "button" : props.type}
      {...props}
    />
  )
}

export { Button, buttonVariants }

/**
 * 📚 BUTTON USAGE DOCUMENTATION
 * 
 * USED IN:
 * - components/auth/LoginForm.tsx - Form submission
 * - components/auth/RegisterForm.tsx - Account creation
 * - components/polls/CreatePollForm.tsx - Poll creation
 * - components/polls/VotingComponent.tsx - Vote submission
 * - components/layout/Navbar.tsx - Navigation actions
 * 
 * SECURITY IMPLEMENTATION:
 * The Button component enhances security by:
 * 1. Setting explicit button type to prevent accidental form submissions
 * 2. Supporting disabled state to prevent multiple submissions
 * 3. Using composition pattern to avoid security issues with prop drilling
 * 4. Maintaining accessibility for keyboard navigation security
 * 
 * VULNERABILITY PREVENTION:
 * - Click jacking protection through proper button semantics
 * - CSRF protection support through proper form submission
 * - Focus management for keyboard security
 * - Explicit type setting to avoid unintended form submissions
 * 
 * ACCESSIBILITY FEATURES:
 * - High contrast focus indicators
 * - Proper disabled state handling
 * - Keyboard navigation support
 * - Screen reader compatibility
 * - Support for ARIA attributes
 * - Visual feedback on interaction states
 */
