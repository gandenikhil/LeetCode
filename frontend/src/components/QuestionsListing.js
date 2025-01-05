import React, { useState, useEffect } from 'react';
import {
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBCard,
  MDBCardBody,
  MDBBadge,
  MDBInput,
  MDBBtn,
  MDBIcon,
  MDBPagination,
  MDBPaginationItem,
  MDBPaginationLink,
  MDBSpinner
} from 'mdb-react-ui-kit';
import { auth,db } from './firebase'; 
import './QuestionsListing.css';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useAuth } from './AuthContext';
import { doc, getDoc } from 'firebase/firestore';

const QuestionsPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Add loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    difficulty: [],
    topics: [],
    status: [],
    search: ''
  });

  const handleQuestionClick = async (question) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('No authenticated user found');
        return;
      }
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        console.error('User document not found');
        return;
      }
      const userData = userDocSnap.data();
      
      if (userData.subscription === 'pro') {
        navigate(`/workspace/${question.id}`, {
          state: {
            question: question,
            testCases: question.testCases,
          }
        });
      } else {
        navigate('/pro', {
          state: {
            fromQuestion: question.id,  
            message: "Upgrade to Pro to access this question!"
          }
        });
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };
  
  // Constants
  const questionsPerPage = 10;
  const difficulties = ['Easy', 'Medium', 'Hard', 'impossible'];
  const topics = ['Arrays', 'Strings', 'Trees', 'Dynamic Programming', 'Graphs', 'Math'];
  const statuses = ['Todo', 'Attempted', 'Solved'];

  const CONSTANTS = React.useMemo(() => ({
    questionsPerPage: 10,
    difficulties: ['Easy', 'Medium', 'Hard', 'impossible'],
    topics: ['Arrays', 'Strings', 'Trees', 'Dynamic Programming', 'Graphs', 'Math'],
    statuses: ['Todo', 'Attempted', 'Solved']
  }), []);


  useEffect(() => {
    let isMounted = true;  // for cleanup

    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const user = auth.currentUser;
        if (!user) {
          throw new Error('No authenticated user found');
        }

        const token = await user.getIdToken();

        const response = await fetch('http://localhost:5000/api/questions', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch questions');
        }

        const data = await response.json();
        
        if (!isMounted) return;

        // Ensure we have valid questions data with all required fields
        const validQuestions = (data.questions || []).map(q => ({
          id: q.id || Math.random().toString(),
          title: q.title || 'Untitled Question',
          description: q.description || 'No description available',
          difficulty: q.difficulty || 'Medium',
          topics: Array.isArray(q.topics) ? q.topics : [],
          status: q.status || 'Todo',
          solvedCount: q.solvedCount || 0,
          acceptance: q.acceptance || 0,
          companies: Array.isArray(q.companies) ? q.companies : []
        }));

        setQuestions(validQuestions);
        setFilteredQuestions(validQuestions);

      } catch (err) {
        console.error('Error fetching questions:', err);
        if (isMounted) {
          setError(err.message);
          
          // Create mock data with proper structure
          const mockQuestions = Array.from({ length: 50 }, (_, index) => ({
            id: (index + 1).toString(),
            title: `Question ${index + 1}`,
            description: `This is a sample question description for question ${index + 1}...`,
            difficulty: CONSTANTS.difficulties[Math.floor(Math.random() * CONSTANTS.difficulties.length)],
            topics: [CONSTANTS.topics[Math.floor(Math.random() * CONSTANTS.topics.length)]],
            status: CONSTANTS.statuses[Math.floor(Math.random() * CONSTANTS.statuses.length)],
            solvedCount: Math.floor(Math.random() * 10000),
            acceptance: Math.floor(Math.random() * 100),
            companies: ['Google', 'Amazon', 'Microsoft'].slice(0, Math.floor(Math.random() * 3) + 1)
          }));
          setQuestions(mockQuestions);
          setFilteredQuestions(mockQuestions);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchQuestions();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);



  // Filter handlers
  const handleFilterChange = (type, value) => {
    const newFilters = { ...filters };
    if (type === 'search') {
      newFilters.search = value;
    } else {
      const index = newFilters[type].indexOf(value);
      if (index === -1) {
        newFilters[type].push(value);
      } else {
        newFilters[type].splice(index, 1);
      }
    }
    setFilters(newFilters);
    applyFilters(newFilters);
    setCurrentPage(1);
  };

  const applyFilters = (currentFilters) => {
    let result = [...questions];

    // Apply search filter
    if (currentFilters.search) {
      result = result.filter(q => 
        q.title.toLowerCase().includes(currentFilters.search.toLowerCase()) ||
        q.description.toLowerCase().includes(currentFilters.search.toLowerCase())
      );
    }

    // Apply difficulty filter
    if (currentFilters.difficulty.length > 0) {
      result = result.filter(q => currentFilters.difficulty.includes(q.difficulty));
    }

    // Apply topics filter
    if (currentFilters.topics.length > 0) {
      result = result.filter(q => 
        q.topics.some(t => currentFilters.topics.includes(t))
      );
    }

    // Apply status filter
    if (currentFilters.status.length > 0) {
      result = result.filter(q => currentFilters.status.includes(q.status));
    }

    setFilteredQuestions(result);
  };

  // Pagination logic
  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = filteredQuestions.slice(indexOfFirstQuestion, indexOfLastQuestion);
  const pageCount = Math.ceil(filteredQuestions.length / questionsPerPage);

  const getDifficultyColor = (difficulty) => {
    if (!difficulty) return 'info';  // default color
    
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'danger';
      default: return 'info';
    }
  };


  const renderQuestionsList = () => {
    return currentQuestions.map(question => (
      <MDBCard key={question.id} className="questions-card mb-3">
        <MDBCardBody>
          <MDBRow>
            <MDBCol md="8">
            <h5 
              className="questions-card-title mb-2"
              onClick={() => handleQuestionClick(question)}
              style={{ cursor: 'pointer' }}
            >
              {question.id}. {question.title || 'Untitled Question'}
            </h5>
            <p className="questions-card-description text-muted mb-3">
              <ReactMarkdown>
                {question.description ? `${question.description.slice(0, 100)}...` : 'No description available'}
              </ReactMarkdown>
            </p>

              <div className="d-flex flex-wrap gap-2">
                {question.difficulty && (
                  <MDBBadge color={getDifficultyColor(question.difficulty)}>
                    {question.difficulty}
                  </MDBBadge>
                )}
                {Array.isArray(question.topics) && question.topics.map(topic => (
                  <MDBBadge key={topic} color="primary">
                    {topic}
                  </MDBBadge>
                ))}
                <MDBBadge color="secondary">
                  {question.status || 'Todo'}
                </MDBBadge>
              </div>
            </MDBCol>
            <MDBCol md="4" className="text-md-end">
              <div className="questions-card-stats">
                <div className="mb-2">
                  <MDBIcon fas icon="user-check" /> {question.solvedCount || 0} solved
                </div>
                <div className="mb-2">
                  <MDBIcon fas icon="chart-line" /> {question.acceptance || 0}% acceptance
                </div>
                <div>
                <MDBBtn 
                  size="sm" 
                  className="questions-solve-btn"
                  onClick={() => handleQuestionClick(question)}
                >
                  Solve Challenge
                </MDBBtn>
                </div>
              </div>
            </MDBCol>
          </MDBRow>
        </MDBCardBody>
      </MDBCard>
    ));
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <MDBSpinner role="status">
          <span className="visually-hidden">Loading...</span>
        </MDBSpinner>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <MDBCard>
          <MDBCardBody className="text-center">
            <MDBIcon fas icon="exclamation-circle" className="text-danger mb-3" size="3x" />
            <h4>Error Loading Questions</h4>
            <p className="text-muted">{error}</p>
            <MDBBtn onClick={() => window.location.reload()}>
              Try Again
            </MDBBtn>
          </MDBCardBody>
        </MDBCard>
      </div>
    );
  }

  return (
    <div className="questions-page-container background-radial-gradient min-vh-100 p-4">
      <MDBContainer fluid className="py-3">
        {/* Search and Filters Section */}
        <MDBCard className="questions-filter-card mb-4">
          <MDBCardBody>
            <MDBRow>
              <MDBCol md="6" lg="4" className="mb-3">
                <MDBInput
                  label="Search questions"
                  icon="search"
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  contrast
                />
              </MDBCol>
            </MDBRow>
            
            {/* Filter Chips */}
            <div className="questions-filter-section mb-3">
              <h6 className="mb-2">Difficulty</h6>
              <div className="d-flex flex-wrap gap-2">
                {difficulties.map(diff => (
                  <MDBBadge
                    key={diff}
                    color={filters.difficulty.includes(diff) ? getDifficultyColor(diff) : 'dark'}
                    className="questions-filter-chip"
                    onClick={() => handleFilterChange('difficulty', diff)}
                    style={{ cursor: 'pointer' }}
                  >
                    {diff}
                  </MDBBadge>
                ))}
              </div>
            </div>

            <div className="questions-filter-section mb-3">
              <h6 className="mb-2">Topics</h6>
              <div className="d-flex flex-wrap gap-2">
                {topics.map(topic => (
                  <MDBBadge
                    key={topic}
                    color={filters.topics.includes(topic) ? 'primary' : 'dark'}
                    className="questions-filter-chip"
                    onClick={() => handleFilterChange('topics', topic)}
                    style={{ cursor: 'pointer' }}
                  >
                    {topic}
                  </MDBBadge>
                ))}
              </div>
            </div>

            <div className="questions-filter-section">
              <h6 className="mb-2">Status</h6>
              <div className="d-flex flex-wrap gap-2">
                {statuses.map(status => (
                  <MDBBadge
                    key={status}
                    color={filters.status.includes(status) ? 'info' : 'dark'}
                    className="questions-filter-chip"
                    onClick={() => handleFilterChange('status', status)}
                    style={{ cursor: 'pointer' }}
                  >
                    {status}
                  </MDBBadge>
                ))}
              </div>
            </div>
          </MDBCardBody>
        </MDBCard>

        {/* Questions List */}
        <div className="questions-list">
          {renderQuestionsList()}
        </div>

        {/* Pagination */}
        {pageCount > 1 && (
          <MDBPagination className="questions-pagination mb-0 justify-content-center">
            <MDBPaginationItem disabled={currentPage === 1}>
              <MDBPaginationLink 
                onClick={() => setCurrentPage(curr => Math.max(curr - 1, 1))}
              >
                Previous
              </MDBPaginationLink>
            </MDBPaginationItem>

            {[...Array(pageCount)].map((_, index) => (
              <MDBPaginationItem key={index + 1} active={currentPage === index + 1}>
                <MDBPaginationLink onClick={() => setCurrentPage(index + 1)}>
                  {index + 1}
                </MDBPaginationLink>
              </MDBPaginationItem>
            ))}

            <MDBPaginationItem disabled={currentPage === pageCount}>
              <MDBPaginationLink 
                onClick={() => setCurrentPage(curr => Math.min(curr + 1, pageCount))}
              >
                Next
              </MDBPaginationLink>
            </MDBPaginationItem>
          </MDBPagination>
        )}
      </MDBContainer>
    </div>
  );
};

export default QuestionsPage;