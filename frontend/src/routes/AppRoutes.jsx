import React from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoutes";
import MainLayout from "../layouts/MainLayout";

// Import pages
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import Products from "../pages/Products";
import AddEditProduct from "../pages/AddEditProduct";
import CreateBill from "../pages/CreateBill";
import Bills from "../pages/Bills";
import Users from "../pages/Users";
import Profile from "../pages/Profile";
import BillReceiptStandalone from "../pages/BillReceiptStandalone";
import About from "../pages/About";

// Import error pages
import { NotFoundPage, UnauthorizedPage } from "../pages/Errors";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/bill/:invoiceNumber" element={<BillReceiptStandalone />} />
      <Route path="/about" element={<About />} />
      <Route path="/services" element={<About />} />

      {/* Protected Routes (Admin + Accountant) */}
      <Route element={<ProtectedRoute allowedRoles={["admin", "accountant"]} />}>
        <Route
          path="/"
          element={
            <MainLayout>
              <Dashboard />
            </MainLayout>
          }
        />
        <Route
          path="/profile"
          element={
            <MainLayout>
              <Profile />
            </MainLayout>
          }
        />
        <Route
          path="/products"
          element={
            <MainLayout>
              <Products />
            </MainLayout>
          }
        />
        <Route
          path="/bills"
          element={
            <MainLayout>
              <Bills />
            </MainLayout>
          }
        />
        <Route
          path="/bills/create"
          element={
            <MainLayout>
              <CreateBill />
            </MainLayout>
          }
        />
        <Route
          path="/billing/retail"
          element={
            <MainLayout>
              <CreateBill key="retail" billType="retail" />
            </MainLayout>
          }
        />
        <Route
          path="/billing/wholesale"
          element={
            <MainLayout>
              <CreateBill key="wholesale" billType="wholesale" />
            </MainLayout>
          }
        />

        {/* Admin Only Views */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route
            path="/products/add"
            element={
              <MainLayout>
                <AddEditProduct />
              </MainLayout>
            }
          />
          <Route
            path="/products/edit/:id"
            element={
              <MainLayout>
                <AddEditProduct />
              </MainLayout>
            }
          />
          <Route
            path="/users"
            element={
              <MainLayout>
                <Users />
              </MainLayout>
            }
          />
        </Route>
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
