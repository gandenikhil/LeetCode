// Navbar.js
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  MDBNavbar,
  MDBContainer,
  MDBNavbarBrand,
  MDBNavbarToggler,
  MDBNavbarItem,
  MDBCollapse,
  MDBBtn,
  MDBIcon,
  MDBNavbarNav,
  MDBDropdown,
  MDBDropdownToggle,
  MDBDropdownMenu,
  MDBDropdownItem
} from 'mdb-react-ui-kit';
import { useAuth } from './AuthContext';
import { logout } from './firebase';
import './Navbar.css';

const Navbar = () => {
  const [openNavNoToggler, setOpenNavNoToggler] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();

  const closeNav = () => setOpenNavNoToggler(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const NavItem = ({ to, icon, text }) => (
    <MDBNavbarItem className='mx-2'>
      <MDBBtn 
        tag={Link} 
        to={to}
        className={`nav-btn ${location.pathname === to ? 'active' : ''}`}
        onClick={closeNav}
      >
        <MDBIcon fas icon={icon} className='nav-icon' />
        <span className='nav-text'>{text}</span>
      </MDBBtn>
    </MDBNavbarItem>
  );

  const AuthButtons = () => {
    if (currentUser) {
      return (
        <MDBDropdown>
          <MDBDropdownToggle tag='a' className='nav-link d-flex align-items-center'>
            <div className="user-avatar">
              {userProfile?.firstName?.charAt(0) || currentUser.email?.charAt(0)}
            </div>
          </MDBDropdownToggle>
          <MDBDropdownMenu>
            <MDBDropdownItem link tag={Link} to='/profile'>
              <MDBIcon fas icon='user' className='me-2' /> Profile
            </MDBDropdownItem>
            <MDBDropdownItem link tag={Link} to='/settings'>
              <MDBIcon fas icon='cog' className='me-2' /> Settings
            </MDBDropdownItem>
            <MDBDropdownItem divider />
            <MDBDropdownItem link onClick={handleLogout}>
              <MDBIcon fas icon='sign-out-alt' className='me-2' /> Logout
            </MDBDropdownItem>
          </MDBDropdownMenu>
        </MDBDropdown>
      );
    }

    return (
      <div className="nav-auth-buttons">
        <MDBBtn 
          tag={Link} 
          to="/login" 
          className='auth-btn login-btn'
          onClick={closeNav}
        >
          <MDBIcon fas icon='sign-in-alt' className='nav-icon' />
          <span className='nav-text'>Login</span>
        </MDBBtn>
        <MDBBtn 
          tag={Link} 
          to="/register" 
          className='auth-btn register-btn'
          onClick={closeNav}
        >
          <MDBIcon fas icon='user-plus' className='nav-icon' />
          <span className='nav-text'>Register</span>
        </MDBBtn>
      </div>
    );
  };

  return (
    <MDBNavbar 
      expand='lg' 
      light 
      bgColor='light' 
      className='navbar-sticky shadow-sm'
      fixed='top'
    >
      <MDBContainer fluid>
        <MDBNavbarBrand 
          tag={Link} 
          to='/' 
          className='brand-text d-flex align-items-center'
          onClick={closeNav}
        >
          <MDBIcon 
            fas 
            icon='code' 
            className='brand-icon' 
          />
          <span className='brand-name'>LeetCode</span>
        </MDBNavbarBrand>

        <MDBNavbarToggler
          type='button'
          aria-expanded='false'
          aria-label='Toggle navigation'
          onClick={() => setOpenNavNoToggler(!openNavNoToggler)}
        >
          <MDBIcon icon='bars' fas />
        </MDBNavbarToggler>

        <MDBCollapse navbar open={openNavNoToggler}>
          <MDBNavbarNav className='ms-auto d-flex align-items-center'>
            <NavItem to="/" icon="home" text="Home" />
            <NavItem to="/QuestionsPage" icon="tasks" text="Problems" />
            <NavItem to="/discuss" icon="comments" text="Discuss" />
            <AuthButtons />
          </MDBNavbarNav>
        </MDBCollapse>
      </MDBContainer>
    </MDBNavbar>
  );
};

export default Navbar;