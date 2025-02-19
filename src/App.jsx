import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import './App.css';
// import Nav from './components/NavTabs';
import Header from './components/Header';
// import Footer from './components/Footer';

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Header />
      {/* <Nav /> */}
      <main className="mx-3">
          <Outlet />
      </main >
      {/* <Footer className="footer-main"/> */}
    </>
  );
}

export default App
