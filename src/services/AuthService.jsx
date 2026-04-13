import { createContext, useContext, useState, useEffect } from "react";

// Context
const AuthContext = createContext();

// Provider
export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("isLoggedIn") === "true" || !!localStorage.getItem("occult_user")
  );
  const [user, setUser] = useState(
    localStorage.getItem("occult_user") ? JSON.parse(localStorage.getItem("occult_user")) : null
  );
  const [loadingUser, setLoadingUser] = useState(false);

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(
    localStorage.getItem("isAdminLoggedIn") === "true"
  );
  const [adminUser, setAdminUser] = useState(
    localStorage.getItem("adminUser") ? JSON.parse(localStorage.getItem("adminUser")) : null
  );

  const email = localStorage.getItem("email");

  // Fetch regular user profile
  const fetchUserProfile = async () => {
    if (!isLoggedIn || !email) return;
    try {
      const res = await fetch("/api/user_profile.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fetch", email: email }),
      });
      const data = await res.json();
      if (data.status) {
        setUser(prev => {
          const updatedUser = { ...prev, ...data.data };
          // PRESERVE marketplace specific fields if they exist
          if (prev?.id) updatedUser.id = prev.id; 
          if (prev?.role) updatedUser.role = prev.role;
          return updatedUser;
        });
      }
    } catch (error) {
      console.error("User profile sync failed:", error);
    }
  };

  // Login/Logout for regular users
  const login = () => {
    localStorage.setItem("isLoggedIn", "true");
    setIsLoggedIn(true);
    fetchUserProfile();
  };

  const loginMarketplace = (userData) => {
    localStorage.setItem("email", userData.email);
    setUser(userData);
    setIsLoggedIn(true);
  };

  const logout = async (userId = null, deviceId = null) => {
    if (userId && deviceId) {
      try {
        await fetch("/api/manage_devices.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "logout", user_id: userId, device_id: deviceId }),
        });
      } catch (error) {
        console.error("Device logout failed:", error);
      }
    }
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("occult_token");
    localStorage.removeItem("occult_user");
    setIsLoggedIn(false);
    setUser(null);
  };

  // Sync user profile every 15 seconds
  useEffect(() => {
    if (isLoggedIn) {
      fetchUserProfile();
      const interval = setInterval(fetchUserProfile, 15000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, email]);

  // Admin login/logout logic (rest of the code)
  const loginAdmin = (userData) => {
    localStorage.setItem("isAdminLoggedIn", "true");
    localStorage.setItem("adminUser", JSON.stringify(userData));
    setIsAdminLoggedIn(true);
    setAdminUser(userData);
  };

  const logoutAdmin = () => {
    localStorage.removeItem("isAdminLoggedIn");
    localStorage.removeItem("adminUser");
    setIsAdminLoggedIn(false);
    setAdminUser(null);
  };

  useEffect(() => {
    let interval;
    const verifyAdmin = async () => {
      if (!isAdminLoggedIn || !adminUser?.id) return;
      try {
        const res = await fetch("/api/verify_admin.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: adminUser.id }),
        });
        const data = await res.json();
        if (data.status === "success" && data.admin) {
          const updatedAdmin = data.admin;
          if (JSON.stringify(updatedAdmin) !== JSON.stringify(adminUser)) {
            setAdminUser(updatedAdmin);
            localStorage.setItem("adminUser", JSON.stringify(updatedAdmin));
          }
        } else {
          logoutAdmin();
        }
      } catch (error) {
        console.error("Admin verification failed:", error);
      }
    };

    if (isAdminLoggedIn) {
      verifyAdmin();
      interval = setInterval(verifyAdmin, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAdminLoggedIn, adminUser?.id]);

  return (
    <AuthContext.Provider value={{ 
      isLoggedIn, user, loadingUser, login, logout, refreshUser: fetchUserProfile, loginMarketplace,
      isAdminLoggedIn, adminUser, loginAdmin, logoutAdmin 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = () => useContext(AuthContext);
