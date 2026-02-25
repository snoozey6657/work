// App.js — top-level routing
import { Routes, Route } from 'react-router-dom';
import Navbar    from './components/Navbar';
import Footer    from './components/Footer';
import HomePage  from './pages/HomePage';
import ListingPage from './pages/ListingPage';
import DetailPage  from './pages/DetailPage';

function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/"            element={<HomePage />} />
          <Route path="/projects"    element={<ListingPage />} />
          <Route path="/projects/:id" element={<DetailPage />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default App;
