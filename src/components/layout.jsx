import { useContext, useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { AppContext } from "../context/appContext";
import logo from '../assets/logo.png';

export default function Layout() {
  const { user, token, setUser, setToken } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation(); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode === 'true' ? true : false;
  });
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const [initials, setInitials] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => { 
    if (user) {
      initialsUserData().then(setInitials);
    }
  }, [user]);

  useEffect(() => {
    if (!user || !token) return;

    const fetchUnreadCount = async () => {
      try {
        const res = await fetch('/api/notifications', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await res.json();
        if (res.ok) {
          const notifications = Array.isArray(data) ? data : (data.notifications || []);
          const unread = notifications.filter(n => !n.read_at).length;
          setUnreadCount(unread);
        } else {
          setUnreadCount(0);
        }
      } catch (err) {
        setUnreadCount(0);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000); // Optional: refresh every 60s
    return () => clearInterval(interval);
  }, [user, token]);

  async function initialsUserData() {
    const firstLetter = user?.first_name?.charAt(0).toUpperCase() || '';
    const lastLetter = user?.last_name?.charAt(0).toUpperCase() || '';
    return `${firstLetter}${lastLetter}`;
  }

  async function handleLogout(e) {
    e.preventDefault();

    // Show confirmation dialog
    const isConfirmed = window.confirm("Are you sure you want to logout?");
    if (!isConfirmed) {
      return;
    }

    try {
      const res = await fetch('/api/logout', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(null);
      setToken(null);
      localStorage.removeItem("token");

      if (res.ok) {
        const data = await res.json();
        console.log('Logout successful:', data);
      } else {
        console.log('Server logout failed, but local logout completed');
      }

      navigate("/login");

    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      navigate("/login");
    }
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(prev => !prev);
  };

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileDropdownOpen && !event.target.closest('.profile-dropdown-container')) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  const [isSmallDevice, setIsSmallDevice] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      const newIsSmallDevice = window.innerWidth <= 768;
      setIsSmallDevice(newIsSmallDevice);
      if (newIsSmallDevice) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [isDarkMode]);

  const handleNavLinkClick = () => {
    if (isSmallDevice) {
      setIsSidebarOpen(false);
      setIsProfileDropdownOpen(false);
    }
  };

  const handleTopNavbarSearch = (e) => {
    e.preventDefault();
    const searchValue = e.target.elements.search.value;
    navigate(`/search?keyword=${encodeURIComponent(searchValue)}`);
  };

  const getBreadcrumbTitle = () => {
    const path = location.pathname;

    switch (path) {
      case '/': return 'Home';
      case '/statistical': return 'Statistical Dashboard';
      case '/users': return 'User Management';
      case '/profile': return 'Profile';
      case '/search': return 'Resource Search';
      case '/createResource': return 'Resources'; 
      case '/booking': return 'Bookings'; 
      case '/notifications': return 'Notifications';
      case '/settings': return 'Settings';
      case '/resource-report': return 'Resource Utilization Report';
      case '/timetable': return 'Time Table';
      case '/reportIssueForm': return 'Report Issue';
      case '/issue-management': return 'Issue Management';
    }

    if (path.startsWith('/resources/')) {
        const resourceId = path.substring('/resources/'.length);
        if (!isNaN(resourceId) && resourceId !== '') {
            return `Resource Details / (${resourceId})`;
        }
    }

    if (path.startsWith('/booking/')) {
        const bookingId = path.substring('/booking/'.length);
        if (!isNaN(bookingId) && bookingId !== '') {
            return `Booking Details / ${bookingId}`;
        }
    }

    if (path.startsWith('/users/')) { 
        const userId = path.substring('/users/'.length);
        if (!isNaN(userId) && userId !== '') {
            return `User Details / ${userId}`;
        }
    }
    
    const segments = path.split('/').filter(Boolean);
    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1];
      return lastSegment.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    return 'Dashboard';
  };

  return (
    <>
      <div className={`dashboard-container ${isSidebarOpen ? "" : "sidebar-closed"}`}>
        <section id="sidebar" className={isSidebarOpen ? "" : "hide"}>
          <div className="brand">
            <center>
              <img src={logo} alt="logo" width={70} height={70} />
              <h3>Mzuzu University</h3>
              <p className="text">Resource Booking App</p>
            </center>
          </div>

          <ul className="side-menu top">
            <li> 
              <NavLink
                to="/"
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={handleNavLinkClick}
              >
                <i className="bx bxs-dashboard"></i>
                <span className="text">Home</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/booking"
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={handleNavLinkClick}
              >
                <i className="bx bxs-calendar-check"></i>
                <span className="text">Bookings</span>
              </NavLink>
            </li>
            
            {user && user.user_type !== 'admin' && (
              <li> 
                <NavLink
                  to="/reportIssueForm"
                  className={({ isActive }) => (isActive ? "active" : "")}
                  onClick={handleNavLinkClick}
                >
                  <i className="bx bx-folder-open"></i>
                  <span className="text">Report issue</span>
                </NavLink>
              </li>
            )}
            <li>
              <NavLink
                to="/createResource"
                className={({ isActive }) => {
                  const path = location.pathname;
                  const isResourcePath = path.startsWith('/resources/') || path === '/createResource' || path === '/createResource/';
                  return (isActive || isResourcePath) ? "active" : "";
                }}
                onClick={handleNavLinkClick}
              >
                <i className="bx bxs-component"></i>
                <span className="text">Resources</span>
              </NavLink>
            </li>
            
            {user && user.user_type === 'admin' && (
              <>
                <li>
                  <NavLink
                    to="/statistical"
                    className={({ isActive }) => (isActive ? "active" : "")}
                    onClick={handleNavLinkClick}
                  >
                    <i className="bx bx-chart"></i>
                    <span className="text">Statistical Dashboard</span>
                  </NavLink>
                </li>
                
                <li>
                  <NavLink
                    to="/timetable"
                    className={({ isActive }) => (isActive ? "active" : "")}
                    onClick={handleNavLinkClick}
                  >
                    <i className="bx bx-timer"></i>
                    <span className="text">Time table</span>
                  </NavLink>
                </li>
                
                <li>
                  <NavLink
                    to="/users"
                    className={({ isActive }) => (isActive ? "active" : "")}
                    onClick={handleNavLinkClick}
                  >                   
                    <i className='bx bx-group'></i> 
                    <span className="text">User Management</span>
                  </NavLink>
                </li>
              
                <li>
                  <NavLink
                    to="/resource-report"
                    className={({ isActive }) => (isActive ? "active" : "")}
                    onClick={handleNavLinkClick}
                  >
                    <i className="bx bx-folder-open"></i>
                    <span className="text">Reports</span>
                  </NavLink>
                </li>
                
                <li>
                  <NavLink
                    to="/issue-management"
                    className={({ isActive }) => (isActive ? "active" : "")}
                    onClick={handleNavLinkClick}
                  >
                    <i className="bx bx-pulse"></i>
                    <span className="text">Issue management</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/news"
                    className={({ isActive }) => (isActive ? "active" : "")}
                    onClick={handleNavLinkClick}
                  >
                    <i className="bx bx-message-dots"></i>
                    <span className="text">News</span>
                  </NavLink>
                </li>
              </>
            )}
            
            <li>
              <NavLink
                to="/search"
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={handleNavLinkClick}
              >
                <i className="bx bx-search-alt"></i>
                <span className="text">Searching</span>
              </NavLink>
            </li>
            
            <li>
              <NavLink
                to="/settings"
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={handleNavLinkClick}
              >
                <i className="bx bxs-cog"></i>
                <span className="text">Settings</span>
              </NavLink>
            </li>
          </ul>
        </section>

        <section id="content">
          <nav>
            <i className="bx bx-menu" onClick={toggleSidebar}></i>
            
            <form onSubmit={handleTopNavbarSearch}>
              <div className="form-input">
                <input type="text" placeholder="Search..." name="search" id="search-field" required />
                <button type="submit" className="search-btn">
                  <i className="bx bx-search"></i>
                </button>
              </div>
            </form>
            
            <div className="left-icons">
              <input
                type="checkbox"
                id="switch-mode"
                hidden
                checked={isDarkMode}
                onChange={toggleDarkMode}
              />
              <label htmlFor="switch-mode" className="switch-mode"></label>

              <a href="/notifications" className="notification" onClick={handleNavLinkClick}>
                <i className="bx bxs-bell"></i>
                {unreadCount > 0 && <span className="num">{unreadCount}</span>}
              </a>

              {/* Enhanced Profile Dropdown */}
              <div className="profile-dropdown-container">
                <div className="profile" onClick={toggleProfileDropdown}>
                  <h1>{initials}</h1>
                </div>
                
                {isProfileDropdownOpen && (
                  <div className="profile-dropdown">
                    {/* User Info Header */}
                    <div className="profile-dropdown-header">
                      <h4>{user?.first_name} {user?.last_name}</h4>
                      <p>{user?.user_type || 'User'}</p>
                    </div>
                    
                    {/* Profile Link */}
                    <NavLink 
                      to="/profile" 
                      onClick={() => { 
                        handleNavLinkClick(); 
                        setIsProfileDropdownOpen(false); 
                      }}
                    >
                      <i className="bx bx-user"></i>
                      View Profile
                    </NavLink>
                    
                    {/* Account Settings */}
                    <NavLink 
                      to="/settings" 
                      onClick={() => { 
                        handleNavLinkClick(); 
                        setIsProfileDropdownOpen(false); 
                      }}
                    >
                      <i className="bx bx-cog"></i>
                      Account Settings
                    </NavLink>
                    
                    {/* Notifications */}
                    <NavLink 
                      to="/notifications" 
                      onClick={() => { 
                        handleNavLinkClick(); 
                        setIsProfileDropdownOpen(false); 
                      }}
                    >
                      <i className="bx bx-bell"></i>
                      Notifications
                    </NavLink>
                    
                    {/* Logout Button */}
                    <button 
                      onClick={(e) => { 
                        handleLogout(e); 
                        setIsProfileDropdownOpen(false); 
                      }}
                    >
                      <i className="bx bxs-log-out-circle"></i>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </nav>

          <main>
            <div className="head-title">
              <div className="left">
                <h1>Welcome {user ? (user.user_type === 'admin' ? `Admin ${user.first_name}` : user.first_name) : 'Guest'}</h1>
                <br />
                <ul className="breadcrumb">
                  <li>
                    <a href="#">Dashboard</a> 
                  </li>
                  <li>
                    <i className="bx bx-chevron-right"></i>
                  </li>
                  <li>
                    <a className="active" href="#">
                      {getBreadcrumbTitle()}
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <Outlet />
          </main>
        </section>
      </div>
    </>
  );
}