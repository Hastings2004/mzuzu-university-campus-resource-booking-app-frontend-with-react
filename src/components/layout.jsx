import { useContext, useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom"; // Import useLocation
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

  const [initials, setInitials] = useState('');
  useEffect(() => { 
    if (user) {
      initialsUserData().then(setInitials);
    }
  }, [user]);

  async function initialsUserData() {
    const firstLetter = user?.first_name?.charAt(0).toUpperCase() || '';
    const lastLetter = user?.last_name?.charAt(0).toUpperCase() || '';

    return `${firstLetter}${lastLetter}`;
  }

  async function handleLogout(e) {
    e.preventDefault();

    if (!window.confirm("Are you sure you want to logout?")) {
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
    }
  };

  const handleTopNavbarSearch = (e) => {
    e.preventDefault();
    const searchValue = e.target.elements.search.value;
    navigate(`/search?keyword=${encodeURIComponent(searchValue)}`);
  };

  const getBreadcrumbTitle = () => {
    const path = location.pathname;

    // 1. Handle exact paths first
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
    }

    // Check for /resources/{id}
    if (path.startsWith('/resources/')) {
        const resourceId = path.substring('/resources/'.length);
        if (!isNaN(resourceId) && resourceId !== '') {
            return `Resource Details / (${resourceId})`;
        }
    }

    // Check for /bookings/{id} (if you have a single booking detail page)
    if (path.startsWith('/booking/')) {
        const bookingId = path.substring('/booking/'.length);
        if (!isNaN(bookingId) && bookingId !== '') {
            return `Booking Details / ${bookingId}`;
        }
    }

    // Check for /users/{id} (if you have a single user detail page)
    if (path.startsWith('/users/')) { 
        const userId = path.substring('/users/'.length);
        if (!isNaN(userId) && userId !== '') {
            return `User Details / ${userId}`;
        }
    }

    
    const segments = path.split('/').filter(Boolean); // Remove empty strings
    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1];
      
      return lastSegment.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    return 'Dashboard'; // Default fallback if nothing matches
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
                    {/* Home Link */}
                    <li> 
                        <NavLink
                            to="/"
                            className={({ isActive }) => (isActive ? "active" : "")}
                           
                        >
                            <i className="bx bxs-dashboard"></i>
                            <span className="text">Home</span>
                        </NavLink>
                    </li>
                    {user && user.user_type != 'admin' && (
                    <li> 
                        <NavLink
                            to="/reportIssueForm"
                            className={({ isActive }) => (isActive ? "active" : "")}
                        >
                            <i className="bx bxs-dashboard"></i>
                            <span className="text">Report issue</span>
                        </NavLink>
                    </li>
                    )}
                    {user && user.user_type === 'admin' && (
                        <>
                           
                            <li>
                                <NavLink
                                    to="/statistical"
                                    className={({ isActive }) => (isActive ? "active" : "")}
                                    // onClick={handleNavLinkClick}
                                >
                                    <i className="bx bx-chart"></i>
                                    <span className="text">Statistical Dashboard</span>
                                </NavLink>
                            </li>
                            {/* User Management */}
                            <li>
                                <NavLink
                                    to="/timetable"
                                    className={({ isActive }) => (isActive ? "active" : "")}
                                    // onClick={handleNavLinkClick}
                                >
                                    <i className="bx bx-chart"></i>
                                    <span className="text">Time table</span>
                                </NavLink>
                            </li>
                            <li>
                                <NavLink
                                    to="/users"
                                    className={({ isActive }) => (isActive ? "active" : "")}
                                    // onClick={handleNavLinkClick}
                                >                   
                                    <i className='bx bx-user-plus'></i> 
                                    <span className="text">User Management</span>
                                </NavLink>
                            </li>
                          
                            <li>
                                <NavLink
                                    to="/resource-report"
                                    className={({ isActive }) => (isActive ? "active" : "")}
                                   
                                >
                                    <i className="bx bx-pulse"></i>
                                    <span className="text">Reports</span>
                                </NavLink>
                            </li>
                             <li>
                                <NavLink
                                    to="/issue-management"
                                    className={({ isActive }) => (isActive ? "active" : "")}
                                   
                                >
                                    <i className="bx bx-pulse"></i>
                                    <span className="text">Issue management</span>
                                </NavLink>
                            </li>
                        </>
                    )}
                    {/* Profile */}
                    <li>
                        <NavLink
                            to="/profile"
                            className={({ isActive }) => (isActive ? "active" : "")}
                            // onClick={handleNavLinkClick}
                        >
                            <i className="bx bx-user"></i>
                            <span className="text">Profile</span>
                        </NavLink>
                    </li>
                    {/* Searching */}
                    <li>
                        <NavLink
                            to="/search"
                            className={({ isActive }) => (isActive ? "active" : "")}
                            // onClick={handleNavLinkClick}
                        >
                            <i className="bx bx-search-alt"></i>
                            <span className="text">Searching</span>
                        </NavLink>
                    </li>
                    {/* Resources */}
                    <li>
                        <NavLink
                            to="/createResource"
                            className={({ isActive }) => (isActive ? "active" : "")}
                            // onClick={handleNavLinkClick}
                        >
                            <i className="bx bxs-component"></i>
                            <span className="text">Resources</span>
                        </NavLink>
                    </li>
                    {/* Bookings */}
                    <li>
                        <NavLink
                            to="/booking"
                            className={({ isActive }) => (isActive ? "active" : "")}
                            // onClick={handleNavLinkClick}
                        >
                            <i className="bx bxs-calendar-check"></i>
                            <span className="text">Bookings</span>
                        </NavLink>
                    </li>
                    
                    {/* Settings */}
                    <li>
                        <NavLink
                            to="/settings"
                            className={({ isActive }) => (isActive ? "active" : "")}
                            // onClick={handleNavLinkClick}
                        >
                            <i className="bx bxs-cog"></i>
                            <span className="text">Settings</span>
                        </NavLink>
                    </li>
                    {/* Logout Button */}
                    <li>
                        <button
                            onClick={handleLogout}
                            className="logout-btn"
                            style={{
                                background: 'none',
                                border: 'none',
                                width: '100%',
                                textAlign: 'left',
                                padding: '12px 16px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                color: 'inherit',
                                fontSize: 'inherit'
                            }}
                        >
                            <i className="bx bxs-log-out-circle"></i>
                            <span className="text">Logout</span>
                        </button>
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

              <a href="/notifications" className="notification">
                <i className="bx bxs-bell"></i>
                <span className="num">0</span>
              </a>
              <NavLink to="/profile" className="profile">
                <h1>{initials}</h1>
              </NavLink>
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