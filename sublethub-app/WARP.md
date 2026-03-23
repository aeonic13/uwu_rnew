# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common Development Commands

### Development Server
- `npm run dev` - Start development server on http://localhost:3000
- `npm run start` - Alternative command to start development server

### Build and Production
- `npm run build` - Create production build in `dist/` directory
- `npm run preview` - Preview the production build locally

### Package Management
- `npm install` - Install all dependencies
- `npm install [package]` - Add a new dependency

## Project Architecture

### Technology Stack
- **React 18** with functional components and hooks
- **Vite** as build tool and dev server
- **Tailwind CSS** for styling with mobile-first responsive design
- **Lucide React** for icons
- **PostCSS** with Autoprefixer for CSS processing

### Application Structure
This is a **single-page application (SPA)** with a sophisticated architecture that combines a main orchestrating component with imported specialized components. The app uses view-based routing through React state management rather than traditional URL-based routing.

#### Core Architecture Pattern
- **State-based routing**: Uses `currentView` state to control which "page" is displayed
- **Main orchestrator**: Primary logic in `SubletApp.jsx` (~2000+ lines) that manages state and navigation
- **Modular components**: Key features split into separate imported components:
  - `UniversitySearch` - Advanced university-based property search with radius filtering
  - `EnhancedRegistration` - Multi-step onboarding with user type detection
  - `AdvancedSearch` - Complex filtering system for property discovery
  - `EnhancedPropertyDetails` - Rich property information with tour scheduling
  - `EnhancedMessaging` - Real-time chat system with property owners
  - Plus 20+ other specialized components for landlord/student workflows
- **Dual-user architecture**: Separate navigation and features for property owners vs. students
- **View management**: Different UI sections rendered conditionally based on `currentView` state

#### Key Views and Navigation
**Student Views:**
- `'browse'` - Main property listing view with search/filtering and university radius search
- `'university-search'` - Advanced search by university with distance-based filtering
- `'detail'` - Property details with enhanced owner info, amenities, and application flow
- `'application'` - Multi-step application with secure payment processing
- `'messages'` - Instagram-style messaging with property owners and tour scheduling
- `'move-in'` - Property condition documentation and utility setup
- `'payments'` - Rent payments, transaction history, and payment reminders
- `'agreement'` - State-compliant legal document signing with digital signatures
- `'confirmation'` - Booking confirmation with next-steps guidance

**Owner/Landlord Views:**
- `'owner-dashboard'` - Comprehensive property management hub with analytics
- `'landlord-listing'` - Advanced listing creation with legal compliance
- `'landlord-inbox'` - Application review and tenant communication
- `'owner-approvals'` - Sublease approval workflow with owner verification
- `'banking-bookkeeping'` - Financial management with automated rent collection
- `'rent-collection'` - Payment processing with 91%+ success rate automation
- `'tax-center'` - Automated Schedule E and 1099 form generation
- `'utility-manager'` - Utility bill management and tenant cost allocation

**Shared/Universal Views:**
- `'profile'` - Role-specific account management (different features for owners vs. students)
- `'dispute-resolution'` - Legal dispute mediation system
- `'deposit-protection'` - Security deposit escrow and return processing
- `'property-management'` - Active lease management for multi-party situations

#### Data Management
- **Local state management**: All data stored in React state (no external state library)
- **Sample data**: Uses hardcoded sample listings for development
- **Real-time features**: Message system, favorites, application tracking
- **Mock integrations**: Simulated payment processing, agreement generation

### Mobile-First Design Philosophy
- **Responsive container**: Fixed max-width mobile container (`max-w-md mx-auto`)
- **Touch-optimized**: Large touch targets, prevented iOS zoom on inputs
- **Bottom navigation**: Fixed mobile-style navigation bar
- **PWA-ready**: Meta tags configured for app-like experience
- **Custom mobile CSS**: iOS tap highlight disabled, mobile-specific animations

### Authentication System
- **University email verification**: Validates `.edu` domain emails
- **Verification badges**: Visual indicators for verified students
- **Session simulation**: Basic user state management (no real auth backend)

### Component Integration Pattern
When working with this codebase, note that:
- New features should be added as views within the main `SubletApp` component
- Navigation handled through `setCurrentView()` state updates
- Shared state accessible throughout the application via props/state
- Styling follows Tailwind utility classes with consistent mobile-first approach
- Icons from Lucide React library should be imported at the top

