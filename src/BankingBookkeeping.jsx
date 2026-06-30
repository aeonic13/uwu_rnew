import React, { useState } from 'react'
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Upload,
  Receipt,
  FileText,
  PieChart,
  BarChart3,
  Filter,
  Search,
  Plus,
  Building2,
  Home,
  Wrench,
  Zap,
  Droplets,
  Users,
  Phone,
  Mail,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  Target,
  Percent,
  Calculator,
  Banknote,
  Wallet,
  CreditCard as Card,
  Landmark,
  PiggyBank,
  Activity,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react'

const BankingBookkeeping = ({ user, onBack, onNavigate }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState('month')
  const [selectedAccount, setSelectedAccount] = useState('all')
  const [showAccountDetails, setShowAccountDetails] = useState({})

  // Mock comprehensive banking and bookkeeping data
  const [financialData] = useState({
    accounts: [
      {
        id: 'checking-001',
        name: 'Business Checking',
        type: 'checking',
        bank: 'Rentra Business Bank',
        balance: 47850.32,
        accountNumber: '****1234',
        routingNumber: '****5678',
        isDefault: true,
        currency: 'USD',
        status: 'active',
        lastTransaction: '2024-03-18',
        monthlyActivity: { deposits: 52400, withdrawals: 28650 },
      },
      {
        id: 'savings-001',
        name: 'Emergency Fund',
        type: 'savings',
        bank: 'Rentra Savings',
        balance: 125000.0,
        accountNumber: '****9876',
        routingNumber: '****5678',
        isDefault: false,
        currency: 'USD',
        status: 'active',
        lastTransaction: '2024-03-15',
        monthlyActivity: { deposits: 5000, withdrawals: 0 },
      },
      {
        id: 'escrow-001',
        name: 'Security Deposit Escrow',
        type: 'escrow',
        bank: 'Rentra Trust',
        balance: 96000.0,
        accountNumber: '****4567',
        routingNumber: '****5678',
        isDefault: false,
        currency: 'USD',
        status: 'active',
        lastTransaction: '2024-03-18',
        monthlyActivity: { deposits: 4800, withdrawals: 2400 },
      },
    ],
    transactions: [
      {
        id: 'txn-001',
        date: '2024-03-18',
        description: 'Rent Payment - Alex Johnson',
        amount: 2400.0,
        type: 'income',
        category: 'Rental Income',
        property: 'University Heights - Unit 3A',
        tenant: 'Alex Johnson',
        account: 'checking-001',
        status: 'completed',
        receiptUrl: '/receipts/txn-001.pdf',
        tags: ['rent', 'recurring'],
        taxDeductible: false,
      },
      {
        id: 'txn-002',
        date: '2024-03-17',
        description: 'Maintenance - Kitchen Faucet Repair',
        amount: -150.0,
        type: 'expense',
        category: 'Maintenance & Repairs',
        property: 'University Heights - Unit 3A',
        vendor: "Mike's Plumbing",
        account: 'checking-001',
        status: 'completed',
        receiptUrl: '/receipts/txn-002.pdf',
        tags: ['maintenance', 'plumbing'],
        taxDeductible: true,
      },
      {
        id: 'txn-003',
        date: '2024-03-16',
        description: 'Property Insurance Premium',
        amount: -1200.0,
        type: 'expense',
        category: 'Insurance',
        property: 'University Heights Complex',
        vendor: 'StateForm Insurance',
        account: 'checking-001',
        status: 'completed',
        receiptUrl: '/receipts/txn-003.pdf',
        tags: ['insurance', 'quarterly'],
        taxDeductible: true,
      },
      {
        id: 'txn-004',
        date: '2024-03-15',
        description: 'Security Deposit - Maria Rodriguez',
        amount: 2200.0,
        type: 'deposit',
        category: 'Security Deposits',
        property: 'University Heights - Unit 2B',
        tenant: 'Maria Rodriguez',
        account: 'escrow-001',
        status: 'completed',
        receiptUrl: '/receipts/txn-004.pdf',
        tags: ['deposit', 'escrow'],
        taxDeductible: false,
      },
    ],
    categories: {
      income: [
        {
          name: 'Rental Income',
          amount: 47800,
          percentage: 89.2,
          transactions: 21,
        },
        { name: 'Late Fees', amount: 350, percentage: 0.7, transactions: 3 },
        { name: 'Pet Fees', amount: 200, percentage: 0.4, transactions: 2 },
        {
          name: 'Application Fees',
          amount: 525,
          percentage: 1.0,
          transactions: 7,
        },
        {
          name: 'Other Income',
          amount: 4725,
          percentage: 8.8,
          transactions: 12,
        },
      ],
      expenses: [
        {
          name: 'Maintenance & Repairs',
          amount: 3200,
          percentage: 32.0,
          transactions: 8,
        },
        { name: 'Insurance', amount: 1800, percentage: 18.0, transactions: 4 },
        {
          name: 'Property Tax',
          amount: 1400,
          percentage: 14.0,
          transactions: 2,
        },
        { name: 'Utilities', amount: 800, percentage: 8.0, transactions: 12 },
        {
          name: 'Management Fees',
          amount: 600,
          percentage: 6.0,
          transactions: 3,
        },
        {
          name: 'Legal & Professional',
          amount: 450,
          percentage: 4.5,
          transactions: 2,
        },
        {
          name: 'Marketing & Advertising',
          amount: 350,
          percentage: 3.5,
          transactions: 5,
        },
        {
          name: 'Office Expenses',
          amount: 250,
          percentage: 2.5,
          transactions: 6,
        },
        { name: 'Bank Fees', amount: 75, percentage: 0.8, transactions: 4 },
        {
          name: 'Other Expenses',
          amount: 1075,
          percentage: 10.8,
          transactions: 15,
        },
      ],
    },
    monthlyTrends: [
      { month: 'Oct 2023', income: 45200, expenses: 8900, netIncome: 36300 },
      { month: 'Nov 2023', income: 46800, expenses: 7200, netIncome: 39600 },
      { month: 'Dec 2023', income: 45600, expenses: 9800, netIncome: 35800 },
      { month: 'Jan 2024', income: 47200, expenses: 8200, netIncome: 39000 },
      { month: 'Feb 2024', income: 47800, expenses: 9100, netIncome: 38700 },
      { month: 'Mar 2024', income: 48400, expenses: 10000, netIncome: 38400 },
    ],
    taxInfo: {
      currentYearDeductions: 28450,
      estimatedTaxSavings: 7960,
      uncategorizedTransactions: 3,
      missingReceipts: 1,
      quarterlyEstimates: {
        q1: { due: '2024-04-15', amount: 8500, paid: true },
        q2: { due: '2024-06-15', amount: 8500, paid: false },
        q3: { due: '2024-09-15', amount: 8500, paid: false },
        q4: { due: '2024-01-15', amount: 8500, paid: false },
      },
    },
    automatedRules: [
      {
        id: 'rule-001',
        name: 'Rent Payments Auto-Categorize',
        condition: 'Description contains "Rent Payment"',
        action: 'Set category to Rental Income',
        enabled: true,
        matchCount: 156,
      },
      {
        id: 'rule-002',
        name: 'Maintenance Expenses',
        condition: 'Amount < 0 AND Description contains "Maintenance"',
        action: 'Set category to Maintenance & Repairs, Mark tax deductible',
        enabled: true,
        matchCount: 43,
      },
    ],
    alerts: [
      {
        id: 'alert-001',
        type: 'low-balance',
        message: 'Checking account balance below $10,000 threshold',
        severity: 'medium',
        date: '2024-03-18',
      },
      {
        id: 'alert-002',
        type: 'missing-receipt',
        message: '1 expense transaction missing receipt for tax purposes',
        severity: 'high',
        date: '2024-03-17',
      },
      {
        id: 'alert-003',
        type: 'tax-deadline',
        message: 'Q2 estimated tax payment due in 28 days',
        severity: 'medium',
        date: '2024-03-16',
      },
    ],
  })

  const getTransactionTypeColor = type => {
    switch (type) {
      case 'income':
        return 'text-green-600'
      case 'expense':
        return 'text-red-600'
      case 'deposit':
        return 'text-brand-500'
      default:
        return 'text-gray-600'
    }
  }

  const getAccountTypeIcon = type => {
    switch (type) {
      case 'checking':
        return <Landmark size={20} />
      case 'savings':
        return <PiggyBank size={20} />
      case 'escrow':
        return <Shield size={20} />
      default:
        return <Wallet size={20} />
    }
  }

  const toggleAccountDetails = accountId => {
    setShowAccountDetails(prev => ({
      ...prev,
      [accountId]: !prev[accountId],
    }))
  }

  return (
    <div className="p-4 pb-20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Banking & Bookkeeping</h2>
        <div className="flex items-center text-gray-600">
          <Calculator size={16} className="mr-2" />
          <span>Automated financial management for real estate investors</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex mb-6 bg-gray-100 rounded-lg p-1 overflow-x-auto">
        {[
          'overview',
          'accounts',
          'transactions',
          'reports',
          'taxes',
          'automation',
        ].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab
                ? 'bg-white text-brand-500 shadow-sm'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Account Summary */}
          <div className="grid grid-cols-1 gap-4">
            {financialData.accounts.map(account => (
              <div
                key={account.id}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className="text-brand-500 mr-3">
                      {getAccountTypeIcon(account.type)}
                    </div>
                    <div>
                      <h4 className="font-semibold">{account.name}</h4>
                      <p className="text-sm text-gray-600">{account.bank}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleAccountDetails(account.id)}
                    className="p-1"
                  >
                    {showAccountDetails[account.id] ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  ${account.balance.toLocaleString()}
                </div>
                {showAccountDetails[account.id] && (
                  <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-600">
                    <p>Account: {account.accountNumber}</p>
                    <p>
                      Last Activity:{' '}
                      {new Date(account.lastTransaction).toLocaleDateString()}
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <span className="text-green-600">
                          +${account.monthlyActivity.deposits.toLocaleString()}
                        </span>
                        <p className="text-xs">This month in</p>
                      </div>
                      <div>
                        <span className="text-red-600">
                          -$
                          {account.monthlyActivity.withdrawals.toLocaleString()}
                        </span>
                        <p className="text-xs">This month out</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Financial Summary */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold mb-4">This Month Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">$48,400</div>
                <div className="text-sm text-gray-600">Total Income</div>
                <div className="text-xs text-green-600">
                  +1.3% vs last month
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">$10,000</div>
                <div className="text-sm text-gray-600">Total Expenses</div>
                <div className="text-xs text-red-600">+9.8% vs last month</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 text-center">
              <div className="text-2xl font-bold text-brand-500">$38,400</div>
              <div className="text-sm text-gray-600">Net Income</div>
              <div className="text-xs text-brand-500">-0.8% vs last month</div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Recent Transactions</h3>
              <button
                onClick={() => setActiveTab('transactions')}
                className="text-brand-500 hover:text-brand-600 text-sm font-medium"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {financialData.transactions.slice(0, 5).map(transaction => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-gray-600">
                      {transaction.category}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${getTransactionTypeColor(transaction.type)}`}
                    >
                      {transaction.amount > 0 ? '+' : ''}$
                      {Math.abs(transaction.amount).toLocaleString()}
                    </p>
                    {transaction.receiptUrl && (
                      <Receipt
                        size={12}
                        className="text-gray-400 ml-2 inline"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          {financialData.alerts.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-3 flex items-center">
                <AlertTriangle size={20} className="mr-2" />
                Financial Alerts
              </h3>
              <div className="space-y-2">
                {financialData.alerts.map(alert => (
                  <p key={alert.id} className="text-sm text-yellow-700">
                    • {alert.message}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Accounts Tab */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Bank Accounts</h3>
            <button className="bg-brand-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-600 flex items-center">
              <Plus size={16} className="mr-2" />
              Connect Account
            </button>
          </div>

          {financialData.accounts.map(account => (
            <div
              key={account.id}
              className="bg-white border border-gray-200 rounded-lg p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="text-brand-500 mr-4">
                    {getAccountTypeIcon(account.type)}
                  </div>
                  <div>
                    <div className="flex items-center">
                      <h4 className="font-semibold mr-2">{account.name}</h4>
                      {account.isDefault && (
                        <span className="px-2 py-1 bg-brand-100 text-blue-800 text-xs rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{account.bank}</p>
                    <p className="text-xs text-gray-500">
                      Account: {account.accountNumber}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    ${account.balance.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600">
                    {account.type.toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-600">Monthly Deposits</div>
                  <div className="font-semibold text-green-600">
                    +${account.monthlyActivity.deposits.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">
                    Monthly Withdrawals
                  </div>
                  <div className="font-semibold text-red-600">
                    -${account.monthlyActivity.withdrawals.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button className="flex-1 bg-brand-500 text-white py-2 rounded-lg font-medium hover:bg-brand-600">
                  View Transactions
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  Settings
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Transaction History</h3>
            <div className="flex space-x-2">
              <select
                value={selectedAccount}
                onChange={e => setSelectedAccount(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Accounts</option>
                {financialData.accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
              <button className="p-2 border border-gray-300 rounded-lg">
                <Search size={16} />
              </button>
              <button className="p-2 border border-gray-300 rounded-lg">
                <Filter size={16} />
              </button>
              <button className="bg-brand-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-600 flex items-center">
                <Plus size={16} className="mr-2" />
                Add Transaction
              </button>
            </div>
          </div>

          {financialData.transactions.map(transaction => (
            <div
              key={transaction.id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <h4 className="font-semibold mr-2">
                      {transaction.description}
                    </h4>
                    {transaction.receiptUrl && (
                      <Receipt size={16} className="text-green-600" />
                    )}
                    {transaction.taxDeductible && (
                      <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        Tax Deductible
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {transaction.category}
                  </p>
                  {transaction.property && (
                    <p className="text-sm text-gray-500">
                      {transaction.property}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p
                    className={`text-xl font-bold ${getTransactionTypeColor(transaction.type)}`}
                  >
                    {transaction.amount > 0 ? '+' : ''}$
                    {Math.abs(transaction.amount).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(transaction.date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {transaction.tags && transaction.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {transaction.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  {transaction.vendor || transaction.tenant || 'System'}
                </div>
                <div className="flex space-x-2">
                  <button className="p-2 text-gray-500 hover:text-brand-500">
                    <FileText size={16} />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-brand-500">
                    <Receipt size={16} />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-brand-500">
                    <Download size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Financial Reports</h3>
            <div className="flex space-x-2">
              <select
                value={dateRange}
                onChange={e => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
              <button className="bg-brand-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-600 flex items-center">
                <Download size={16} className="mr-2" />
                Export Report
              </button>
            </div>
          </div>

          {/* Income vs Expenses Trend */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4 flex items-center">
              <TrendingUp size={20} className="mr-2 text-brand-500" />
              6-Month Trend
            </h4>
            <div className="space-y-3">
              {financialData.monthlyTrends.map((month, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="font-medium">{month.month}</span>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm">
                      <span className="text-green-600">
                        +${month.income.toLocaleString()}
                      </span>
                      <span className="text-gray-400 mx-2">|</span>
                      <span className="text-red-600">
                        -${month.expenses.toLocaleString()}
                      </span>
                    </div>
                    <div className="font-semibold text-brand-500">
                      ${month.netIncome.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Income Categories */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4 flex items-center">
              <TrendingUp size={20} className="mr-2 text-green-600" />
              Income Breakdown
            </h4>
            <div className="space-y-3">
              {financialData.categories.income.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 bg-green-500 rounded mr-3"
                      style={{ opacity: category.percentage / 100 + 0.3 }}
                    ></div>
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      ${category.amount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {category.percentage}% ({category.transactions}{' '}
                      transactions)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expense Categories */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4 flex items-center">
              <TrendingDown size={20} className="mr-2 text-red-600" />
              Expense Breakdown
            </h4>
            <div className="space-y-3">
              {financialData.categories.expenses.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 bg-red-500 rounded mr-3"
                      style={{ opacity: category.percentage / 100 + 0.3 }}
                    ></div>
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      ${category.amount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {category.percentage}% ({category.transactions}{' '}
                      transactions)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Taxes Tab */}
      {activeTab === 'taxes' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Tax Management</h3>
            <button className="bg-brand-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-600 flex items-center">
              <Download size={16} className="mr-2" />
              Generate Tax Report
            </button>
          </div>

          {/* Tax Summary */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4">2024 Tax Summary</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  $
                  {financialData.taxInfo.currentYearDeductions.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Deductions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-500">
                  ${financialData.taxInfo.estimatedTaxSavings.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Estimated Savings</div>
              </div>
            </div>
          </div>

          {/* Tax Issues */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-800 mb-3 flex items-center">
              <AlertTriangle size={20} className="mr-2" />
              Items Needing Attention
            </h4>
            <div className="space-y-2">
              <p className="text-sm text-red-700">
                • {financialData.taxInfo.uncategorizedTransactions} transactions
                need categorization
              </p>
              <p className="text-sm text-red-700">
                • {financialData.taxInfo.missingReceipts} expense missing
                receipt
              </p>
            </div>
          </div>

          {/* Quarterly Estimates */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4">Quarterly Estimated Payments</h4>
            <div className="space-y-3">
              {Object.entries(financialData.taxInfo.quarterlyEstimates).map(
                ([quarter, payment]) => (
                  <div
                    key={quarter}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">
                        {quarter.toUpperCase()} 2024
                      </div>
                      <div className="text-sm text-gray-600">
                        Due: {payment.due}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="font-semibold mr-3">
                        ${payment.amount.toLocaleString()}
                      </span>
                      <span
                        className={`px-3 py-1 text-sm rounded-full ${
                          payment.paid
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {payment.paid ? 'Paid' : 'Due'}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Automation Tab */}
      {activeTab === 'automation' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Automation Rules</h3>
            <button className="bg-brand-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-600 flex items-center">
              <Plus size={16} className="mr-2" />
              Create Rule
            </button>
          </div>

          {/* Active Rules */}
          <div className="space-y-4">
            {financialData.automatedRules.map(rule => (
              <div
                key={rule.id}
                className="bg-white border border-gray-200 rounded-lg p-6"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold">{rule.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>When:</strong> {rule.condition}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Then:</strong> {rule.action}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      className="sr-only peer"
                      readOnly
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Matched {rule.matchCount} transactions
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
                      Edit
                    </button>
                    <button className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Suggested Rules */}
          <div className="bg-brand-50 border border-brand-200 rounded-lg p-6">
            <h4 className="font-semibold text-blue-800 mb-4">
              Suggested Automation Rules
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div>
                  <p className="font-medium">Auto-categorize utility bills</p>
                  <p className="text-sm text-gray-600">
                    Automatically categorize transactions from utility companies
                  </p>
                </div>
                <button className="px-3 py-1 text-sm bg-brand-500 text-white rounded hover:bg-brand-600">
                  Create Rule
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div>
                  <p className="font-medium">Security deposit handling</p>
                  <p className="text-sm text-gray-600">
                    Automatically move security deposits to escrow account
                  </p>
                </div>
                <button className="px-3 py-1 text-sm bg-brand-500 text-white rounded hover:bg-brand-600">
                  Create Rule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={onBack}
        className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 mt-6"
      >
        Back
      </button>
    </div>
  )
}

export default BankingBookkeeping
