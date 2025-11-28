import React from 'react';
import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import RegisterPage from './(site)/register/registerPage';
import LoginPage from './(site)/login/loginPage';
import HomePage from './(site)/home/homePage';
import CreateBlogPage from './(site)/blog/createBlogPage';
import SearchBlogPage from './(site)/blog/searchBlogPage';
import ViewBlogPage from './(site)/blog/viewBlogPage';
import Phase3Page from './(site)/phase3/phase3Page';



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/blog/create" element={<CreateBlogPage />} />
        <Route path="/blog/search" element={<SearchBlogPage />} />
        <Route path="/blog/:blogId" element={<ViewBlogPage />} />
        <Route path="/phase3" element={<Phase3Page />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
