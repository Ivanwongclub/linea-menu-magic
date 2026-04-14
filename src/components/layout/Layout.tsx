import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Outlet, useLocation } from "react-router-dom";

export default function Layout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main key={pathname}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
