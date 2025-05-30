import { useContext, useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom"; // Import NavLink
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

  async function handleLogout(e) {
    e.preventDefault();

    const response = await fetch("/api/logout", {
      method: "post",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    console.log(data);

    if (response.ok) {
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      navigate("/");
    }
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
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
            {/* Use NavLink for active class behavior */}
            <li> {/* Remove the 'active' class here, NavLink handles it */}
              <NavLink to="/">
                <i className="bx bxs-dashboard"></i>
                <span className="text">Home</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/profile">
                <i className="bx bx-user"></i>
                <span className="text">Profile</span>
              </NavLink>
            </li>
            <li>
              {/* If your / route (Home) also acts as the Resources page, keep it as / */}
              {/* If Resources has its own page, change the 'to' prop accordingly */}
              <NavLink to="/"> {/* Assuming / is also the Resources page */}
                <i className="bx bxs-component"></i>
                <span className="text">Resources</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/booking">
                <i className="bx bxs-calendar-check"></i>
                <span className="text">Bookings</span>
              </NavLink>
            </li>

            <li>
              {/* Assuming /notifications is the route for notifications */}
              <NavLink to="/notifications">
                <i className="bx bxs-bell"></i>
                <span className="text">Notification</span>
              </NavLink>
            </li>

            <li>
              <NavLink to="/settings">
                <i className="bx bxs-cog"></i>
                <span className="text">Settings</span>
              </NavLink>
            </li>
            <li onClick={handleLogout}>
              {/* Logout is not a navigation link, so Link/NavLink isn't ideal here. */}
              {/* Using a simple <a> tag or a button for logout is often better practice. */}
              <a href="#"> {/* Using href="#" to prevent default navigation */}
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
            <form>
              <div className="form-input">
                <input type="text" placeholder="Search..." name="search" id="search-field" required />
                <button type="submit" className="search-btn" name="search-btn">
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

            <a href="notification-admin.php" className="notification">
              <i className="bx bxs-bell"></i>
              <span className="num">0</span>
            </a>
            <a href="profile-admin.php" className="profile">
              <img src={user?.profile_picture || logo} alt="Profile" /> {/* Use user profile picture if available */}
            </a>
          </nav>

          <main>
            <div className="head-title">
              <div className="left">
                {/* Optional chaining for user properties */}
                <h1>Welcome {user?.first_name}</h1>

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