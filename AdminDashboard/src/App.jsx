import "./App.css";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  NavLink,
} from "react-router-dom";
import Dashboard from "./Pages/Dashboard";
import Users from "./Pages/Users";
import Orders from "./Pages/Orders";
import Settings from "./Pages/Settings";

/* import AuthProvider from "./context/AuthContext"; */
import UserPage from "./Pages/UserPage";
import AuthProvider from "./context/AuthContext";
import ProductApprovals from "./Pages/ProductApprovals";
import Finance from "./Pages/FinancePage";
import GroupBuyManagement from "./Pages/GroupBuyManagement";
import UpdateNotifier from "./components/UpdateNotifier";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen flex dark:bg-gray-100">
            {/* Main Content */}
            <main className="flex-1 p-8">
              <Routes>
                {/* Root Dashboard */}
                <Route path="/" element={<Dashboard />} />

                {/* Nested Users Routes */}
                <Route path="/users" element={<Users />} />
                <Route path="/users/:userId" element={<UserPage />} />

                {/* Other Sections */}
                <Route path="/orders" element={<Orders />} />
                <Route path="/settings" element={<Settings />} />
                <Route
                  path="/productapprovals"
                  element={<ProductApprovals />}
                />
                <Route path="/finance" element={<Finance />} />
                <Route path="/group-buy" element={<GroupBuyManagement />} />

                {/* Catch-all fallback */}
                <Route path="*" element={<h1>404 - Not Found</h1>} />
              </Routes>
            </main>
          </div>
          <UpdateNotifier />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
