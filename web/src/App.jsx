import React, { useState } from "react";
import { isLoggedIn, logout } from "./api.js";
import Login from "./pages/Login.jsx";
import Layout from "./components/Layout.jsx";
import Overview from "./pages/Overview.jsx";
import SalesRecords from "./pages/SalesRecords.jsx";
import ProfitLoss from "./pages/ProfitLoss.jsx";
import Shops from "./pages/Shops.jsx";
import Inventory from "./pages/Inventory.jsx";
import Admins from "./pages/Admins.jsx";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [page, setPage] = useState("overview");

  if (!loggedIn) {
    return <Login onLoggedIn={() => setLoggedIn(true)} />;
  }

  function handleLogout() {
    logout();
    setLoggedIn(false);
  }

  const pageMap = {
    overview: <Overview />,
    sales: <SalesRecords />,
    pnl: <ProfitLoss />,
    inventory: <Inventory />,
    shops: <Shops />,
    admins: <Admins />
  };

  return (
    <Layout activePage={page} onNavigate={setPage} onLogout={handleLogout}>
      {pageMap[page]}
    </Layout>
  );
}
