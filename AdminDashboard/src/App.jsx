import "./App.css";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import Dashboard from "./Pages/Dashboard";
import Users from "./Pages/Users";
import Vendors from "./Pages/Vendors";
import Orders from "./Pages/Orders";
import Settings from "./Pages/Settings";
import UserPage from "./Pages/UserPage";
import { AuthProvider } from "./core/auth";
import { RouteGuard } from "./core/auth";
import ProductApprovals from "./Pages/ProductApprovals";
import Finance from "./Pages/FinancePage";
import GroupBuyManagement from "./Pages/GroupBuyManagement";
import UpdateNotifier from "./components/UpdateNotifier";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen flex dark:bg-gray-100">
          {/* Main Content */}
          <main className="flex-1 p-8">
            <Routes>
              {/* Root Dashboard — protected */}
              <Route
                path="/"
                element={
                  <RouteGuard>
                    <Dashboard />
                  </RouteGuard>
                }
              />

              {/* Nested Users Routes — protected with permission check */}
              <Route
                path="/users"
                element={
                  <RouteGuard requiredResource="users" requiredAction="view">
                    <Users />
                  </RouteGuard>
                }
              />
              <Route
                path="/users/:userId"
                element={
                  <RouteGuard requiredResource="users" requiredAction="view">
                    <UserPage />
                  </RouteGuard>
                }
              />

              {/* Vendors Route */}
              <Route
                path="/vendors"
                element={
                  <RouteGuard requiredResource="users" requiredAction="view">
                    <Vendors />
                  </RouteGuard>
                }
              />

              {/* Other Sections */}
              <Route
                path="/orders"
                element={
                  <RouteGuard requiredResource="orders" requiredAction="view">
                    <Orders />
                  </RouteGuard>
                }
              />
              <Route
                path="/settings"
                element={
                  <RouteGuard requiredResource="settings" requiredAction="view">
                    <Settings />
                  </RouteGuard>
                }
              />
              <Route
                path="/productapprovals"
                element={
                  <RouteGuard requiredResource="products" requiredAction="approve">
                    <ProductApprovals />
                  </RouteGuard>
                }
              />
              <Route
                path="/finance"
                element={
                  <RouteGuard requiredResource="finance" requiredAction="view">
                    <Finance />
                  </RouteGuard>
                }
              />
              <Route
                path="/group-buy"
                element={
                  <RouteGuard requiredResource="orders" requiredAction="view">
                    <GroupBuyManagement />
                  </RouteGuard>
                }
              />

              {/* Catch-all fallback */}
              <Route path="*" element={<h1>404 - Not Found</h1>} />
            </Routes>
          </main>
        </div>
        <UpdateNotifier />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
