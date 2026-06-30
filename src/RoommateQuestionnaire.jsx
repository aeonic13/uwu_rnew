import React, { useState } from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'

const RoommateQuestionnaire = ({
  onComplete,
  onBack,
  existingAnswers = null,
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState(existingAnswers || {})

  const questions = [
    {
      category: 'Sharing & Expenses',
      questions: [
        {
          id: 'billPayment',
          question: 'When do you pay bills?',
          type: 'single',
          options: [
            { value: 'immediate', label: 'Pay immediately', weight: 3 },
            { value: 'byDueDate', label: 'Pay by due date', weight: 2 },
            {
              value: 'eventually',
              label: 'Pay when we get around to them',
              weight: 1,
            },
          ],
        },
        {
          id: 'utilities',
          question: 'How should we pay utilities?',
          type: 'single',
          options: [
            { value: 'splitEvenly', label: 'Split costs evenly', weight: 2 },
            {
              value: 'separate',
              label:
                'Separate utility expenses (e.g. One pays hydro, one pays internet)',
              weight: 1,
            },
          ],
        },
        {
          id: 'borrowing',
          question: 'What are your thoughts on sharing and borrowing?',
          type: 'single',
          options: [
            {
              value: 'shareEverything',
              label: "Let's share everything - no need to ask",
              weight: 4,
            },
            {
              value: 'askFirst',
              label: 'You can probably borrow my stuff - just ask first',
              weight: 3,
            },
            {
              value: 'emergencyOnly',
              label: "I won't say no in an emergency (I prefer to not share)",
              weight: 2,
            },
            {
              value: 'neverLend',
              label: "Sorry, I don't ever lend my stuff to others",
              weight: 1,
            },
          ],
        },
        {
          id: 'commonItems',
          question: 'How should we share common-use items?',
          type: 'single',
          options: [
            { value: 'takeTurns', label: 'Take turns buying', weight: 3 },
            { value: 'splitCosts', label: 'Split costs evenly', weight: 2 },
            {
              value: 'buyOwn',
              label: 'Buy our own items separately',
              weight: 1,
            },
          ],
        },
        {
          id: 'foodSharing',
          question: 'How should we share common food items?',
          type: 'single',
          options: [
            { value: 'takeTurns', label: 'Take turns buying', weight: 3 },
            { value: 'splitCosts', label: 'Split costs evenly', weight: 2 },
            {
              value: 'buyOwn',
              label: 'Buy our own items separately',
              weight: 1,
            },
          ],
        },
      ],
    },
    {
      category: 'Cleanliness & Upkeep',
      questions: [
        {
          id: 'tidiness',
          question: 'How tidy are you?',
          type: 'single',
          options: [
            { value: 'spotless', label: 'Could eat off the floor', weight: 4 },
            { value: 'organized', label: 'Everything is put away', weight: 3 },
            { value: 'messy', label: 'A little messy', weight: 2 },
            { value: 'chaotic', label: "Where's the floor?", weight: 1 },
          ],
        },
        {
          id: 'kitchen',
          question: "What's your kitchen like?",
          type: 'single',
          options: [
            {
              value: 'sparklingClean',
              label: 'Always sparkling clean',
              weight: 4,
            },
            { value: 'cleanTidy', label: 'Clean and mostly tidy', weight: 3 },
            { value: 'goodLuck', label: 'Good luck finding stuff', weight: 2 },
            { value: 'disaster', label: "Salmonella's best friend", weight: 1 },
          ],
        },
        {
          id: 'bathroom',
          question: "What's your bathroom like?",
          type: 'single',
          options: [
            {
              value: 'spotless',
              label: 'Spotlessly clean - daily tidy',
              weight: 4,
            },
            { value: 'weekly', label: 'Pretty good - weekly clean', weight: 3 },
            { value: 'monthly', label: 'Not bad - monthly clean', weight: 2 },
            {
              value: 'never',
              label: 'Not sure - no cleaning products',
              weight: 1,
            },
          ],
        },
        {
          id: 'dishes',
          question: 'How do you handle dishes?',
          type: 'single',
          options: [
            { value: 'dailyClean', label: 'Washed/put away daily', weight: 4 },
            { value: 'overnight', label: 'Washed/dry overnight', weight: 3 },
            {
              value: 'morningSoak',
              label: 'Wash in morning after overnight soak',
              weight: 2,
            },
            {
              value: 'whenDirty',
              label: 'Wash only when everything else is dirty',
              weight: 1,
            },
          ],
        },
        {
          id: 'cleaningSchedule',
          question: 'How will we handle cleaning?',
          type: 'single',
          options: [
            { value: 'rotate', label: 'Rotate cleaning assignment', weight: 3 },
            {
              value: 'permanent',
              label: 'Permanent cleaning assignment',
              weight: 2,
            },
            {
              value: 'asNeeded',
              label: 'Decide when need for cleaning arises',
              weight: 1,
            },
          ],
        },
        {
          id: 'cleaningFrequency',
          question: 'How often will you do your share of cleaning?',
          type: 'single',
          options: [
            { value: 'daily', label: 'Daily', weight: 5 },
            { value: 'weekly', label: 'Weekly', weight: 4 },
            { value: 'biweekly', label: 'Bi-weekly', weight: 3 },
            { value: 'monthly', label: 'Once a month', weight: 2 },
            { value: 'whenDesired', label: 'When desired', weight: 1 },
          ],
        },
      ],
    },
    {
      category: 'Lifestyle',
      questions: [
        {
          id: 'smoking',
          question: 'Do you smoke? (Cigarettes, shisha, etc.)',
          type: 'single',
          options: [
            { value: 'yes', label: 'Yes', weight: 1 },
            {
              value: 'notInHouse',
              label: 'Yes, but not in the house',
              weight: 2,
            },
            { value: 'no', label: 'No', weight: 3 },
          ],
        },
        {
          id: 'smokingTolerance',
          question: 'Does smoking bother you?',
          type: 'single',
          options: [
            { value: 'yes', label: 'Yes', weight: 1 },
            { value: 'no', label: 'No', weight: 2 },
          ],
        },
        {
          id: 'pets',
          question: 'Do you have pets?',
          type: 'multiple',
          options: [
            { value: 'dog', label: 'Dog' },
            { value: 'cat', label: 'Cat' },
            { value: 'furry', label: 'Other furry critter' },
            { value: 'furless', label: 'Fur-less critter' },
            { value: 'none', label: 'None' },
          ],
        },
        {
          id: 'petTolerance',
          question: 'Do you mind pets?',
          type: 'multiple',
          options: [
            { value: 'dogs', label: 'Dogs are fine' },
            { value: 'cats', label: 'Cats are fine' },
            { value: 'furry', label: 'Other furry critters are ok' },
            { value: 'furless', label: 'Fur-less critters are ok' },
            { value: 'noPets', label: "I don't want pets around" },
          ],
        },
        {
          id: 'internetUse',
          question: "What's your internet use like?",
          type: 'single',
          options: [
            { value: 'heavy', label: 'Bandwidth hog', weight: 4 },
            { value: 'moderate', label: 'Moderate use', weight: 3 },
            { value: 'occasional', label: 'Once in a while', weight: 2 },
            { value: 'rarely', label: 'Almost never', weight: 1 },
          ],
        },
        {
          id: 'occupation',
          question: 'What do you do?',
          type: 'multiple',
          options: [
            { value: 'student', label: "I'm a student" },
            { value: 'professional', label: "I'm a working professional" },
            { value: 'partTime', label: 'I have a part-time job' },
          ],
        },
      ],
    },
    {
      category: 'Noise & Quiet Hours',
      questions: [
        {
          id: 'noiseAcceptable',
          question: 'When is noise acceptable?',
          type: 'single',
          options: [
            { value: 'anytime', label: 'Any time of day or night', weight: 4 },
            {
              value: 'dayEvening',
              label: 'During the day and evening, but not at night',
              weight: 3,
            },
            {
              value: 'daytimeOnly',
              label: 'During the daytime only please',
              weight: 2,
            },
            {
              value: 'library',
              label: 'I need the silence of a library',
              weight: 1,
            },
          ],
        },
        {
          id: 'musicFrequency',
          question: 'How often do you have music on?',
          type: 'single',
          options: [
            { value: 'always', label: 'Always!', weight: 4 },
            { value: 'often', label: 'Often', weight: 3 },
            { value: 'rarely', label: 'Rarely', weight: 2 },
            { value: 'never', label: 'Never', weight: 1 },
          ],
        },
        {
          id: 'musicVolume',
          question: "What's the volume like?",
          type: 'single',
          options: [
            { value: 'shakesFloor', label: 'Shakes the floor', weight: 4 },
            {
              value: 'comfortable',
              label: 'Comfortable listening level',
              weight: 3,
            },
            {
              value: 'background',
              label: 'Quiet, background level',
              weight: 2,
            },
            { value: 'headphones', label: 'I use headphones', weight: 1 },
          ],
        },
        {
          id: 'bedtime',
          question: 'When do you go to bed during the week?',
          type: 'single',
          options: [
            { value: 'early', label: 'Early: between 8pm - 11pm', weight: 1 },
            {
              value: 'moderate',
              label: 'Moderate: between 11pm - 1am',
              weight: 2,
            },
            { value: 'late', label: 'Late: between 1am - 4am', weight: 3 },
            { value: 'daylight', label: 'During daylight hours', weight: 4 },
          ],
        },
        {
          id: 'studyHabits',
          question: 'Study habits?',
          type: 'single',
          options: [
            { value: 'quiet', label: 'Must be completely quiet', weight: 1 },
            {
              value: 'someDistractions',
              label: 'Some distractions are ok',
              weight: 2,
            },
            { value: 'elsewhere', label: 'Usually study elsewhere', weight: 3 },
            { value: 'noStudy', label: 'Who needs to study?', weight: 4 },
          ],
        },
        {
          id: 'comingGoing',
          question: 'How often will you be coming and going?',
          type: 'single',
          options: [
            { value: 'always', label: "I'll be home 24/7", weight: 1 },
            { value: 'onceTwice', label: 'Once or twice per day', weight: 2 },
            { value: 'constantly', label: 'Constantly', weight: 3 },
          ],
        },
      ],
    },
    {
      category: 'Socializing',
      questions: [
        {
          id: 'guestPolicy',
          question: "What's your guest policy?",
          type: 'single',
          options: [
            {
              value: 'allTheTime',
              label: 'The more the merrier! Guests all the time',
              weight: 5,
            },
            {
              value: 'headsUp',
              label: 'Not a problem, just ask for a heads up',
              weight: 4,
            },
            {
              value: 'occasionally',
              label: 'One or two guests are okay occasionally',
              weight: 3,
            },
            {
              value: 'rare',
              label: 'On a rare occasion guests are fine',
              weight: 2,
            },
            {
              value: 'noGuests',
              label: 'I prefer no guests coming over',
              weight: 1,
            },
          ],
        },
        {
          id: 'overnightGuests',
          question: 'How do you feel about guests spending the night?',
          type: 'single',
          options: [
            { value: 'noProblem', label: "Doesn't bother me", weight: 4 },
            {
              value: 'occasionally',
              label: 'Occasionally is fine, but not multiple nights',
              weight: 3,
            },
            {
              value: 'regularly',
              label: 'Guests staying over regularly is fine',
              weight: 4,
            },
            {
              value: 'notComfortable',
              label: "I'm not comfortable with guests staying over",
              weight: 1,
            },
          ],
        },
        {
          id: 'parties',
          question: 'How do you feel about parties?',
          type: 'single',
          options: [
            {
              value: 'loveThem',
              label: "Love them, I'd host every week if I could!",
              weight: 4,
            },
            {
              value: 'withNotice',
              label: "They're fine, just provide notice ahead of time",
              weight: 3,
            },
            {
              value: 'smallGathering',
              label: 'An occasional dinner/small gathering is fine',
              weight: 2,
            },
            {
              value: 'noParties',
              label: "I don't want to have any parties at my home",
              weight: 1,
            },
          ],
        },
        {
          id: 'frequentGuests',
          question: 'Will any guests be staying over?',
          type: 'single',
          options: [
            {
              value: 'frequent',
              label: 'I have a guest who will stay over frequently (3+ x/week)',
              weight: 3,
            },
            {
              value: 'occasional',
              label: 'I have a guest who will stay over occasionally (<3x)',
              weight: 2,
            },
            {
              value: 'none',
              label: 'I do not anticipate any guests staying over',
              weight: 1,
            },
          ],
        },
      ],
    },
    {
      category: 'Food & Cooking',
      questions: [
        {
          id: 'dietaryRestrictions',
          question: 'Anything about food I should know?',
          type: 'multiple',
          options: [
            {
              value: 'vegMeatOk',
              label: "I'm vegetarian/vegan but meat can be in the house",
            },
            {
              value: 'vegNoMeat',
              label: "I'm vegetarian/vegan and meat can't be in the house",
            },
            { value: 'kosher', label: "I'm Kosher" },
            { value: 'halal', label: "I'm Halal" },
            { value: 'none', label: 'No dietary restrictions' },
          ],
        },
        {
          id: 'cookingFrequency',
          question: 'How often do you cook?',
          type: 'single',
          options: [
            {
              value: 'allMeals',
              label: 'All three meals, most days',
              weight: 4,
            },
            { value: 'dinners', label: 'Usually dinners', weight: 3 },
            {
              value: 'bigMeals',
              label: 'One or two big meals a week',
              weight: 2,
            },
            { value: 'never', label: 'Pretty much never', weight: 1 },
          ],
        },
        {
          id: 'alcoholUse',
          question: 'How do you feel about alcohol?',
          type: 'single',
          options: [
            {
              value: 'weekdays',
              label: "I'm game for drinks during the week",
              weight: 4,
            },
            {
              value: 'weekends',
              label: 'I save it for the weekends',
              weight: 3,
            },
            {
              value: 'occasionally',
              label: 'I drink a few times a month',
              weight: 2,
            },
            {
              value: 'noDrinkOkWithIt',
              label: "I don't drink, but I don't mind if you do",
              weight: 2,
            },
            {
              value: 'alcoholFree',
              label: "I don't drink, and I'd like an alcohol-free home",
              weight: 1,
            },
          ],
        },
      ],
    },
    {
      category: 'Relationship Expectations',
      questions: [
        {
          id: 'roommateRelationship',
          question: 'What are you hoping for from me as a roommate?',
          type: 'single',
          options: [
            {
              value: 'billsChores',
              label: 'Someone to split the bills and chores',
              weight: 1,
            },
            {
              value: 'friendly',
              label: "Someone friendly, but don't have to be best friends",
              weight: 2,
            },
            {
              value: 'hangOut',
              label: 'Someone who wants to hang out and do stuff with',
              weight: 3,
            },
          ],
        },
        {
          id: 'additionalOccupants',
          question: 'Will anyone else be living with us?',
          type: 'single',
          options: [
            { value: 'no', label: 'No', weight: 1 },
            { value: 'partner', label: 'Yes, my partner', weight: 2 },
            { value: 'family', label: 'Yes, my family (w/kids)', weight: 3 },
          ],
        },
      ],
    },
  ]

  const totalSteps = questions.length

  const handleAnswer = (questionId, value, isMultiple = false) => {
    if (isMultiple) {
      const currentAnswers = answers[questionId] || []
      if (currentAnswers.includes(value)) {
        setAnswers({
          ...answers,
          [questionId]: currentAnswers.filter(v => v !== value),
        })
      } else {
        setAnswers({
          ...answers,
          [questionId]: [...currentAnswers, value],
        })
      }
    } else {
      setAnswers({
        ...answers,
        [questionId]: value,
      })
    }
  }

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete(answers)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    } else {
      onBack()
    }
  }

  const currentCategory = questions[currentStep]
  const progress = ((currentStep + 1) / totalSteps) * 100

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <button
            onClick={handlePrevious}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-3"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {currentStep === 0 ? 'Back' : 'Previous'}
          </button>

          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Roommate Compatibility
          </h1>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-brand-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Step {currentStep + 1} of {totalSteps}
          </p>
        </div>
      </div>

      {/* Questions */}
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">
            {currentCategory.category}
          </h2>

          <div className="space-y-8">
            {currentCategory.questions.map(q => (
              <div key={q.id}>
                <p className="font-medium text-gray-900 mb-3">{q.question}</p>
                <div className="space-y-2">
                  {q.options.map(option => {
                    const isSelected =
                      q.type === 'multiple'
                        ? (answers[q.id] || []).includes(option.value)
                        : answers[q.id] === option.value

                    return (
                      <button
                        key={option.value}
                        onClick={() =>
                          handleAnswer(
                            q.id,
                            option.value,
                            q.type === 'multiple'
                          )
                        }
                        className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-brand-500 bg-brand-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{option.label}</span>
                          {isSelected && (
                            <Check className="w-5 h-5 text-brand-500" />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <button
          onClick={handleNext}
          className="w-full bg-brand-500 text-white py-4 rounded-lg font-semibold flex items-center justify-center hover:bg-brand-600 transition-colors"
        >
          {currentStep === totalSteps - 1 ? 'Complete' : 'Next'}
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  )
}

export default RoommateQuestionnaire
