import { useContext, useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { AppContext } from "../context/appContext";
import logo from '../assets/logo.png';
import moment from 'moment';

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
  
  const isAdmin = user && user.user_type === 'admin';
  const resourceTypes = [
    'Meeting Room', 'Classrooms', 'Vehicle', 'ICT LABS', 'Auditorium',
  ];
  const [searchType, setSearchType] = useState('resources');
  const [keyword, setKeyword] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [userId, setUserId] = useState('');
  const [searchResults, setSearchResults] = useState({ resources: [], bookings: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchDebounceTimeout, setSearchDebounceTimeout] = useState(null);
  const [canGoBack, setCanGoBack] = useState(false);

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

  useEffect(() => {
    if (!isAdmin && searchType === 'users') {
      setSearchType('resources');
    }
  }, [isAdmin, searchType]);

  // Clear search results when navigating to different pages
  useEffect(() => {
    setSearchResults({ resources: [], bookings: [], users: [] });
    setSearchPerformed(false);
    setError(null);
    setShowAdvanced(false);
  }, [location.pathname]);

  // Track if we can go back
  useEffect(() => {
    // Check if we're not on the home page or if there's history
    const isNotHome = location.pathname !== '/';
    const hasHistory = window.history.length > 1;
    setCanGoBack(isNotHome && hasHistory);
  }, [location.pathname]);

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

  const handleBackButton = () => {
    if (canGoBack) {
      navigate(-1);
    } else {
      // If we can't go back, go to home page
      navigate('/');
    }
  };

  const handleTopNavbarSearch = (e) => {
    e.preventDefault();
    const searchValue = e.target.elements.search.value;
    setKeyword(searchValue);
    performSearch(searchValue);
    setShowAdvanced(false); // Hide advanced on simple search
  };

  const performSearch = async (kw) => {
    if (!token) {
      setError('Authentication token missing.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setSearchResults({ resources: [], bookings: [], users: [] });
    setSearchPerformed(true);
    const queryParams = new URLSearchParams();
    if ((kw ?? keyword).trim()) queryParams.append('query', (kw ?? keyword).trim());
    if (searchType === 'resources' && resourceType) queryParams.append('resource_type', resourceType);
    if (searchType === 'bookings' && startTime) queryParams.append('start_time', startTime);
    if (searchType === 'bookings' && endTime) queryParams.append('end_time', endTime);
    if (isAdmin && userId) queryParams.append('user_id', userId);
    const hasSearchParams = (kw ?? keyword).trim() || resourceType || startTime || endTime || userId;
    if (!hasSearchParams && searchType !== 'resources') {
      setLoading(false);
      setSearchResults({ resources: [], bookings: [], users: [] });
      return;
    }
    try {
      const response = await fetch(`/api/search/global?${queryParams.toString()}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (response.ok) {
        if (data.results_by_type) {
          setSearchResults(data.results_by_type);
        } else {
          setError(data.message || 'Received unexpected data format for global search.');
        }
      } else {
        setError(data.message || 'Failed to perform search.');
      }
    } catch (err) {
      setError('Network error or server unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setKeyword('');
    setResourceType('');
    setStartTime('');
    setEndTime('');
    setUserId('');
    setSearchResults({ resources: [], bookings: [], users: [] });
    setError(null);
    setSearchPerformed(false);
    setSearchType('resources');
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

  useEffect(() => {
    if (!showAdvanced) return; // Only auto-search in advanced mode
    if (searchDebounceTimeout) clearTimeout(searchDebounceTimeout);
    const timeout = setTimeout(() => {
      if (keyword || resourceType || startTime || endTime || userId) {
        performSearch();
      }
    }, 400); // 400ms debounce
    setSearchDebounceTimeout(timeout);
    return () => clearTimeout(timeout);
  }, [keyword, searchType, resourceType, startTime, endTime, userId, showAdvanced]);

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
                className={({ isActive }) => {
                  const path = location.pathname;
                  const isBookingPath = path.startsWith('/booking/') || path === '/booking/:id' || path === '/bookings/:id/edit';
                  return (isActive || isBookingPath) ? "active" : "";
                }}
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
                to="/viewResource"
                className={({ isActive }) => {
                  const path = location.pathname;
                  const isResourcePath = path.startsWith('/resources/') 
                  || path === '/createResource' || path === '/createResource/' 
                  || path === '/resources/edit/' || path === '/resources/edit'
                  || path === '/resources/edit/:id' || path === '/resources/edit/:id/'
                  || path === '/resources/:id' || path === '/resources/:id/'
                  || path === '/resources/:id/edit' || path === '/resources/:id/edit/'
                  || path === '/resources/:id/edit/:id' || path === '/resources/:id/edit/:id/'
                  || path === '/resources/:id/edit/:id/edit' || path === '/resources/:id/edit/:id/edit/'
                  || path === '/resources/:id/edit/:id/edit/:id' || path === '/resources/:id/edit/:id/edit/:id/'
                  || path === '/resources/:id/edit/:id/edit/:id/edit' || path === '/resources/:id/edit/:id/edit/:id/edit/'
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
                <button type="button" className="advanced-btn" style={{marginLeft:'6px'}} onClick={()=>setShowAdvanced(v=>!v)}>
                  {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
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
                 {/* Back Button */}
            <button
              type="button"
              className="back-btn"
              onClick={handleBackButton}
              title={canGoBack ? "Go Back" : "Go Home"}
              style={{marginLeft:'1rem', marginTop:'1rem', marginBottom:'1rem', backgroundColor:'green', color:'white', border:'none', padding:'0.5rem 1rem', borderRadius:'0.25rem', cursor:'pointer'}}
            >
              <i className={canGoBack ? "bx bx-arrow-back" : "bx bxs-home"}></i>
              <span className="text">{canGoBack ? 'Back' : 'Home'}</span>
            </button>
              </div>
            </div>
            {/* ADVANCED SEARCH FILTERS */}
            {showAdvanced && (
              <div className="search-form" style={{marginBottom:'1rem', background:'#f9f9f9', padding:'1rem', borderRadius:'8px'}}>
                <div className="form-group">
                  <label htmlFor="searchType">Search For:</label>
                  <select id="searchType" value={searchType} onChange={e=>{setSearchType(e.target.value); setResourceType(''); setStartTime(''); setEndTime(''); setUserId('');}}>
                    <option value="resources">Resources</option>
                    <option value="bookings">Bookings</option>
                    {isAdmin && <option value="users">Users</option>}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="keyword">Keyword:</label>
                  <input type="text" id="keyword" value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder={searchType==='resources'?"e.g., Room A, ICT LAB 1":searchType==='bookings'?"e.g., MZUNI-RBA-001, Meeting, John":searchType==='users'?"e.g., John Doe, john@example.com":""} />
                </div>
                {searchType==='resources' && (
                  <div className="form-group">
                    <label htmlFor="resourceType">Resource Type:</label>
                    <select id="resourceType" value={resourceType} onChange={e=>setResourceType(e.target.value)}>
                      <option value="">All Types</option>
                      {resourceTypes.map(rType=>(<option key={rType} value={rType}>{rType}</option>))}
                    </select>
                  </div>
                )}
                {searchType==='bookings' && (
                  <>
                    <div className="form-group">
                      <label htmlFor="startTime">Start Time:</label>
                      <input type="datetime-local" id="startTime" value={startTime} onChange={e=>setStartTime(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="endTime">End Time:</label>
                      <input type="datetime-local" id="endTime" value={endTime} onChange={e=>setEndTime(e.target.value)} />
                    </div>
                  </>
                )}
                {isAdmin && (searchType==='bookings'||searchType==='users') && (
                  <div className="form-group">
                    <label htmlFor="userId">User ID (Admin):</label>
                    <input type="text" id="userId" value={userId} onChange={e=>setUserId(e.target.value)} placeholder="Optional: Enter User ID" />
                  </div>
                )}
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={handleReset} disabled={loading}>Reset</button>
                  <button type="button" className="btn btn-primary" onClick={()=>performSearch()}>Search</button>
                </div>
              </div>
            )}
            {/* SEARCH RESULTS */}
            {(searchPerformed || loading) && (
              <div className="search-results" style={{marginBottom:'2rem'}}>
                <h3>Search Results</h3>
                {error && <p className="error-message">{error}</p>}
                {loading && <p>Loading results...</p>}
                {!loading && searchPerformed && searchResults.resources.length===0 && searchResults.bookings.length===0 && searchResults.users.length===0 && !error && (
                  <p>No results found matching your criteria.</p>
                )}
                {!loading && searchPerformed && (
                  <>
                    {searchResults.resources.length>0 && (
                      <div className="results-section">
                        <h4>Resources ({searchResults.resources.length})</h4>
                        <ul className="resource-list">
                          {searchResults.resources.map(resource=>(
                            <li key={`resource-${resource.id}`} className="resource-item">
                              <h5>{resource.name} ({resource.category})</h5>
                              <p><strong>Location:</strong> {resource.location || 'N/A'}</p>
                              <p><strong>Capacity:</strong> {resource.capacity || 'N/A'}</p>
                              <p><strong>Status:</strong> {resource.status}</p>
                              <p className="text-sm">{resource.description}</p>
                              <NavLink to={`/resources/${resource.id}`} className="text-blue-500 block">View Details</NavLink>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {searchResults.bookings.length>0 && (
                      <div className="results-section">
                        <h4>Bookings ({searchResults.bookings.length})</h4>
                        <ul className="booking-list">
                          {searchResults.bookings.map(booking=>(
                            <li key={`booking-${booking.id}`} className="booking-item">
                              <h5>Ref: {booking.booking_reference}</h5>
                              <p><strong>Resource:</strong> {booking.resource?.name || 'N/A'} ({booking.resource?.type || 'N/A'})</p>
                              <p><strong>Purpose:</strong> {booking.purpose}</p>
                              <p><strong>Status:</strong> {booking.status}</p>
                              <p><strong>Time:</strong> {moment(booking.start_time).format('YYYY-MM-DD HH:mm')} - {moment(booking.end_time).format('YYYY-MM-DD HH:mm')}</p>
                              {isAdmin && booking.user && (
                                <p><strong>Booked By:</strong> {booking.user.first_name} {booking.user.last_name} ({booking.user.email})</p>
                              )}
                              <NavLink to={`/booking/${booking.id}`} className="text-blue-500 block">View Details</NavLink>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {isAdmin && searchResults.users.length>0 && (
                      <div className="results-section">
                        <h4>Users ({searchResults.users.length})</h4>
                        <ul className="user-list">
                          {searchResults.users.map(userResult=>(
                            <li key={`user-${userResult.id}`} className="user-item">
                              <h5>{userResult.first_name} {userResult.last_name}</h5>
                              <p><strong>Email:</strong> {userResult.email}</p>
                              <p><strong>User Type:</strong> {userResult.user_type}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {!(searchPerformed || loading) && <Outlet />}
          </main>
        </section>
      </div>
    </>
  );
}