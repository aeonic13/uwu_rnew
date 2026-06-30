import React, { useState, useMemo } from 'react'
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  User,
  TrendingUp,
  Check,
  X,
  AlertCircle,
} from 'lucide-react'
import { findBestMatches } from './utils/roommateCompatibility'

const RoommateMatching = ({
  userAnswers,
  potentialRoommates,
  onBack,
  onMessageUser,
}) => {
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  // Derive matches during render instead of syncing via an effect
  const matches = useMemo(
    () => findBestMatches(userAnswers, potentialRoommates, null, 20),
    [userAnswers, potentialRoommates]
  )

  const getCategoryName = category => {
    const names = {
      cleanliness: 'Cleanliness',
      sharing: 'Sharing & Expenses',
      noise: 'Noise & Quiet Hours',
      lifestyle: 'Lifestyle',
      socializing: 'Socializing',
      food: 'Food & Cooking',
      relationship: 'Relationship',
    }
    return names[category] || category
  }

  const getScoreColor = score => {
    if (score >= 85) return 'text-green-600 bg-green-50'
    if (score >= 70) return 'text-green-600 bg-green-50'
    if (score >= 55) return 'text-brand-500 bg-brand-50'
    if (score >= 40) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const MatchCard = ({ match }) => {
    const { compatibility } = match
    const scoreColor = getScoreColor(compatibility.overallScore)

    return (
      <div
        onClick={() => {
          setSelectedMatch(match)
          setShowDetails(true)
        }}
        className="bg-white rounded-lg shadow-sm p-4 mb-4 cursor-pointer hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center mr-3">
              <User className="w-6 h-6 text-brand-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{match.name}</h3>
              <p className="text-sm text-gray-500">
                {match.university || 'Student'}
              </p>
            </div>
          </div>

          <div className={`px-3 py-1 rounded-full ${scoreColor} font-semibold`}>
            {compatibility.overallScore}%
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {match.bio || 'Looking for a compatible roommate...'}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm">
            <span
              className={`font-medium ${compatibility.interpretation.color === 'green' ? 'text-green-600' : compatibility.interpretation.color === 'blue' ? 'text-brand-500' : compatibility.interpretation.color === 'yellow' ? 'text-yellow-600' : 'text-red-600'}`}
            >
              {compatibility.interpretation.text}
            </span>
          </div>

          <button
            onClick={e => {
              e.stopPropagation()
              onMessageUser(match)
            }}
            className="p-2 text-brand-500 hover:bg-brand-50 rounded-full transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Category breakdown preview */}
        <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-2">
          {Object.entries(compatibility.categoryScores)
            .slice(0, 3)
            .map(([category, data]) => (
              <div key={category} className="text-center">
                <p className="text-xs text-gray-500 mb-1">
                  {getCategoryName(category)}
                </p>
                <p
                  className={`text-sm font-semibold ${getScoreColor(data.score)}`}
                >
                  {data.score}%
                </p>
              </div>
            ))}
        </div>
      </div>
    )
  }

  const renderMatchDetails = match => {
    const { compatibility } = match

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
        <div className="bg-white rounded-t-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b px-4 py-4 z-10">
            <button
              onClick={() => setShowDetails(false)}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-3"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to matches
            </button>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mr-4">
                  <User className="w-8 h-8 text-brand-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {match.name}
                  </h2>
                  <p className="text-gray-600">
                    {match.university || 'Student'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4">
            {/* Overall compatibility */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-6 text-white mb-6">
              <div className="text-center">
                <div className="text-5xl font-bold mb-2">
                  {compatibility.overallScore}%
                </div>
                <p className="text-lg opacity-90">
                  {compatibility.interpretation.text}
                </p>
                <div className="flex items-center justify-center mt-4">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  <span>Compatibility Score</span>
                </div>
              </div>
            </div>

            {/* Bio */}
            {match.bio && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                <p className="text-gray-700">{match.bio}</p>
              </div>
            )}

            {/* Category breakdown */}
            <div className="mb-6">
              <h3 className="font-bold text-gray-900 mb-4">
                Compatibility Breakdown
              </h3>
              <div className="space-y-3">
                {Object.entries(compatibility.categoryScores)
                  .sort((a, b) => b[1].score - a[1].score)
                  .map(([category, data]) => (
                    <div
                      key={category}
                      className="bg-white rounded-lg p-4 border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">
                          {getCategoryName(category)}
                        </span>
                        <span
                          className={`font-semibold ${getScoreColor(data.score)}`}
                        >
                          {data.score}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            data.score >= 70
                              ? 'bg-green-500'
                              : data.score >= 55
                                ? 'bg-brand-500'
                                : data.score >= 40
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                          }`}
                          style={{ width: `${data.score}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Weight: {data.weight.toFixed(1)}x importance
                      </p>
                    </div>
                  ))}
              </div>
            </div>

            {/* Key differences */}
            <div className="mb-6">
              <h3 className="font-bold text-gray-900 mb-4">Key Insights</h3>
              <div className="space-y-3">
                {compatibility.breakdown
                  .filter(item => item.score < 50)
                  .slice(0, 5)
                  .map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-yellow-50 border border-yellow-200 rounded-lg p-3"
                    >
                      <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Different preferences in{' '}
                            {getCategoryName(item.category)}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Score: {Math.round(item.score)}% - Consider
                            discussing this
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                {compatibility.breakdown.filter(item => item.score >= 90)
                  .length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {
                            compatibility.breakdown.filter(
                              item => item.score >= 90
                            ).length
                          }{' '}
                          areas of strong alignment
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          You have very similar preferences in multiple
                          categories
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pb-6">
              <button
                onClick={() => {
                  onMessageUser(match)
                  setShowDetails(false)
                }}
                className="w-full bg-brand-500 text-white py-4 rounded-lg font-semibold hover:bg-brand-600 transition-colors flex items-center justify-center"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Send Message
              </button>

              <button
                onClick={() => setShowDetails(false)}
                className="w-full bg-gray-100 text-gray-700 py-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Back to All Matches
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-3"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>

          <h1 className="text-2xl font-bold text-gray-900">Your Matches</h1>
          <p className="text-gray-600 mt-1">
            Found {matches.length} compatible roommate
            {matches.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Matches list */}
      <div className="max-w-md mx-auto px-4 py-6">
        {matches.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">No matches yet</h3>
            <p className="text-gray-600">
              Check back later as more people complete their compatibility
              questionnaire
            </p>
          </div>
        ) : (
          <>
            {matches.map((match, idx) => (
              <MatchCard key={idx} match={match} />
            ))}
          </>
        )}
      </div>

      {/* Match details modal */}
      {showDetails && selectedMatch && renderMatchDetails(selectedMatch)}
    </div>
  )
}

export default RoommateMatching
