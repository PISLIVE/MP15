import { createBrowserRouter } from "react-router";
import Layout from "./Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { History } from "./pages/History";
import { Settings } from "./pages/Settings";
import ProtectedRoute from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      {
        index: true,
        Component: Login,
      },
      {
        path: "login",
        Component: Login,
      },
      {
        path: "dashboard",
        Component: ProtectedRoute,
        children: [
          {
            index: true,
            Component: Dashboard,
          },
        ],
      },
      {
        path: "history",
        Component: ProtectedRoute,
        children: [
          {
            index: true,
            Component: History,
          },
        ],
      },
      {
        path: "settings",
        Component: ProtectedRoute,
        children: [
          {
            index: true,
            Component: Settings,
          },
        ],
      },
    ],
  },
]);
