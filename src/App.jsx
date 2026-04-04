import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Route, Routes } from "react-router-dom";
import ChatWidget, { UserChatContent } from "./components/ChatWidget.jsx";
import EnlightenmentWidget, { QuoteContent } from "./components/EnlightenmentWidget.jsx";
import InboxWidget, { InboxContent } from "./components/InboxWidget.jsx";
import LogoMenu from "./components/LogoMenu.jsx";
import Modal from "./components/Modal.jsx";
import RobotChat, { AIChatContent } from "./components/RobotChat.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import CelebritiesPage from "./pages/CelebritiesPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import SubmitPage from "./pages/SubmitPage.jsx";

const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
const BACKGROUND_REFRESH_MS = 1800000;
const FALLBACK_BACKGROUNDS = [
  "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?auto=format&fit=crop&w=1600&q=80",
];

function App() {
  const [backgroundImage, setBackgroundImage] = useState(FALLBACK_BACKGROUNDS[0]);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const [activePopup, setActivePopup] = useState(null);
  const [authUser, setAuthUser] = useState(() => {
    const user = localStorage.getItem("user");
    const token = localStorage.getItem("poetry-token");
    const email = localStorage.getItem("poetry-auth-email") || localStorage.getItem("ethereal-user-email");

    if (!user && !token && !email) {
      return null;
    }

    return {
      user: user || "",
      email: email || "",
      token: token || "",
    };
  });
  const isAuthenticated = Boolean(authUser?.token || authUser?.email);

  useEffect(() => {
    if (authUser?.email || authUser?.token) {
      localStorage.setItem(
        "user",
        JSON.stringify({
          email: authUser.email || "",
          token: authUser.token || "",
        })
      );
      return;
    }

    localStorage.removeItem("user");
  }, [authUser]);

  useEffect(() => {
    let isMounted = true;

    const preloadAndSetBackground = (url) => {
      const image = new Image();
      image.loading = "lazy";
      image.src = url;
      image.onload = () => {
        if (isMounted) {
          setBackgroundImage(url);
        }
      };
    };

    const fetchBackground = async () => {
      if (!UNSPLASH_ACCESS_KEY) {
        const fallback = FALLBACK_BACKGROUNDS[Math.floor(Math.random() * FALLBACK_BACKGROUNDS.length)];
        preloadAndSetBackground(fallback);
        return;
      }

      try {
        const response = await fetch(
          `https://api.unsplash.com/search/photos?query=ocean%20deep%20sea%20dark%20water&orientation=landscape&per_page=10&client_id=${UNSPLASH_ACCESS_KEY}`
        );

        if (!response.ok) {
          throw new Error("Unable to fetch background image.");
        }

        const payload = await response.json();
        const results = Array.isArray(payload.results) ? payload.results : [];
        const imageUrl =
          results[Math.floor(Math.random() * results.length)]?.urls?.regular ||
          FALLBACK_BACKGROUNDS[Math.floor(Math.random() * FALLBACK_BACKGROUNDS.length)];

        preloadAndSetBackground(imageUrl);
      } catch (_error) {
        const fallback = FALLBACK_BACKGROUNDS[Math.floor(Math.random() * FALLBACK_BACKGROUNDS.length)];
        preloadAndSetBackground(fallback);
      }
    };

    fetchBackground();
    const intervalId = window.setInterval(fetchBackground, BACKGROUND_REFRESH_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setParallaxOffset(window.scrollY * 0.08);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const cursor = document.querySelector(".cursor-orb");
    if (!cursor) {
      return undefined;
    }

    const moveCursor = (event) => {
      cursor.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
    };

    const handlePointerOver = (event) => {
      if (event.target.closest(".image-card, .poem-card, .primary-button, .secondary-button, .nav-link")) {
        cursor.classList.add("cursor-orb-active");
      }
    };

    const handlePointerOut = () => {
      cursor.classList.remove("cursor-orb-active");
    };

    window.addEventListener("pointermove", moveCursor, { passive: true });
    document.addEventListener("pointerover", handlePointerOver);
    document.addEventListener("pointerout", handlePointerOut);

    return () => {
      window.removeEventListener("pointermove", moveCursor);
      document.removeEventListener("pointerover", handlePointerOver);
      document.removeEventListener("pointerout", handlePointerOut);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("poetry-token");
    localStorage.removeItem("poetry-auth-email");
    localStorage.removeItem("ethereal-user-email");
    localStorage.removeItem("ethereal-user-id");
    setAuthUser(null);
  };

  const togglePopup = (popupName) => {
    setActivePopup((current) => (current === popupName ? null : popupName));
  };

  const popupTitleMap = {
    ai: "ai",
    quote: "quote",
    inbox: "inbox",
    chat: "chat",
  };

  return (
    <div className="app-frame">
      <motion.div
        className="page-background"
        style={{
          backgroundImage: `url("${backgroundImage}")`,
          transform: `translateY(${parallaxOffset}px) scale(1.05)`,
        }}
      />
      <div className="page-overlay" />
      <div className="ambient-glow ambient-glow-one" />
      <div className="ambient-glow ambient-glow-two" />
      <div className="cursor-orb" />

      <div className="app-shell">
        <header className="topbar">
          <div className="topbar-brand">
            <LogoMenu isAuthenticated={isAuthenticated} onLogout={handleLogout} />
          </div>
        </header>

        <motion.main
          className="content"
          key={backgroundImage}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/celebrities" element={<CelebritiesPage />} />
            <Route path="/submit" element={<SubmitPage />} />
            <Route
              path="/auth"
              element={<AuthPage isAuthenticated={isAuthenticated} authUser={authUser} onAuthChange={setAuthUser} />}
            />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </motion.main>
        <div className="utility-dock">
          <RobotChat onOpen={() => setActivePopup("ai")} />
          <EnlightenmentWidget onOpen={() => setActivePopup("quote")} />
          <InboxWidget onOpen={() => setActivePopup("inbox")} />
          <ChatWidget onOpen={() => setActivePopup("chat")} />
        </div>
        <Modal
          isOpen={activePopup !== null}
          onClose={() => setActivePopup(null)}
          title={popupTitleMap[activePopup] || ""}
        >
          {activePopup === "ai" && <AIChatContent onClose={() => setActivePopup(null)} />}
          {activePopup === "quote" && <QuoteContent isActive={activePopup === "quote"} />}
          {activePopup === "inbox" && <InboxContent />}
          {activePopup === "chat" && <UserChatContent />}
        </Modal>
      </div>
    </div>
  );
}

export default App;
