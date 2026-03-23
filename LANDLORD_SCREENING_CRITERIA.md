# Landlord Screening Criteria Configuration

**Feature**: Allow landlords to set custom screening requirements per property or as default profile settings.

**Why This Matters**: The San Diego PM mentioned they require "4x-5x income-to-rent ratio." Different landlords have different risk tolerances. Some require 3x income, others 5x. Some accept 620 credit, others require 700+.

---

## User Story

**As a landlord**, I want to:
1. Set my income requirement (3x, 4x, or 5x monthly rent)
2. Set minimum credit score (600, 650, 700, etc.)
3. Define if employment verification is required
4. Specify reference requirements (number of references)
5. Set criminal background policies (case-by-case vs automatic reject)
6. Define eviction history policy

**So that** Rentra automatically scores applicants against MY criteria, not generic criteria.

---

## Database Schema Design

### Option 1: Per-Property Criteria (Recommended)

```prisma
model Listing {
  id                    String   @id @default(cuid())
  // ... existing fields ...
  
  // Screening Criteria (embedded)
  incomeMultiplier      Float    @default(4.0)  // 3.0, 4.0, 5.0, etc.
  minCreditScore        Int      @default(650)  // 600, 650, 700, etc.
  requireEmployment     Boolean  @default(true)
  requireReferences     Int      @default(2)    // Number of references
  
  // Background Check Policies
  allowCriminalHistory  Boolean  @default(false)
  allowEvictionHistory  Boolean  @default(false)
  
  // Optional: More granular control
  screeningNotes        String?  // "Will consider case-by-case for misdemeanors"
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

**Pros**: 
- Simple, criteria attached directly to listing
- Easy to query and display on listing page
- Landlord can have different criteria for different properties

**Cons**: 
- Landlord has to set criteria for every new listing

---

### Option 2: Default Profile + Per-Property Override (Best UX)

```prisma
// Landlord's default screening criteria
model ScreeningProfile {
  id                    String   @id @default(cuid())
  userId                String   @unique  // Landlord's user ID
  user                  User     @relation(fields: [userId], references: [id])
  
  // Default criteria (applies to all properties unless overridden)
  incomeMultiplier      Float    @default(4.0)
  minCreditScore        Int      @default(650)
  requireEmployment     Boolean  @default(true)
  requireReferences     Int      @default(2)
  allowCriminalHistory  Boolean  @default(false)
  allowEvictionHistory  Boolean  @default(false)
  
  // Pet Policy
  allowPets             Boolean  @default(false)
  maxPetWeight          Int?     // in pounds
  petDeposit            Float?   // additional pet deposit
  
  // Smoking Policy
  allowSmoking          Boolean  @default(false)
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

model Listing {
  id                    String   @id @default(cuid())
  // ... existing fields ...
  
  // Override default screening criteria (optional)
  overrideIncomeMultiplier      Float?
  overrideMinCreditScore        Int?
  overrideRequireEmployment     Boolean?
  overrideRequireReferences     Int?
  overrideAllowCriminalHistory  Boolean?
  overrideAllowEvictionHistory  Boolean?
  
  // Computed: Use override if set, otherwise use profile default
  // This is calculated in application code, not database
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

**Pros**: 
- Best UX: Landlord sets criteria once, applies to all properties
- Can override per-property if needed ("This property is cheaper, I'll accept 3x income instead of my usual 4x")
- Saves time for landlords with multiple properties

**Cons**: 
- Slightly more complex logic (need to check override first, then fall back to profile default)

**Recommendation**: Use Option 2 for best landlord experience.

---

## API Endpoints

### 1. Get/Update Landlord's Default Screening Profile

```javascript
// GET /api/screening-profile
// Returns landlord's default screening criteria

router.get('/screening-profile', authMiddleware, async (req, res) => {
  const userId = req.user.id
  
  // Get or create screening profile
  let profile = await prisma.screeningProfile.findUnique({
    where: { userId }
  })
  
  // If no profile exists, create default one
  if (!profile) {
    profile = await prisma.screeningProfile.create({
      data: {
        userId,
        incomeMultiplier: 4.0,
        minCreditScore: 650,
        requireEmployment: true,
        requireReferences: 2,
        allowCriminalHistory: false,
        allowEvictionHistory: false,
        allowPets: false,
        allowSmoking: false
      }
    })
  }
  
  res.json(profile)
})

// PUT /api/screening-profile
// Update landlord's default screening criteria

router.put('/screening-profile', authMiddleware, async (req, res) => {
  const userId = req.user.id
  const {
    incomeMultiplier,
    minCreditScore,
    requireEmployment,
    requireReferences,
    allowCriminalHistory,
    allowEvictionHistory,
    allowPets,
    maxPetWeight,
    petDeposit,
    allowSmoking
  } = req.body
  
  // Validation
  if (incomeMultiplier && (incomeMultiplier < 2.0 || incomeMultiplier > 10.0)) {
    return res.status(400).json({ error: 'Income multiplier must be between 2.0 and 10.0' })
  }
  
  if (minCreditScore && (minCreditScore < 300 || minCreditScore > 850)) {
    return res.status(400).json({ error: 'Credit score must be between 300 and 850' })
  }
  
  const profile = await prisma.screeningProfile.upsert({
    where: { userId },
    update: {
      incomeMultiplier,
      minCreditScore,
      requireEmployment,
      requireReferences,
      allowCriminalHistory,
      allowEvictionHistory,
      allowPets,
      maxPetWeight,
      petDeposit,
      allowSmoking
    },
    create: {
      userId,
      incomeMultiplier: incomeMultiplier || 4.0,
      minCreditScore: minCreditScore || 650,
      requireEmployment: requireEmployment !== undefined ? requireEmployment : true,
      requireReferences: requireReferences || 2,
      allowCriminalHistory: allowCriminalHistory || false,
      allowEvictionHistory: allowEvictionHistory || false,
      allowPets: allowPets || false,
      maxPetWeight,
      petDeposit,
      allowSmoking: allowSmoking || false
    }
  })
  
  res.json(profile)
})
```

---

### 2. Override Criteria for Specific Listing

```javascript
// PUT /api/listings/:id/screening-criteria
// Override screening criteria for a specific property

router.put('/listings/:id/screening-criteria', authMiddleware, async (req, res) => {
  const { id } = req.params
  const userId = req.user.id
  const {
    overrideIncomeMultiplier,
    overrideMinCreditScore,
    overrideRequireEmployment,
    overrideRequireReferences,
    overrideAllowCriminalHistory,
    overrideAllowEvictionHistory
  } = req.body
  
  // Verify ownership
  const listing = await prisma.listing.findUnique({
    where: { id }
  })
  
  if (!listing || listing.ownerId !== userId) {
    return res.status(403).json({ error: 'Not authorized' })
  }
  
  // Update listing with overrides
  const updated = await prisma.listing.update({
    where: { id },
    data: {
      overrideIncomeMultiplier,
      overrideMinCreditScore,
      overrideRequireEmployment,
      overrideRequireReferences,
      overrideAllowCriminalHistory,
      overrideAllowEvictionHistory
    }
  })
  
  res.json(updated)
})
```

---

### 3. Get Effective Criteria (Profile + Override)

```javascript
// Helper function to get effective screening criteria for a listing
async function getEffectiveScreeningCriteria(listingId, landlordId) {
  // Get listing (with any overrides)
  const listing = await prisma.listing.findUnique({
    where: { id: listingId }
  })
  
  // Get landlord's default profile
  const profile = await prisma.screeningProfile.findUnique({
    where: { userId: landlordId }
  })
  
  // Merge: Use override if set, otherwise use profile default
  return {
    incomeMultiplier: listing.overrideIncomeMultiplier ?? profile?.incomeMultiplier ?? 4.0,
    minCreditScore: listing.overrideMinCreditScore ?? profile?.minCreditScore ?? 650,
    requireEmployment: listing.overrideRequireEmployment ?? profile?.requireEmployment ?? true,
    requireReferences: listing.overrideRequireReferences ?? profile?.requireReferences ?? 2,
    allowCriminalHistory: listing.overrideAllowCriminalHistory ?? profile?.allowCriminalHistory ?? false,
    allowEvictionHistory: listing.overrideAllowEvictionHistory ?? profile?.allowEvictionHistory ?? false
  }
}

// GET /api/listings/:id/screening-criteria
// Get effective screening criteria for a listing (profile + overrides)

router.get('/listings/:id/screening-criteria', async (req, res) => {
  const { id } = req.params
  
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { owner: true }
  })
  
  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' })
  }
  
  const criteria = await getEffectiveScreeningCriteria(id, listing.ownerId)
  
  res.json(criteria)
})
```

---

## Auto-Scoring Logic Integration

### Updated Application Scoring

```javascript
// Score an application against landlord's criteria
async function scoreApplication(applicationId) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      user: true,
      listing: {
        include: { owner: true }
      },
      cosigner: true
    }
  })
  
  // Get effective screening criteria
  const criteria = await getEffectiveScreeningCriteria(
    application.listingId,
    application.listing.ownerId
  )
  
  const results = {
    incomeCheck: null,
    creditCheck: null,
    employmentCheck: null,
    referencesCheck: null,
    criminalCheck: null,
    evictionCheck: null,
    overallStatus: 'pending'
  }
  
  // 1. Income Check (use cosigner income if present)
  const applicantIncome = application.cosigner?.verifiedIncome || application.user.verifiedIncome
  const rentAmount = application.listing.rent
  const requiredIncome = rentAmount * criteria.incomeMultiplier
  
  results.incomeCheck = {
    status: applicantIncome >= requiredIncome ? 'pass' : 'fail',
    applicantIncome,
    requiredIncome,
    multiplier: criteria.incomeMultiplier,
    message: `Income: $${applicantIncome}/month (required: $${requiredIncome}/month = rent $${rentAmount} × ${criteria.incomeMultiplier})`
  }
  
  // 2. Credit Check (if credit score available)
  if (application.user.creditScore) {
    results.creditCheck = {
      status: application.user.creditScore >= criteria.minCreditScore ? 'pass' : 'fail',
      creditScore: application.user.creditScore,
      minRequired: criteria.minCreditScore,
      message: `Credit Score: ${application.user.creditScore} (min required: ${criteria.minCreditScore})`
    }
  }
  
  // 3. Employment Check (if required)
  if (criteria.requireEmployment) {
    results.employmentCheck = {
      status: application.user.employmentStatus === 'employed' ? 'pass' : 'fail',
      employmentStatus: application.user.employmentStatus,
      message: application.user.employmentStatus === 'employed' 
        ? 'Employment: Verified ✓' 
        : 'Employment: Not verified'
    }
  }
  
  // 4. References Check
  const referenceCount = application.references?.length || 0
  results.referencesCheck = {
    status: referenceCount >= criteria.requireReferences ? 'pass' : 'fail',
    provided: referenceCount,
    required: criteria.requireReferences,
    message: `References: ${referenceCount}/${criteria.requireReferences} provided`
  }
  
  // 5. Criminal Background Check
  if (application.criminalBackgroundCheck) {
    results.criminalCheck = {
      status: criteria.allowCriminalHistory ? 'review' : 'fail',
      hasRecord: application.criminalBackgroundCheck.hasRecord,
      message: application.criminalBackgroundCheck.hasRecord
        ? (criteria.allowCriminalHistory ? 'Criminal history found - Manual review required' : 'Criminal history found - Does not meet criteria')
        : 'No criminal history found ✓'
    }
  }
  
  // 6. Eviction History Check
  if (application.evictionCheck) {
    results.evictionCheck = {
      status: criteria.allowEvictionHistory ? 'review' : 'fail',
      hasEviction: application.evictionCheck.hasEviction,
      message: application.evictionCheck.hasEviction
        ? (criteria.allowEvictionHistory ? 'Eviction history found - Manual review required' : 'Eviction history found - Does not meet criteria')
        : 'No eviction history found ✓'
    }
  }
  
  // Determine overall status
  const allChecks = Object.values(results).filter(v => v && typeof v === 'object' && v.status)
  const failedChecks = allChecks.filter(check => check.status === 'fail')
  const reviewChecks = allChecks.filter(check => check.status === 'review')
  
  if (failedChecks.length > 0) {
    results.overallStatus = 'does_not_meet_criteria'
  } else if (reviewChecks.length > 0) {
    results.overallStatus = 'manual_review_required'
  } else {
    results.overallStatus = 'meets_criteria'
  }
  
  // Update application with scoring results
  await prisma.application.update({
    where: { id: applicationId },
    data: {
      screeningResults: results,
      screeningStatus: results.overallStatus
    }
  })
  
  return results
}
```

---

## UI/UX Design

### 1. Landlord Settings Page: Default Screening Criteria

```jsx
// ScreeningProfileSettings.jsx

import React, { useState, useEffect } from 'react'
import { Check, X, Info } from 'lucide-react'

export default function ScreeningProfileSettings() {
  const [profile, setProfile] = useState(null)
  const [saving, setSaving] = useState(false)
  
  useEffect(() => {
    // Load existing profile
    fetch('/api/screening-profile')
      .then(res => res.json())
      .then(data => setProfile(data))
  }, [])
  
  const handleSave = async () => {
    setSaving(true)
    await fetch('/api/screening-profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    })
    setSaving(false)
  }
  
  if (!profile) return <div>Loading...</div>
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Default Screening Criteria</h1>
      <p className="text-gray-600 mb-8">
        Set your default screening requirements. These will apply to all new listings unless you override them.
      </p>
      
      {/* Income Requirement */}
      <div className="mb-6 p-4 border rounded-lg">
        <label className="block font-semibold mb-2">
          Income Requirement
          <span className="ml-2 text-sm text-gray-500 font-normal">
            How many times the monthly rent must applicants earn?
          </span>
        </label>
        
        <div className="flex items-center gap-4">
          {[3.0, 3.5, 4.0, 4.5, 5.0].map(multiplier => (
            <button
              key={multiplier}
              onClick={() => setProfile({ ...profile, incomeMultiplier: multiplier })}
              className={`px-4 py-2 rounded-lg border-2 transition ${
                profile.incomeMultiplier === multiplier
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {multiplier}x
            </button>
          ))}
        </div>
        
        <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
          <strong>Example:</strong> For a $1,000/month property with {profile.incomeMultiplier}x requirement, 
          applicants must earn ${(1000 * profile.incomeMultiplier).toLocaleString()}/month
        </div>
      </div>
      
      {/* Credit Score */}
      <div className="mb-6 p-4 border rounded-lg">
        <label className="block font-semibold mb-2">
          Minimum Credit Score
        </label>
        
        <div className="flex items-center gap-4">
          {[600, 620, 650, 680, 700].map(score => (
            <button
              key={score}
              onClick={() => setProfile({ ...profile, minCreditScore: score })}
              className={`px-4 py-2 rounded-lg border-2 transition ${
                profile.minCreditScore === score
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {score}+
            </button>
          ))}
        </div>
        
        <div className="mt-3 text-sm text-gray-600">
          <strong>Note:</strong> 650+ is typical for rental properties. Lower scores may indicate higher risk.
        </div>
      </div>
      
      {/* Employment Verification */}
      <div className="mb-6 p-4 border rounded-lg">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={profile.requireEmployment}
            onChange={(e) => setProfile({ ...profile, requireEmployment: e.target.checked })}
            className="w-5 h-5"
          />
          <span className="font-semibold">Require Employment Verification</span>
        </label>
        <p className="text-sm text-gray-600 ml-8 mt-1">
          Applicants must have verified employment or consistent income source
        </p>
      </div>
      
      {/* References */}
      <div className="mb-6 p-4 border rounded-lg">
        <label className="block font-semibold mb-2">
          Number of References Required
        </label>
        
        <div className="flex items-center gap-4">
          {[0, 1, 2, 3].map(count => (
            <button
              key={count}
              onClick={() => setProfile({ ...profile, requireReferences: count })}
              className={`px-4 py-2 rounded-lg border-2 transition ${
                profile.requireReferences === count
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {count}
            </button>
          ))}
        </div>
      </div>
      
      {/* Background Policies */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="font-semibold mb-3">Background Check Policies</h3>
        
        <label className="flex items-center gap-3 mb-3">
          <input
            type="checkbox"
            checked={profile.allowCriminalHistory}
            onChange={(e) => setProfile({ ...profile, allowCriminalHistory: e.target.checked })}
            className="w-5 h-5"
          />
          <span>Consider applicants with criminal history (case-by-case review)</span>
        </label>
        
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={profile.allowEvictionHistory}
            onChange={(e) => setProfile({ ...profile, allowEvictionHistory: e.target.checked })}
            className="w-5 h-5"
          />
          <span>Consider applicants with eviction history (case-by-case review)</span>
        </label>
        
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <Info className="inline w-4 h-4 mr-2" />
          <strong>Legal Note:</strong> Fair Housing laws prohibit blanket bans. If unchecked, 
          applications will be flagged for your manual review rather than auto-rejected.
        </div>
      </div>
      
      {/* Pet Policy */}
      <div className="mb-6 p-4 border rounded-lg">
        <label className="flex items-center gap-3 mb-3">
          <input
            type="checkbox"
            checked={profile.allowPets}
            onChange={(e) => setProfile({ ...profile, allowPets: e.target.checked })}
            className="w-5 h-5"
          />
          <span className="font-semibold">Allow Pets</span>
        </label>
        
        {profile.allowPets && (
          <div className="ml-8 space-y-3">
            <div>
              <label className="block text-sm mb-1">Max Pet Weight (lbs)</label>
              <input
                type="number"
                value={profile.maxPetWeight || ''}
                onChange={(e) => setProfile({ ...profile, maxPetWeight: parseInt(e.target.value) })}
                className="w-32 px-3 py-2 border rounded"
                placeholder="50"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Additional Pet Deposit ($)</label>
              <input
                type="number"
                value={profile.petDeposit || ''}
                onChange={(e) => setProfile({ ...profile, petDeposit: parseFloat(e.target.value) })}
                className="w-32 px-3 py-2 border rounded"
                placeholder="300"
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Default Criteria'}
      </button>
      
      <p className="text-sm text-gray-500 text-center mt-4">
        These settings will apply to all new listings. You can override them for specific properties.
      </p>
    </div>
  )
}
```

---

### 2. Application Review Dashboard (Landlord View)

```jsx
// ApplicationReviewDashboard.jsx

import React from 'react'
import { Check, X, AlertCircle } from 'lucide-react'

export default function ApplicationReviewDashboard({ application, screeningResults }) {
  const getStatusColor = (status) => {
    if (status === 'pass') return 'text-green-600 bg-green-50'
    if (status === 'fail') return 'text-red-600 bg-red-50'
    return 'text-yellow-600 bg-yellow-50'
  }
  
  const getStatusIcon = (status) => {
    if (status === 'pass') return <Check className="w-5 h-5" />
    if (status === 'fail') return <X className="w-5 h-5" />
    return <AlertCircle className="w-5 h-5" />
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Application Review</h1>
      
      {/* Overall Status */}
      <div className={`mb-6 p-4 rounded-lg border-2 ${
        screeningResults.overallStatus === 'meets_criteria' 
          ? 'border-green-500 bg-green-50'
          : screeningResults.overallStatus === 'does_not_meet_criteria'
          ? 'border-red-500 bg-red-50'
          : 'border-yellow-500 bg-yellow-50'
      }`}>
        <div className="flex items-center gap-3">
          {getStatusIcon(
            screeningResults.overallStatus === 'meets_criteria' ? 'pass' : 
            screeningResults.overallStatus === 'does_not_meet_criteria' ? 'fail' : 
            'review'
          )}
          <div>
            <h2 className="font-bold text-lg">
              {screeningResults.overallStatus === 'meets_criteria' && '✓ Meets All Criteria'}
              {screeningResults.overallStatus === 'does_not_meet_criteria' && 'Does Not Meet Criteria'}
              {screeningResults.overallStatus === 'manual_review_required' && 'Manual Review Required'}
            </h2>
            <p className="text-sm">
              {screeningResults.overallStatus === 'meets_criteria' && 'This applicant passes all your screening requirements'}
              {screeningResults.overallStatus === 'does_not_meet_criteria' && 'This applicant does not meet one or more of your requirements'}
              {screeningResults.overallStatus === 'manual_review_required' && 'Review required due to background check findings'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Individual Checks */}
      <div className="space-y-4">
        {/* Income Check */}
        {screeningResults.incomeCheck && (
          <div className={`p-4 rounded-lg border ${getStatusColor(screeningResults.incomeCheck.status)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(screeningResults.incomeCheck.status)}
                <div>
                  <h3 className="font-semibold">Income Verification</h3>
                  <p className="text-sm">{screeningResults.incomeCheck.message}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  ${screeningResults.incomeCheck.applicantIncome.toLocaleString()}
                </div>
                <div className="text-xs">per month</div>
              </div>
            </div>
            
            {screeningResults.incomeCheck.status === 'fail' && (
              <div className="mt-3 p-3 bg-white rounded text-sm">
                <strong>Shortfall:</strong> $
                {(screeningResults.incomeCheck.requiredIncome - screeningResults.incomeCheck.applicantIncome).toLocaleString()}
                /month below your {screeningResults.incomeCheck.multiplier}x requirement
              </div>
            )}
          </div>
        )}
        
        {/* Credit Check */}
        {screeningResults.creditCheck && (
          <div className={`p-4 rounded-lg border ${getStatusColor(screeningResults.creditCheck.status)}`}>
            <div className="flex items-center gap-3">
              {getStatusIcon(screeningResults.creditCheck.status)}
              <div>
                <h3 className="font-semibold">Credit Score</h3>
                <p className="text-sm">{screeningResults.creditCheck.message}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Employment Check */}
        {screeningResults.employmentCheck && (
          <div className={`p-4 rounded-lg border ${getStatusColor(screeningResults.employmentCheck.status)}`}>
            <div className="flex items-center gap-3">
              {getStatusIcon(screeningResults.employmentCheck.status)}
              <div>
                <h3 className="font-semibold">Employment Verification</h3>
                <p className="text-sm">{screeningResults.employmentCheck.message}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* References Check */}
        {screeningResults.referencesCheck && (
          <div className={`p-4 rounded-lg border ${getStatusColor(screeningResults.referencesCheck.status)}`}>
            <div className="flex items-center gap-3">
              {getStatusIcon(screeningResults.referencesCheck.status)}
              <div>
                <h3 className="font-semibold">References</h3>
                <p className="text-sm">{screeningResults.referencesCheck.message}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="mt-8 flex gap-4">
        <button className="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">
          Approve Application
        </button>
        <button className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300">
          Request More Info
        </button>
        <button className="flex-1 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700">
          Reject Application
        </button>
      </div>
    </div>
  )
}
```

---

## Student-Facing: Criteria Display on Listing Page

```jsx
// ListingCriteriaDisplay.jsx (shown to students on property listing)

import React from 'react'
import { DollarSign, Award, Briefcase, Users } from 'lucide-react'

export default function ListingCriteriaDisplay({ criteria, rent }) {
  const requiredIncome = rent * criteria.incomeMultiplier
  
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h3 className="font-semibold mb-3">Qualification Requirements</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-gray-500" />
          <span>
            <strong>Income:</strong> ${requiredIncome.toLocaleString()}/month minimum 
            ({criteria.incomeMultiplier}x rent)
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-gray-500" />
          <span>
            <strong>Credit Score:</strong> {criteria.minCreditScore}+ required
          </span>
        </div>
        
        {criteria.requireEmployment && (
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-gray-500" />
            <span>Employment verification required</span>
          </div>
        )}
        
        {criteria.requireReferences > 0 && (
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span>{criteria.requireReferences} references required</span>
          </div>
        )}
      </div>
      
      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
        <strong>💡 Tip:</strong> Don't meet the income requirement? You can invite a co-signer 
        (parent or guarantor) during the application process.
      </div>
    </div>
  )
}
```

---

## Implementation Priority

### Phase 1: Core Criteria (1-2 days)
1. Create `ScreeningProfile` model in Prisma schema
2. Add migration
3. Build API endpoints (GET/PUT `/api/screening-profile`)
4. Update auto-scoring logic to use landlord's criteria
5. Build landlord settings page UI

### Phase 2: Per-Listing Overrides (1 day)
1. Add override fields to `Listing` model
2. Build override UI on listing creation/edit page
3. Update `getEffectiveScreeningCriteria()` helper function

### Phase 3: Student-Facing Display (0.5 days)
1. Show criteria on listing pages
2. Add "You may need a co-signer" prompt if student income < required

### Phase 4: Advanced Features (Future)
1. Pre-qualification calculator ("Can I afford this?")
2. Saved searches with criteria filters
3. Smart matching (only show properties student qualifies for)

---

## Database Migration

```prisma
// Add to schema.prisma

model ScreeningProfile {
  id                    String   @id @default(cuid())
  userId                String   @unique
  user                  User     @relation(fields: [userId], references: [id])
  
  // Income & Credit
  incomeMultiplier      Float    @default(4.0)
  minCreditScore        Int      @default(650)
  
  // Verification Requirements
  requireEmployment     Boolean  @default(true)
  requireReferences     Int      @default(2)
  
  // Background Policies
  allowCriminalHistory  Boolean  @default(false)
  allowEvictionHistory  Boolean  @default(false)
  
  // Pet Policy
  allowPets             Boolean  @default(false)
  maxPetWeight          Int?
  petDeposit            Float?
  
  // Smoking Policy
  allowSmoking          Boolean  @default(false)
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  @@index([userId])
}

model Listing {
  // ... existing fields ...
  
  // Per-listing overrides (optional)
  overrideIncomeMultiplier      Float?
  overrideMinCreditScore        Int?
  overrideRequireEmployment     Boolean?
  overrideRequireReferences     Int?
  overrideAllowCriminalHistory  Boolean?
  overrideAllowEvictionHistory  Boolean?
}

model Application {
  // ... existing fields ...
  
  // Store screening results
  screeningResults      Json?    // Full scoring breakdown
  screeningStatus       String?  // meets_criteria, does_not_meet_criteria, manual_review_required
}
```

```bash
# Generate migration
npx prisma migrate dev --name add_screening_criteria
```

---

## Benefits

### For Landlords:
1. **Control**: Set their own risk tolerance (3x vs 5x income)
2. **Consistency**: Same criteria applied to all applicants (Fair Housing compliance)
3. **Efficiency**: Auto-scoring saves time reviewing applications
4. **Flexibility**: Different criteria for different properties if needed
5. **Transparency**: Students see requirements upfront, reducing unqualified applications

### For Students:
1. **Clarity**: Know exactly what's required before applying
2. **Guidance**: "You may need a co-signer" prompt helps them succeed
3. **Fairness**: Objective criteria, not arbitrary landlord decisions

### For Rentra:
1. **Competitive advantage**: Most PMSs have fixed criteria or require manual setup per listing
2. **Better matching**: Pre-filter applicants, higher approval rates
3. **Professional credibility**: Shows understanding of real landlord needs (from PM interview!)

---

## Marketing Copy

### Feature Description (for landlords):
> **Set Your Standards, We'll Do the Math**
> 
> Configure your screening criteria once—income requirements, credit minimums, employment verification—and Rentra automatically scores every applicant. You'll see "Meets Criteria ✓" or "Does Not Meet Criteria ✗" at a glance, with full transparency on why.
> 
> Different property? Different standards? Override criteria per listing in seconds.

### Value Prop:
**Problem**: "I spend 2 hours reviewing applications, manually calculating if the parent's income is 4x the rent."

**Solution**: "Rentra does it instantly. You see: 'Parent income: $120k/year ✓ (rent $800 × 4 = $3,200 required) — Approved' No math, no docs, no time wasted."

---

## Next Steps

1. ✅ Design complete (this document)
2. Create Prisma schema changes
3. Generate migration
4. Build backend API endpoints
5. Build landlord settings UI
6. Update auto-scoring logic
7. Test with real scenarios (San Diego PM's 4x requirement)
8. Ship to production

**Estimated Total Time**: 2-3 days for full implementation
