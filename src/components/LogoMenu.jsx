import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const MENU_ITEMS = [
  { label: "Home", path: "/" },
  { label: "Submit", path: "/submit" },
  { label: "Login", path: "/auth" },
  { label: "Profile", path: "/profile" },
];

function LogoMenu({ isAuthenticated = false, onLogout = () => {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const isUserLoggedIn = Boolean(localStorage.getItem("user")) || isAuthenticated;

  const visibleMenuItems = useMemo(
    () => MENU_ITEMS.filter((item) => !(isAuthenticated && item.label === "Login")),
    [isAuthenticated]
  );

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  return (
    <div className="logo-menu-wrap" ref={menuRef}>
      <button
        type="button"
        className="logo-trigger"
        onClick={() => setIsOpen((current) => !current)}
        aria-label="Toggle logo menu"
      >
        <div className="logo-container">
          <div className="brand-mark" aria-hidden="true">
            <span className="brand-mark-halo" />
            <span className="brand-mark-silhouette" />
          </div>
          <h1 className="brand-title">Ethereal Beauty</h1>
        </div>
      </button>

      {isOpen ? (
        <div className="logo-dropdown-menu">
          {visibleMenuItems.map((item) => (
            <button
              key={item.path}
              type="button"
              className="logo-dropdown-item"
              onClick={() => {
                setIsOpen(false);
                navigate(item.path);
              }}
            >
              {item.label}
            </button>
          ))}
          {isUserLoggedIn ? (
            <button
              type="button"
              className="logo-dropdown-item logo-dropdown-item-logout"
              onClick={() => {
                setIsOpen(false);
                onLogout();
                navigate("/");
              }}
            >
              Logout
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default LogoMenu;
