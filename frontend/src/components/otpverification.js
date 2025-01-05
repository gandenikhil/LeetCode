import React, { useState, useRef, useEffect } from 'react';
import './otpstyles.css';

const OTPVerification = ({ 
  isOpen, 
  onClose, 
  phoneNumber, 
  onVerify, 
  resendOTP, 
  timer = 30 
}) => {
  console.log('OTPVerification rendered with isOpen:', isOpen);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(timer);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);

  useEffect(() => {
    console.log('OTPVerification mounted/updated. isOpen:', isOpen);
    if (isOpen) {
      setOtp(['', '', '', '', '', '']);
      setError('');
      setTimeLeft(timer);
      // Focus first input when modal opens
      setTimeout(() => {
        if (inputs.current[0]) {
          inputs.current[0].focus();
        }
      }, 100);
    }
  }, [isOpen, timer]);

  useEffect(() => {
    let intervalId;
    if (isOpen && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [timeLeft, isOpen]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);
    setError('');

    // Move to next input if there's a value
    if (element.value && index < 5) {
      inputs.current[index + 1].focus();
    }

    // Auto submit when all fields are filled
    if (index === 5 && element.value) {
      handleVerify();
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

  const handleVerify = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setError('Please enter complete OTP');
      return;
    }

    setLoading(true);
    try {
      await onVerify(otpValue);
    } catch (error) {
      console.error('OTP Verification Error:', error);
      setError(error.message || 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      if (inputs.current[0]) {
        inputs.current[0].focus();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await resendOTP();
      setTimeLeft(timer);
      setError('');
      setOtp(['', '', '', '', '', '']);
      if (inputs.current[0]) {
        inputs.current[0].focus();
      }
    } catch (error) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    console.log('OTPVerification not shown because isOpen is false');
    return null;
  }

  console.log('Rendering OTP modal with phone number:', phoneNumber);


  return (
    <div className="otp-modal-overlay" onClick={(e) => e.stopPropagation()}>
      {console.log("otp model has triggered")}
      <div className="otp-modal">
        <button className="close-button" onClick={onClose} type="button">×</button>
        
        <div className="otp-content">
          <h2>Enter Verification Code</h2>
          <p className="phone-number">
            Enter the 6-digit code sent to {phoneNumber}
          </p>
          
          <div className="otp-input-group">
            {otp.map((value, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                ref={(ref) => inputs.current[index] = ref}
                value={value}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={`otp-input ${error ? 'error' : ''}`}
                disabled={loading}
                autoComplete="off"
              />
            ))}
          </div>

          {error && <p className="error-message">{error}</p>}

          <button 
            className="verify-button" 
            onClick={handleVerify}
            disabled={loading || otp.join('').length !== 6}
            type="button"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>

          <div className="resend-section">
            {timeLeft > 0 ? (
              <p>Resend code in {timeLeft}s</p>
            ) : (
              <button 
                className="resend-button" 
                onClick={handleResend}
                disabled={loading}
                type="button"
              >
                Resend OTP
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;