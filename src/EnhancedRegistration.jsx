import React, { useState } from 'react';
import { Shield, Camera, Check, Clock, User, CreditCard, FileCheck, ArrowRight, Search, Home, Building2, GraduationCap, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { authApi, setAuthToken, normalizeUser } from './api';

const EnhancedRegistration = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [userIntent, setUserIntent] = useState(''); // 'looking-to-rent' or 'looking-to-list'
  const [listerType, setListerType] = useState(''); // 'student-lease' or 'property-owner'
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    university: '',
    password: '',
    confirmPassword: '',
    profilePhoto: null,
    userType: 'student', // 'student' or 'owner'
    wantsCreditCheck: false
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateEmail = (email) => {
    // For students - require .edu email
    if (userIntent === 'looking-to-rent' || listerType === 'student-lease') {
      const universityDomains = [
        '.edu', 'usc.edu', 'ucla.edu', 'nyu.edu', 'stanford.edu', 'harvard.edu', 'mit.edu'
      ];
      return universityDomains.some(domain => email.toLowerCase().includes(domain));
    }
    // For property owners - any valid email
    if (listerType === 'property-owner') {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    return false;
  };

  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setFormData(prev => ({ ...prev, email: newEmail }));
    setIsEmailValid(validateEmail(newEmail));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, profilePhoto: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleComplete = async () => {
    let finalUserType = 'student';
    if (listerType === 'property-owner') {
      finalUserType = 'owner';
    } else if (userIntent === 'looking-to-rent' || listerType === 'student-lease') {
      finalUserType = 'student';
    }

    setIsSubmitting(true);
    setApiError('');

    try {
      const { data } = await authApi.register({
        email: formData.email,
        password: formData.password,
        userType: finalUserType,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        university: formData.university || undefined,
      });

      setAuthToken(data.token);
      onComplete(normalizeUser(data.user));
    } catch (err) {
      const details = err.response?.data?.error?.details;
      const message =
        (Array.isArray(details) ? details.join(', ') : null) ||
        err.response?.data?.error?.message ||
        'Registration failed. Please try again.';
      setApiError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1: User Intent Selection
  if (currentStep === 1) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col justify-center p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-500 mb-2">Welcome to Rentra</h1>
          <p className="text-gray-600">Connect with fellow students for safe rentalting</p>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-6 text-center">What brings you here today?</h2>
          
          <div className="space-y-4">
            <button
              onClick={() => {
                setUserIntent('looking-to-rent');
                nextStep();
              }}
              className="w-full p-6 border-2 border-gray-300 rounded-lg hover:border-brand-300 hover:bg-brand-50 transition-colors text-left"
            >
              <div className="flex items-center">
                <div className="bg-brand-100 rounded-full p-3 mr-4">
                  <Search size={28} className="text-brand-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Looking to Rent</h3>
                  <p className="text-sm text-gray-600 mt-1">I'm a student searching for a place to live</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                setUserIntent('looking-to-list');
                nextStep();
              }}
              className="w-full p-6 border-2 border-gray-300 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors text-left"
            >
              <div className="flex items-center">
                <div className="bg-green-100 rounded-full p-3 mr-4">
                  <Home size={28} className="text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Looking to List</h3>
                  <p className="text-sm text-gray-600 mt-1">I want to list my property or find someone to lease</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Lister Type Selection (if looking-to-list) OR Email Entry
  if (currentStep === 2) {
    // If user chose "looking-to-list", show lister type selection
    if (userIntent === 'looking-to-list') {
      return (
        <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col justify-center p-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">What type of lister are you?</h2>
            <p className="text-gray-600">This helps us customize your experience</p>
          </div>

          <div className="space-y-4 mb-8">
            <button
              onClick={() => {
                setListerType('student-lease');
                nextStep();
              }}
              className="w-full p-6 border-2 border-gray-300 rounded-lg hover:border-brand-300 hover:bg-brand-50 transition-colors text-left"
            >
              <div className="flex items-center">
                <div className="bg-brand-100 rounded-full p-3 mr-4">
                  <GraduationCap size={28} className="text-brand-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Student Looking to Lease</h3>
                  <p className="text-sm text-gray-600 mt-1">I'm a student who needs someone to take over my lease</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                setListerType('property-owner');
                nextStep();
              }}
              className="w-full p-6 border-2 border-gray-300 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors text-left"
            >
              <div className="flex items-center">
                <div className="bg-green-100 rounded-full p-3 mr-4">
                  <Building2 size={28} className="text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Property Owner/Landlord</h3>
                  <p className="text-sm text-gray-600 mt-1">I own property and want to rent to students</p>
                </div>
              </div>
            </button>
          </div>

          <button
            onClick={prevStep}
            className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
        </div>
      );
    }
    
    // If user chose "looking-to-rent", show email entry
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col justify-center p-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Verify Your Student Status</h2>
          <p className="text-gray-600">We need to verify you're a student</p>
        </div>

        <div className="mb-6">
          <div className="flex items-center mb-4 p-4 bg-brand-50 rounded-lg">
            <Shield className="text-brand-500 mr-3" size={24} />
            <div>
              <h3 className="font-semibold text-blue-800">University Email Required</h3>
              <p className="text-sm text-brand-500">We verify all student renters with their .edu email</p>
            </div>
          </div>

          <input
            type="email"
            value={formData.email}
            onChange={handleEmailChange}
            placeholder="Enter your university email"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          {formData.email && !isEmailValid && (
            <p className="text-red-500 text-sm mt-2">Please use a valid university email (.edu)</p>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={prevStep}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={nextStep}
            disabled={!isEmailValid}
            className={`flex-1 py-3 rounded-lg font-semibold flex items-center justify-center ${
              isEmailValid
                ? 'bg-brand-500 text-white hover:bg-brand-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Continue <ArrowRight className="ml-2" size={20} />
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Email Entry for Listers OR Personal Information
  if (currentStep === 3) {
    // If lister (student or owner) hasn't entered email yet, show email entry
    if (userIntent === 'looking-to-list' && !formData.email) {
      const isStudentLister = listerType === 'student-lease';
      const isOwner = listerType === 'property-owner';
      
      return (
        <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col justify-center p-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">
              {isStudentLister ? 'Verify Your Student Status' : 'Enter Your Email'}
            </h2>
            <p className="text-gray-600">
              {isStudentLister 
                ? 'We need to verify you\'re a student' 
                : 'We\'ll use this to contact you about your listings'
              }
            </p>
          </div>

          <div className="mb-6">
            {isStudentLister && (
              <div className="flex items-center mb-4 p-4 bg-brand-50 rounded-lg">
                <Shield className="text-brand-500 mr-3" size={24} />
                <div>
                  <h3 className="font-semibold text-blue-800">University Email Required</h3>
                  <p className="text-sm text-brand-500">Students must verify with their .edu email</p>
                </div>
              </div>
            )}
            
            {isOwner && (
              <div className="flex items-center mb-4 p-4 bg-green-50 rounded-lg">
                <Building2 className="text-green-600 mr-3" size={24} />
                <div>
                  <h3 className="font-semibold text-green-800">Property Owner Email</h3>
                  <p className="text-sm text-green-600">Any valid email address is accepted</p>
                </div>
              </div>
            )}

            <input
              type="email"
              value={formData.email}
              onChange={handleEmailChange}
              placeholder={isStudentLister ? "Enter your university email" : "Enter your email address"}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />

            {formData.email && !isEmailValid && (
              <p className="text-red-500 text-sm mt-2">
                {isStudentLister 
                  ? 'Please use a valid university email (.edu)' 
                  : 'Please enter a valid email address'
                }
              </p>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={prevStep}
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={nextStep}
              disabled={!isEmailValid}
              className={`flex-1 py-3 rounded-lg font-semibold flex items-center justify-center ${
                isEmailValid
                  ? 'bg-brand-500 text-white hover:bg-brand-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Continue <ArrowRight className="ml-2" size={20} />
            </button>
          </div>
        </div>
      );
    }

    // Show personal information form for all users who have email
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Tell Us About Yourself</h2>
          <p className="text-gray-600">Help others get to know you better</p>
        </div>

        {/* Profile Photo Upload */}
        <div className="mb-6 text-center">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              {photoPreview ? (
                <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-gray-400" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-brand-500 text-white rounded-full p-2 cursor-pointer hover:bg-brand-600">
              <Camera size={16} />
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>
          <p className="text-sm text-gray-600 mt-2">Add a friendly photo to your profile</p>
        </div>

        {/* Personal Information */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <input
              type="text"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          
          <input
            type="tel"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          
          {/* Only show university field for students */}
          {(userIntent === 'looking-to-rent' || listerType === 'student-lease') && (
            <input
              type="text"
              placeholder="University Name"
              value={formData.university}
              onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          )}

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Create password (min. 8 chars, 1 uppercase, 1 number)"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full pr-10 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Confirm password */}
          <div>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className={`w-full pr-10 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                  formData.confirmPassword && formData.password !== formData.confirmPassword
                    ? 'border-red-400'
                    : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
            )}
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={prevStep}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={nextStep}
            disabled={
              !formData.firstName || !formData.lastName || !formData.phone ||
              formData.password.length < 8 || formData.password !== formData.confirmPassword
            }
            className={`flex-1 py-3 rounded-lg font-semibold ${
              formData.firstName && formData.lastName && formData.phone &&
              formData.password.length >= 8 && formData.password === formData.confirmPassword
                ? 'bg-brand-500 text-white hover:bg-brand-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Step 4: Credit Check & Background Verification (Students Only) or Completion
  if (currentStep === 4) {
    // Property owners skip credit check and go straight to completion
    if (listerType === 'property-owner') {
      return (
        <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col justify-center p-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Welcome to Rentra!</h2>
            <p className="text-gray-600">You're all set up as a property owner</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex items-center mb-4">
              <div className="bg-green-100 rounded-full p-2 mr-4">
                <Building2 className="text-green-600" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-green-800">Property Owner Features</h3>
              </div>
            </div>
            <div className="space-y-2 text-sm text-green-700">
              <div className="flex items-center">
                <Check size={16} className="mr-2" />
                <span>List unlimited properties</span>
              </div>
              <div className="flex items-center">
                <Check size={16} className="mr-2" />
                <span>Manage applications and tenants</span>
              </div>
              <div className="flex items-center">
                <Check size={16} className="mr-2" />
                <span>Access to financial management tools</span>
              </div>
              <div className="flex items-center">
                <Check size={16} className="mr-2" />
                <span>Professional dispute resolution</span>
              </div>
            </div>
          </div>

          {apiError && (
            <div className="flex items-start bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
              <AlertCircle size={16} className="text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{apiError}</p>
            </div>
          )}
          <button
            onClick={handleComplete}
            disabled={isSubmitting}
            className={`w-full py-3 rounded-lg font-semibold ${
              isSubmitting
                ? 'bg-green-400 text-white cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isSubmitting ? 'Creating account…' : 'Get Started'}
          </button>
        </div>
      );
    }

    // Students get credit check option
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Streamline Your Applications</h2>
          <p className="text-gray-600">Get pre-approved to move faster</p>
        </div>

        {/* Credit Check Recommendation */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <div className="bg-green-100 rounded-full p-2 mr-4">
              <CreditCard className="text-green-600" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-800 mb-2">Recommended: Quick Pre-Approval</h3>
              <p className="text-sm text-green-700 mb-4">
                To streamline the renting process and have a faster, more convenient time, we recommend you apply through our partner <strong>"RentSpree"</strong> and set up your credit check, so owners can have quick access.
              </p>
              
              <div className="space-y-2 text-sm text-green-700">
                <div className="flex items-center">
                  <Check size={16} className="mr-2" />
                  <span>Credit score verification</span>
                </div>
                <div className="flex items-center">
                  <Check size={16} className="mr-2" />
                  <span>Background check</span>
                </div>
                <div className="flex items-center">
                  <Check size={16} className="mr-2" />
                  <span>Income verification</span>
                </div>
                <div className="flex items-center">
                  <Check size={16} className="mr-2" />
                  <span>Faster application approvals</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-4 mb-8">
          <button
            onClick={() => setFormData(prev => ({ ...prev, wantsCreditCheck: true }))}
            className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
              formData.wantsCreditCheck
                ? 'border-brand-500 bg-brand-50 text-brand-600'
                : 'border-gray-300 hover:border-brand-300'
            }`}
          >
            <div className="flex items-center">
              <div className="bg-brand-100 rounded-full p-2 mr-4">
                <FileCheck className="text-brand-500" size={20} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Yes, set up pre-approval now</h4>
                <p className="text-sm text-gray-600">Get verified and stand out to landlords</p>
              </div>
              {formData.wantsCreditCheck && (
                <Check className="text-brand-500" size={24} />
              )}
            </div>
          </button>

          <button
            onClick={() => setFormData(prev => ({ ...prev, wantsCreditCheck: false }))}
            className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
              !formData.wantsCreditCheck
                ? 'border-gray-500 bg-gray-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center">
              <div className="bg-gray-100 rounded-full p-2 mr-4">
                <Clock className="text-gray-600" size={20} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Maybe later</h4>
                <p className="text-sm text-gray-600">I'll do this when I'm ready to apply</p>
              </div>
              {!formData.wantsCreditCheck && (
                <Check className="text-gray-600" size={24} />
              )}
            </div>
          </button>
        </div>

        <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-brand-600">
            <strong>Note:</strong> In the meantime, feel free to save places and begin messaging with property owners. You can complete verification anytime from your profile.
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={prevStep}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={handleComplete}
            disabled={isSubmitting}
            className={`flex-1 py-3 rounded-lg font-semibold ${
              isSubmitting
                ? 'bg-brand-400 text-white cursor-not-allowed'
                : 'bg-brand-500 text-white hover:bg-brand-600'
            }`}
          >
            {isSubmitting ? 'Creating account…' : 'Complete Registration'}
          </button>
        </div>
      </div>
    );
  }
};

export default EnhancedRegistration;