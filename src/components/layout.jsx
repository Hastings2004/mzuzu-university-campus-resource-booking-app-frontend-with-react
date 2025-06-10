import { useContext, useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { AppContext } from "../context/appContext";
import logo from '../assets/logo.png';

export default function Layout() {
  const { user, token, setUser, setToken } = useContext(AppContext);
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode === 'true' ? true : false;
  });

  const handleLogout = async () => {
    // 1. Ask for Confirmation FIRST
    if (!window.confirm("Are you sure you want to logout?")) {
      return;
    }

    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error("Server logout failed:", response.status, await response.text());
      }
    } catch (error) {
      console.error("Network error during server logout:", error);
    }

    navigate('/'); // Redirect to login page or home page
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  // State to track if it's a small device
  const [isSmallDevice, setIsSmallDevice] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      const newIsSmallDevice = window.innerWidth <= 768;
      setIsSmallDevice(newIsSmallDevice);
      // Only set sidebar to false initially on small devices, not when resizing larger
      if (newIsSmallDevice) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Call once on mount

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

  // New function to close sidebar on link click if it's a small device
  const handleNavLinkClick = () => {
    if (isSmallDevice) {
      setIsSidebarOpen(false);
    }
  };

  // Handle the top navigation bar search (optional: redirect to /search page)
  const handleTopNavbarSearch = (e) => {
    e.preventDefault();
    const searchValue = e.target.elements.search.value;
    // You could pass the search value as state or query param
    navigate(`/search?keyword=${encodeURIComponent(searchValue)}`);
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
              <NavLink to="/" onClick={handleNavLinkClick}>
                <i className="bx bxs-dashboard"></i>
                <span className="text">Home</span>
              </NavLink>
            </li>
            {user && user.user_type === 'admin' && ( // Conditional rendering for admin dashboard
              <>
                <li>
                  <NavLink to="/statistical" onClick={handleNavLinkClick}>
                    <i className="bx bx-chart"></i>
                    <span className="text">Statistical Dashboard</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/users" onClick={handleNavLinkClick}>
                    <i className="bx bx-user"></i>
                    <span className="text">User Management</span>
                  </NavLink>
                </li>
              </>
            )}
            <li>
              <NavLink to="/profile" onClick={handleNavLinkClick}>
                <i className="bx bx-user"></i>
                <span className="text">Profile</span>
              </NavLink>
            </li>
            <li>
              {/* NEW: NavLink for the dedicated search page */}
              <NavLink to="/search" onClick={handleNavLinkClick}>
                <i className="bx bx-search-alt"></i> {/* Changed icon to search */}
                <span className="text">Resource Search</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/createResource" onClick={handleNavLinkClick}> {/* Assuming /createResource is for managing resources */}
                <i className="bx bxs-component"></i>
                <span className="text">Resources</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/booking" onClick={handleNavLinkClick}>
                <i className="bx bxs-calendar-check"></i>
                <span className="text">Bookings</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/notifications" onClick={handleNavLinkClick}>
                <i className="bx bxs-bell"></i>
                <span className="text">Notification</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/settings" onClick={handleNavLinkClick}>
                <i className="bx bxs-cog"></i>
                <span className="text">Settings</span>
              </NavLink>
            </li>
            <li onClick={handleLogout}>
              <a href="#">
                <i className="bx bxs-log-out-circle"></i>
                <span className="text">Logout</span>
              </a>
            </li>
          </ul>
        </section>

        <section id="content">
          <nav>
            <i className="bx bx-menu" onClick={toggleSidebar}></i>
            <a href="#" className="nav-link">
              Categories
            </a>
            {/* Modified: Make the top navbar search redirect to the search page */}
            <form onSubmit={handleTopNavbarSearch}>
              <div className="form-input">
                <input type="text" placeholder="Search..." name="search" id="search-field" required />
                <button type="submit" className="search-btn">
                  <i className="bx bx-search"></i>
                </button>
              </div>
            </form>
            <div></div> {/* Empty div, consider removing if not needed */}
            <input
              type="checkbox"
              id="switch-mode"
              hidden
              checked={isDarkMode}
              onChange={toggleDarkMode}
            />
            <label htmlFor="switch-mode" className="switch-mode"></label>

            <a href="/notifications" className="notification"> {/* Changed to React Router link */}
              <i className="bx bxs-bell"></i>
              <span className="num">0</span> {/* This '0' would typically be dynamic */}
            </a>
            <a href="/profile" className="profile"> {/* Changed to React Router link */}
              <img src={user?.profile_picture || logo} alt="Profile" />
            </a>
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
                      Home
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