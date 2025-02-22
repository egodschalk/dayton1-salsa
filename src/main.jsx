import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import App from './App.jsx';
import About from './pages/About';
import Classes from './pages/Classes';
import Events from './pages/Events';
import Instructors from './pages/Instructors';
import FAQs from './pages/FAQs';


const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <About />,
      },
      {
        path: '/Classes',
        element: <Classes />,
      },
      {
        path: '/Events',
        element: <Events />,
      },
      {
        path: '/Instructors',
        element: <Instructors />,
      },
      {
        path: '/FAQs',
        element: <FAQs />,
      },
    ],
  },
]);

createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />
)