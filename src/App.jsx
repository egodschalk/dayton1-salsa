import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Contact from './components/Contact';
import Footer from './components/Footer';


function App() {
  
  const [count, setCount] = useState(0)

  return (
    <>
      <Header />
      <main className="mx-3">
          <Outlet />
      </main >
      <Contact />
      <Footer className="footer-main"/>
    </>
  );
}

export default App
