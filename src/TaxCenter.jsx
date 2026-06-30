import React, { useState } from 'react'
import {
  FileText,
  Download,
  Calculator,
  DollarSign,
  Calendar,
  Building2,
  TrendingUp,
  TrendingDown,
  Receipt,
  AlertTriangle,
  CheckCircle,
  Plus,
  Edit,
  Eye,
  Settings,
  Filter,
  Search,
  RefreshCw,
  PieChart,
  BarChart3,
  Percent,
  Target,
  Clock,
  Mail,
  Shield,
  Award,
  Activity,
  Users,
  Home,
  Wrench,
} from 'lucide-react'

const TaxCenter = ({ user, onBack, onNavigate }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedYear, setSelectedYear] = useState('2024')
  const [selectedProperty, setSelectedProperty] = useState('all')

  // Mock comprehensive tax data for property owners
  const [taxData] = useState({
    overview: {
      totalRentalIncome: 574800,
      totalDeductibleExpenses: 168250,
      netRentalIncome: 406550,
      estimatedTaxSavings: 42168,
      effectiveTaxRate: 28,
      properties: 8,
      units: 24,
      form1099Count: 24,
      scheduleEReady: true,
    },
    scheduleE: {
      properties: [
        {
          id: 'prop-1',
          address: '123 University Ave, Los Angeles, CA 90007',
          description: 'University Heights Complex',
          rentalIncome: 220800,
          expenses: {
            advertising: 2100,
            auto: 3200,
            cleaning: 4800,
            commissions: 0,
            insurance: 14400,
            legal: 1800,
            management: 8000,
            mortgage: 156000,
            otherInterest: 0,
            repairs: 12600,
            supplies: 1200,
            taxes: 18000,
            utilities: 14400,
            depreciation: 28000,
            other: 2400,
          },
          totalExpenses: 266900,
          netIncome: -46100,
          daysRented: 365,
          personalUse: 0,
          fairRentalDays: 365,
        },
        {
          id: 'prop-2',
          address: '456 College Blvd, Los Angeles, CA 90024',
          description: 'Student Village Townhomes',
          rentalIncome: 162000,
          expenses: {
            advertising: 1800,
            auto: 2400,
            cleaning: 3600,
            commissions: 0,
            insurance: 10800,
            legal: 1200,
            management: 6000,
            mortgage: 108000,
            otherInterest: 0,
            repairs: 9000,
            supplies: 900,
            taxes: 13200,
            utilities: 10800,
            depreciation: 20000,
            other: 1800,
          },
          totalExpenses: 189500,
          netIncome: -27500,
          daysRented: 365,
          personalUse: 0,
          fairRentalDays: 365,
        },
      ],
      totals: {
        totalRentalIncome: 382800,
        totalExpenses: 456400,
        netRentalIncome: -73600,
      },
    },
    form1099: [
      {
        id: '1099-001',
        tenant: 'Alex Johnson',
        ssn: '***-**-1234',
        address: '123 University Ave, Unit 3A, Los Angeles, CA 90007',
        rentPaid: 28800,
        property: 'University Heights Complex',
        yearlyTotal: 28800,
        months: 12,
      },
      {
        id: '1099-002',
        tenant: 'Maria Rodriguez',
        ssn: '***-**-5678',
        address: '123 University Ave, Unit 2B, Los Angeles, CA 90007',
        rentPaid: 26400,
        property: 'University Heights Complex',
        yearlyTotal: 26400,
        months: 12,
      },
      {
        id: '1099-003',
        tenant: 'Emma Wilson',
        ssn: '***-**-9012',
        address: '456 College Blvd, Unit 1C, Los Angeles, CA 90024',
        rentPaid: 27600,
        property: 'Student Village Townhomes',
        yearlyTotal: 27600,
        months: 12,
      },
    ],
    deductions: {
      categories: [
        {
          name: 'Mortgage Interest & Principal',
          amount: 264000,
          percentage: 56.8,
          deductible: 186000,
          description: 'Interest portion of mortgage payments',
          irs_code: 'Schedule E, Line 12',
        },
        {
          name: 'Depreciation',
          amount: 48000,
          percentage: 10.3,
          deductible: 48000,
          description: 'Property depreciation over 27.5 years',
          irs_code: 'Schedule E, Line 18',
        },
        {
          name: 'Property Taxes',
          amount: 31200,
          percentage: 6.7,
          deductible: 31200,
          description: 'Real estate taxes paid',
          irs_code: 'Schedule E, Line 16',
        },
        {
          name: 'Insurance',
          amount: 25200,
          percentage: 5.4,
          deductible: 25200,
          description: 'Property insurance premiums',
          irs_code: 'Schedule E, Line 9',
        },
        {
          name: 'Utilities',
          amount: 25200,
          percentage: 5.4,
          deductible: 25200,
          description: 'Water, electricity, gas, internet',
          irs_code: 'Schedule E, Line 17',
        },
        {
          name: 'Repairs & Maintenance',
          amount: 21600,
          percentage: 4.6,
          deductible: 21600,
          description: 'Ordinary repairs and maintenance',
          irs_code: 'Schedule E, Line 14',
        },
        {
          name: 'Management Fees',
          amount: 14000,
          percentage: 3.0,
          deductible: 14000,
          description: 'Property management services',
          irs_code: 'Schedule E, Line 11',
        },
        {
          name: 'Cleaning & Maintenance',
          amount: 8400,
          percentage: 1.8,
          deductible: 8400,
          description: 'Cleaning between tenants',
          irs_code: 'Schedule E, Line 6',
        },
        {
          name: 'Auto & Travel',
          amount: 5600,
          percentage: 1.2,
          deductible: 5600,
          description: 'Vehicle expenses for property visits',
          irs_code: 'Schedule E, Line 5',
        },
        {
          name: 'Advertising',
          amount: 3900,
          percentage: 0.8,
          deductible: 3900,
          description: 'Marketing and advertising costs',
          irs_code: 'Schedule E, Line 4',
        },
        {
          name: 'Legal & Professional',
          amount: 3000,
          percentage: 0.6,
          deductible: 3000,
          description: 'Attorney and CPA fees',
          irs_code: 'Schedule E, Line 10',
        },
        {
          name: 'Office Expenses',
          amount: 4200,
          percentage: 0.9,
          deductible: 4200,
          description: 'Office supplies and services',
          irs_code: 'Schedule E, Line 19 (Other)',
        },
      ],
      totalDeductions: 436300,
      potentialSavings: 122164,
    },
    taxDocuments: [
      {
        id: 'doc-001',
        name: 'Schedule E - 2024',
        type: 'schedule_e',
        status: 'ready',
        lastUpdated: '2024-12-15',
        description: 'Supplemental Income and Loss from Rental Real Estate',
      },
      {
        id: 'doc-002',
        name: '1099-MISC Forms (24)',
        type: '1099_misc',
        status: 'ready',
        lastUpdated: '2024-12-15',
        description: 'Rents received from tenants over $600',
      },
      {
        id: 'doc-003',
        name: 'Rental Income Summary',
        type: 'income_summary',
        status: 'ready',
        lastUpdated: '2024-12-15',
        description: 'Detailed rental income by property and tenant',
      },
      {
        id: 'doc-004',
        name: 'Expense Detail Report',
        type: 'expense_detail',
        status: 'ready',
        lastUpdated: '2024-12-15',
        description: 'Categorized expenses with receipts',
      },
      {
        id: 'doc-005',
        name: 'Depreciation Schedule',
        type: 'depreciation',
        status: 'ready',
        lastUpdated: '2024-12-15',
        description: 'Property depreciation calculations',
      },
    ],
    alerts: [
      {
        id: 'alert-001',
        type: 'missing_receipt',
        message: '3 expense transactions missing receipts',
        severity: 'medium',
        action: 'Upload receipts to maximize deductions',
      },
      {
        id: 'alert-002',
        type: 'depreciation_optimization',
        message: 'Consider cost segregation study for additional depreciation',
        severity: 'low',
        action: 'Potential $12,000 additional deduction',
      },
      {
        id: 'alert-003',
        type: '1099_deadline',
        message: '1099 forms must be sent to tenants by January 31st',
        severity: 'high',
        action: 'Generate and mail 1099 forms now',
      },
    ],
    quarterlyEstimates: {
      q1: { due: '2024-04-15', amount: 18500, paid: true, dueIn: -120 },
      q2: { due: '2024-06-17', amount: 18500, paid: true, dueIn: -60 },
      q3: { due: '2024-09-16', amount: 18500, paid: true, dueIn: -15 },
      q4: { due: '2025-01-15', amount: 18500, paid: false, dueIn: 45 },
    },
  })

  const getStatusColor = status => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'missing':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const generateScheduleE = () => {
    // In a real app, this would generate the actual PDF
    alert('Schedule E form generated! Ready for download.')
  }

  const generate1099Forms = () => {
    // In a real app, this would generate all 1099-MISC forms
    alert('All 1099-MISC forms generated! Ready for download and mailing.')
  }

  return (
    <div className="p-4 pb-20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Tax Center</h2>
        <div className="flex items-center text-gray-600">
          <Calculator size={16} className="mr-2" />
          <span>Automated tax preparation for real estate investors</span>
        </div>
      </div>

      {/* Year and Property Selector */}
      <div className="flex space-x-3 mb-6">
        <select
          value={selectedYear}
          onChange={e => setSelectedYear(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg font-medium"
        >
          <option value="2024">Tax Year 2024</option>
          <option value="2023">Tax Year 2023</option>
          <option value="2022">Tax Year 2022</option>
        </select>
        <select
          value={selectedProperty}
          onChange={e => setSelectedProperty(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">All Properties</option>
          <option value="university-heights">University Heights</option>
          <option value="student-village">Student Village</option>
        </select>
      </div>

      {/* Tab Navigation */}
      <div className="flex mb-6 bg-gray-100 rounded-lg p-1 overflow-x-auto">
        {[
          'overview',
          'schedule-e',
          '1099-forms',
          'deductions',
          'documents',
          'estimates',
        ].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab
                ? 'bg-white text-brand-500 shadow-sm'
                : 'text-gray-600'
            }`}
          >
            {tab
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Tax Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                ${taxData.overview.totalRentalIncome.toLocaleString()}
              </div>
              <div className="text-sm text-green-700">Total Rental Income</div>
              <div className="text-xs text-green-600 mt-1">
                {taxData.overview.properties} properties
              </div>
            </div>

            <div className="bg-brand-50 p-4 rounded-lg border border-brand-200">
              <div className="text-2xl font-bold text-brand-500">
                ${taxData.overview.totalDeductibleExpenses.toLocaleString()}
              </div>
              <div className="text-sm text-brand-600">Deductible Expenses</div>
              <div className="text-xs text-brand-500 mt-1">
                {(
                  (taxData.overview.totalDeductibleExpenses /
                    taxData.overview.totalRentalIncome) *
                  100
                ).toFixed(1)}
                % of income
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">
                ${taxData.overview.netRentalIncome.toLocaleString()}
              </div>
              <div className="text-sm text-purple-700">Net Rental Income</div>
              <div className="text-xs text-purple-600 mt-1">
                After all deductions
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-600">
                ${taxData.overview.estimatedTaxSavings.toLocaleString()}
              </div>
              <div className="text-sm text-yellow-700">
                Estimated Tax Savings
              </div>
              <div className="text-xs text-yellow-600 mt-1">
                {taxData.overview.effectiveTaxRate}% effective rate
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={generateScheduleE}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <FileText size={20} className="text-green-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Generate Schedule E</p>
                    <p className="text-sm text-gray-600">
                      Ready for {selectedYear} tax year
                    </p>
                  </div>
                </div>
                <Download size={16} className="text-gray-400" />
              </button>

              <button
                onClick={generate1099Forms}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Receipt size={20} className="text-brand-500 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Generate 1099-MISC Forms</p>
                    <p className="text-sm text-gray-600">
                      {taxData.overview.form1099Count} forms ready
                    </p>
                  </div>
                </div>
                <Download size={16} className="text-gray-400" />
              </button>

              <button className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <BarChart3 size={20} className="text-purple-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Download Tax Package</p>
                    <p className="text-sm text-gray-600">
                      Complete tax documents bundle
                    </p>
                  </div>
                </div>
                <Download size={16} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Tax Alerts */}
          {taxData.alerts.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-3 flex items-center">
                <AlertTriangle size={20} className="mr-2" />
                Tax Preparation Alerts
              </h3>
              <div className="space-y-2">
                {taxData.alerts.map(alert => (
                  <div key={alert.id} className="flex items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-700">
                        {alert.message}
                      </p>
                      <p className="text-xs text-yellow-600">{alert.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tax Document Status */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold mb-4">Tax Document Status</h3>
            <div className="space-y-3">
              {taxData.taxDocuments.slice(0, 3).map(doc => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <FileText size={16} className="text-brand-500 mr-3" />
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-gray-600">{doc.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getStatusColor(doc.status)}`}
                    >
                      {doc.status}
                    </span>
                    <button className="p-1 text-gray-500 hover:text-brand-500">
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Schedule E Tab */}
      {activeTab === 'schedule-e' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">
              Schedule E - Supplemental Income and Loss
            </h3>
            <button
              onClick={generateScheduleE}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 flex items-center"
            >
              <Download size={16} className="mr-2" />
              Generate Schedule E
            </button>
          </div>

          {taxData.scheduleE.properties.map((property, index) => (
            <div
              key={property.id}
              className="bg-white border border-gray-200 rounded-lg p-6"
            >
              <div className="mb-4">
                <h4 className="font-semibold text-lg">Property {index + 1}</h4>
                <p className="text-gray-600">{property.address}</p>
                <p className="text-sm text-gray-500">{property.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium mb-3">Rental Income</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Rents Received</span>
                      <span className="font-medium">
                        ${property.rentalIncome.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Days Rented</span>
                      <span>{property.daysRented}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Personal Use Days</span>
                      <span>{property.personalUse}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium mb-3">Expenses</h5>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Advertising</span>
                      <span>
                        ${property.expenses.advertising.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Auto & Travel</span>
                      <span>${property.expenses.auto.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cleaning & Maintenance</span>
                      <span>
                        ${property.expenses.cleaning.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Insurance</span>
                      <span>
                        ${property.expenses.insurance.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Legal & Professional</span>
                      <span>${property.expenses.legal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Management Fees</span>
                      <span>
                        ${property.expenses.management.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mortgage Interest</span>
                      <span>
                        ${property.expenses.mortgage.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Repairs</span>
                      <span>${property.expenses.repairs.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxes</span>
                      <span>${property.expenses.taxes.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Utilities</span>
                      <span>
                        ${property.expenses.utilities.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Depreciation</span>
                      <span>
                        ${property.expenses.depreciation.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>Total Expenses</span>
                      <span>${property.totalExpenses.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Net Income (Loss)</span>
                  <span
                    className={`font-bold text-lg ${property.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    ${property.netIncome.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Schedule E Totals */}
          <div className="bg-brand-50 border border-brand-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4">Schedule E Totals</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-brand-500">
                  ${taxData.scheduleE.totals.totalRentalIncome.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Rental Income</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-red-600">
                  ${taxData.scheduleE.totals.totalExpenses.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Expenses</div>
              </div>
              <div className="text-center">
                <div
                  className={`text-xl font-bold ${taxData.scheduleE.totals.netRentalIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  ${taxData.scheduleE.totals.netRentalIncome.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">
                  Net Rental Income (Loss)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1099 Forms Tab */}
      {activeTab === '1099-forms' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">1099-MISC Forms</h3>
            <button
              onClick={generate1099Forms}
              className="bg-brand-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-600 flex items-center"
            >
              <Download size={16} className="mr-2" />
              Generate All 1099s
            </button>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">
              Important 1099 Deadlines
            </h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• January 31: Mail 1099-MISC forms to tenants</li>
              <li>
                • February 28: File with IRS (March 31 if filing electronically)
              </li>
              <li>• Required for any tenant who paid $600 or more in rent</li>
            </ul>
          </div>

          <div className="space-y-4">
            {taxData.form1099.map(form => (
              <div
                key={form.id}
                className="bg-white border border-gray-200 rounded-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold">{form.tenant}</h4>
                    <p className="text-sm text-gray-600">{form.address}</p>
                    <p className="text-xs text-gray-500">SSN: {form.ssn}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600">
                      ${form.rentPaid.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Rent Paid</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-600">Property</div>
                    <div className="font-medium">{form.property}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Months Occupied</div>
                    <div className="font-medium">{form.months} months</div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button className="flex-1 bg-brand-500 text-white py-2 rounded-lg font-medium hover:bg-brand-600">
                    Generate 1099
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    Preview
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    <Mail size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deductions Tab */}
      {activeTab === 'deductions' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Tax Deductions Summary</h3>
            <div className="text-lg font-bold text-green-600">
              ${taxData.deductions.potentialSavings.toLocaleString()} potential
              savings
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h4 className="font-semibold text-green-800 mb-4">
              Total Deductions: $
              {taxData.deductions.totalDeductions.toLocaleString()}
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-green-700">At 28% tax bracket</div>
                <div className="text-xl font-bold text-green-600">
                  $
                  {(taxData.deductions.totalDeductions * 0.28).toLocaleString()}
                </div>
                <div className="text-xs text-green-600">
                  Federal tax savings
                </div>
              </div>
              <div>
                <div className="text-sm text-green-700">Plus state savings</div>
                <div className="text-xl font-bold text-green-600">
                  ${(taxData.deductions.totalDeductions * 0.1).toLocaleString()}
                </div>
                <div className="text-xs text-green-600">
                  Estimated additional
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {taxData.deductions.categories.map((category, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold">{category.name}</h4>
                    <p className="text-sm text-gray-600">
                      {category.description}
                    </p>
                    <p className="text-xs text-brand-500">
                      {category.irs_code}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-brand-500">
                      ${category.deductible.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {category.percentage}% of total
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-brand-500 h-2 rounded-full"
                    style={{ width: `${category.percentage}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Tax Savings: ${(category.deductible * 0.28).toLocaleString()}{' '}
                  (28% bracket)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Tax Documents & Reports</h3>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 flex items-center">
              <Download size={16} className="mr-2" />
              Download All
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {taxData.taxDocuments.map(doc => (
              <div
                key={doc.id}
                className="bg-white border border-gray-200 rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <FileText size={24} className="text-brand-500 mr-4" />
                    <div>
                      <h4 className="font-semibold">{doc.name}</h4>
                      <p className="text-sm text-gray-600">{doc.description}</p>
                      <p className="text-xs text-gray-500">
                        Last updated: {doc.lastUpdated}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-3 py-1 text-sm rounded-full ${getStatusColor(doc.status)}`}
                    >
                      {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                    </span>
                    <button className="p-2 text-gray-500 hover:text-brand-500">
                      <Eye size={16} />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-brand-500">
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-brand-50 border border-brand-200 rounded-lg p-6">
            <h4 className="font-semibold text-blue-800 mb-3">
              Professional Tax Preparation
            </h4>
            <p className="text-sm text-brand-600 mb-4">
              All documents are CPA-ready and formatted for professional tax
              preparation software including TurboTax, H&R Block, and TaxAct.
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <CheckCircle size={16} className="text-green-600 inline mr-2" />
                IRS-compliant formatting
              </div>
              <div>
                <CheckCircle size={16} className="text-green-600 inline mr-2" />
                Automatic calculations
              </div>
              <div>
                <CheckCircle size={16} className="text-green-600 inline mr-2" />
                Supporting documentation
              </div>
              <div>
                <CheckCircle size={16} className="text-green-600 inline mr-2" />
                Audit trail maintained
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quarterly Estimates Tab */}
      {activeTab === 'estimates' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Quarterly Estimated Taxes</h3>
            <button className="bg-brand-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-600">
              Calculate Next Quarter
            </button>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">
              Estimated Tax Payment Schedule
            </h4>
            <p className="text-sm text-yellow-700">
              Based on your rental income and deductions, here are your
              quarterly payment obligations.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {Object.entries(taxData.quarterlyEstimates).map(
              ([quarter, payment]) => (
                <div
                  key={quarter}
                  className="bg-white border border-gray-200 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">
                        {quarter.toUpperCase()} {selectedYear} Payment
                      </h4>
                      <p className="text-sm text-gray-600">
                        Due: {payment.due}
                      </p>
                      <p className="text-xs text-gray-500">
                        {payment.dueIn > 0
                          ? `Due in ${payment.dueIn} days`
                          : payment.dueIn === 0
                            ? 'Due today'
                            : `${Math.abs(payment.dueIn)} days overdue`}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-brand-500">
                        ${payment.amount.toLocaleString()}
                      </div>
                      <span
                        className={`px-3 py-1 text-sm rounded-full ${
                          payment.paid
                            ? 'bg-green-100 text-green-800'
                            : payment.dueIn <= 0
                              ? 'bg-red-100 text-red-800'
                              : payment.dueIn <= 30
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {payment.paid
                          ? 'Paid'
                          : payment.dueIn <= 0
                            ? 'Overdue'
                            : 'Upcoming'}
                      </span>
                    </div>
                  </div>
                  {!payment.paid && (
                    <div className="flex space-x-3 pt-4 border-t border-gray-200">
                      <button className="flex-1 bg-brand-500 text-white py-2 rounded-lg font-medium hover:bg-brand-600">
                        Make Payment
                      </button>
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                        Calculate
                      </button>
                    </div>
                  )}
                </div>
              )
            )}
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h4 className="font-semibold text-green-800 mb-3">
              Tax Planning Tips
            </h4>
            <ul className="text-sm text-green-700 space-y-2">
              <li>• Consider making quarterly payments to avoid penalties</li>
              <li>• Keep detailed records of all rental-related expenses</li>
              <li>• Track mileage for property visits and maintenance trips</li>
              <li>• Save receipts for all deductible expenses</li>
              <li>• Consider cost segregation studies for larger properties</li>
            </ul>
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

export default TaxCenter
