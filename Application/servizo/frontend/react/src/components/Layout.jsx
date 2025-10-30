import { useLocation } from "react-router-dom";
import Navbar from "./NavBar.jsx";


function Layout({ children }) {
const location = useLocation();
const showNavbar = location.pathname !== "/login" && location.pathname !== "/register" && location.pathname !== "/forgot-password";

return (
    <>
      {showNavbar && <Navbar />}
      {children}
    </>
  );
}

export default Layout