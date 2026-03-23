# Roommate Compatibility Matching Feature

## Overview
The roommate compatibility matching system helps students find compatible roommates based on comprehensive questionnaire responses. The system uses a sophisticated algorithm to calculate compatibility scores across multiple lifestyle categories.

## Components

### 1. RoommateQuestionnaire (`src/RoommateQuestionnaire.jsx`)
**Purpose**: Multi-step questionnaire for users to complete

**Features**:
- 7 category sections with 30+ questions
- Progress indicator
- Single and multiple-choice questions
- Mobile-optimized UI
- Save/resume capability (via `existingAnswers` prop)

**Categories**:
1. **Sharing & Expenses** - Bill payment, utilities, borrowing habits
2. **Cleanliness & Upkeep** - Tidiness levels, cleaning schedules
3. **Lifestyle** - Smoking, pets, internet usage, occupation
4. **Noise & Quiet Hours** - Acceptable noise times, music habits, bedtime
5. **Socializing** - Guest policies, parties, overnight visitors
6. **Food & Cooking** - Dietary restrictions, cooking frequency, alcohol
7. **Relationship Expectations** - Desired roommate relationship, additional occupants

**Props**:
- `onComplete(answers)` - Called when questionnaire is completed
- `onBack()` - Called when user goes back
- `existingAnswers` - Pre-populate with previous answers

### 2. RoommateMatching (`src/RoommateMatching.jsx`)
**Purpose**: Display compatibility matches with detailed breakdowns

**Features**:
- Sorted list of matches by compatibility score
- Color-coded compatibility ratings (Excellent, Great, Good, Fair, Poor)
- Detailed match view with:
  - Overall compatibility score
  - Category-by-category breakdown
  - Key insights (differences to discuss)
  - Strong alignment areas
  - Direct messaging

**Props**:
- `userAnswers` - Current user's questionnaire responses
- `potentialRoommates` - Array of potential matches with their answers
- `onBack()` - Called when user navigates back
- `onMessageUser(match)` - Called when user wants to message a match

### 3. Compatibility Algorithm (`src/utils/roommateCompatibility.js`)
**Purpose**: Calculate compatibility scores between users

#### Key Functions:

##### `calculateCompatibility(user1Answers, user2Answers, questionConfig)`
Returns compatibility object with:
- `overallScore` - Weighted average score (0-100)
- `isDealbreaker` - Boolean if there's a deal-breaking incompatibility
- `dealbreakerReason` - Why they're incompatible
- `categoryScores` - Scores for each category
- `breakdown` - Question-by-question comparison
- `interpretation` - Human-readable assessment

##### `findBestMatches(userAnswers, potentialRoommates, questionConfig, limit)`
Returns sorted array of best matches, excluding deal-breakers

##### `getCategoryComparison(user1Answers, user2Answers, category)`
Returns detailed comparison for a specific category

#### Scoring Logic:

**Category Weights** (importance multipliers):
- Cleanliness: 1.5x (most important)
- Sharing & Expenses: 1.3x
- Noise & Quiet Hours: 1.3x
- Lifestyle: 1.2x
- Socializing: 1.0x
- Food & Cooking: 0.8x
- Relationship: 0.7x (least important)

**Deal-breakers** (automatic rejection):
1. **Smoking**: One person smokes, other is bothered by it
2. **Pets**: One has pets, other wants no pets
3. **Dietary**: One requires no meat in house, other eats meat
4. **Alcohol**: One wants alcohol-free home, other drinks

**Score Interpretation**:
- 85-100%: Excellent Match (green)
- 70-84%: Great Match (green)
- 55-69%: Good Match (blue)
- 40-54%: Fair Match (yellow)
- 0-39%: Poor Match (red)

## Integration with RentraApp

### State Management
```javascript
const [roommateQuestionnaireAnswers, setRoommateQuestionnaireAnswers] = useState(null);
const [potentialRoommates, setPotentialRoommates] = useState([...]);
```