### File Structure Context
```
src/
├── SubletApp.jsx              # Main application orchestrator (2000+ lines)
├── main.jsx                   # React app entry point
├── index.css                  # Global styles, Tailwind imports, mobile optimizations
├── utils/
│   └── security.js            # Comprehensive security utilities (689 lines)
└── [Component Files]          # Imported specialized components:
    ├── UniversitySearch.jsx   # University-based property search
    ├── EnhancedRegistration.jsx # Multi-step user onboarding
    ├── AdvancedSearch.jsx     # Advanced filtering system
    ├── EnhancedPropertyDetails.jsx # Rich property display
    ├── EnhancedMessaging.jsx  # Real-time messaging system
    ├── MessagesList.jsx       # Instagram-style conversation list
    ├── PaymentReminders.jsx   # Automated payment system
    ├── MoveInConfirmation.jsx # Property condition documentation
    ├── OwnerDashboard.jsx     # Property management hub
    ├── BankingBookkeeping.jsx # Financial management
    ├── RentCollectionSystem.jsx # Payment processing
    ├── TaxCenter.jsx          # Tax form automation
    └── [20+ additional components for specialized workflows]
```

## Security Architecture

### Comprehensive Security System
The app includes a sophisticated security layer in `src/utils/security.js` with:

#### SQL Injection Prevention
- **SecureQueryBuilder class**: Parameterized query construction
- **Input validation**: Type-safe validation for email, phone, numbers, strings, dates, UUIDs
- **Identifier escaping**: Automatic SQL identifier sanitization

#### XSS Prevention
- **DOMPurify integration**: HTML sanitization for user content
- **Context-aware sanitization**: Different rules for comments, descriptions, general content
- **Form data validation**: Schema-based sanitization with configurable rules

#### Rate Limiting
- **RateLimiter class**: Sophisticated rate limiting with IP blocking
- **Action-specific limits**: Different limits for login, messaging, applications, listings
- **Automatic cleanup**: Memory-efficient with periodic cleanup of old entries
- **Configurable policies**: Customizable limits per action type

#### Additional Security Features
- **Secure token generation**: Cryptographically secure random tokens
- **Password hashing**: SHA-256 based password security (production should use bcrypt)
- **File upload validation**: Size, type, and extension validation
- **Security event logging**: Comprehensive audit trail with severity levels

### Security Integration Points
When working with user input or data processing:
1. Use `validateInput()` for type-safe input validation
2. Apply `sanitizeUserContent()` for display of user-generated content
3. Use `applyRateLimit()` before processing sensitive actions
4. Log security events with `logSecurityEvent()` for audit trails

## Development Guidelines

### When Adding New Features
1. Add new views to the `currentView` state management system
2. Create separate component files for complex features (follow imported component pattern)
3. For simple features, add inline components within `SubletApp.jsx`
4. Add navigation logic to role-appropriate bottom navigation (owner vs. student navigation differs)
5. Maintain mobile-first responsive design principles
6. Use Tailwind classes consistently with existing UI patterns
7. **Always apply appropriate security measures** from `utils/security.js`

### Styling Standards
- **Mobile-first**: Design for 375px+ width, max-width container of 28rem
- **Color scheme**: Blue primary (`blue-600`), success green, gray neutrals
- **Spacing**: Consistent padding/margin using Tailwind spacing scale
- **Interactive states**: Hover/focus states for all interactive elements

### State Management Patterns
- Use React hooks (useState, useEffect) for local component state
- Pass data between views using existing state variables
- Follow the established pattern of lifting state up to the main component
- Maintain data structures similar to existing `listings`, `favorites`, `messages` arrays

## Key Integration Points

### Adding New Property Features
- Extend the `sampleListings` data structure
- Update filtering logic in `filteredListings`
- Add amenity options to `availableAmenities` array

### Payment/Transaction Features
- Follow the `submitPayment()` and `generateSubleaseAgreement()` patterns
- Update `transactions` state array for new payment types
- Maintain the mock approval workflow pattern

### University Integration
- Add new universities to the `universities` array in SubletApp.jsx
- Update email validation using `validateInput('email')` from security utils
- Maintain the verified student badge system
- Consider radius-based search functionality in UniversitySearch component

### Adding Security to New Features
- **User input validation**: Use `sanitizeFormData()` with appropriate schemas
- **Rate limiting**: Apply `applyRateLimit()` for user actions (especially forms, messaging, applications)
- **Content sanitization**: Use `sanitizeUserContent()` for any displayed user-generated content
- **File uploads**: Validate with `validateFileUpload()` for size, type, and extension checks
- **Logging**: Add `logSecurityEvent()` calls for important security-related actions

### Dual-User Architecture Considerations
When adding features, consider:
- **Role-based access**: Different functionality for `userType === 'owner'` vs. `userType === 'student'`
- **Navigation differences**: Owners get Dashboard/Post/Payments/Inbox, Students get Browse/Messages/Property/Profile
- **Data visibility**: What data should be accessible to which user types
- **Workflow differences**: Owner approval workflows vs. student application workflows

### Component Architecture Best Practices
- **Large features**: Create separate component files (imported pattern like `EnhancedMessaging`)
- **Simple features**: Add as inline components within SubletApp.jsx
- **State management**: Pass necessary state down as props, lift state up to SubletApp for shared data
- **Security integration**: Always validate and sanitize data at component boundaries
