import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './App.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import IncompletePage from './pages/IncompletePage.jsx';
import AiSearchPage from './pages/AiSearchPage.jsx';
import { queryClient } from './queryClient.js';
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
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
      <Toaster
        className="training-toaster"
        closeButton
        duration={3000}
        position="bottom-right"
        richColors
      />
    </QueryClientProvider>
  </React.StrictMode>,
);
