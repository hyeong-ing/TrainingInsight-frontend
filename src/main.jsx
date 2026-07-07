import React from 'react';
import ReactDOM from 'react-dom/client';
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import IncompletePage from './pages/IncompletePage.jsx';
import AiSearchPage from './pages/AiSearchPage.jsx';
import './styles/global.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'incomplete', element: <IncompletePage /> },
      { path: 'ai-search', element: <AiSearchPage /> },
      { path: '*', element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
