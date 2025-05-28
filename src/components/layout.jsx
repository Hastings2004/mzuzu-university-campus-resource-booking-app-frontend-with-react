import { useContext, useState, useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { AppContext } from "../context/appContext";
import logo from '../assets/logo.png'; 


export default function Layout() {
  const { user, token, setUser, setToken } = useContext(AppContext);
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // State to control sidebar visibility
  
  // State for dark mode, initialized from localStorage or default to false
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

  // Toggle sidebar for smaller screens
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  // Close sidebar by default on smaller screens when component mounts
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) { // Adjust breakpoint as needed
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Call once on mount to set initial state

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Effect to apply dark mode class to body and save preference to localStorage
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [isDarkMode]); // Rerun this effect whenever isDarkMode changes

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
            <li className="active">
              <Link to="/"> 
                <i className="bx bxs-dashboard"></i> {/* Correct Boxicon for dashboard/home */}
                <span className="text">Home</span>
              </Link>
            </li>
            <li>
              <Link to="/profile">
                <i className="bx bx-user"></i>
                <span className="text">Profile</span>
              </Link>
            </li>
            <li>
              <Link to="/">
                <i className="bx bxs-component"></i> {/* Changed to a more resource-like icon */}
                <span className="text">Resources</span>
              </Link>
            </li>
            <li>
              <Link to="/booking">
                <i className="bx bxs-calendar-check"></i> {/* Changed to a more booking-like icon */}
                <span className="text">Bookings</span>
              </Link>
            </li>
            
            <li>
              <Link to="/">
                <i className="bx bxs-bell"></i>
                <span className="text">Notification</span>
              </Link>
            </li>
           
             <li>
              <Link to="/settings">
                <i className="bx bxs-cog"></i>
                <span className="text">Settings</span>
              </Link>
            </li>
            <li onClick={handleLogout} >
              <Link to="#"> {/* Use to="#" or just <a> if not navigating */}
                <i className="bx bxs-log-out-circle"></i>
                <span className="text">Logout</span>
              </Link>
            </li>
          
          </ul>
         
           
            
        </section>

        <section id="content">
          <nav>
            <i className="bx bx-menu" onClick={toggleSidebar}></i> 
            <a href="#" className="nav-link">
              Categories
            </a>
            <form >
              <div className="form-input">
                <input type="text" placeholder="Search..." name="search" id="search-field" required />
                <button type="submit" className="search-btn" name="search-btn">
                  <i className="bx bx-search"></i>
                </button>
              </div>
            </form>
            {/* The switch for dark mode */}
            <div>
              
            </div>
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
              <img src={logo} alt="Profile" />
            </a>
          </nav>

          <main>
            <div className="head-title">
              <div className="left">
                
                  <h1>Welcome {user.first_name}</h1>
                
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