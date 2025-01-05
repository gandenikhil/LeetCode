import React, { useState, useEffect } from 'react';
import {
  MDBCard,
  MDBCardBody,
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBBadge,
  MDBSpinner
} from 'mdb-react-ui-kit';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';
import { useAuth } from './AuthContext';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import './userProfile.css';

const UserProfile = () => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mockUserData = {
    firstName: "Alex",
    lastName: "Thompson",
    email: "alex.thompson@example.com",
    problemsSolved: 347,
    streak: 15,
    subscription: "Premium",
    badges: [
      { name: "30 Day Streak", icon: "🔥" },
      { name: "Problem Master", icon: "🏆" },
      { name: "Top Contributor", icon: "⭐" },
      { name: "Speed Demon", icon: "⚡" }
    ],
    languages: [
      { name: "Python", value: 85 },
      { name: "JavaScript", value: 75 },
      { name: "Java", value: 60 },
      { name: "C++", value: 45 },
      { name: "Ruby", value: 30 }
    ],
    weeklyActivity: [
      { day: "Mon", problems: 12 },
      { day: "Tue", problems: 8 },
      { day: "Wed", problems: 15 },
      { day: "Thu", problems: 10 },
      { day: "Fri", problems: 20 },
      { day: "Sat", problems: 25 },
      { day: "Sun", problems: 18 }
    ],
    problemCategories: [
      { subject: "Arrays", score: 85 },
      { subject: "Strings", score: 75 },
      { subject: "Dynamic Programming", score: 65 },
      { subject: "Trees", score: 80 },
      { subject: "Graphs", score: 70 }
    ]
  };

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!currentUser) {
          throw new Error('No user logged in');
        }

        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          throw new Error('User profile not found');
        }

        // Fetch user's submissions
        const submissionsQuery = query(
          collection(db, 'submissions'),
          where('userId', '==', currentUser.uid)
        );
        const submissionsSnapshot = await getDocs(submissionsQuery);
        
        const problemsSolved = submissionsSnapshot.size;

        
        
        setUserData({
          ...userDoc.data(),
          problemsSolved,
          // Keep the visualization data as mock for now
          badges: [
            { name: "30 Day Streak", icon: "🔥" },
            { name: "Problem Master", icon: "🏆" },
            { name: "Top Contributor", icon: "⭐" },
            { name: "Speed Demon", icon: "⚡" }
          ],
          languages: [
            { name: "Python", value: 85 },
            { name: "JavaScript", value: 75 },
            { name: "Java", value: 60 },
            { name: "C++", value: 45 },
            { name: "Ruby", value: 30 }
          ],
          weeklyActivity: [
            { day: "Mon", problems: 12 },
            { day: "Tue", problems: 8 },
            { day: "Wed", problems: 15 },
            { day: "Thu", problems: 10 },
            { day: "Fri", problems: 20 },
            { day: "Sat", problems: 25 },
            { day: "Sun", problems: 18 }
          ],
          problemCategories: [
            { subject: "Arrays", score: 85 },
            { subject: "Strings", score: 75 },
            { subject: "Dynamic Programming", score: 65 },
            { subject: "Trees", score: 80 },
            { subject: "Graphs", score: 70 }
          ]
        });
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

  if (loading) {
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
      <div className="alert alert-danger m-4" role="alert">
        {error}
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="alert alert-warning m-4" role="alert">
        No user data available
      </div>
    );
  }

  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
          {payload.name}
        </text>
        <text x={cx} y={cy + 20} dy={8} textAnchor="middle" fill={fill}>
          {`${value}%`}
        </text>
        <sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  return (
    <div className="profile-page-container">
      <MDBContainer fluid className="py-5">
        <MDBRow>
          {/* Left Column - User Info */}
          <MDBCol lg="4">
            <MDBCard className="profile-card mb-4 hover-shadow">
              <MDBCardBody className="text-center">
                <div className="profile-avatar-container mb-4">
                  <div className="profile-avatar-initials">
                    <span className="display-4">{userData.firstName?.charAt(0) || 'U'}</span>
                  </div>
                </div>
                <h2 className="h3 mb-3">
                  {userData.firstName} {userData.lastName}
                </h2>
                <p className="text-muted mb-4">{userData.email}</p>
                <p className="text-muted mb-4">📱 {userData.phoneNumber}</p>
                <div className="d-flex justify-content-center gap-3 mb-4">
                  <MDBBadge pill className='px-3 py-2 profile-level-badge'>
                    Level {Math.floor(userData.problemsSolved / 50) + 1}
                  </MDBBadge>
                  <MDBBadge pill color='success' className='px-3 py-2'>
                    {userData.subscription || 'Free'}
                  </MDBBadge>
                </div>
                
                <div className="profile-stats">
                  <div className="stat-item p-3 rounded mb-3 bg-light-hover">
                    <i className="fas fa-code-branch fa-2x mb-2 text-primary"></i>
                    <h4 className="h5 mb-0">{userData.problemsSolved}</h4>
                    <p className="small text-muted mb-0">Problems Solved</p>
                  </div>
                  <div className="stat-item p-3 rounded mb-3 bg-light-hover">
                    <i className="fas fa-fire fa-2x mb-2 text-danger"></i>
                    <h4 className="h5 mb-0">{userData.streak || 0}</h4>
                    <p className="small text-muted mb-0">Day Streak</p>
                  </div>
                </div>

                {userData.address && (
                  <div className="mt-4">
                    <h6 className="text-muted">Address</h6>
                    <p>{userData.address}</p>
                  </div>
                )}
              </MDBCardBody>
            </MDBCard>

            {/* Programming Languages */}
            <MDBCard className="profile-card mb-4">
              <MDBCardBody>
                <h3 className="h5 mb-4">Programming Languages</h3>
                <div style={{ height: "300px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mockUserData.languages}
                        cx="50%"
                        cy="50%"
                        activeShape={renderActiveShape}
                        innerRadius={60}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {mockUserData.languages.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </MDBCardBody>
            </MDBCard>
          </MDBCol>

          {/* Right Column - Stats & Progress */}
          <MDBCol lg="8">
            {/* Weekly Activity */}
            <MDBCard className="profile-card mb-4">
              <MDBCardBody>
                <h3 className="h5 mb-4">Weekly Activity</h3>
                <div style={{ height: "300px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockUserData.weeklyActivity}>
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="problems"
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={{ fill: "#8884d8", strokeWidth: 2 }}
                      />
                      <Legend />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </MDBCardBody>
            </MDBCard>

            {/* Problem Categories */}
            <MDBCard className="profile-card mb-4">
              <MDBCardBody>
                <h3 className="h5 mb-4">Problem Categories</h3>
                <div style={{ height: "300px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart outerRadius={90} data={mockUserData.problemCategories}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar
                        name="Skills"
                        dataKey="score"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.6}
                      />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </MDBCardBody>
            </MDBCard>

            {/* Achievements */}
            <MDBCard className="profile-card">
              <MDBCardBody>
                <h3 className="h5 mb-4">Achievements</h3>
                <MDBRow className="g-4">
                  {mockUserData.badges.map((badge, index) => (
                    <MDBCol xs="6" md="3" key={index}>
                      <div className="badge-card text-center p-4 profile-achievement-card">
                        <div className="profile-achievement-icon mb-3">
                          <span style={{ fontSize: "2.5rem" }}>{badge.icon}</span>
                        </div>
                        <div className="badge-name">
                          {badge.name}
                        </div>
                      </div>
                    </MDBCol>
                  ))}
                </MDBRow>
              </MDBCardBody>
            </MDBCard>
          </MDBCol>
        </MDBRow>
      </MDBContainer>
    </div>
  );
};

export default UserProfile;