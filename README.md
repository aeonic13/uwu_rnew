# SubletHub

A mobile-first React application for student subletting, built with React, Vite, and Tailwind CSS.

## Features

- **Student Authentication**: University email verification system
- **Property Browsing**: Search and filter subletting opportunities by university and location
- **Detailed Listings**: View property details, amenities, and owner information
- **Secure Applications**: Built-in application and payment processing flow
- **Messaging System**: Direct communication with property owners
- **Legal Agreements**: AI-generated sublease agreements with digital signatures
- **Payment Center**: Track transactions and payment history
- **Profile Management**: User profile and preferences

## Tech Stack

- **React 18**: Modern React with hooks and functional components
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Lucide React**: Beautiful icon library
- **Mobile-First Design**: Optimized for mobile devices with responsive layouts

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd sublethub-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the project for production
- `npm run preview` - Preview the production build locally

## Project Structure

```
sublethub-app/
├── src/
│   ├── SubletApp.jsx      # Main application component
│   ├── main.jsx           # Application entry point
│   └── index.css          # Global styles and Tailwind imports
├── index.html             # HTML template
├── package.json           # Project dependencies and scripts
├── tailwind.config.js     # Tailwind CSS configuration
├── postcss.config.js      # PostCSS configuration
└── vite.config.js         # Vite configuration
```

## Key Components

- **SubletApp**: Main application component with routing logic
- **LoginScreen**: University email authentication
- **Browse View**: Property search and listing display
- **Detail View**: Individual property information
- **ApplicationFlow**: Multi-step application and payment process
- **SubleaseAgreementView**: Legal document signing interface
- **PaymentCenter**: Transaction history and management
- **PostListingForm**: Create new property listings
- **ProfileView**: User account management

## Features in Detail

### Authentication
- University email validation (.edu domains)
- Verified student status indicators

### Property Management
- Image galleries with favorites system
- Advanced filtering by university and location
- Detailed amenity listings and descriptions

### Secure Payments
- ACH bank transfer integration
- Service fee calculation (2%)
- Transaction tracking and history

### Legal Integration
- Automated sublease agreement generation
- Digital signature collection
- Agreement summary and terms display

## Mobile Optimization

The application is designed mobile-first with:
- Responsive layouts optimized for phones
- Touch-friendly interface elements
- PWA-ready meta tags for app-like experience
- Optimized form inputs to prevent zoom on iOS

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the package.json file for details.