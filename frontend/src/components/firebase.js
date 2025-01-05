// firebase.js
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signOut as firebaseSignOut,
    multiFactor as firebaseMultiFactor,
    PhoneAuthProvider as FirebasePhoneAuthProvider,
    RecaptchaVerifier,
    signInWithPhoneNumber
} from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';



const firebaseConfig = {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    measurementId: ""
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const PhoneAuthProvider = FirebasePhoneAuthProvider;
export const multiFactor = firebaseMultiFactor;
let recaptchaVerifier = null;


// Get user info and phone number
export const getUserInfo = async (email, password) => {
    try {
      // Get user from Firestore without signing in
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        throw new Error('User not found');
      }
  
      const userData = querySnapshot.docs[0].data();
      return {
        success: true,
        phoneNumber: userData.phoneNumber,
        email: email,
        password: password,
        userId: querySnapshot.docs[0].id,
        userProfile: userData
      };
    } catch (error) {
      console.error('Error getting user info:', error);
      throw error;
    }
  };


  export const sendOTP = async (phoneNumber) => {
    try {
      // Ensure the phone number is properly formatted (with a '+' sign)
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      console.log('Sending OTP to:', formattedPhone);
  
      // Initialize reCAPTCHA for invisible verification
      const recaptchaVerifier = new RecaptchaVerifier(
        auth,
        'recaptcha-container',  // The ID of the element in your DOM
        {
          size: 'invisible',  // Invisible reCAPTCHA
          callback: (response) => {
            console.log("reCAPTCHA verified successfully.");
          }
        }
      );
  
      // Send OTP using the reCAPTCHA verifier
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
      window.confirmationResult = confirmationResult;
      console.log('OTP sent successfully');
  
      return { success: true };
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  };
  
  
  
  
  
  export const verifyAndLogin = async (otp) => {
    try {
      // Ensure confirmationResult is available for OTP verification
      if (!window.confirmationResult) {
        throw new Error('No OTP verification in progress.');
      }
  
      // Verify OTP entered by user
      const result = await window.confirmationResult.confirm(otp);
      if (!result.user) {
        throw new Error('OTP verification failed');
      }
  
      // Now sign in with the stored credentials (email/password)
      const userCredential = await signInWithEmailAndPassword(auth, window.tempEmail, window.tempPassword);
      const user = userCredential.user;
  
      // Get a fresh ID token and store it
      const idToken = await user.getIdToken();
      localStorage.setItem('userToken', idToken);
      localStorage.setItem('userId', user.uid);
  
      // Clean up temporary data
      delete window.tempEmail;
      delete window.tempPassword;
      window.confirmationResult = null;
  
      return { success: true };
    } catch (error) {
      console.error('OTP verification error:', error);
      throw new Error('Failed to verify OTP. Please try again.');
    }
  };
  
  


// Register new user
export const register = async (userData) => {
    try {
        console.log('Starting registration with data:', { ...userData, password: '****' });

        // Create Firebase user first
        const userCredential = await createUserWithEmailAndPassword(
            auth, 
            userData.email, 
            userData.password
        );
        const user = userCredential.user;
        console.log('Firebase user created:', user.uid);

        // Send email verification
        await sendEmailVerification(user);
        console.log('Verification email sent');

        // Get the ID token
        const idToken = await user.getIdToken();

        // Prepare data for backend
        const backendData = {
            uid: user.uid,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            phoneNumber: userData.phoneNumber,
            address: userData.address || '',
            userType: userData.userType || [],
            phoneVerified: true
        };

        console.log('Sending data to backend:', backendData);

        // Register user in backend
        const registerResponse = await fetch('http://localhost:5000/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify(backendData)
        });
        
        if (!registerResponse.ok) {
            const errorData = await registerResponse.json();
            console.error('Backend registration failed:', errorData);
            // If backend registration fails, delete the Firebase user
            await user.delete();
            throw new Error(errorData.error || `Registration failed with status: ${registerResponse.status}`);
        }
        
        const data = await registerResponse.json();
        console.log('Backend registration successful:', data);
        
        return {
            success: true,
            message: 'Registration successful. Please verify your email.',
            userId: user.uid
        };
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
};

// firebase.js
export const checkCredentials = async (email, password) => {
    try {
      // Just verify credentials, no sign-in yet
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // Fetch user data from Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
  
      if (!userDocSnap.exists()) {
        throw new Error('User profile not found');
      }
  
      const userData = userDocSnap.data();
      console.log('User profile found:', userData);
  
      // Store the email and password temporarily
      window.tempEmail = email;
      window.tempPassword = password;
  
      // Return the user's phone number and other necessary data
      return {
        success: true,
        phoneNumber: userData.phoneNumber,
        email: email,
        userId: user.uid,
        userProfile: userData
      };
    } catch (error) {
      console.error('Error checking credentials:', error);
      throw error;
    }
  };
  
  
  
  
  export const verifyOTPAndLogin = async (otp) => {
    try {
      // Ensure the confirmationResult is available
      if (!window.confirmationResult) {
        throw new Error('No OTP verification in progress.');
      }
  
      // Verify the OTP
      const result = await window.confirmationResult.confirm(otp);
      if (!result.user) {
        throw new Error('OTP verification failed');
      }
  
      // Sign in with the previously saved credentials (email/password)
      const userCredential = await signInWithEmailAndPassword(auth, window.tempEmail, window.tempPassword);
      const user = userCredential.user;
  
      // Get a fresh ID token
      const idToken = await user.getIdToken();
      localStorage.setItem('userToken', idToken);
      localStorage.setItem('userId', user.uid);
  
      // Clean up temporary data
      delete window.tempEmail;
      delete window.tempPassword;
      window.confirmationResult = null;
  
      return { success: true };
    } catch (error) {
      console.error('OTP verification error:', error);
      throw new Error('Failed to verify OTP. Please try again.');
    }
  };
  
  
  
  
  export const login = async (email, password) => {
    try {
      console.log('Starting login process...');
      
      // Step 1: Verify credentials (without signing in immediately)
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get user profile from Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (!userDocSnap.exists()) {
        throw new Error('User profile not found');
      }
      
      const userData = userDocSnap.data();
      console.log('User profile found:', userData);
  
      // Store temporary credentials (email and password)
      window.tempEmail = email;
      window.tempPassword = password;
      window.originalUserUID = user.uid;
      
      // Step 2: Sign out immediately (for OTP process)
      await firebaseSignOut(auth);
      console.log('Logged out temporarily for OTP verification');
      
      // Return user's phone number for OTP
      return {
        success: true,
        phoneNumber: userData.phoneNumber,
        email: email,
        userId: user.uid,
        userProfile: userData
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };


  
  
  export const startPhoneVerification = async (phoneNumber) => {
    try {
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      console.log('Starting phone verification for:', formattedPhone);
  
      // Initialize reCAPTCHA
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA verified');
          }
        });
      }
  
      // Send verification code
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        window.recaptchaVerifier
      );
  
      window.confirmationResult = confirmationResult;
      console.log('OTP sent successfully');
      return { success: true };
    } catch (error) {
      console.error('Phone verification error:', error);
      // Clean up reCAPTCHA on error
      if (window.recaptchaVerifier) {
        await window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      throw new Error(error.message || 'Failed to send verification code');
    }
  };

  export const clearRecaptcha = () => {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      } catch (e) {
        console.warn('Error clearing reCAPTCHA:', e);
      }
    }
  };
  
  
