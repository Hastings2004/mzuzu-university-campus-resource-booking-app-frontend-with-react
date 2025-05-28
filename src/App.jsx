import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './components/home';
import Layout from './components/layout';
import Login from './auth/login';
import Register from './auth/register';
import { useContext } from 'react';
import { AppContext } from './context/appContext';
import Create from './resources/create';
import Update from './resources/update';
import View from './resources/view';
import Drop from './resources/testings'; 
import MyBookings from './Bookings/showsBookings';
import ViewBooking from './Bookings/viewBooking';
export default function App() {
  const { user } = useContext(AppContext);

  return (
    <BrowserRouter>
      <Routes>
        
        <Route path="/login" element={user ? <Home /> : <Login />} />
        <Route path="/register" element={user ? <Home /> : <Register />} />

       
        <Route path="/" element={user ? <Layout /> : <Login />}>
          
          <Route index element={user ? <Home /> : <Login />} /> 
          <Route path="create" element={<Create />} />
          <Route path="new" element={<Drop />} />
          <Route path="resources/:id" element={<View />} />
          <Route path="resources/update/:id" element={<Update />} />
          <Route path="booking" element={<MyBookings />}/>
          <Route path="booking/:id" element={<ViewBooking />} />
        </Route>

        
      </Routes>
    </BrowserRouter>
  );
}