import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { MDBSpinner } from 'mdb-react-ui-kit';

const SuccessPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const updateSubscription = async () => {
      try {
        const idToken = await currentUser.getIdToken();
        
        // Call the update subscription endpoint
        const response = await fetch('http://localhost:5000/api/update-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          }
        });

        const data = await response.json();
        
        if (data.success) {
          // Redirect to questions page after successful update
          navigate('/questionsPage', { replace: true });
        } else {
          setError('Failed to update subscription');
        }
      } catch (error) {
        console.error('Error updating subscription:', error);
        setError('An error occurred while updating your subscription');
      }
    };

    if (currentUser) {
      updateSubscription();
    }
  }, [currentUser, navigate]);

  if (error) {
    return (
      <div className="text-center mt-5">
        <h2>Error</h2>
        <p className="text-danger">{error}</p>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/subscription')}
        >
          Return to Subscription Page
        </button>
      </div>
    );
  }

  return (
    <div className="text-center mt-5">
      <MDBSpinner style={{ width: '3rem', height: '3rem' }}>
        <span className='visually-hidden'>Loading...</span>
      </MDBSpinner>
      <p className="mt-3">Processing your subscription...</p>
    </div>
  );
};

export default SuccessPage;