// firebase.js

export const verifyPhoneNumber = async (phoneNumber) => {
    try {
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      console.log('Starting phone verification for:', formattedPhone);
  
      // Clean up existing reCAPTCHA if it exists
      if (window.recaptchaVerifier) {
        try {
          await window.recaptchaVerifier.clear();
        } catch (e) {
          console.warn('Error clearing existing reCAPTCHA:', e);
        }
        window.recaptchaVerifier = null;
      }
  
      // Remove existing container if it exists
      const existingContainer = document.getElementById('recaptcha-container');
      if (existingContainer) {
        existingContainer.remove();
      }
  
      // Create new container
      const container = document.createElement('div');
      container.id = 'recaptcha-container';
      container.style.position = 'fixed';
      container.style.bottom = '0';
      container.style.right = '0';
      container.style.zIndex = '9999';
      document.body.appendChild(container);
  
      // Create new reCAPTCHA verifier
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: (response) => {
          console.log('reCAPTCHA verified:', response);
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
        }
      });
  
      console.log('reCAPTCHA initialized, sending verification code...');
  
      // Send verification code
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        window.recaptchaVerifier
      );
  
      console.log('Verification code sent successfully');
      window.confirmationResult = confirmationResult;
      return { success: true };
  
    } catch (error) {
      console.error('Phone verification error:', error);
      // Clean up on error
      if (window.recaptchaVerifier) {
        try {
          await window.recaptchaVerifier.clear();
        } catch (e) {
          console.warn('Error clearing reCAPTCHA on failure:', e);
        }
        window.recaptchaVerifier = null;
      }
      
      // Remove container on error
      const container = document.getElementById('recaptcha-container');
      if (container) {
        container.remove();
      }
      
      throw new Error(error.message || 'Failed to send verification code');
    }
  };
  
  export const verifyOTP = async (code) => {
    try {
      if (!window.confirmationResult) {
        throw new Error('No verification in progress. Please request a new code.');
      }
  
      const result = await window.confirmationResult.confirm(code);
      console.log('OTP verified successfully');
      return {
        success: true,
        user: result.user
      };
    } catch (error) {
      console.error('OTP verification error:', error);
      if (error.code === 'auth/invalid-verification-code') {
        throw new Error('Invalid verification code. Please try again.');
      } else if (error.code === 'auth/code-expired') {
        throw new Error('Verification code has expired. Please request a new one.');
      }
      throw new Error(error.message || 'Failed to verify code');
    }
  };
  
  export const completeLogin = async (userInfo, otpCode) => {
    try {
      if (!window.tempUserEmail || !window.tempUserPassword) {
        throw new Error('Login session expired');
      }
  
      // First verify OTP
      await verifyOTP(otpCode);
  
      // Now sign in with email/password
      const userCredential = await signInWithEmailAndPassword(
        auth,
        window.tempUserEmail,
        window.tempUserPassword
      );
  
      const user = userCredential.user;
      const idToken = await user.getIdToken();
  
      // Store auth data
      localStorage.setItem('userToken', idToken);
      localStorage.setItem('userId', user.uid);
      if (userInfo.userProfile) {
        localStorage.setItem('userProfile', JSON.stringify(userInfo.userProfile));
      }
  
      // Clean up temp data
      delete window.tempUserEmail;
      delete window.tempUserPassword;
      delete window.tempUserUid;
      delete window.confirmationResult;
      if (window.recaptchaVerifier) {
        await window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
  
      return { success: true };
    } catch (error) {
      console.error('Complete login error:', error);
      throw new Error(error.message || 'Failed to complete login');
    }
  };
  
  export const logout = async () => {
    try {
      await firebaseSignOut(auth);
      localStorage.clear();
  
      // Clean up all temporary data
      if (recaptchaVerifier) {
        try {
          recaptchaVerifier.clear();
        } catch (error) {
          console.error('Error clearing recaptcha:', error);
        }
        recaptchaVerifier = null;
      }
  
      delete window.confirmationResult;
      delete window.originalUserUID;
      delete window.tempEmail;
      delete window.tempPassword;
      delete window.recaptchaVerifier;
  
      const container = document.getElementById('recaptcha-container');
      if (container) {
        container.remove();
      }
  
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

export const sendEmailOTP = async (email) => {
    try {
        const actionCodeSettings = {
            url: window.location.origin + '/login', // URL must be whitelisted in Firebase Console
            handleCodeInApp: true
        };
        console.log(actionCodeSettings);

        // First verify if this email exists
        const response = await fetch('http://localhost:5000/api/check-email-exists', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        if (!data.exists) {
            throw new Error('No account found with this email');
        }

        // Send OTP email
        const otpResponse = await fetch('http://localhost:5000/api/send-email-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });

        const otpData = await otpResponse.json();
        if (!otpData.success) {
            throw new Error(otpData.error || 'Failed to send OTP');
        }

        return {
            success: true,
            message: 'OTP sent successfully'
        };
    } catch (error) {
        console.error('Send email OTP error:', error);
        throw error;
    }
};

// Function to verify email OTP
export const verifyEmailOTP = async (email, otp) => {
    try {
        const response = await fetch('http://localhost:5000/api/verify-email-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, otp })
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Invalid OTP');
        }

        return {
            success: true,
            token: data.token
        };
    } catch (error) {
        console.error('Verify email OTP error:', error);
        throw error;
    }
};