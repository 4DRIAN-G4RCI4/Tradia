import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import Disclaimer from "./components/Disclaimer";
import Footer from "./components/Footer";
import DashboardPage from "./pages/DashboardPage";
import NewsPage from "./pages/NewsPage";

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="app">
      <NavBar onSearch={setSearchQuery} />

      <Routes>
        <Route path="/" element={<DashboardPage searchQuery={searchQuery} />} />
        <Route path="/noticias" element={<NewsPage />} />
      </Routes>

      <Disclaimer />
      <Footer />
    </div>
  );
}