### Navigation Flow
1. User clicks "Roommates" tab in bottom navigation
2. If no questionnaire completed → Show `RoommateQuestionnaire`
3. After completing questionnaire → Show `RoommateMatching`
4. Back button returns to appropriate view based on completion status

### Views
- `'roommate-questionnaire'` - Questionnaire view
- `'roommate-matching'` - Matches view

## Data Structure

### User Answers Object
```javascript
{
  billPayment: 'byDueDate',
  utilities: 'splitEvenly',
  borrowing: 'askFirst',
  // ... 30+ question IDs with values
  tidiness: 'organized',
  smoking: 'no',
  pets: ['none'], // Array for multiple choice
  // etc.
}
```

### Potential Roommate Object
```javascript
{
  id: 1,
  name: 'Alex Johnson',
  university: 'USC',
  bio: 'Computer Science major...',
  avatar: 'https://...',
  answers: { /* same structure as user answers */ }
}
```

### Match Result Object
```javascript
{
  ...roommate, // All roommate properties
  compatibility: {
    overallScore: 78,
    isDealbreaker: false,
    categoryScores: {
      cleanliness: { score: 85, weight: 1.5 },
      sharing: { score: 72, weight: 1.3 }
      // ... other categories
    },
    breakdown: [
      {
        questionId: 'tidiness',
        category: 'cleanliness',
        score: 100,
        user1Answer: 'organized',
        user2Answer: 'organized'
      }
      // ... all questions
    ],
    interpretation: {
      level: 'great',
      text: 'Great Match',
      color: 'green'
    }
  }
}
```

## Usage Example

```javascript
// In RentraApp.jsx
{currentView === 'roommate-questionnaire' && (
  <RoommateQuestionnaire
    existingAnswers={roommateQuestionnaireAnswers}
    onComplete={(answers) => {
      setRoommateQuestionnaireAnswers(answers);
      setCurrentView('roommate-matching');
    }}
    onBack={() => setCurrentView('browse')}
  />
)}

{currentView === 'roommate-matching' && roommateQuestionnaireAnswers && (
  <RoommateMatching
    userAnswers={roommateQuestionnaireAnswers}
    potentialRoommates={potentialRoommates}
    onBack={() => setCurrentView('browse')}
    onMessageUser={(match) => {
      // Create conversation and navigate to messages
    }}
  />
)}
```

## Future Enhancements

### Backend Integration
1. **Store questionnaire responses** in database
2. **Real-time matching** as new users complete questionnaires
3. **Filter by university/location** before matching
4. **Match notifications** when high-compatibility user joins
5. **Questionnaire versioning** to update questions over time

### Feature Additions
1. **Partial matches** - Show matches even if questionnaire incomplete
2. **Preference weights** - Let users indicate which categories matter most
3. **Icebreaker suggestions** - Pre-written messages based on compatibility
4. **Compatibility trends** - Analytics on what makes good matches
5. **Re-take questionnaire** - Allow users to update responses
6. **Deal-breaker customization** - Let users set their own deal-breakers
7. **Group compatibility** - Match groups of 3-4 compatible roommates
8. **Personality insights** - Show user their roommate "type"

### UX Improvements
1. **Save progress** - Allow saving incomplete questionnaires
2. **Question explanations** - Help text for ambiguous questions
3. **Skip questions** - Optional questions with default values
4. **Visual comparison** - Side-by-side answer comparison
5. **Match reasons** - Explain why compatibility is high/low
6. **Filtering** - Filter matches by score threshold

## Testing

To test the feature:
1. Run `npm run dev`
2. Register as a student
3. Click "Roommates" tab
4. Complete the questionnaire (7 steps)
5. View your matches sorted by compatibility
6. Click a match to see detailed breakdown
7. Message a match to start conversation

## Technical Notes

- **Mobile-first design** - Optimized for mobile viewport
- **No external dependencies** - Uses only React and Lucide icons
- **Stateless algorithm** - Pure functions in compatibility util
- **Performance** - O(n) matching calculation per user
- **Type safety** - Add TypeScript for production use
- **Security** - Sanitize user inputs before storing (use existing security utils)
