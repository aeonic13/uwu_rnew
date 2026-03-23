# Rentra - Comprehensive Student Housing Platform

Rentra is a comprehensive web application designed to connect students for rentalting arrangements. The platform provides secure, legal, and efficient tools for property owners, students seeking housing, and families supporting students.

## 🚀 Key Features

### For Students (Sublessees)
- **Advanced Property Search**: Search by university, location, price range, and amenities
- **University-Specific Search**: Find properties within specific distances from major universities
- **Secure Messaging**: Direct communication with property owners and current tenants
- **Application Management**: Digital application process with document upload
- **Parent/Guardian Support**: Allow family members to help with payments and lease management
- **Lease Contract Creation**: Generate legally binding rentalting agreements
- **Payment Integration**: Secure rent payments with ACH and credit card support

### For Property Owners/Landlords
- **Comprehensive Dashboard**: Full property portfolio management
- **Rent Collection System**: Automated rent collection with 91%+ success rate
- **Banking & Bookkeeping**: Integrated financial management and reporting
- **Tax Center**: Automated Schedule E and 1099 form generation
- **Lease Approval System**: Review and approve tenant rentalting requests
- **Tenant Screening**: Background checks and application review tools
- **Maintenance Management**: Track and manage property maintenance requests
- **Security Deposit Management**: Secure escrow and return processing

### For Student Rentalters
- **Listing Creation**: Post room or property rentals with owner approval workflow
- **Legal Contract Generation**: State-compliant lease agreements with digital signatures
- **Tenant Screening**: Verify and screen potential sublessees
- **Payment Collection**: Set up automated rent collection from sublessees

### Family Features
- **Parent/Guardian Management**: Allow family members to support student housing costs
- **Payment Authorization**: Parents can make rent payments on behalf of students
- **Family Notifications**: Keep all family members informed of important updates
- **Emergency Contact Integration**: Streamlined emergency communication systems

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
   cd rentra-app
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
rentra-app/
├── src/
│   ├── RentraApp.jsx      # Main application component
│   ├── main.jsx           # Application entry point
│   └── index.css          # Global styles and Tailwind imports
├── index.html             # HTML template
├── package.json           # Project dependencies and scripts
├── tailwind.config.js     # Tailwind CSS configuration
├── postcss.config.js      # PostCSS configuration
└── vite.config.js         # Vite configuration
```

## Key Components

- **RentraApp**: Main application component with routing logic
- **LoginScreen**: University email authentication
- **Browse View**: Property search and listing display
- **Detail View**: Individual property information
- **ApplicationFlow**: Multi-step application and payment process
- **LeaseAgreementView**: Legal document signing interface
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
- Automated lease agreement generation
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