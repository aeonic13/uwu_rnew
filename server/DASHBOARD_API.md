# Dashboard API Endpoints

## Overview

New dashboard endpoints for landlords to manage group applications, track payments, and view rent rolls.

**Base URL**: `/api/dashboard`  
**Authentication**: Required (Owner role only)

---

## Endpoints

### 1. Get Applications for Listing

**GET** `/api/dashboard/landlord/applications/:listingId`

Get all applications for a specific listing with group status and payment details.

#### Parameters
- `listingId` (path) - Listing ID

#### Response
```json
{
  "listing": {
    "id": "listing-id",
    "title": "2BR Apartment near UCLA",
    "price": 2000
  },
  "applications": [
    {
      "id": "app-id",
      "status": "approved",
      "startDate": "2026-03-01T00:00:00.000Z",
      "endDate": "2027-03-01T00:00:00.000Z",
      "applicant": {
        "id": "user-id",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@student.edu",
        "university": "UCLA",
        "verified": true
      },
      "transactions": [...],
      "agreement": {...},
      "cosigners": [...]
    }
  ],
  "stats": {
    "total": 5,
    "pending": 2,
    "approved": 2,
    "rejected": 1,
    "withCosigners": 3,
    "totalRevenue": 10000
  }
}
```

#### Use Case
- View all applicants for a property
- See payment history per applicant
- Track cosigner status
- Monitor revenue from the property

---

### 2. Get Group Application Status

**GET** `/api/dashboard/landlord/group-status/:listingId`

Get detailed breakdown of application statuses for group living situations.

#### Parameters
- `listingId` (path) - Listing ID

#### Response
```json
{
  "listing": {
    "id": "listing-id",
    "title": "4BR House",
    "bedrooms": 4
  },
  "breakdown": {
    "readyForMove": [...],
    "pendingTenantSignature": [...],
    "pendingLandlordSignature": [...],
    "awaitingApproval": [...],
    "needsCosigner": [...],
    "rejected": [...]
  },
  "summary": {
    "total": 10,
    "readyToMove": 2,
    "awaitingSignatures": 3,
    "needsReview": 5
  }
}
```

#### Use Case
- Manage group housing (4+ bedroom properties)
- See which applicants have completed signing
- Identify which applications need cosigners
- Track which applicants are ready to move in

---

### 3. Get Rent Roll

**GET** `/api/dashboard/landlord/rent-roll`

Get portfolio-wide view of all properties with tenant and payment summaries.

#### Response
```json
{
  "rentRoll": [
    {
      "listing": {
        "id": "listing-id",
        "title": "2BR Apartment",
        "address": "123 Main St, Los Angeles"
      },
      "tenants": [
        {
          "id": "tenant-id",
          "name": "John Doe",
          "email": "john@student.edu",
          "monthlyRent": 2000,
          "leaseStart": "2026-03-01",
          "leaseEnd": "2027-03-01",
          "paidThisMonth": 2000,
          "pendingThisMonth": 0
        }
      ],
      "occupancy": "2/2",
      "financials": {
        "monthlyExpected": 4000,
        "monthlyCollected": 4000,
        "pendingCollection": 0,
        "collectionRate": "100.0"
      }
    }
  ],
  "totals": {
    "properties": 5,
    "totalUnits": 15,
    "occupiedUnits": 12,
    "occupancyRate": "80.0",
    "monthlyExpected": 24000,
    "monthlyCollected": 22000,
    "pendingCollection": 1000
  },
  "month": "February 2026"
}
```

#### Use Case
- Portfolio overview for landlords with multiple properties
- Track occupancy rates across properties
- Monitor payment collection rates
- Identify late payments or pending collections
- Calculate monthly cash flow

---

### 4. Get Payment Status for Application

**GET** `/api/dashboard/landlord/payment-status/:applicationId`

Get detailed payment history and statistics for a specific tenant/application.

#### Parameters
- `applicationId` (path) - Application ID

