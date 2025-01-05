import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MDBBtn,
  MDBContainer,
  MDBCard,
  MDBCardBody,
  MDBInput,
  MDBIcon,
  MDBRow,
  MDBCol,
  MDBCheckbox
} from 'mdb-react-ui-kit';
import { 
  getAuth, 
  signInWithPhoneNumber, 
  signInWithCustomToken,
  RecaptchaVerifier
} from 'firebase/auth';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(30);
  const [userInfo, setUserInfo] = useState(null);
  const inputs = React.useRef([]);

  const API_BASE_URL = 'http://localhost:5000';

  useEffect(() => {
    // Initialize reCAPTCHA verifier
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible',
      'callback': (response) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      }
    });

    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }
    };
  }, [auth]);

  useEffect(() => {
    let intervalId;
    if (showOTP && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [timeLeft, showOTP]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Move to next input if there's a value
    if (element.value && index < 5) {
      inputs.current[index + 1].focus();
    }

    // Auto submit when all fields are filled
    if (index === 5 && element.value) {
      handleVerifyOTP();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputs.current[index - 1].focus();
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
  
    try {
      // Step 1: Check credentials with backend
      const response = await fetch(`${API_BASE_URL}/api/check-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',  // Important for CORS
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
  
      setUserInfo(data);
  
      // Step 2: Start Firebase phone verification
      const phoneNumber = data.phoneNumber;
      const appVerifier = window.recaptchaVerifier;
  
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      window.confirmationResult = confirmationResult;
  
      setShowOTP(true);
      setSuccess(`Verification code sent to ${phoneNumber}`);
  
      // Focus first OTP input
      setTimeout(() => {
        if (inputs.current[0]) {
          inputs.current[0].focus();
        }
      }, 100);
  
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'An error occurred during login');
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setError('Please enter the complete OTP');
      return;
    }
  
    setIsLoading(true);
    try {
      // Verify OTP with Firebase
      const result = await window.confirmationResult.confirm(otpValue);
      const user = result.user;
      const idToken = await user.getIdToken();
  
      // Verify with backend
      const response = await fetch(`${API_BASE_URL}/api/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',  // Important for CORS
        body: JSON.stringify({
          idToken: idToken,
          code: otpValue
        })
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify OTP');
      }
  
      if (data.success) {
        // Sign in with the custom token
        await signInWithCustomToken(auth, data.customToken);
        
        // Store authentication data
        const finalIdToken = await auth.currentUser.getIdToken();
        localStorage.setItem('userToken', finalIdToken);
        localStorage.setItem('userId', data.userId);
  
        setSuccess('Login successful! Redirecting...');
        setTimeout(() => {
          navigate('/QuestionsPage');
        }, 1000);
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setError(error.message || 'Failed to verify OTP');
      setOtp(['', '', '', '', '', '']);
      if (inputs.current[0]) {
        inputs.current[0].focus();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      const phoneNumber = userInfo.phoneNumber;
      const appVerifier = window.recaptchaVerifier;

      // Clear existing recaptcha
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }

      // Create new recaptcha verifier
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible'
      });

      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      window.confirmationResult = confirmationResult;

      setTimeLeft(30);
      setSuccess('Verification code resent successfully');
      setOtp(['', '', '', '', '', '']);
      if (inputs.current[0]) {
        inputs.current[0].focus();
      }
    } catch (error) {
      setError('Failed to resend OTP');
      console.error('Resend OTP error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const Alert = ({ message, type }) => (
    <div className={`alert alert-${type} d-flex align-items-center mb-4`} role="alert">
      <MDBIcon 
        fas 
        icon={type === 'success' ? 'check-circle' : 'exclamation-circle'} 
        className='me-2'
      />
      {message}
    </div>
  );

  return (
    <MDBContainer fluid className="login-container">
      <div id="recaptcha-container"></div>
      <MDBRow className='justify-content-center w-100 h-100 m-0'>
        <MDBCol md='8' lg='5' className='p-4'>
          <MDBCard className='login-card'>
            <MDBCardBody>
              <div className="text-center mb-4">
                <h2 className="fw-bold text-dark mb-2">Welcome Back!</h2>
                <p className="text-dark-emphasis">Please login to your account</p>
              </div>

              {error && <Alert message={error} type="danger" />}
              {success && <Alert message={success} type="success" />}

              {!showOTP ? (
                // Login Form
                <form onSubmit={handleSubmit}>
                  <MDBInput 
                    wrapperClass='mb-4' 
                    label='Email' 
                    name='email'
                    type='email'
                    value={formData.email}
                    onChange={handleInputChange}
                    className='login-input'
                    disabled={isLoading}
                    required
                  />
                  <MDBInput 
                    wrapperClass='mb-4' 
                    label='Password' 
                    name='password'
                    type='password'
                    value={formData.password}
                    onChange={handleInputChange}
                    className='login-input'
                    disabled={isLoading}
                    required
                  />

                  <div className='d-flex justify-content-between align-items-center mb-4'>
                    <MDBCheckbox 
                      name='remember' 
                      label='Remember me' 
                      className='text-dark'
                    />
                    <Link to="/forgot-password" className="text-primary fw-semibold">
                      Forgot password?
                    </Link>
                  </div>

                  <MDBBtn 
                    type='submit'
                    className='w-100 mb-4 login-btn'
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        Logging in...
                      </>
                    ) : (
                      'Login'
                    )}
                  </MDBBtn>
                </form>
              ) : (
                // OTP Verification Form
                <div className="otp-section">
                  <h3 className="text-center mb-3">Enter Verification Code</h3>
                  <p className="text-center text-muted mb-4">
                    Enter the 6-digit code sent to {userInfo?.phoneNumber}
                  </p>
                  
                  <div className="otp-input-group mb-4">
                    {otp.map((value, index) => (
                      <input
                        key={index}
                        type="text"
                        maxLength="1"
                        value={value}
                        ref={(ref) => inputs.current[index] = ref}
                        onChange={(e) => handleOtpChange(e.target, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        className="otp-input"
                        disabled={isLoading}
                      />
                    ))}
                  </div>

                  <MDBBtn 
                    className='w-100 mb-3'
                    onClick={handleVerifyOTP}
                    disabled={isLoading || otp.join('').length !== 6}
                  >
                    {isLoading ? 'Verifying...' : 'Verify OTP'}
                  </MDBBtn>

                  <div className="text-center">
                    {timeLeft > 0 ? (
                      <p className="text-muted">Resend code in {timeLeft}s</p>
                    ) : (
                      <button 
                        className="btn btn-link"
                        onClick={handleResendOTP}
                        disabled={isLoading}
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="text-center mb-3">
                <p className="text-dark">Don't have an account? 
                  <Link to="/register" className="text-primary fw-semibold ms-2">
                    Register here
                  </Link>
                </p>
              </div>
            </MDBCardBody>
          </MDBCard>
        </MDBCol>
      </MDBRow>
    </MDBContainer>
  );
};

export default LoginPage;