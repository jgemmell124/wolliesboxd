import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import HomePage from './pages/Home';
import NotFound from './pages/NotFound';
import Navigation from './components/Navigation';
import LoginPage from './pages/LoginPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route exact path='/login' element={<LoginPage />}/>
        <Route exact path='/signup' element={<h1>Sign up here</h1>}/>
        <Route path='*' element={<MainContent />} />
      </Routes>
    </BrowserRouter>
  );
}

const MainContent = () => {
  return (
    <Navigation>
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='*' element={<NotFound />} />
      </Routes>
    </Navigation>
  );
};

export default App;
