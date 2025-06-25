import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './components/home';
import Layout from './components/layout';
import Login from './auth/login';
import Register from './auth/register';
import { useContext } from 'react';
import { AppContext } from './context/appContext';
import View from './resources/view';
import MyBookings from './Bookings/showsBookings';
import ViewBooking from './Bookings/viewBooking';
import UpdateBooking from './Bookings/updateBooking';
import UpdateResource from './resources/update';
import ShowProfile from './profile/showProfile';
import CreateResource from './resources/create';
import ShowResource from './resources/showResource';
import Statistical from './admin/statistical';
import UserManagement from './admin/userManagement';
import EditUser from './admin/editUser';
import Settings from './components/settings';
import Notifications from './components/notifications';
import GlobalSearch from './components/search';
import ResourceUtilizationReport from './admin/ResourceUtilizationReport';
import TimetableImport from './components/TimetableImport';
import IssueManagementDashboard from './admin/IssueManagementDashboard';
import ReportIssueForm from './components/ReportIssueForm';
import NewsCreate from './admin/news';

import DocumentViewPlaceholder from './components/DocumentViewPlaceholder';

export default function App() {
  const { user } = useContext(AppContext);

  return (
    <BrowserRouter>
      <Routes>
        
        <Route path="/login" element={user ? <Home /> : <Login />} />
        <Route path="/register" element={user ? <Home /> : <Register />} />
        <Route path="/document-view/:id" element={<DocumentViewPlaceholder />} />
        <Route path="/" element={user ? <Layout /> : <Login />}>
          
          <Route index element={user ? <Home /> : <Login />} /> 
          <Route path="createResource" element={<CreateResource />} />
          <Route path="resources/:id" element={<View />} />
          <Route path="resources/edit/:id" element={<UpdateResource />} />
          <Route path="bookings/:id/edit" element={<UpdateBooking />} /> 
          <Route path='profile' element={<ShowProfile />} />
          <Route path='statistical' element={<Statistical />}/>
          <Route path="users" element={<UserManagement />} />
          <Route path="users/edit/:id" element={<EditUser />} />
          <Route path="booking" element={<MyBookings />}/>
          <Route path="booking/:id" element={<ViewBooking />} />
          <Route path="search" element={<GlobalSearch />} />
          <Route path="settings" element={<Settings />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path='resource-report' element={<ResourceUtilizationReport />} />
          <Route path='timetable' element={<TimetableImport />} />
          <Route path='issue-management' element={<IssueManagementDashboard />} />
          <Route path='reportIssueForm' element={< ReportIssueForm />} />
          <Route path='news' element={ <NewsCreate /> } />
          <Route path="viewResource" element={<ShowResource />} />
        </Route>

        
      </Routes>
    </BrowserRouter>
  );
}