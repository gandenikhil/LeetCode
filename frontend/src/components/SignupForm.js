import React, { useState, useEffect } from 'react';
import {
  MDBBtn,
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBCard,
  MDBCardBody,
  MDBInput,
  MDBIcon,
  MDBCheckbox
} from 'mdb-react-ui-kit';
import { useNavigate } from 'react-router-dom';
import { register, verifyPhoneNumber, verifyOTP } from './firebase';
import OTPVerification from './otpverification';
import './SignupForm.css';

const SignupForm = () => {
  const navigate = useNavigate();
  const [showOTP, setShowOTP] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    countryCode: '+1',
    phoneNumber: '',
    address: '',
    userType: []
  });


  const professions = [
    { id: "student", label: "Student" },
    { id: "tutor", label: "Tutor" },
    { id: "professional", label: "Professional" }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setVerificationError('');
  };


  // Add recaptcha container when component mounts
  useEffect(() => {
    const recaptchaDiv = document.createElement('div');
    recaptchaDiv.id = 'recaptcha-container';
    document.body.appendChild(recaptchaDiv);

    return () => {
      const container = document.getElementById('recaptcha-container');
      if (container) {
        container.remove();
      }
    };
  }, []);


  const handleCheckboxChange = (id) => {
    setFormData(prev => {
      const updatedUserType = prev.userType.includes(id)
        ? prev.userType.filter(type => type !== id)
        : [...prev.userType, id];
      return {
        ...prev,
        userType: updatedUserType
      };
    });
  };

  useEffect(() => {
    const recaptchaDiv = document.createElement('div');
    recaptchaDiv.id = 'recaptcha-container';
    document.body.appendChild(recaptchaDiv);

    return () => {
      const container = document.getElementById('recaptcha-container');
      if (container) {
        container.remove();
      }
    };
  }, []);

  const handlePhoneVerify = async (e) => {
    e.preventDefault();
    setVerificationError('');
    setIsVerifying(true);

    try {
      const fullPhoneNumber = `${formData.countryCode}${formData.phoneNumber}`;
      const result = await verifyPhoneNumber(fullPhoneNumber);
      
      if (result.success) {
        setShowOTP(true);
      } else {
        throw new Error('Failed to send verification code');
      }
    } catch (error) {
      console.error('Phone verification error:', error);
      setVerificationError(error.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      const fullPhoneNumber = `${formData.countryCode}${formData.phoneNumber}`;
      const result = await verifyPhoneNumber(fullPhoneNumber);
      return { success: true };
    } catch (error) {
      console.error('Resend OTP error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Form validation
    if (formData.password !== formData.confirmPassword) {
      setVerificationError('Passwords do not match');
      return;
    }

    if (!formData.phoneNumber) {
      setVerificationError('Phone number is required');
      return;
    }

    setIsVerifying(true);
    try {
      // Start phone verification
      const fullPhoneNumber = `${formData.countryCode}${formData.phoneNumber}`;
      const result = await verifyPhoneNumber(fullPhoneNumber);
      
      if (result.success) {
        setShowOTP(true);
      } else {
        throw new Error('Failed to send verification code');
      }
    } catch (error) {
      console.error('Phone verification error:', error);
      setVerificationError(error.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyOTP = async (otpCode) => {
    setIsVerifying(true);
    try {
      // First verify OTP
      const verifyResult = await verifyOTP(otpCode);
      if (!verifyResult.success) {
        throw new Error('Invalid OTP');
      }

      // If OTP verification is successful, then create user account
      const registerResult = await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: `${formData.countryCode}${formData.phoneNumber}`,
        address: formData.address,
        userType: formData.userType
      });

      if (registerResult.success) {
        setShowOTP(false);
        navigate('/login');
        return { success: true };
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      console.error('Verification Error:', error);
      throw new Error(error.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
};


  const handleGoogleSignup = () => {
    console.log('Google signup clicked');
  };

  // Add this inside your SignupForm component, before the return statement
React.useEffect(() => {
  const symbols = ['<', '>', '{', '}', '/', '*', '[', ']', '(', ')', ';', '=', '+', '-', '_', '&&', '||'];
  const container = document.querySelector('.background-radial-gradient');
  
  // Function to generate random properties
  const randomProps = () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    rotation: Math.random() * 360,
    scale: 0.5 + Math.random() * 1.5,
    floatTime: 15 + Math.random() * 20,
    floatDelay: Math.random() * -30,
    startX: -200 + Math.random() * 400,
    endX: -200 + Math.random() * 400,
    startRotate: Math.random() * 360,
    endRotate: 360 + Math.random() * 720,
  });

  // Create coding symbols
  for (let i = 0; i < 50; i++) {  // Increased number of symbols
    const symbol = document.createElement('div');
    const props = randomProps();
    
    symbol.className = 'coding-symbol';
    symbol.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    symbol.style.cssText = `
      left: ${props.x}px;
      top: ${props.y}px;
      transform: rotate(${props.rotation}deg) scale(${props.scale});
      --float-time: ${props.floatTime}s;
      --float-delay: ${props.floatDelay}s;
      --start-x: ${props.startX}px;
      --end-x: ${props.endX}px;
      --start-rotate: ${props.startRotate}deg;
      --end-rotate: ${props.endRotate}deg;
      font-size: ${3 + Math.random() * 3}rem;
      opacity: ${0.1 + Math.random() * 0.2};
    `;
    
    container.appendChild(symbol);
  }

  // Create geometric shapes
  const shapes = ['triangle', 'circle', 'square'];
  for (let i = 0; i < 30; i++) {  // Added geometric shapes
    const shape = document.createElement('div');
    const props = randomProps();
    const shapeType = shapes[Math.floor(Math.random() * shapes.length)];
    
    shape.className = `geometric-shape ${shapeType}`;
    shape.style.cssText = `
      left: ${props.x}px;
      top: ${props.y}px;
      transform: rotate(${props.rotation}deg) scale(${props.scale * 0.8});
      --float-time: ${props.floatTime}s;
      --float-delay: ${props.floatDelay}s;
      --start-x: ${props.startX}px;
      --end-x: ${props.endX}px;
      --start-rotate: ${props.startRotate}deg;
      --end-rotate: ${props.endRotate}deg;
      --scale: ${0.3 + Math.random() * 0.7};
    `;
    
    container.appendChild(shape);
  }

  // Cleanup function
  return () => {
    const elements = document.querySelectorAll('.coding-symbol, .geometric-shape');
    elements.forEach(element => element.remove());
  };
}, []);

return (
  <MDBContainer fluid className='p-4 background-radial-gradient overflow-hidden'>
    <MDBRow className='g-0 align-items-center h-100'>
      <MDBCol md='6' className='text-center text-md-start d-flex flex-column justify-content-center'>
        <h1 className="my-5 display-3 fw-bold ls-tight px-3" style={{color: 'hsl(218, 81%, 95%)'}}>
          Practice & Learn <br />
          <span style={{color: 'hsl(218, 81%, 75%)'}}>Data Structures & Algorithms</span>
        </h1>
        <p className='px-3' style={{color: 'hsl(218, 81%, 85%)'}}>
          Join our platform to enhance your coding skills, practice problems,
          and prepare for technical interviews. Learn from a vast collection
          of programming challenges and connect with a community of developers.
        </p>
      </MDBCol>

      <MDBCol md='6' className='position-relative'>
        <div id="radius-shape-1" className="position-absolute rounded-circle shadow-5-strong"></div>
        <div id="radius-shape-2" className="position-absolute shadow-5-strong"></div>

        <MDBCard className='my-5 bg-glass'>
          <MDBCardBody className='p-5'>
            <div className="text-center mb-4">
              <h2 className="fw-bold mb-4">Create Account</h2>
              <MDBBtn 
                className='w-100 mb-4 btn-light d-flex align-items-center justify-content-center'
                style={{ height: '45px' }}
                onClick={handleGoogleSignup}
              >
                <MDBIcon fab icon='google' className='mx-2'/>
                Sign up with Google
              </MDBBtn>
              <div className="divider d-flex align-items-center my-4">
                <p className="text-center mx-3 mb-0">OR</p>
              </div>
            </div>

            {verificationError && (
                <div className="alert alert-danger" role="alert">
                  {verificationError}
                </div>
              )}

            <form onSubmit={handleSubmit}>
              <MDBRow>
                <MDBCol md='6'>
                  <MDBInput
                    label='First Name'
                    name='firstName'
                    type='text'
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className='mb-4'
                  />
                </MDBCol>
                <MDBCol md='6'>
                  <MDBInput
                    label='Last Name'
                    name='lastName'
                    type='text'
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className='mb-4'
                  />
                </MDBCol>
              </MDBRow>

              <MDBInput
          label='Email'
          name='email'
          type='email'
          value={formData.email}
          onChange={handleInputChange}
          required
          className='mb-4'
        />

        <MDBInput
          label='Password'
          name='password'
          type='password'
          value={formData.password}
          onChange={handleInputChange}
          required
          className='mb-4'
        />

        <MDBInput
          label='Confirm Password'
          name='confirmPassword'
          type='password'
          value={formData.confirmPassword}
          onChange={handleInputChange}
          required
          className='mb-4'
        />

        <MDBRow className="align-items-end">
        <MDBCol size='3'>
                    <MDBInput
                      label='Country Code'
                      name='countryCode'
                      type='text'
                      value={formData.countryCode}
                      onChange={handleInputChange}
                      required
                      className='mb-4'
                      placeholder='+1'
                    />
                  </MDBCol>
          <MDBCol>
                    <MDBInput
                      label='Phone Number'
                      name='phoneNumber'
                      type='tel'
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      required
                      className='mb-4'
                    />
                  </MDBCol>
        </MDBRow>

        {verificationError && (
          <div className="text-danger small mb-3 px-3">
            {verificationError}
          </div>
        )}
              

              <MDBInput
                label='Address (Optional)'
                name='address'
                type='text'
                value={formData.address}
                onChange={handleInputChange}
                className='mb-4'
              />

              <div className='mb-4'>
                <p className='mb-2'>Profession</p>
                <MDBRow>
                  {professions.map(({ id, label }) => (
                    <MDBCol size='4' key={id}>
                      <MDBCheckbox
                        name={id}
                        id={id}
                        label={label}
                        checked={formData.userType.includes(id)}
                        onChange={() => handleCheckboxChange(id)}
                      />
                    </MDBCol>
                  ))}
                </MDBRow>
              </div>

              <MDBBtn 
                  type='submit' 
                  className='w-100 mb-4'
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <>
                      <div className="spinner-border spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      Verifying...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </MDBBtn>
                    </form>

                    <OTPVerification
                isOpen={showOTP}
                onClose={() => setShowOTP(false)}
                phoneNumber={`${formData.countryCode}${formData.phoneNumber}`}
                onVerify={handleVerifyOTP}
                resendOTP={handleResendOTP}
                timer={30}
              />
          </MDBCardBody>
        </MDBCard>
      </MDBCol>
    </MDBRow>
  </MDBContainer>
);

};

export default SignupForm;