#### Response
```json
{
  "application": {
    "id": "app-id",
    "status": "approved",
    "startDate": "2026-03-01",
    "endDate": "2027-03-01"
  },
  "tenant": {
    "id": "user-id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@student.edu",
    "phone": "+1234567890"
  },
  "listing": {
    "id": "listing-id",
    "title": "2BR Apartment",
    "location": "123 Main St"
  },
  "agreement": {
    "monthlyRent": 2000,
    "securityDeposit": 4000,
    "startDate": "2026-03-01",
    "endDate": "2027-03-01"
  },
  "transactions": [
    {
      "id": "txn-id",
      "amount": 2000,
      "status": "completed",
      "createdAt": "2026-02-01",
      "paymentMethod": "ach"
    }
  ],
  "stats": {
    "totalPaid": 8000,
    "totalPending": 0,
    "totalFailed": 0,
    "paymentCount": 4,
    "lastPaymentDate": "2026-02-01",
    "expectedTotal": 8000,
    "balance": 0
  }
}
```

#### Use Case
- View tenant payment history
- Check if tenant is current on rent
- Calculate balance owed
- Track payment method used
- Identify payment failures

---

## Authentication

All endpoints require:
1. Valid JWT token in Authorization header
2. User role must be `owner` (landlord)

**Example Request:**
```bash
curl -X GET http://localhost:5001/api/dashboard/landlord/rent-roll \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": {
    "message": "Authentication required"
  }
}
```

### 403 Forbidden
```json
{
  "error": {
    "message": "You do not have permission to perform this action."
  }
}
```

### 404 Not Found
```json
{
  "error": {
    "message": "Listing not found or unauthorized"
  }
}
```

### 500 Server Error
```json
{
  "error": {
    "message": "Failed to get applications"
  }
}
```

---

## Frontend Integration

### Example: Fetch Rent Roll

```javascript
import { api } from '../services'

async function fetchRentRoll() {
  try {
    const response = await api.get('/dashboard/landlord/rent-roll')
    return response.data
  } catch (error) {
    console.error('Failed to fetch rent roll:', error)
    throw error
  }
}
```

### Example: Check Application Status

```javascript
async function getApplicationStatus(applicationId) {
  try {
    const response = await api.get(
      `/dashboard/landlord/payment-status/${applicationId}`
    )
    return response.data
  } catch (error) {
    console.error('Failed to fetch payment status:', error)
    throw error
  }
}
```

---

## Database Queries

These endpoints perform complex Prisma queries that:
- Use `include` to join related tables (applicant, transactions, agreements, cosigners)
- Calculate aggregate statistics (totals, averages, counts)
- Filter by date ranges (current month for rent roll)
- Sort results by creation date

**Performance Considerations:**
- Rent roll endpoint may be slow for landlords with 50+ properties
- Consider adding pagination for large result sets
- Add database indexes on `ownerId`, `listingId`, `status` fields

---

## Testing

### Test with cURL

```bash
# 1. Login to get token
TOKEN=$(curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"landlord@example.com","password":"password"}' \
  | jq -r '.token')

# 2. Get rent roll
curl -X GET http://localhost:5001/api/dashboard/landlord/rent-roll \
  -H "Authorization: Bearer $TOKEN" | jq

# 3. Get applications for a listing
curl -X GET http://localhost:5001/api/dashboard/landlord/applications/LISTING_ID \
  -H "Authorization: Bearer $TOKEN" | jq

# 4. Get group status
curl -X GET http://localhost:5001/api/dashboard/landlord/group-status/LISTING_ID \
  -H "Authorization: Bearer $TOKEN" | jq

# 5. Get payment status
curl -X GET http://localhost:5001/api/dashboard/landlord/payment-status/APP_ID \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## Status

✅ **Complete and Ready to Use**

All endpoints are:
- Implemented with Prisma database queries
- Protected with authentication middleware
- Role-restricted to owners only
- Returning comprehensive data with statistics

**Next Steps:**
- Build frontend dashboard components
- Add data visualization (charts, graphs)
- Implement export to CSV/PDF features
- Add date range filters

---

**Created**: February 25, 2026  
**API Version**: 1.0.0
