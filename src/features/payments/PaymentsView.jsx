import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import {
  ArrowLeft,
  CreditCard,
  Plus,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  ChevronRight,
  Building,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'

// Sample transactions data
const sampleTransactions = [
  {
    id: 1,
    type: 'rent',
    amount: 1200,
    serviceFee: 36,
    total: 1236,
    status: 'completed',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    property: 'Cozy 1BR near USC Campus',
    landlord: 'Sarah Chen',
    paymentMethod: '**** 4242',
  },
  {
    id: 2,
    type: 'deposit',
    amount: 2400,
    serviceFee: 0,
    total: 2400,
    status: 'completed',
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    property: 'Cozy 1BR near USC Campus',
    landlord: 'Sarah Chen',
    paymentMethod: '**** 4242',
  },
  {
    id: 3,
    type: 'rent',
    amount: 1200,
    serviceFee: 36,
    total: 1236,
    status: 'pending',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    property: 'Cozy 1BR near USC Campus',
    landlord: 'Sarah Chen',
    paymentMethod: '**** 4242',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

// Sample payment methods
const samplePaymentMethods = [
  {
    id: 1,
    type: 'card',
    brand: 'Visa',
    lastFour: '4242',
    expiryMonth: 12,
    expiryYear: 2025,
    isDefault: true,
  },
  {
    id: 2,
    type: 'bank',
    bankName: 'Chase',
    lastFour: '6789',
    accountType: 'Checking',
    isDefault: false,
  },
]

/**
 * Format date
 */
function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Status badge component
 */
function StatusBadge({ status }) {
  const config = {
    completed: {
      icon: CheckCircle,
      text: 'Completed',
      className: 'bg-green-100 text-green-700',
    },
    pending: {
      icon: Clock,
      text: 'Pending',
      className: 'bg-yellow-100 text-yellow-700',
    },
    failed: {
      icon: XCircle,
      text: 'Failed',
      className: 'bg-red-100 text-red-700',
    },
    processing: {
      icon: Clock,
      text: 'Processing',
      className: 'bg-blue-100 text-blue-700',
    },
  }

  const { icon: Icon, text, className } = config[status] || config.pending

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
    >
      <Icon size={12} className="mr-1" />
      {text}
    </span>
  )
}

StatusBadge.propTypes = {
  status: PropTypes.oneOf(['completed', 'pending', 'failed', 'processing'])
    .isRequired,
}

/**
 * Transaction card component
 */
function TransactionCard({ transaction, onClick }) {
  const typeLabels = {
    rent: 'Rent Payment',
    deposit: 'Security Deposit',
    fee: 'Service Fee',
    refund: 'Refund',
  }

  return (
    <button
      onClick={() => onClick(transaction)}
      className="w-full p-4 bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors text-left"
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-medium">{typeLabels[transaction.type]}</p>
          <p className="text-sm text-gray-500">{transaction.property}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold">${transaction.total.toFixed(2)}</p>
          <StatusBadge status={transaction.status} />
        </div>
      </div>
      <div className="flex items-center text-sm text-gray-500">
        <Calendar size={14} className="mr-1" />
        {formatDate(transaction.date)}
      </div>
    </button>
  )
}

TransactionCard.propTypes = {
  transaction: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    type: PropTypes.string.isRequired,
    total: PropTypes.number.isRequired,
    status: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    property: PropTypes.string,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
}

/**
 * Payment method card component
 */
function PaymentMethodCard({ method, onSelect }) {
  return (
    <button
      onClick={() => onSelect(method)}
      className="w-full flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
    >
      <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center mr-3">
        {method.type === 'card' ? (
          <CreditCard size={20} className="text-gray-500" />
        ) : (
          <Building size={20} className="text-gray-500" />
        )}
      </div>
      <div className="flex-1 text-left">
        <p className="font-medium">
          {method.type === 'card'
            ? `${method.brand} •••• ${method.lastFour}`
            : `${method.bankName} •••• ${method.lastFour}`}
        </p>
        <p className="text-sm text-gray-500">
          {method.type === 'card'
            ? `Expires ${method.expiryMonth}/${method.expiryYear}`
            : method.accountType}
        </p>
      </div>
      {method.isDefault && (
        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
          Default
        </span>
      )}
      <ChevronRight size={20} className="text-gray-400 ml-2" />
    </button>
  )
}

PaymentMethodCard.propTypes = {
  method: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    type: PropTypes.oneOf(['card', 'bank']).isRequired,
    lastFour: PropTypes.string.isRequired,
    isDefault: PropTypes.bool,
    brand: PropTypes.string,
    bankName: PropTypes.string,
    expiryMonth: PropTypes.number,
    expiryYear: PropTypes.number,
    accountType: PropTypes.string,
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
}

/**
 * Payments View
 */
function PaymentsView() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [activeTab, setActiveTab] = useState('transactions')
  const [transactions, setTransactions] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTransaction, setSelectedTransaction] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      // TODO: Replace with actual API calls
      await new Promise((resolve) => setTimeout(resolve, 500))
      setTransactions(sampleTransactions)
      setPaymentMethods(samplePaymentMethods)
      setIsLoading(false)
    }

    fetchData()
  }, [])

  const pendingPayments = transactions.filter((t) => t.status === 'pending')
  const totalPending = pendingPayments.reduce((sum, t) => sum + t.total, 0)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="flex items-center p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors mr-2"
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Payments</h1>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'transactions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('methods')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'methods'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500'
            }`}
          >
            Payment Methods
          </button>
        </div>
      </div>

      {/* Pending Payment Alert */}
      {pendingPayments.length > 0 && activeTab === 'transactions' && (
        <div className="mx-4 mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="text-yellow-600 mr-3 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-semibold text-yellow-800">
                Payment Due Soon
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                You have {pendingPayments.length} pending payment
                {pendingPayments.length > 1 ? 's' : ''} totaling $
                {totalPending.toFixed(2)}
              </p>
              <button className="mt-2 text-sm font-medium text-yellow-800 underline">
                Pay Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {activeTab === 'transactions' ? (
        <div className="mt-4">
          {transactions.length === 0 ? (
            <div className="text-center py-16 px-4">
              <DollarSign size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No transactions yet
              </h3>
              <p className="text-gray-500">
                Your payment history will appear here
              </p>
            </div>
          ) : (
            <div className="bg-white">
              {transactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  onClick={setSelectedTransaction}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 space-y-3">
          {paymentMethods.map((method) => (
            <PaymentMethodCard
              key={method.id}
              method={method}
              onSelect={() => {}}
            />
          ))}

          <button className="w-full flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors">
            <Plus size={20} className="mr-2" />
            Add Payment Method
          </button>
        </div>
      )}

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50"
          onClick={() => setSelectedTransaction(null)}
        >
          <div
            className="bg-white rounded-t-2xl w-full max-w-md max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">Transaction Details</h2>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="text-center mb-6">
                <p className="text-3xl font-bold">
                  ${selectedTransaction.total.toFixed(2)}
                </p>
                <StatusBadge status={selectedTransaction.status} />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Property</span>
                  <span className="font-medium">{selectedTransaction.property}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Landlord</span>
                  <span className="font-medium">{selectedTransaction.landlord}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Date</span>
                  <span className="font-medium">
                    {formatDate(selectedTransaction.date)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Payment Method</span>
                  <span className="font-medium">
                    {selectedTransaction.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-medium">
                    ${selectedTransaction.amount.toFixed(2)}
                  </span>
                </div>
                {selectedTransaction.serviceFee > 0 && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Service Fee</span>
                    <span className="font-medium">
                      ${selectedTransaction.serviceFee.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-2">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold">
                    ${selectedTransaction.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {selectedTransaction.status === 'pending' && (
                <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold mt-6 hover:bg-blue-700 transition-colors">
                  Pay Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PaymentsView
