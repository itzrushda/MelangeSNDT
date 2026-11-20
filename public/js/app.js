/**
 * Melange Event Management Portal - Complete React SPA Application
 * Implements Module 1 (Auth), Module 2 (Admin Dashboard), Module 3 (College GS Dashboard), Module 4 (Event Management)
 * Mobile-First, Android-Optimized, and Pixel-Perfect according to College Fest UI designs
 */

const { useState, useEffect, useMemo, useRef } = React;

// --- Helper Icons (FontAwesome / SVG) ---
function Icon({ name, className = "" }) {
  const iconMap = {
    building: "fa-solid fa-building-columns",
    users: "fa-solid fa-users",
    trophy: "fa-solid fa-trophy",
    calendar: "fa-regular fa-calendar",
    "check-circle": "fa-solid fa-circle-check",
    "alert-triangle": "fa-solid fa-triangle-exclamation",
    hourglass: "fa-solid fa-hourglass-half",
    "circle-dot": "fa-solid fa-circle-dot",
    search: "fa-solid fa-magnifying-glass",
    bell: "fa-regular fa-bell",
    key: "fa-solid fa-key",
    shield: "fa-solid fa-shield-halved",
    user: "fa-regular fa-user",
    lock: "fa-solid fa-lock",
    eye: "fa-regular fa-eye",
    "eye-slash": "fa-regular fa-eye-slash",
    edit: "fa-solid fa-pencil",
    trash: "fa-regular fa-trash-can",
    plus: "fa-solid fa-plus",
    download: "fa-solid fa-download",
    close: "fa-solid fa-xmark",
    menu: "fa-solid fa-bars",
    logout: "fa-solid fa-arrow-right-from-bracket",
    sparkles: "fa-solid fa-wand-magic-sparkles",
    gear: "fa-solid fa-gear",
    bullhorn: "fa-solid fa-bullhorn",
    fileText: "fa-regular fa-file-lines",
    upload: "fa-solid fa-cloud-arrow-up",
    check: "fa-solid fa-check",
    arrowUpDown: "fa-solid fa-sort"
  };

  const faClass = iconMap[name] || `fa-solid fa-${name}`;
  return React.createElement("i", { className: `${faClass} ${className}` });
}

// =============================================================
// MAIN APP COMPONENT
// =============================================================
function MelangeApp() {
  // Authentication & Session State
  const [currentUser, setCurrentUser] = useState(null);
  const [currentCollege, setCurrentCollege] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Active View Routing State
  const [currentView, setCurrentView] = useState("auth"); // 'auth', 'admin-dashboard', 'admin-events', 'admin-colleges', 'admin-reports', 'admin-announcements', 'admin-settings', 'gs-dashboard', 'gs-profile', 'gs-add-participant', 'gs-participant-list', 'gs-reports', 'gs-announcements', 'gs-settings'

  // Mobile Navigation Drawer
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Global Toasts / Notification Banners
  const [toast, setToast] = useState({
    show: true,
    message: "Standard toast notifications may appear",
    type: "warning" // 'success', 'warning', 'error', 'info'
  });

  // Modal Dialogs State
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  // Check existing session on boot
  useEffect(() => {
    async function checkSession() {
      try {
        const token = MelangeAPI.getToken();
        if (token) {
          const res = await MelangeAPI.getMe();
          if (res.success && res.user) {
            setCurrentUser(res.user);
            setCurrentCollege(res.college);
            setCurrentView(res.user.role === "admin" ? "admin-dashboard" : "gs-dashboard");
          } else {
            setCurrentView("auth");
          }
        } else {
          setCurrentView("auth");
        }
      } catch (e) {
        setCurrentView("auth");
      } finally {
        setIsLoadingAuth(false);
      }
    }
    checkSession();
  }, []);

  // Fetch Notifications
  useEffect(() => {
    if (currentUser) {
      MelangeAPI.getNotifications().then(res => {
        if (res.success) setNotifications(res.notifications);
      }).catch(() => {});
      MelangeAPI.getAnnouncements().then(res => {
        if (res.success) setAnnouncements(res.announcements);
      }).catch(() => {});
    }
  }, [currentUser]);

  const triggerToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    if (type !== "warning") {
      setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 4000);
    }
  };

  const handleLogout = async () => {
    await MelangeAPI.logout();
    setCurrentUser(null);
    setCurrentCollege(null);
    setCurrentView("auth");
    setIsMobileDrawerOpen(false);
    triggerToast("Logged out successfully.", "info");
  };

  if (isLoadingAuth) {
    return React.createElement(
      "div",
      { className: "min-h-screen bg-[#160a3a] flex flex-col items-center justify-center text-white" },
      React.createElement("div", { className: "w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" }),
      React.createElement("p", { className: "text-lg font-semibold tracking-wider text-amber-300" }, "INITIALIZING MELANGE FEST PORTAL...")
    );
  }

  // If not logged in, display Module 1: Authentication & Role Management
  if (!currentUser || currentView === "auth") {
    return React.createElement(
      "div",
      { className: "min-h-screen bg-slate-100 flex flex-col justify-between" },
      React.createElement(AuthModule, {
        onLoginSuccess: (user, college, redirectTo) => {
          setCurrentUser(user);
          setCurrentCollege(college);
          setCurrentView(redirectTo.includes("admin") ? "admin-dashboard" : "gs-dashboard");
          triggerToast(`Welcome back, ${user.name}!`, "success");
        },
        onForgotPasswordClick: () => setShowForgotPasswordModal(true),
        triggerToast
      }),
      showForgotPasswordModal && React.createElement(ForgotPasswordModal, {
        onClose: () => setShowForgotPasswordModal(false),
        triggerToast
      })
    );
  }

  // App Layout for Authenticated Users (Module 2, 3, or 4)
  return React.createElement(
    "div",
    { className: "min-h-screen bg-[#f8fafc] flex flex-col md:flex-row pb-20 md:pb-0" },

    // Left Navigation Sidebar (Desktop)
    React.createElement(AppSidebar, {
      currentUser,
      currentCollege,
      currentView,
      setCurrentView,
      onLogout: handleLogout
    }),

    // Mobile Navigation Drawer (Android Touch Slide-Over)
    isMobileDrawerOpen && React.createElement(MobileNavDrawer, {
      currentUser,
      currentCollege,
      currentView,
      setCurrentView,
      onClose: () => setIsMobileDrawerOpen(false),
      onLogout: handleLogout
    }),

    // Main Content Region
    React.createElement(
      "div",
      { className: "flex-1 flex flex-col min-w-0" },

      // Top Header
      React.createElement(AppHeader, {
        currentUser,
        currentCollege,
        currentView,
        onToggleMobileDrawer: () => setIsMobileDrawerOpen(!isMobileDrawerOpen),
        onOpenNotifications: () => setShowNotificationsDrawer(true),
        onOpenChangePassword: () => setShowChangePasswordModal(true)
      }),

      // Main View Content
      React.createElement(
        "main",
        { className: "p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto" },

        // Module 2: Admin Dashboard
        currentView === "admin-dashboard" && React.createElement(AdminDashboardView, {
          currentUser,
          setCurrentView,
          triggerToast
        }),

        // Module 3: College GS Dashboard
        currentView === "gs-dashboard" && React.createElement(CollegeGSDashboardView, {
          currentUser,
          currentCollege,
          setCurrentCollege,
          setCurrentView,
          triggerToast
        }),

        // Module 4: Event Management
        (currentView === "admin-events" || currentView === "event-management") && React.createElement(EventManagementView, {
          currentUser,
          triggerToast
        }),

        // Module 5: Registration Management
        (currentView === "admin-registrations" || currentView === "gs-registrations" || currentView === "registrations") && React.createElement(RegistrationManagementView, {
          currentUser,
          currentCollege,
          triggerToast
        }),

        // Module 6: Report Management
        (currentView === "admin-reports" || currentView === "gs-reports" || currentView === "reports") && React.createElement(ReportManagementView, {
          currentUser,
          currentCollege,
          triggerToast
        }),

        // Additional Connected Modules
        currentView === "admin-colleges" && React.createElement(CollegesManagementView, { triggerToast }),
        currentView === "admin-announcements" && React.createElement(AnnouncementsView, { announcements, triggerToast }),
        currentView === "admin-settings" && React.createElement(SettingsView, { currentUser, onOpenChangePassword: () => setShowChangePasswordModal(true) }),

        // GS Views
        currentView === "gs-profile" && React.createElement(CollegeProfileView, { currentCollege, setCurrentCollege, triggerToast }),
        currentView === "gs-add-participant" && React.createElement(AddParticipantStandaloneView, { currentCollege, setCurrentView, triggerToast }),
        currentView === "gs-participant-list" && React.createElement(ParticipantListStandaloneView, { currentCollege, triggerToast }),
        currentView === "gs-announcements" && React.createElement(AnnouncementsView, { announcements, triggerToast }),
        currentView === "gs-settings" && React.createElement(SettingsView, { currentUser, onOpenChangePassword: () => setShowChangePasswordModal(true) })
      )
    ),

    // Android Bottom Navigation Bar
    React.createElement(AndroidBottomNav, {
      currentUser,
      currentView,
      setCurrentView
    }),

    // Floating Toast Notification matching Image 4 (bottom-left)
    toast.show && React.createElement(ToastBanner, {
      toast,
      onClose: () => setToast(prev => ({ ...prev, show: false }))
    }),

    // Modals
    showChangePasswordModal && React.createElement(ChangePasswordModal, {
      onClose: () => setShowChangePasswordModal(false),
      triggerToast
    }),

    showNotificationsDrawer && React.createElement(NotificationsDrawer, {
      notifications,
      onClose: () => setShowNotificationsDrawer(false)
    })
  );
}

// =============================================================
// MODULE 1: AUTHENTICATION & ROLE MANAGEMENT VIEW (MATCHING IMAGE 1)
// =============================================================
function AuthModule({ onLoginSuccess, onForgotPasswordClick, triggerToast }) {
  const [selectedRole, setSelectedRole] = useState("college_gs"); // 'admin' or 'college_gs'
  const [username, setUsername] = useState("AEC04-GS");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");

  const handleRoleSwitch = (role) => {
    setSelectedRole(role);
    setAuthError("");
    if (role === "admin") {
      setUsername("admin");
      setPassword("admin123");
    } else {
      setUsername("AEC04-GS");
      setPassword("password123");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setIsSubmitting(true);

    try {
      const res = await MelangeAPI.login(username, password, selectedRole, rememberMe);
      if (res.success) {
        onLoginSuccess(res.user, res.college, res.redirectTo);
      } else {
        setAuthError(res.message || "Authentication failed. Check credentials.");
      }
    } catch (err) {
      setAuthError(err.message || "Failed to log in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return React.createElement(
    "div",
    { className: "min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-slate-50" },
    React.createElement(
      "div",
      { className: "w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-100" },

      // Left Column: Festive Indigo Banner
      React.createElement(
        "div",
        {
          className: "w-full md:w-5/12 p-8 md:p-10 text-white flex flex-col justify-between relative overflow-hidden",
          style: {
            background: "linear-gradient(145deg, #1d0747 0%, #15093e 50%, #0d1254 100%)"
          }
        },
        // Top Fest Branding
        React.createElement(
          "div",
          null,
          React.createElement(
            "div",
            { className: "flex items-center justify-between mb-8" },
            React.createElement(
              "div",
              { className: "flex items-center gap-3" },
              React.createElement(
                "div",
                { className: "w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-300 font-bold text-xl shadow-lg" },
                "M"
              ),
              React.createElement(
                "div",
                null,
                React.createElement("h1", { className: "text-xl font-bold tracking-tight text-white flex items-center gap-2" }, "Melange"),
                React.createElement("p", { className: "text-xs text-slate-300 font-medium" }, "Event Management Portal")
              )
            ),
            React.createElement(
              "div",
              { className: "px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/60 text-amber-300 font-bold text-xs flex items-center gap-1 shadow-sm" },
              "Gold 🎉"
            )
          ),
          React.createElement(
            "h2",
            { className: "text-2xl md:text-3xl font-extrabold leading-tight tracking-tight mb-8 text-white" },
            "Connecting Colleges, Celebrating Talent 📣"
          ),
          // Bullet list with gold icons
          React.createElement(
            "div",
            { className: "space-y-6" },
            React.createElement(
              "div",
              { className: "flex items-start gap-4" },
              React.createElement(
                "div",
                { className: "w-9 h-9 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm" },
                React.createElement(Icon, { name: "shield", className: "text-sm text-amber-300" })
              ),
              React.createElement(
                "div",
                null,
                React.createElement("h3", { className: "text-sm font-bold text-amber-200 mb-0.5" }, "Melange Admin:"),
                React.createElement("p", { className: "text-xs text-slate-300 leading-relaxed" }, "Manage colleges, events, registrations & reports.")
              )
            ),
            React.createElement(
              "div",
              { className: "flex items-start gap-4" },
              React.createElement(
                "div",
                { className: "w-9 h-9 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm" },
                React.createElement(Icon, { name: "users", className: "text-sm text-amber-300" })
              ),
              React.createElement(
                "div",
                null,
                React.createElement("h3", { className: "text-sm font-bold text-amber-200 mb-0.5" }, "College General Secretaries:"),
                React.createElement("p", { className: "text-xs text-slate-300 leading-relaxed" }, "Manage your college participants & event entries.")
              )
            ),
            React.createElement(
              "div",
              { className: "flex items-start gap-4" },
              React.createElement(
                "div",
                { className: "w-9 h-9 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm" },
                React.createElement(Icon, { name: "check-circle", className: "text-sm text-amber-300" })
              ),
              React.createElement(
                "div",
                null,
                React.createElement("h3", { className: "text-sm font-bold text-amber-200 mb-0.5" }, "Security Features UI:"),
                React.createElement("p", { className: "text-xs text-slate-300 leading-relaxed" }, "Secure login badge, Session active indicator, Last login information.")
              )
            )
          )
        ),
        // Subtle footer
        React.createElement(
          "div",
          { className: "pt-8 text-xs text-slate-400 border-t border-white/10 mt-6" },
          "Melange '26 Annual Inter-Collegiate Fest • Official Portal"
        )
      ),

      // Right Column: Clean White Elevated Login Card
      React.createElement(
        "div",
        { className: "w-full md:w-7/12 p-8 md:p-12 flex flex-col justify-center bg-white" },
        React.createElement("h2", { className: "text-2xl md:text-3xl font-extrabold text-slate-900 mb-1" }, "Welcome Back"),
        React.createElement("p", { className: "text-sm text-slate-500 mb-6 font-medium" }, "Secure login for Admins & College General Secretaries"),

        // Tab Switcher (Admin Login vs College GS Login)
        React.createElement(
          "div",
          { className: "grid grid-cols-2 gap-4 mb-6" },

          // Tab 1: Admin Login
          React.createElement(
            "button",
            {
              type: "button",
              onClick: () => handleRoleSwitch("admin"),
              className: `p-4 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all relative overflow-hidden ${
                selectedRole === "admin"
                  ? "border-[#240b52] bg-purple-50/40 shadow-sm"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`
            },
            React.createElement("div", { className: "absolute top-0 left-0 w-8 h-8 bg-amber-400 -translate-x-4 -translate-y-4 rotate-45" }),
            React.createElement(
              "div",
              { className: `w-12 h-12 rounded-2xl flex items-center justify-center mb-2 ${selectedRole === "admin" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}` },
              React.createElement(Icon, { name: "key", className: "text-lg" })
            ),
            React.createElement("span", { className: `text-sm font-bold ${selectedRole === "admin" ? "text-purple-900" : "text-slate-600"}` }, "Admin Login")
          ),

          // Tab 2: College GS Login
          React.createElement(
            "button",
            {
              type: "button",
              onClick: () => handleRoleSwitch("college_gs"),
              className: `p-4 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all relative overflow-hidden ${
                selectedRole === "college_gs"
                  ? "border-blue-700 bg-blue-50/40 shadow-sm"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`
            },
            React.createElement("div", { className: "absolute top-0 left-0 w-8 h-8 bg-amber-400 -translate-x-4 -translate-y-4 rotate-45" }),
            React.createElement(
              "div",
              { className: `w-12 h-12 rounded-2xl flex items-center justify-center mb-2 ${selectedRole === "college_gs" ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-500"}` },
              React.createElement(Icon, { name: "building", className: "text-lg" })
            ),
            React.createElement("span", { className: `text-sm font-bold ${selectedRole === "college_gs" ? "text-blue-900" : "text-slate-600"}` }, "College GS Login")
          )
        ),

        // Error message banner
        authError && React.createElement(
          "div",
          { className: "mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2" },
          React.createElement(Icon, { name: "alert-triangle", className: "text-rose-500" }),
          React.createElement("span", null, authError)
        ),

        // Form
        React.createElement(
          "form",
          { onSubmit: handleSubmit, className: "space-y-4" },

          // Username / College ID input
          React.createElement(
            "div",
            null,
            React.createElement("label", { className: "block text-xs font-bold text-slate-700 mb-1.5" }, "Username / College ID"),
            React.createElement(
              "div",
              { className: "relative flex items-center" },
              React.createElement(
                "span",
                { className: "absolute left-4 text-slate-400" },
                React.createElement(Icon, { name: "user" })
              ),
              React.createElement("input", {
                type: "text",
                value: username,
                onChange: (e) => setUsername(e.target.value),
                placeholder: selectedRole === "admin" ? "e.g. admin or admin@melange.edu" : "e.g. AEC04-GS",
                required: true,
                className: "w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all font-medium"
              })
            )
          ),

          // Password input
          React.createElement(
            "div",
            null,
            React.createElement(
              "div",
              { className: "flex items-center justify-between mb-1.5" },
              React.createElement("label", { className: "block text-xs font-bold text-slate-700" }, "Password"),
              React.createElement(
                "button",
                {
                  type: "button",
                  onClick: () => setShowPassword(!showPassword),
                  className: "text-xs font-semibold text-slate-500 hover:text-purple-600 flex items-center gap-1"
                },
                React.createElement(Icon, { name: showPassword ? "eye-slash" : "eye" }),
                React.createElement("span", null, showPassword ? "Hide password" : "Show password")
              )
            ),
            React.createElement(
              "div",
              { className: "relative flex items-center" },
              React.createElement(
                "span",
                { className: "absolute left-4 text-slate-400" },
                React.createElement(Icon, { name: "lock" })
              ),
              React.createElement("input", {
                type: showPassword ? "text" : "password",
                value: password,
                onChange: (e) => setPassword(e.target.value),
                placeholder: "•••••••••",
                required: true,
                className: "w-full pl-11 pr-11 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all font-mono"
              }),
              React.createElement(
                "button",
                {
                  type: "button",
                  onClick: () => setShowPassword(!showPassword),
                  className: "absolute right-4 text-slate-400 hover:text-slate-600"
                },
                React.createElement(Icon, { name: showPassword ? "eye-slash" : "eye" })
              )
            )
          ),

          // Remember Me & Forgot Password Row
          React.createElement(
            "div",
            { className: "flex items-center justify-between pt-1" },
            React.createElement(
              "label",
              { className: "flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600 select-none" },
              React.createElement("input", {
                type: "checkbox",
                checked: rememberMe,
                onChange: (e) => setRememberMe(e.target.checked),
                className: "w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              }),
              React.createElement("span", null, "Remember me")
            ),
            React.createElement(
              "button",
              {
                type: "button",
                onClick: onForgotPasswordClick,
                className: "text-xs font-semibold text-amber-600 hover:text-amber-700 hover:underline"
              },
              "Forgot Password?"
            )
          ),

          // Submit Button
          React.createElement(
            "button",
            {
              type: "submit",
              disabled: isSubmitting,
              className: "w-full py-3.5 px-6 rounded-xl font-bold text-white text-sm tracking-wide bg-blue-700 hover:bg-blue-800 active:scale-[0.99] transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
            },
            isSubmitting && React.createElement("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" }),
            React.createElement("span", null, selectedRole === "admin" ? "Login as Admin" : "Login as GS"),
            React.createElement(Icon, { name: "sparkles", className: "text-xs text-amber-300" })
          )
        ),

        // Security Footnote matching Image 1
        React.createElement(
          "div",
          { className: "mt-8 text-center" },
          React.createElement(
            "p",
            { className: "text-xs text-slate-500 font-medium flex items-center justify-center gap-1.5" },
            React.createElement("span", null, "🔒"),
            React.createElement("span", { className: "font-semibold text-slate-700" }, "AES-256 Secure Access"),
            React.createElement("span", null, "| Authorized personnel only")
          ),
          React.createElement(
            "p",
            { className: "text-[11px] text-slate-400 mt-1" },
            "Only authorized Admins and College GS members can access this portal"
          )
        )
      )
    )
  );
}

// =============================================================
// FORGOT & RESET PASSWORD MODAL
// =============================================================
function ForgotPasswordModal({ onClose, triggerToast }) {
  const [step, setStep] = useState(1); // 1: Enter ID, 2: Enter Token & New Password
  const [identifier, setIdentifier] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [infoMsg, setInfoMsg] = useState("");

  const handleRequestToken = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await MelangeAPI.forgotPassword(identifier);
      if (res.success) {
        setInfoMsg(res.message);
        if (res.resetToken) setResetToken(res.resetToken);
        setStep(2);
      }
    } catch (err) {
      triggerToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await MelangeAPI.resetPassword(resetToken, newPassword);
      if (res.success) {
        triggerToast("Password reset successful! You may now login.", "success");
        onClose();
      }
    } catch (err) {
      triggerToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return React.createElement(
    "div",
    { className: "fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" },
    React.createElement(
      "div",
      { className: "bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-100" },
      React.createElement(
        "div",
        { className: "flex items-center justify-between pb-4 border-b border-slate-100 mb-4" },
        React.createElement("h3", { className: "text-lg font-bold text-slate-900" }, "Forgot Password Recovery"),
        React.createElement(
          "button",
          { onClick: onClose, className: "text-slate-400 hover:text-slate-600" },
          React.createElement(Icon, { name: "close" })
        )
      ),

      step === 1 ? React.createElement(
        "form",
        { onSubmit: handleRequestToken, className: "space-y-4" },
        React.createElement("p", { className: "text-xs text-slate-600" }, "Enter your Username (e.g. AEC04-GS or admin) or registered email to generate a security token."),
        React.createElement("input", {
          type: "text",
          value: identifier,
          onChange: (e) => setIdentifier(e.target.value),
          placeholder: "Username or Email Address",
          required: true,
          className: "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-purple-600"
        }),
        React.createElement(
          "button",
          {
            type: "submit",
            disabled: loading,
            className: "w-full py-2.5 bg-purple-700 text-white rounded-xl font-bold text-sm hover:bg-purple-800 transition"
          },
          loading ? "Verifying..." : "Generate Recovery Token"
        )
      ) : React.createElement(
        "form",
        { onSubmit: handleResetPassword, className: "space-y-4" },
        infoMsg && React.createElement("div", { className: "p-3 rounded-xl bg-amber-50 text-amber-800 text-xs font-medium" }, infoMsg),
        React.createElement("input", {
          type: "text",
          value: resetToken,
          onChange: (e) => setResetToken(e.target.value),
          placeholder: "Recovery Token (e.g. RST-123456)",
          required: true,
          className: "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono"
        }),
        React.createElement("input", {
          type: "password",
          value: newPassword,
          onChange: (e) => setNewPassword(e.target.value),
          placeholder: "New Password",
          required: true,
          className: "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm"
        }),
        React.createElement(
          "button",
          {
            type: "submit",
            disabled: loading,
            className: "w-full py-2.5 bg-blue-700 text-white rounded-xl font-bold text-sm hover:bg-blue-800 transition"
          },
          loading ? "Updating..." : "Update Password"
        )
      )
    )
  );
}

// =============================================================
// CHANGE PASSWORD MODAL
// =============================================================
function ChangePasswordModal({ onClose, triggerToast }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      triggerToast("New passwords do not match.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await MelangeAPI.changePassword(currentPassword, newPassword);
      if (res.success) {
        triggerToast("Password changed successfully!", "success");
        onClose();
      }
    } catch (err) {
      triggerToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return React.createElement(
    "div",
    { className: "fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" },
    React.createElement(
      "div",
      { className: "bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-100" },
      React.createElement(
        "div",
        { className: "flex items-center justify-between pb-4 border-b border-slate-100 mb-4" },
        React.createElement("h3", { className: "text-lg font-bold text-slate-900" }, "Change Password"),
        React.createElement(
          "button",
          { onClick: onClose, className: "text-slate-400 hover:text-slate-600" },
          React.createElement(Icon, { name: "close" })
        )
      ),
      React.createElement(
        "form",
        { onSubmit: handleSubmit, className: "space-y-4" },
        React.createElement("div", null,
          React.createElement("label", { className: "block text-xs font-semibold text-slate-700 mb-1" }, "Current Password"),
          React.createElement("input", {
            type: "password",
            value: currentPassword,
            onChange: (e) => setCurrentPassword(e.target.value),
            required: true,
            className: "w-full px-4 py-2 border rounded-xl text-sm"
          })
        ),
        React.createElement("div", null,
          React.createElement("label", { className: "block text-xs font-semibold text-slate-700 mb-1" }, "New Password"),
          React.createElement("input", {
            type: "password",
            value: newPassword,
            onChange: (e) => setNewPassword(e.target.value),
            required: true,
            className: "w-full px-4 py-2 border rounded-xl text-sm"
          })
        ),
        React.createElement("div", null,
          React.createElement("label", { className: "block text-xs font-semibold text-slate-700 mb-1" }, "Confirm New Password"),
          React.createElement("input", {
            type: "password",
            value: confirmPassword,
            onChange: (e) => setConfirmPassword(e.target.value),
            required: true,
            className: "w-full px-4 py-2 border rounded-xl text-sm"
          })
        ),
        React.createElement(
          "div",
          { className: "flex justify-end gap-3 pt-2" },
          React.createElement("button", { type: "button", onClick: onClose, className: "px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl" }, "Cancel"),
          React.createElement("button", { type: "submit", disabled: loading, className: "px-5 py-2 text-sm font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl" }, loading ? "Saving..." : "Save New Password")
        )
      )
    )
  );
}

// =============================================================
// NOTIFICATIONS DRAWER
// =============================================================
function NotificationsDrawer({ notifications, onClose }) {
  return React.createElement(
    "div",
    { className: "fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-end" },
    React.createElement(
      "div",
      { className: "bg-white w-full max-w-sm h-full p-6 flex flex-col shadow-2xl animate-in slide-in-from-right" },
      React.createElement(
        "div",
        { className: "flex items-center justify-between pb-4 border-b border-slate-100" },
        React.createElement("h3", { className: "text-lg font-bold text-slate-900 flex items-center gap-2" },
          React.createElement(Icon, { name: "bell", className: "text-amber-500" }),
          "Fest Notifications"
        ),
        React.createElement("button", { onClick: onClose, className: "text-slate-400 hover:text-slate-600" }, React.createElement(Icon, { name: "close" }))
      ),
      React.createElement(
        "div",
        { className: "flex-1 overflow-y-auto divide-y divide-slate-100 py-2" },
        notifications.length === 0 ? React.createElement("p", { className: "text-xs text-slate-400 py-6 text-center" }, "No notifications right now.") :
        notifications.map(n => React.createElement(
          "div",
          { key: n._id, className: "py-3" },
          React.createElement("div", { className: "flex items-center justify-between mb-1" },
            React.createElement("span", { className: "text-xs font-bold text-slate-800" }, n.title),
            React.createElement("span", { className: "text-[10px] text-slate-400" }, n.time)
          ),
          React.createElement("p", { className: "text-xs text-slate-600 leading-relaxed" }, n.message)
        ))
      )
    )
  );
}

// =============================================================
// APP SIDEBAR (MATCHING IMAGES 2 & 3)
// =============================================================
function AppSidebar({ currentUser, currentCollege, currentView, setCurrentView, onLogout }) {
  const isAdmin = currentUser.role === "admin";

  const adminNav = [
    { id: "admin-dashboard", label: "Dashboard", icon: "gear" },
    { id: "admin-colleges", label: "Manage Colleges", icon: "building" },
    { id: "admin-events", label: "Manage Events", icon: "calendar" },
    { id: "admin-registrations", label: "Registrations", icon: "fileText" },
    { id: "admin-reports", label: "Reports", icon: "fileText" },
    { id: "admin-announcements", label: "Announcements", icon: "bullhorn" },
    { id: "admin-settings", label: "Settings", icon: "gear" }
  ];

  const gsNav = [
    { id: "gs-dashboard", label: "Dashboard", icon: "gear" },
    { id: "gs-profile", label: "College Profile", icon: "building" },
    { id: "gs-add-participant", label: "Add Participants", icon: "plus" },
    { id: "gs-participant-list", label: "Participant List", icon: "users" },
    { id: "gs-registrations", label: "Registrations", icon: "fileText" },
    { id: "gs-reports", label: "Reports", icon: "fileText" },
    { id: "gs-announcements", label: "Announcements", icon: "bullhorn" },
    { id: "gs-settings", label: "Settings", icon: "gear" }
  ];

  const navItems = isAdmin ? adminNav : gsNav;

  return React.createElement(
    "aside",
    {
      className: "hidden md:flex w-64 flex-col justify-between p-6 flex-shrink-0 text-white min-h-screen",
      style: { background: "#160a3a" }
    },
    React.createElement(
      "div",
      null,
      // Brand Logo Header matching Image 2 & 3
      React.createElement(
        "div",
        { className: "mb-10 text-center" },
        React.createElement(
          "div",
          { className: "flex items-center justify-center gap-2 mb-1" },
          React.createElement("span", { className: "text-amber-400 text-lg" }, "🎪"),
          React.createElement("h2", { className: "text-2xl font-extrabold tracking-tight text-white font-serif" }, "Melange")
        ),
        React.createElement("p", { className: "text-[11px] text-amber-200/70 uppercase tracking-widest font-semibold" }, "Event Management Portal")
      ),

      // Navigation Items List
      React.createElement(
        "nav",
        { className: "space-y-1.5" },
        navItems.map(item => {
          const isActive = currentView === item.id || (item.id === "admin-dashboard" && currentView === "admin-dashboard");
          return React.createElement(
            "button",
            {
              key: item.id,
              onClick: () => setCurrentView(item.id),
              className: `w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
                isActive
                  ? "nav-item-active"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`
            },
            React.createElement(Icon, { name: item.icon, className: `text-sm ${isActive ? "text-white" : "text-slate-400"}` }),
            React.createElement("span", null, item.label)
          );
        })
      )
    ),

    // Bottom Logout Button
    React.createElement(
      "div",
      { className: "pt-6 border-t border-white/10" },
      React.createElement(
        "button",
        {
          onClick: onLogout,
          className: "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-slate-300 hover:text-white hover:bg-rose-500/20 hover:border-rose-500/30 transition-all text-left"
        },
        React.createElement(Icon, { name: "logout", className: "text-sm text-slate-400" }),
        React.createElement("span", null, "Logout")
      )
    )
  );
}

// =============================================================
// MOBILE NAV DRAWER (ANDROID)
// =============================================================
function MobileNavDrawer({ currentUser, currentCollege, currentView, setCurrentView, onClose, onLogout }) {
  return React.createElement(
    "div",
    { className: "fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm md:hidden flex" },
    React.createElement(
      "div",
      { className: "w-72 bg-[#160a3a] h-full p-6 text-white flex flex-col justify-between shadow-2xl animate-in slide-in-from-left" },
      React.createElement(
        "div",
        null,
        React.createElement(
          "div",
          { className: "flex items-center justify-between mb-8 pb-4 border-b border-white/10" },
          React.createElement(
            "div",
            null,
            React.createElement("h2", { className: "text-xl font-extrabold text-white font-serif" }, "Melange '26"),
            React.createElement("p", { className: "text-[10px] text-amber-300 font-semibold uppercase tracking-wider" }, currentUser.role === "admin" ? "Central Directorate" : currentCollege?.code || "College GS")
          ),
          React.createElement("button", { onClick: onClose, className: "text-white/60 hover:text-white" }, React.createElement(Icon, { name: "close" }))
        ),
        React.createElement(
          "nav",
          { className: "space-y-2" },
          (currentUser.role === "admin" ? [
            { id: "admin-dashboard", label: "Dashboard", icon: "gear" },
            { id: "admin-colleges", label: "Manage Colleges", icon: "building" },
            { id: "admin-events", label: "Manage Events", icon: "calendar" },
            { id: "admin-registrations", label: "Registrations", icon: "fileText" },
            { id: "admin-reports", label: "Reports", icon: "fileText" },
            { id: "admin-announcements", label: "Announcements", icon: "bullhorn" }
          ] : [
            { id: "gs-dashboard", label: "Dashboard", icon: "gear" },
            { id: "gs-profile", label: "College Profile", icon: "building" },
            { id: "gs-add-participant", label: "Add Participant", icon: "plus" },
            { id: "gs-participant-list", label: "Participants", icon: "users" },
            { id: "gs-registrations", label: "Registrations", icon: "fileText" },
            { id: "gs-reports", label: "Reports", icon: "fileText" }
          ]).map(i => React.createElement(
            "button",
            {
              key: i.id,
              onClick: () => { setCurrentView(i.id); onClose(); },
              className: `w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold ${
                currentView === i.id ? "nav-item-active" : "text-slate-300 hover:bg-white/5"
              }`
            },
            React.createElement(Icon, { name: i.icon }),
            React.createElement("span", null, i.label)
          ))
        )
      ),
      React.createElement(
        "button",
        {
          onClick: onLogout,
          className: "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-rose-300 hover:bg-rose-500/20"
        },
        React.createElement(Icon, { name: "logout" }),
        React.createElement("span", null, "Logout")
      )
    ),
    React.createElement("div", { className: "flex-1", onClick: onClose })
  );
}

// =============================================================
// APP HEADER (MATCHING IMAGES 2, 3, 4)
// =============================================================
function AppHeader({ currentUser, currentCollege, currentView, onToggleMobileDrawer, onOpenNotifications, onOpenChangePassword }) {
  const isAdmin = currentUser.role === "admin";

  let headerTitle = "Admin Dashboard";
  let subtitleBadge = null;

  if (currentView === "admin-dashboard") headerTitle = "Admin Dashboard";
  else if (currentView === "gs-dashboard") {
    headerTitle = "College Dashboard";
    subtitleBadge = `College Name: ${currentCollege?.name || "AEC Metro College"} (${currentCollege?.code || "AEC04"})`;
  }
  else if (currentView === "admin-events" || currentView === "event-management") headerTitle = "Event Management";
  else if (currentView.includes("registrations")) headerTitle = "Registration Management";
  else if (currentView === "admin-colleges") headerTitle = "College Directorate";
  else if (currentView.includes("reports")) headerTitle = "Reports & Analytics";
  else headerTitle = "Melange Fest Portal";

  return React.createElement(
    "header",
    { className: "bg-white border-b border-slate-200/80 px-4 md:px-8 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-sm" },

    // Left: Mobile drawer button + Page Title
    React.createElement(
      "div",
      { className: "flex items-center gap-3" },
      React.createElement(
        "button",
        {
          onClick: onToggleMobileDrawer,
          className: "md:hidden p-2 text-slate-600 hover:text-slate-900 focus:outline-none"
        },
        React.createElement(Icon, { name: "menu", className: "text-lg" })
      ),
      React.createElement(
        "div",
        null,
        React.createElement("h1", { className: "text-lg md:text-xl font-bold text-slate-900" }, headerTitle),
        subtitleBadge && React.createElement(
          "p",
          { className: "text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md inline-block mt-0.5 border border-purple-200/60" },
          subtitleBadge
        )
      )
    ),

    // Center: Search Input (Desktop)
    React.createElement(
      "div",
      { className: "hidden lg:flex items-center flex-1 max-w-xs mx-8" },
      React.createElement(
        "div",
        { className: "relative w-full" },
        React.createElement(
          "span",
          { className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" },
          React.createElement(Icon, { name: "search" })
        ),
        React.createElement("input", {
          type: "text",
          placeholder: "Search events, colleges...",
          className: "w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600"
        })
      )
    ),

    // Right: Notifications & User Profile Pill
    React.createElement(
      "div",
      { className: "flex items-center gap-3" },
      // Notification Bell
      React.createElement(
        "button",
        {
          onClick: onOpenNotifications,
          className: "relative p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition"
        },
        React.createElement(Icon, { name: "bell", className: "text-base" }),
        React.createElement(
          "span",
          { className: "absolute top-1 right-1 w-4 h-4 bg-blue-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white" },
          "1"
        )
      ),

      // Profile Pill matching Alex Carter / Rohit Sharma in screenshots
      React.createElement(
        "button",
        {
          onClick: onOpenChangePassword,
          title: "Click to change password or view profile",
          className: "flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition text-left"
        },
        React.createElement("img", {
          src: currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
          alt: currentUser.name,
          className: "w-8 h-8 rounded-full object-cover border border-purple-200"
        }),
        React.createElement(
          "div",
          { className: "hidden sm:block leading-tight" },
          React.createElement("span", { className: "block text-xs font-bold text-slate-800" }, currentUser.name),
          React.createElement("span", { className: "block text-[10px] text-slate-500 font-medium" }, currentUser.title || (isAdmin ? "Event Administrator" : "General Secretary"))
        )
      )
    )
  );
}

// =============================================================
// ANDROID BOTTOM NAVIGATION BAR
// =============================================================
function AndroidBottomNav({ currentUser, currentView, setCurrentView }) {
  const isAdmin = currentUser.role === "admin";

  const adminTabs = [
    { id: "admin-dashboard", label: "Dashboard", icon: "gear" },
    { id: "admin-events", label: "Events", icon: "calendar" },
    { id: "admin-registrations", label: "Registrations", icon: "fileText" },
    { id: "admin-reports", label: "Reports", icon: "download" }
  ];

  const gsTabs = [
    { id: "gs-dashboard", label: "Dashboard", icon: "gear" },
    { id: "gs-add-participant", label: "Add Student", icon: "plus" },
    { id: "gs-registrations", label: "Registrations", icon: "fileText" },
    { id: "gs-reports", label: "Reports", icon: "download" }
  ];

  const tabs = isAdmin ? adminTabs : gsTabs;

  return React.createElement(
    "nav",
    { className: "md:hidden mobile-bottom-nav" },
    tabs.map(tab => {
      const isActive = currentView === tab.id;
      return React.createElement(
        "button",
        {
          key: tab.id,
          onClick: () => setCurrentView(tab.id),
          className: `mobile-nav-btn ${isActive ? "active font-bold" : ""}`
        },
        React.createElement(
          "span",
          { className: "icon-indicator text-base mb-0.5" },
          React.createElement(Icon, { name: tab.icon })
        ),
        React.createElement("span", null, tab.label)
      );
    })
  );
}

// =============================================================
// TOAST BANNER (MATCHING IMAGE 4 BOTTOM-LEFT)
// =============================================================
function ToastBanner({ toast, onClose }) {
  return React.createElement(
    "div",
    { className: "fixed bottom-20 md:bottom-6 left-4 md:left-6 z-50 melange-toast" },
    React.createElement(
      "div",
      { className: "bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3 text-slate-800" },
      React.createElement(Icon, { name: "alert-triangle", className: "text-amber-500 text-sm" }),
      React.createElement(
        "div",
        { className: "text-xs font-semibold leading-snug" },
        React.createElement("span", { className: "block text-slate-900 font-bold" }, toast.message),
        React.createElement("span", { className: "block text-[11px] text-slate-400 font-normal" }, "Real-time updates active")
      ),
      React.createElement(
        "button",
        { onClick: onClose, className: "ml-2 text-slate-400 hover:text-slate-600" },
        React.createElement(Icon, { name: "close", className: "text-xs" })
      )
    )
  );
}

// =============================================================
// MODULE 2: ADMIN DASHBOARD VIEW (MATCHING IMAGE 2)
// =============================================================
function AdminDashboardView({ currentUser, setCurrentView, triggerToast }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddCollegeModal, setShowAddCollegeModal] = useState(false);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await MelangeAPI.getAdminDashboard();
        if (res.success) setDashboardData(res);
      } catch (err) {
        triggerToast("Failed to load dashboard data.", "error");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const handleDownloadExcel = async () => {
    try {
      await MelangeAPI.downloadExcelReport();
      triggerToast("Master directory Excel report downloaded successfully!", "success");
    } catch (e) {
      triggerToast("Download failed.", "error");
    }
  };

  if (loading) {
    return React.createElement("div", { className: "p-8 text-center text-slate-500" }, "Loading Admin Directorate...");
  }

  const { stats, recentActivities, growthChart, colleges, previewEvents } = dashboardData || {};

  return React.createElement(
    "div",
    { className: "space-y-6" },

    // 4 Top Overview Cards matching Image 2
    React.createElement(
      "div",
      { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" },

      // Card 1: Total Colleges Registered
      React.createElement(
        "div",
        { className: "card-tint-purple p-5 rounded-2xl stat-card-hover shadow-sm flex items-start justify-between" },
        React.createElement(
          "div",
          null,
          React.createElement("p", { className: "text-xs font-semibold text-slate-500 mb-1" }, "Total Colleges Registered"),
          React.createElement("h3", { className: "text-3xl font-extrabold text-slate-900 font-mono tracking-tight" }, "42"),
          React.createElement("span", { className: "inline-block text-[11px] font-bold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-md mt-2" }, "+5 this week")
        ),
        React.createElement(
          "div",
          { className: "w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-lg" },
          React.createElement(Icon, { name: "building" })
        )
      ),

      // Card 2: Total Participants
      React.createElement(
        "div",
        { className: "card-tint-blue p-5 rounded-2xl stat-card-hover shadow-sm flex items-start justify-between" },
        React.createElement(
          "div",
          null,
          React.createElement("p", { className: "text-xs font-semibold text-slate-500 mb-1" }, "Total Participants"),
          React.createElement("h3", { className: "text-3xl font-extrabold text-slate-900 font-mono tracking-tight" }, "1,240"),
          React.createElement("span", { className: "inline-block text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md mt-2" }, "85% capacity")
        ),
        React.createElement(
          "div",
          { className: "w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-lg" },
          React.createElement(Icon, { name: "users" })
        )
      ),

      // Card 3: Total Events
      React.createElement(
        "div",
        { className: "card-tint-gold p-5 rounded-2xl stat-card-hover shadow-sm flex items-start justify-between" },
        React.createElement(
          "div",
          null,
          React.createElement("p", { className: "text-xs font-semibold text-slate-500 mb-1" }, "Total Events"),
          React.createElement("h3", { className: "text-3xl font-extrabold text-slate-900 font-mono tracking-tight" }, "28"),
          React.createElement("span", { className: "inline-block text-[11px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md mt-2" }, "4 Arenas")
        ),
        React.createElement(
          "div",
          { className: "w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-lg" },
          React.createElement(Icon, { name: "calendar" })
        )
      ),

      // Card 4: Active Registrations
      React.createElement(
        "div",
        { className: "card-tint-green p-5 rounded-2xl stat-card-hover shadow-sm flex items-start justify-between" },
        React.createElement(
          "div",
          null,
          React.createElement("p", { className: "text-xs font-semibold text-slate-500 mb-1" }, "Active Registrations"),
          React.createElement("h3", { className: "text-3xl font-extrabold text-slate-900 font-mono tracking-tight" }, "845"),
          React.createElement("span", { className: "inline-block text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md mt-2" }, "Live")
        ),
        React.createElement(
          "div",
          { className: "w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg" },
          React.createElement(Icon, { name: "check-circle" })
        )
      )
    ),

    // Middle Row: Recent Activity + Registration Growth + Reports Quick Access
    React.createElement(
      "div",
      { className: "grid grid-cols-1 lg:grid-cols-12 gap-6" },

      // Left: Recent Activity (4 cols)
      React.createElement(
        "div",
        { className: "lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between" },
        React.createElement(
          "div",
          null,
          React.createElement("h3", { className: "text-sm font-bold text-slate-900 mb-4" }, "Recent Activity"),
          React.createElement(
            "div",
            { className: "space-y-4" },
            (recentActivities || []).map(act => React.createElement(
              "div",
              { key: act._id, className: "flex items-start gap-3" },
              React.createElement(
                "div",
                { className: `w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5 ${
                  act.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                  act.color === 'amber' ? 'bg-amber-100 text-amber-600' :
                  'bg-blue-100 text-blue-600'
                }` },
                React.createElement(Icon, { name: act.icon })
              ),
              React.createElement(
                "div",
                { className: "leading-snug" },
                React.createElement("p", { className: "text-xs font-semibold text-slate-800" }, act.title),
                React.createElement("span", { className: "text-[10px] text-slate-400" }, act.time)
              )
            ))
          )
        )
      ),

      // Center: Registration Growth Interactive Chart (5 cols)
      React.createElement(
        "div",
        { className: "lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between" },
        React.createElement("h3", { className: "text-sm font-bold text-slate-900 mb-2" }, "Registration Growth"),
        React.createElement(RegistrationGrowthSVGChart, { data: growthChart }),
        React.createElement(
          "div",
          { className: "flex items-center justify-center gap-6 pt-2 text-[11px] text-slate-500 font-medium" },
          React.createElement("span", { className: "flex items-center gap-1.5" },
            React.createElement("span", { className: "w-3 h-3 rounded-sm bg-purple-600 inline-block" }),
            "Monthly Volume"
          ),
          React.createElement("span", { className: "flex items-center gap-1.5" },
            React.createElement("span", { className: "w-3 h-1 bg-cyan-500 inline-block" }),
            "Growth Curve"
          )
        )
      ),

      // Right: Reports Quick Access (3 cols)
      React.createElement(
        "div",
        { className: "lg:col-span-3 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between" },
        React.createElement(
          "div",
          null,
          React.createElement("h3", { className: "text-sm font-bold text-slate-900 mb-4" }, "Reports Quick Access"),
          React.createElement(
            "div",
            { className: "space-y-3" },
            React.createElement(
              "button",
              {
                onClick: () => setCurrentView("admin-reports"),
                className: "w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs text-left transition flex items-center justify-between"
              },
              React.createElement("span", null, "College-wise Report"),
              React.createElement(Icon, { name: "fileText", className: "text-slate-400" })
            ),
            React.createElement(
              "button",
              {
                onClick: () => setCurrentView("admin-reports"),
                className: "w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs text-left transition flex items-center justify-between"
              },
              React.createElement("span", null, "Event-wise Report"),
              React.createElement(Icon, { name: "calendar", className: "text-slate-400" })
            ),
            React.createElement(
              "button",
              {
                onClick: handleDownloadExcel,
                className: "w-full py-3 px-4 rounded-xl btn-download-excel font-bold text-xs flex items-center justify-between shadow-md"
              },
              React.createElement("span", null, "Download Excel"),
              React.createElement(Icon, { name: "download", className: "text-sm" })
            )
          )
        )
      )
    ),

    // Bottom Row: Manage Colleges Table + Preview Events Card
    React.createElement(
      "div",
      { className: "grid grid-cols-1 lg:grid-cols-12 gap-6" },

      // Left 8 Cols: Manage Colleges Table
      React.createElement(
        "div",
        { className: "lg:col-span-8 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm" },
        React.createElement(
          "div",
          { className: "flex items-center justify-between mb-4" },
          React.createElement("h3", { className: "text-sm font-bold text-slate-900" }, "Manage Colleges"),
          React.createElement(
            "button",
            {
              onClick: () => setShowAddCollegeModal(true),
              className: "px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
            },
            React.createElement(Icon, { name: "plus" }),
            React.createElement("span", null, "+ Add College")
          )
        ),
        // Table container
        React.createElement(
          "div",
          { className: "table-scroll-container" },
          React.createElement(
            "table",
            { className: "w-full text-left border-collapse" },
            React.createElement(
              "thead",
              null,
              React.createElement(
                "tr",
                { className: "border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase" },
                React.createElement("th", { className: "pb-3" }, "College Name"),
                React.createElement("th", { className: "pb-3" }, "GS Name"),
                React.createElement("th", { className: "pb-3" }, "Email"),
                React.createElement("th", { className: "pb-3" }, "Contact Number"),
                React.createElement("th", { className: "pb-3 text-center" }, "Total Participants"),
                React.createElement("th", { className: "pb-3" }, "Status"),
                React.createElement("th", { className: "pb-3 text-right" }, "Actions")
              )
            ),
            React.createElement(
              "tbody",
              { className: "divide-y divide-slate-50 text-xs" },
              (colleges || []).map(col => React.createElement(
                "tr",
                { key: col._id, className: "hover:bg-slate-50/70 transition" },
                React.createElement("td", { className: "py-3 font-bold text-slate-800" }, col.name),
                React.createElement("td", { className: "py-3 text-slate-600" }, col.gsName),
                React.createElement("td", { className: "py-3 text-slate-500 font-mono text-[11px]" }, col.email),
                React.createElement("td", { className: "py-3 text-slate-600 font-mono text-[11px]" }, col.phone),
                React.createElement("td", { className: "py-3 text-center font-bold text-slate-900 font-mono" }, col.totalParticipants),
                React.createElement(
                  "td",
                  { className: "py-3" },
                  React.createElement(
                    "span",
                    {
                      className: `px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        col.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`
                    },
                    col.status
                  )
                ),
                React.createElement(
                  "td",
                  { className: "py-3 text-right space-x-2 text-slate-400" },
                  React.createElement("button", { title: "Edit", className: "hover:text-purple-600" }, React.createElement(Icon, { name: "edit" })),
                  React.createElement("button", { title: "Delete", className: "hover:text-rose-600" }, React.createElement(Icon, { name: "trash" })),
                  React.createElement("button", { title: "View", className: "hover:text-blue-600" }, React.createElement(Icon, { name: "eye" }))
                )
              ))
            )
          )
        )
      ),

      // Right 4 Cols: Manage Events Mini Preview matching Image 2
      React.createElement(
        "div",
        { className: "lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm" },
        React.createElement(
          "div",
          { className: "flex items-center justify-between mb-4" },
          React.createElement("h3", { className: "text-sm font-bold text-slate-900" }, "Manage Events"),
          React.createElement(
            "button",
            {
              onClick: () => setCurrentView("admin-events"),
              className: "text-xs font-bold text-purple-700 hover:underline"
            },
            "View All"
          )
        ),
        React.createElement(
          "div",
          { className: "space-y-4" },
          (previewEvents || []).map(ev => React.createElement(
            "div",
            { key: ev._id, className: "p-3.5 rounded-2xl border border-slate-100 hover:border-purple-200 transition bg-slate-50/50" },
            React.createElement(
              "div",
              { className: "flex gap-3 mb-2" },
              React.createElement("img", {
                src: ev.poster || "https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=200&q=80",
                alt: ev.name,
                className: "w-12 h-12 rounded-xl object-cover"
              }),
              React.createElement(
                "div",
                { className: "flex-1 min-w-0" },
                React.createElement("h4", { className: "text-xs font-bold text-slate-900 truncate" }, ev.name),
                React.createElement(
                  "div",
                  { className: "flex items-center gap-2 mt-0.5" },
                  React.createElement("span", { className: "text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded" }, ev.category),
                  React.createElement("span", { className: "text-[10px] text-slate-400" }, ev.date)
                ),
                React.createElement("p", { className: "text-[10px] text-slate-500 mt-0.5 truncate" }, `📍 ${ev.venue} • Limit: ${ev.maxCapacity}`)
              )
            ),
            React.createElement(
              "div",
              { className: "flex items-center justify-between pt-2 border-t border-slate-100" },
              React.createElement(
                "span",
                { className: "text-[11px] text-slate-500" },
                "Registration: ",
                React.createElement("span", { className: "font-bold text-amber-600" }, ev.status)
              ),
              React.createElement(
                "div",
                { className: "space-x-2" },
                React.createElement(
                  "button",
                  {
                    onClick: () => setCurrentView("admin-events"),
                    className: "px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                  },
                  "Edit"
                ),
                React.createElement(
                  "button",
                  {
                    onClick: () => setCurrentView("admin-events"),
                    className: "px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-600 hover:bg-rose-100"
                  },
                  "Delete"
                )
              )
            )
          ))
        )
      )
    ),

    // Modal: Add College
    showAddCollegeModal && React.createElement(AddCollegeModal, {
      onClose: () => setShowAddCollegeModal(false),
      onCollegeAdded: (newCol) => {
        setDashboardData(prev => ({
          ...prev,
          colleges: [newCol, ...(prev.colleges || [])]
        }));
        triggerToast(`College '${newCol.name}' successfully enrolled!`, "success");
        setShowAddCollegeModal(false);
      },
      triggerToast
    })
  );
}

// Interactive SVG Registration Growth Chart
function RegistrationGrowthSVGChart({ data = [] }) {
  const chartData = data.length > 0 ? data : [
    { month: 'Jan', registrations: 12 },
    { month: 'Mar', registrations: 24 },
    { month: 'May', registrations: 28 },
    { month: 'Jul', registrations: 22 },
    { month: 'Sep', registrations: 32 },
    { month: 'Oct', registrations: 40 }
  ];

  const maxVal = 45;
  const height = 120;
  const width = 360;

  // Build points for spline
  const points = chartData.map((d, i) => {
    const x = 30 + i * ((width - 60) / (chartData.length - 1));
    const y = height - (d.registrations / maxVal) * (height - 30) - 15;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  return React.createElement(
    "svg",
    { viewBox: `0 0 ${width} ${height}`, className: "w-full h-36" },
    // Horizontal grid lines
    [0.25, 0.5, 0.75, 1].map(lvl => React.createElement("line", {
      key: lvl,
      x1: 20,
      y1: height - lvl * (height - 30) - 10,
      x2: width - 20,
      y2: height - lvl * (height - 30) - 10,
      stroke: "#f1f5f9",
      strokeDasharray: "3 3"
    })),
    // Vertical bars
    points.map((p, i) => React.createElement(
      "rect",
      {
        key: i,
        x: p.x - 7,
        y: p.y,
        width: 14,
        height: height - 15 - p.y,
        fill: "#7c3aed",
        rx: 3,
        className: "transition-all duration-300 hover:fill-purple-500"
      }
    )),
    // Line Curve
    React.createElement("path", {
      d: pathD,
      fill: "none",
      stroke: "#06b6d4",
      strokeWidth: 3,
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }),
    // Dots on line
    points.map((p, i) => React.createElement("circle", {
      key: `dot-${i}`,
      cx: p.x,
      cy: p.y,
      r: 3.5,
      fill: "#ffffff",
      stroke: "#06b6d4",
      strokeWidth: 2
    })),
    // X-Axis Labels
    points.map((p, i) => React.createElement(
      "text",
      {
        key: `lbl-${i}`,
        x: p.x,
        y: height - 2,
        textAnchor: "middle",
        fill: "#94a3b8",
        fontSize: "10px",
        fontFamily: "Plus Jakarta Sans"
      },
      p.month
    ))
  );
}

// Modal: Add New College
function AddCollegeModal({ onClose, onCollegeAdded, triggerToast }) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    gsName: "",
    email: "",
    phone: "",
    city: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await MelangeAPI.createCollege(formData);
      if (res.success) {
        onCollegeAdded(res.college);
      }
    } catch (err) {
      triggerToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return React.createElement(
    "div",
    { className: "fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" },
    React.createElement(
      "div",
      { className: "bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-100" },
      React.createElement(
        "div",
        { className: "flex items-center justify-between pb-4 border-b border-slate-100 mb-4" },
        React.createElement("h3", { className: "text-lg font-bold text-slate-900" }, "Add Participating College"),
        React.createElement("button", { onClick: onClose, className: "text-slate-400 hover:text-slate-600" }, React.createElement(Icon, { name: "close" }))
      ),
      React.createElement(
        "form",
        { onSubmit: handleSubmit, className: "space-y-4" },
        React.createElement("div", { className: "grid grid-cols-2 gap-3" },
          React.createElement("div", null,
            React.createElement("label", { className: "block text-xs font-semibold text-slate-700 mb-1" }, "College Name"),
            React.createElement("input", {
              type: "text",
              value: formData.name,
              onChange: (e) => setFormData({ ...formData, name: e.target.value }),
              required: true,
              placeholder: "e.g. Pune Institute",
              className: "w-full px-3 py-2 border rounded-xl text-xs"
            })
          ),
          React.createElement("div", null,
            React.createElement("label", { className: "block text-xs font-semibold text-slate-700 mb-1" }, "College Code"),
            React.createElement("input", {
              type: "text",
              value: formData.code,
              onChange: (e) => setFormData({ ...formData, code: e.target.value.toUpperCase() }),
              required: true,
              placeholder: "e.g. PICT01",
              className: "w-full px-3 py-2 border rounded-xl text-xs uppercase"
            })
          )
        ),
        React.createElement("div", { className: "grid grid-cols-2 gap-3" },
          React.createElement("div", null,
            React.createElement("label", { className: "block text-xs font-semibold text-slate-700 mb-1" }, "GS Full Name"),
            React.createElement("input", {
              type: "text",
              value: formData.gsName,
              onChange: (e) => setFormData({ ...formData, gsName: e.target.value }),
              required: true,
              placeholder: "General Secretary Name",
              className: "w-full px-3 py-2 border rounded-xl text-xs"
            })
          ),
          React.createElement("div", null,
            React.createElement("label", { className: "block text-xs font-semibold text-slate-700 mb-1" }, "City / Campus"),
            React.createElement("input", {
              type: "text",
              value: formData.city,
              onChange: (e) => setFormData({ ...formData, city: e.target.value }),
              placeholder: "City",
              className: "w-full px-3 py-2 border rounded-xl text-xs"
            })
          )
        ),
        React.createElement("div", { className: "grid grid-cols-2 gap-3" },
          React.createElement("div", null,
            React.createElement("label", { className: "block text-xs font-semibold text-slate-700 mb-1" }, "Official Email"),
            React.createElement("input", {
              type: "email",
              value: formData.email,
              onChange: (e) => setFormData({ ...formData, email: e.target.value }),
              required: true,
              placeholder: "gs.college@fest.edu",
              className: "w-full px-3 py-2 border rounded-xl text-xs"
            })
          ),
          React.createElement("div", null,
            React.createElement("label", { className: "block text-xs font-semibold text-slate-700 mb-1" }, "Phone Number"),
            React.createElement("input", {
              type: "tel",
              value: formData.phone,
              onChange: (e) => setFormData({ ...formData, phone: e.target.value }),
              placeholder: "+91 98000 00000",
              className: "w-full px-3 py-2 border rounded-xl text-xs"
            })
          )
        ),
        React.createElement(
          "div",
          { className: "flex justify-end gap-3 pt-3" },
          React.createElement("button", { type: "button", onClick: onClose, className: "px-4 py-2 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-100" }, "Cancel"),
          React.createElement("button", { type: "submit", disabled: submitting, className: "px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl" }, submitting ? "Enrolling..." : "Enroll College")
        )
      )
    )
  );
}

// =============================================================
// MODULE 3: COLLEGE GS DASHBOARD VIEW (MATCHING IMAGE 3)
// =============================================================
function CollegeGSDashboardView({ currentUser, currentCollege, setCurrentCollege, setCurrentView, triggerToast }) {
  const [gsData, setGsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSuccessBanner, setShowSuccessBanner] = useState(true);

  // New Participant Form State
  const [participantForm, setParticipantForm] = useState({
    name: "Aryan Kapoor",
    gender: "Male",
    department: "Computer Science",
    year: "2024",
    phone: "+91 98765 4210",
    email: "aryan.k@aecmetro.edu",
    eventIds: ["ev_dance"],
    teamName: "AEC Solo Performer",
    idCardData: ""
  });
  const [isSubmittingParticipant, setIsSubmittingParticipant] = useState(false);

  // Filters for Participant Management Table
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEvent, setFilterEvent] = useState("All");
  const [filterYear, setFilterYear] = useState("All");

  // Edit Profile Modal
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  // Available fest events for dropdown
  const [availableEvents, setAvailableEvents] = useState([]);

  useEffect(() => {
    async function loadGS() {
      try {
        const [dashRes, evRes] = await Promise.all([
          MelangeAPI.getGSDashboard(),
          MelangeAPI.getEvents()
        ]);
        if (dashRes.success) {
          setGsData(dashRes);
          if (dashRes.college) setCurrentCollege(dashRes.college);
        }
        if (evRes.success) setAvailableEvents(evRes.events);
      } catch (err) {
        triggerToast("Failed to load college data.", "error");
      } finally {
        setLoading(false);
      }
    }
    loadGS();
  }, []);

  const handleAddParticipant = async (e) => {
    e.preventDefault();
    if (!participantForm.eventIds.length) {
      triggerToast("Please select at least one event.", "error");
      return;
    }
    setIsSubmittingParticipant(true);
    try {
      const res = await MelangeAPI.addGSParticipant(participantForm);
      if (res.success) {
        setShowSuccessBanner(true);
        triggerToast(`Participant enrolled successfully in ${participantForm.eventIds.length} event${participantForm.eventIds.length === 1 ? "" : "s"}!`, "success");
        // Refresh GS list
        const refreshed = await MelangeAPI.getGSDashboard();
        if (refreshed.success) setGsData(refreshed);
      }
    } catch (err) {
      triggerToast(err.message, "error");
    } finally {
      setIsSubmittingParticipant(false);
    }
  };

  const handleDeleteParticipant = async (id) => {
    if (!confirm("Are you sure you want to remove this participant registration?")) return;
    try {
      const res = await MelangeAPI.deleteGSParticipant(id);
      if (res.success) {
        triggerToast("Participant removed.", "info");
        const refreshed = await MelangeAPI.getGSDashboard();
        if (refreshed.success) setGsData(refreshed);
      }
    } catch (err) {
      triggerToast(err.message, "error");
    }
  };

  if (loading) {
    return React.createElement("div", { className: "p-8 text-center text-slate-500" }, "Loading College Portal...");
  }

  const college = currentCollege || gsData?.college || {
    name: "AEC Metro College",
    code: "AEC04",
    gsName: "Rohit Sharma",
    email: "gs.aec@gmail.com",
    phone: "+91 98765 43210"
  };

  const rawParticipants = gsData?.participants || [];
  const filteredParticipants = rawParticipants.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEvent = filterEvent === "All" || p.eventName === filterEvent || p.eventId === filterEvent;
    const matchesYear = filterYear === "All" || p.year === filterYear;
    return matchesSearch && matchesEvent && matchesYear;
  });

  return React.createElement(
    "div",
    { className: "space-y-6" },

    // 4 Top Metric Cards matching Image 3
    React.createElement(
      "div",
      { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" },

      // Card 1: Total Participants Registered
      React.createElement(
        "div",
        { className: "card-tint-purple p-5 rounded-2xl stat-card-hover shadow-sm flex items-start justify-between" },
        React.createElement(
          "div",
          null,
          React.createElement("p", { className: "text-xs font-semibold text-slate-500 mb-1" }, "Total Participants Registered"),
          React.createElement("h3", { className: "text-3xl font-extrabold text-slate-900 font-mono tracking-tight" }, college.totalParticipants || "42"),
          React.createElement("span", { className: "inline-block text-[11px] font-bold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-md mt-2" }, "+5 this week")
        ),
        React.createElement(
          "div",
          { className: "w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-lg" },
          React.createElement(Icon, { name: "users" })
        )
      ),

      // Card 2: Total Events Participated
      React.createElement(
        "div",
        { className: "card-tint-blue p-5 rounded-2xl stat-card-hover shadow-sm flex items-start justify-between" },
        React.createElement(
          "div",
          null,
          React.createElement("p", { className: "text-xs font-semibold text-slate-500 mb-1" }, "Total Events Participated"),
          React.createElement("h3", { className: "text-3xl font-extrabold text-slate-900 font-mono tracking-tight" }, college.eventsParticipated || "12"),
          React.createElement("span", { className: "inline-block text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md mt-2" }, "Active")
        ),
        React.createElement(
          "div",
          { className: "w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-lg" },
          React.createElement(Icon, { name: "calendar" })
        )
      ),

      // Card 3: Pending Registrations
      React.createElement(
        "div",
        { className: "card-tint-gold p-5 rounded-2xl stat-card-hover shadow-sm flex items-start justify-between" },
        React.createElement(
          "div",
          null,
          React.createElement("p", { className: "text-xs font-semibold text-slate-500 mb-1" }, "Pending Registrations"),
          React.createElement("h3", { className: "text-3xl font-extrabold text-slate-900 font-mono tracking-tight" }, college.pendingRegistrations || "8"),
          React.createElement("span", { className: "inline-block text-[11px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md mt-2" }, "Action required")
        ),
        React.createElement(
          "div",
          { className: "w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-lg" },
          React.createElement(Icon, { name: "alert-triangle" })
        )
      ),

      // Card 4: Completed Registrations
      React.createElement(
        "div",
        { className: "card-tint-green p-5 rounded-2xl stat-card-hover shadow-sm flex items-start justify-between" },
        React.createElement(
          "div",
          null,
          React.createElement("p", { className: "text-xs font-semibold text-slate-500 mb-1" }, "Completed Registrations"),
          React.createElement("h3", { className: "text-3xl font-extrabold text-slate-900 font-mono tracking-tight" }, college.completedRegistrations || "34"),
          React.createElement("span", { className: "inline-block text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md mt-2" }, "Approved")
        ),
        React.createElement(
          "div",
          { className: "w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg" },
          React.createElement(Icon, { name: "check-circle" })
        )
      )
    ),

    // Middle Row: College Profile (Left) + Add Participant Form (Right)
    React.createElement(
      "div",
      { className: "grid grid-cols-1 lg:grid-cols-12 gap-6" },

      // Left 4 Cols: College Profile Card matching Image 3
      React.createElement(
        "div",
        { className: "lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between" },
        React.createElement(
          "div",
          null,
          React.createElement("h3", { className: "text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" }, "College Profile"),
          React.createElement("h2", { className: "text-xl font-extrabold text-slate-900 mb-6" }, college.name),
          React.createElement(
            "div",
            { className: "space-y-3.5 text-xs" },
            React.createElement("div", { className: "flex justify-between py-1 border-b border-slate-50" },
              React.createElement("span", { className: "text-slate-400 font-medium" }, "GS:"),
              React.createElement("span", { className: "font-bold text-slate-800" }, college.gsName)
            ),
            React.createElement("div", { className: "flex justify-between py-1 border-b border-slate-50" },
              React.createElement("span", { className: "text-slate-400 font-medium" }, "Email:"),
              React.createElement("span", { className: "font-semibold text-slate-700 font-mono text-[11px]" }, college.email)
            ),
            React.createElement("div", { className: "flex justify-between py-1 border-b border-slate-50" },
              React.createElement("span", { className: "text-slate-400 font-medium" }, "Contact:"),
              React.createElement("span", { className: "font-semibold text-slate-700 font-mono text-[11px]" }, college.phone)
            ),
            React.createElement("div", { className: "flex justify-between py-1" },
              React.createElement("span", { className: "text-slate-400 font-medium" }, "Code:"),
              React.createElement("span", { className: "font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-mono" }, college.code)
            )
          )
        ),
        React.createElement(
          "button",
          {
            onClick: () => setShowEditProfileModal(true),
            className: "mt-6 w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition"
          },
          "Edit Profile"
        )
      ),

      // Right 8 Cols: Add Participant Form matching Image 3
      React.createElement(
        "div",
        { className: "lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm" },
        // Success Message alert banner matching Image 3
        showSuccessBanner && React.createElement(
          "div",
          { className: "mb-4 p-2.5 px-4 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold flex items-center justify-between" },
          React.createElement("span", { className: "flex items-center gap-1.5" },
            React.createElement(Icon, { name: "check-circle", className: "text-emerald-600" }),
            "Success message! Participant registered."
          ),
          React.createElement("button", { onClick: () => setShowSuccessBanner(false), className: "text-emerald-500 hover:text-emerald-700" }, React.createElement(Icon, { name: "close", className: "text-xs" }))
        ),

        React.createElement("h3", { className: "text-sm font-bold text-slate-900 mb-4" }, "Add Participant"),

        React.createElement(
          "form",
          { onSubmit: handleAddParticipant, className: "space-y-4" },

          // Row 1: Name, Gender, Department, Year
          React.createElement(
            "div",
            { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3" },
            React.createElement(
              "div",
              null,
              React.createElement("label", { className: "block text-[11px] font-bold text-slate-700 mb-1" }, "Student Full Name"),
              React.createElement("input", {
                type: "text",
                value: participantForm.name,
                onChange: (e) => setParticipantForm({ ...participantForm, name: e.target.value }),
                placeholder: "Aryan Kapoor",
                required: true,
                className: "w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-600"
              })
            ),
            React.createElement(
              "div",
              null,
              React.createElement("label", { className: "block text-[11px] font-bold text-slate-700 mb-1" }, "Gender"),
              React.createElement(
                "select",
                {
                  value: participantForm.gender,
                  onChange: (e) => setParticipantForm({ ...participantForm, gender: e.target.value }),
                  className: "w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-600 bg-white"
                },
                React.createElement("option", { value: "Active" }, "Active / Selected"),
                React.createElement("option", { value: "Male" }, "Male"),
                React.createElement("option", { value: "Female" }, "Female"),
                React.createElement("option", { value: "Other" }, "Other")
              )
            ),
            React.createElement(
              "div",
              null,
              React.createElement("label", { className: "block text-[11px] font-bold text-slate-700 mb-1" }, "Department"),
              React.createElement(
                "select",
                {
                  value: participantForm.department,
                  onChange: (e) => setParticipantForm({ ...participantForm, department: e.target.value }),
                  className: "w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-600 bg-white"
                },
                React.createElement("option", { value: "Computer Science" }, "Computer Science"),
                React.createElement("option", { value: "Information Technology" }, "Information Technology"),
                React.createElement("option", { value: "Mechanical Engineering" }, "Mechanical"),
                React.createElement("option", { value: "Electronics" }, "Electronics"),
                React.createElement("option", { value: "Civil Engineering" }, "Civil")
              )
            ),
            React.createElement(
              "div",
              null,
              React.createElement("label", { className: "block text-[11px] font-bold text-slate-700 mb-1" }, "Year"),
              React.createElement(
                "select",
                {
                  value: participantForm.year,
                  onChange: (e) => setParticipantForm({ ...participantForm, year: e.target.value }),
                  className: "w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-600 bg-white"
                },
                React.createElement("option", { value: "2024" }, "2024"),
                React.createElement("option", { value: "2025" }, "2025"),
                React.createElement("option", { value: "2026" }, "2026"),
                React.createElement("option", { value: "1st Year" }, "1st Year"),
                React.createElement("option", { value: "2nd Year" }, "2nd Year")
              )
            )
          ),

          // Row 2: Phone, Email
          React.createElement(
            "div",
            { className: "grid grid-cols-1 sm:grid-cols-2 gap-3" },
            React.createElement(
              "div",
              null,
              React.createElement("label", { className: "block text-[11px] font-bold text-slate-700 mb-1" }, "Phone Number"),
              React.createElement("input", {
                type: "tel",
                value: participantForm.phone,
                onChange: (e) => setParticipantForm({ ...participantForm, phone: e.target.value }),
                placeholder: "+91 98765 4210",
                required: true,
                className: "w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
              })
            ),
            React.createElement(
              "div",
              null,
              React.createElement("label", { className: "block text-[11px] font-bold text-slate-700 mb-1" }, "Email Address"),
              React.createElement("input", {
                type: "email",
                value: participantForm.email,
                onChange: (e) => setParticipantForm({ ...participantForm, email: e.target.value }),
                placeholder: "Email Address",
                required: true,
                className: "w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
              })
            )
          ),

          // Row 3: Select Event + Upload Student ID Card Dropzone
          React.createElement(
            "div",
            { className: "grid grid-cols-1 sm:grid-cols-2 gap-3 items-start" },
            React.createElement(
              "div",
              null,
              React.createElement("label", { className: "block text-[11px] font-bold text-slate-700 mb-1" }, "Select Events"),
              React.createElement(
                "details",
                { className: "relative" },
                React.createElement(
                  "summary",
                  { className: "w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white cursor-pointer list-none" },
                  `${participantForm.eventIds.length} event${participantForm.eventIds.length === 1 ? "" : "s"} selected`
                ),
                React.createElement(
                  "div",
                  { className: "mt-1 max-h-48 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-lg" },
                  availableEvents.map(ev => React.createElement(
                    "label",
                    { key: ev._id, className: "flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50 cursor-pointer" },
                    React.createElement("input", {
                      type: "checkbox",
                      checked: participantForm.eventIds.includes(ev._id),
                      onChange: (e) => setParticipantForm({
                        ...participantForm,
                        eventIds: e.target.checked
                          ? [...participantForm.eventIds, ev._id]
                          : participantForm.eventIds.filter(id => id !== ev._id)
                      }),
                      className: "accent-purple-700"
                    }),
                    React.createElement("span", { className: "text-slate-700" }, `${ev.name} (${ev.category}) - ${ev.remainingSlots || 0} slots left`)
                  ))
                )
              ),
              React.createElement("div", { className: "mt-3" },
                React.createElement("label", { className: "block text-[11px] font-bold text-slate-700 mb-1" }, "Team Name (optional)"),
                React.createElement("input", {
                  type: "text",
                  value: participantForm.teamName,
                  onChange: (e) => setParticipantForm({ ...participantForm, teamName: e.target.value }),
                  placeholder: "Optional team alias",
                  className: "w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                })
              )
            ),
            // Upload ID Card Dropzone matching Image 3
            React.createElement(
              "div",
              null,
              React.createElement("label", { className: "block text-[11px] font-bold text-slate-700 mb-1" }, "Upload Student ID Card"),
              React.createElement(
                "label",
                { className: "dropzone-box rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer text-center min-h-[96px]" },
                React.createElement(Icon, { name: "upload", className: "text-slate-400 text-lg mb-1" }),
                React.createElement("span", { className: "text-[11px] font-bold text-slate-700" }, "Upload dropzone"),
                React.createElement("span", { className: "text-[10px] text-slate-400" }, "Tap to choose or drag & drop ID card scan"),
                React.createElement("input", {
                  type: "file",
                  accept: "image/*,.pdf",
                  className: "hidden",
                  onChange: (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setParticipantForm({ ...participantForm, idCardData: "simulated_id_card_data" });
                      triggerToast(`Uploaded ID: ${file.name}`, "info");
                    }
                  }
                })
              )
            )
          ),

          // Action Buttons: Save Participant (Purple) + Reset Form
          React.createElement(
            "div",
            { className: "flex items-center gap-3 pt-2" },
            React.createElement(
              "button",
              {
                type: "submit",
                disabled: isSubmittingParticipant,
                className: "py-2.5 px-6 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md transition"
              },
              isSubmittingParticipant ? "Registering..." : "Save Participant"
            ),
            React.createElement(
              "button",
              {
                type: "button",
                onClick: () => setParticipantForm({
                  name: "",
                  gender: "Male",
                  department: "Computer Science",
                  year: "2024",
                  phone: "",
                  email: "",
                  eventIds: [availableEvents[0]?._id || "ev_dance"],
                  teamName: "",
                  idCardData: ""
                }),
                className: "py-2.5 px-5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition"
              },
              "Reset Form"
            )
          )
        )
      )
    ),

    // Bottom Row: Participant Management Table matching Image 3
    React.createElement(
      "div",
      { className: "bg-white p-6 rounded-3xl border border-slate-100 shadow-sm" },
      React.createElement(
        "div",
        { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4" },
        React.createElement("h3", { className: "text-sm font-bold text-slate-900" }, "Participant Management"),
        // Search & Filters matching Image 3
        React.createElement(
          "div",
          { className: "flex flex-wrap items-center gap-2" },
          // Search input
          React.createElement(
            "div",
            { className: "relative min-w-[180px]" },
            React.createElement(
              "span",
              { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" },
              React.createElement(Icon, { name: "search" })
            ),
            React.createElement("input", {
              type: "text",
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value),
              placeholder: "Search participant...",
              className: "w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none"
            })
          ),
          // Filter by Event
          React.createElement(
            "select",
            {
              value: filterEvent,
              onChange: (e) => setFilterEvent(e.target.value),
              className: "px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-700"
            },
            React.createElement("option", { value: "All" }, "Filter by Event ∨"),
            availableEvents.map(e => React.createElement("option", { key: e._id, value: e.name }, e.name))
          ),
          // Filter by Year
          React.createElement(
            "select",
            {
              value: filterYear,
              onChange: (e) => setFilterYear(e.target.value),
              className: "px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-700"
            },
            React.createElement("option", { value: "All" }, "Filter by Year ∨"),
            React.createElement("option", { value: "2024" }, "2024"),
            React.createElement("option", { value: "2025" }, "2025"),
            React.createElement("option", { value: "2026" }, "2026")
          )
        )
      ),

      // Table container
      React.createElement(
        "div",
        { className: "table-scroll-container" },
        React.createElement(
          "table",
          { className: "w-full text-left border-collapse" },
          React.createElement(
            "thead",
            null,
            React.createElement(
              "tr",
              { className: "border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase" },
              React.createElement("th", { className: "pb-3" }, "Student Name ↕"),
              React.createElement("th", { className: "pb-3" }, "Department"),
              React.createElement("th", { className: "pb-3" }, "Year ↕"),
              React.createElement("th", { className: "pb-3" }, "Contact ↕"),
              React.createElement("th", { className: "pb-3" }, "Event"),
              React.createElement("th", { className: "pb-3" }, "Registration Status"),
              React.createElement("th", { className: "pb-3 text-right" }, "Actions")
            )
          ),
          React.createElement(
            "tbody",
            { className: "divide-y divide-slate-50 text-xs" },
            filteredParticipants.length === 0 ? React.createElement(
              "tr",
              null,
              React.createElement("td", { colSpan: 7, className: "py-6 text-center text-slate-400" }, "No participants found matching your criteria.")
            ) :
            filteredParticipants.map(part => React.createElement(
              "tr",
              { key: part._id, className: "hover:bg-slate-50/70 transition" },
              React.createElement("td", { className: "py-3 font-bold text-slate-900" }, part.name),
              React.createElement("td", { className: "py-3 text-slate-600" }, part.department),
              React.createElement("td", { className: "py-3 text-slate-600 font-mono" }, part.year),
              React.createElement("td", { className: "py-3 text-slate-600 font-mono text-[11px]" }, part.phone),
              React.createElement("td", { className: "py-3 font-semibold text-purple-900" }, part.eventName),
              React.createElement(
                "td",
                { className: "py-3" },
                React.createElement(
                  "div",
                  { className: "flex items-center gap-1.5" },
                  React.createElement(
                    "span",
                    { className: "px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700" },
                    part.status || "Active"
                  ),
                  part.status === "Pending" && React.createElement(
                    "span",
                    { className: "px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700" },
                    "Pending"
                  )
                )
              ),
              React.createElement(
                "td",
                { className: "py-3 text-right space-x-3 text-xs" },
                React.createElement("button", { onClick: () => alert(`Student: ${part.name}\nCollege: ${college.name}\nEvent: ${part.eventName}\nContact: ${part.phone}`), className: "text-slate-600 hover:text-blue-600 font-semibold" }, "View"),
                React.createElement("button", { onClick: () => alert("Edit modal for: " + part.name), className: "text-slate-600 hover:text-purple-600 font-semibold" }, "Edit"),
                React.createElement("button", { onClick: () => handleDeleteParticipant(part._id), className: "text-rose-500 hover:text-rose-700 font-semibold" }, "Delete")
              )
            ))
          )
        )
      )
    ),

    // Modal: Edit College Profile
    showEditProfileModal && React.createElement(EditCollegeProfileModal, {
      college,
      onClose: () => setShowEditProfileModal(false),
      onProfileUpdated: (updated) => {
        setCurrentCollege(updated);
        triggerToast("College profile updated!", "success");
        setShowEditProfileModal(false);
      },
      triggerToast
    })
  );
}

// Modal: Edit College Profile
function EditCollegeProfileModal({ college, onClose, onProfileUpdated, triggerToast }) {
  const [formData, setFormData] = useState({
    gsName: college.gsName || "",
    email: college.email || "",
    phone: college.phone || "",
    city: college.city || ""
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await MelangeAPI.updateGSProfile(formData);
      if (res.success) onProfileUpdated(res.college);
    } catch (err) {
      triggerToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return React.createElement(
    "div",
    { className: "fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" },
    React.createElement(
      "div",
      { className: "bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-100" },
      React.createElement(
        "div",
        { className: "flex items-center justify-between pb-4 border-b border-slate-100 mb-4" },
        React.createElement("h3", { className: "text-lg font-bold text-slate-900" }, `Edit Profile - ${college.name}`),
        React.createElement("button", { onClick: onClose, className: "text-slate-400 hover:text-slate-600" }, React.createElement(Icon, { name: "close" }))
      ),
      React.createElement(
        "form",
        { onSubmit: handleSubmit, className: "space-y-4" },
        React.createElement("div", null,
          React.createElement("label", { className: "block text-xs font-semibold text-slate-700 mb-1" }, "GS Full Name"),
          React.createElement("input", {
            type: "text",
            value: formData.gsName,
            onChange: (e) => setFormData({ ...formData, gsName: e.target.value }),
            required: true,
            className: "w-full px-3 py-2 border rounded-xl text-sm"
          })
        ),
        React.createElement("div", null,
          React.createElement("label", { className: "block text-xs font-semibold text-slate-700 mb-1" }, "Official Email"),
          React.createElement("input", {
            type: "email",
            value: formData.email,
            onChange: (e) => setFormData({ ...formData, email: e.target.value }),
            required: true,
            className: "w-full px-3 py-2 border rounded-xl text-sm"
          })
        ),
        React.createElement("div", null,
          React.createElement("label", { className: "block text-xs font-semibold text-slate-700 mb-1" }, "Contact Number"),
          React.createElement("input", {
            type: "tel",
            value: formData.phone,
            onChange: (e) => setFormData({ ...formData, phone: e.target.value }),
            required: true,
            className: "w-full px-3 py-2 border rounded-xl text-sm"
          })
        ),
        React.createElement(
          "div",
          { className: "flex justify-end gap-3 pt-2" },
          React.createElement("button", { type: "button", onClick: onClose, className: "px-4 py-2 text-sm text-slate-600 rounded-xl hover:bg-slate-100" }, "Cancel"),
          React.createElement("button", { type: "submit", disabled: saving, className: "px-5 py-2 text-sm font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl" }, saving ? "Saving..." : "Save Profile")
        )
      )
    )
  );
}

// =============================================================
// MODULE 4: EVENT MANAGEMENT VIEW (MATCHING IMAGE 4)
// =============================================================
function EventManagementView({ currentUser, triggerToast }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [venueFilter, setVenueFilter] = useState("All");

  // Slide-over Drawer / Modal State
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  // Delete Confirmation Dialog State
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState(null);

  const fetchEvents = async () => {
    try {
      const res = await MelangeAPI.getEvents();
      if (res.success) setEvents(res.events);
    } catch (e) {
      triggerToast("Failed to load events.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleOpenCreateDrawer = () => {
    setEditingEvent(null);
    setShowDrawer(true);
  };

  const handleOpenEditDrawer = (ev) => {
    setEditingEvent(ev);
    setShowDrawer(true);
  };

  const handleDeleteConfirm = async (id) => {
    try {
      const res = await MelangeAPI.deleteEvent(id);
      if (res.success) {
        triggerToast("Event deleted successfully.", "info");
        setDeleteConfirmEvent(null);
        fetchEvents();
      }
    } catch (err) {
      triggerToast(err.message, "error");
    }
  };

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "All" || e.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesStatus = statusFilter === "All" || e.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesVenue = venueFilter === "All" || e.venue.toLowerCase().includes(venueFilter.toLowerCase());
    return matchesSearch && matchesCategory && matchesStatus && matchesVenue;
  });

  return React.createElement(
    "div",
    { className: "space-y-6" },

    // Top Action Header with Create Event Button matching Image 4
    React.createElement(
      "div",
      { className: "flex flex-col md:flex-row md:items-center justify-between gap-4" },
      React.createElement(
        "div",
        null,
        React.createElement("h2", { className: "text-2xl font-extrabold text-slate-900" }, "Event Management"),
        React.createElement("p", { className: "text-xs text-slate-500 font-medium" }, "Create, update, and manage all college fest events")
      ),
      React.createElement(
        "div",
        { className: "flex items-center gap-3" },
        // Create Event Purple Button
        React.createElement(
          "button",
          {
            onClick: handleOpenCreateDrawer,
            className: "py-2.5 px-5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-purple-700/20 transition active:scale-95"
          },
          React.createElement(Icon, { name: "plus" }),
          React.createElement("span", null, "Create Event")
        )
      )
    ),

    // Filter Bar matching Image 4 (Search, Category ∨, Date ∨, Status ∨, Venue ∨)
    React.createElement(
      "div",
      { className: "bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-3" },
      // Search
      React.createElement(
        "div",
        { className: "relative flex-1 min-w-[200px]" },
        React.createElement(
          "span",
          { className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" },
          React.createElement(Icon, { name: "search" })
        ),
        React.createElement("input", {
          type: "text",
          value: searchTerm,
          onChange: (e) => setSearchTerm(e.target.value),
          placeholder: "Search events...",
          className: "w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none"
        })
      ),
      // Category filter
      React.createElement(
        "select",
        {
          value: categoryFilter,
          onChange: (e) => setCategoryFilter(e.target.value),
          className: "px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-700"
        },
        React.createElement("option", { value: "All" }, "Category ∨"),
        React.createElement("option", { value: "Cultural" }, "Cultural"),
        React.createElement("option", { value: "Music" }, "Music"),
        React.createElement("option", { value: "Fine Arts" }, "Fine Arts"),
        React.createElement("option", { value: "Literary" }, "Literary")
      ),
      // Status filter
      React.createElement(
        "select",
        {
          value: statusFilter,
          onChange: (e) => setStatusFilter(e.target.value),
          className: "px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-700"
        },
        React.createElement("option", { value: "All" }, "Status ∨"),
        React.createElement("option", { value: "Open" }, "Open"),
        React.createElement("option", { value: "Upcoming" }, "Upcoming"),
        React.createElement("option", { value: "Closed" }, "Closed")
      ),
      // Venue filter
      React.createElement(
        "select",
        {
          value: venueFilter,
          onChange: (e) => setVenueFilter(e.target.value),
          className: "px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-700"
        },
        React.createElement("option", { value: "All" }, "Venue ∨"),
        React.createElement("option", { value: "Main Auditorium" }, "Main Auditorium"),
        React.createElement("option", { value: "Open Ground" }, "Open Ground"),
        React.createElement("option", { value: "Main Arena" }, "Main Arena"),
        React.createElement("option", { value: "Chanakya Senate Hall" }, "Chanakya Hall")
      )
    ),

    // 4 Metric Stats Cards matching Image 4
    React.createElement(
      "div",
      { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" },

      // Card 1: Total Events
      React.createElement(
        "div",
        { className: "bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between" },
        React.createElement(
          "div",
          null,
          React.createElement("p", { className: "text-xs font-semibold text-slate-500 mb-1" }, "Total Events"),
          React.createElement("h3", { className: "text-3xl font-extrabold text-slate-900 font-mono" }, "28"),
          React.createElement("span", { className: "text-[11px] text-slate-400 mt-1 block" }, "Across all categories")
        ),
        React.createElement(
          "div",
          { className: "w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-base" },
          React.createElement(Icon, { name: "calendar" })
        )
      ),

      // Card 2: Active Events
      React.createElement(
        "div",
        { className: "bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between" },
        React.createElement(
          "div",
          null,
          React.createElement("p", { className: "text-xs font-semibold text-slate-500 mb-1" }, "Active Events"),
          React.createElement("h3", { className: "text-3xl font-extrabold text-slate-900 font-mono" }, "18"),
          React.createElement("span", { className: "text-[11px] text-slate-400 mt-1 block" }, "Open for registration")
        ),
        React.createElement(
          "div",
          { className: "w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-base" },
          React.createElement(Icon, { name: "circle-dot" })
        )
      ),

      // Card 3: Completed Events
      React.createElement(
        "div",
        { className: "bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between" },
        React.createElement(
          "div",
          null,
          React.createElement("p", { className: "text-xs font-semibold text-slate-500 mb-1" }, "Completed Events"),
          React.createElement("h3", { className: "text-3xl font-extrabold text-slate-900 font-mono" }, "6"),
          React.createElement("span", { className: "text-[11px] text-slate-400 mt-1 block" }, "Finished successfully")
        ),
        React.createElement(
          "div",
          { className: "w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-base" },
          React.createElement(Icon, { name: "check-circle" })
        )
      ),

      // Card 4: Upcoming Events
      React.createElement(
        "div",
        { className: "bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between" },
        React.createElement(
          "div",
          null,
          React.createElement("p", { className: "text-xs font-semibold text-slate-500 mb-1" }, "Upcoming Events"),
          React.createElement("h3", { className: "text-3xl font-extrabold text-slate-900 font-mono" }, "4"),
          React.createElement("span", { className: "text-[11px] text-slate-400 mt-1 block" }, "Yet to launch")
        ),
        React.createElement(
          "div",
          { className: "w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-base" },
          React.createElement(Icon, { name: "hourglass" })
        )
      )
    ),

    // "All Events" Responsive Card Grid (Middle Section matching Image 4)
    React.createElement(
      "div",
      null,
      React.createElement("h3", { className: "text-base font-extrabold text-slate-900 mb-4" }, "All Events"),
      React.createElement(
        "div",
        { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" },
        filteredEvents.map(ev => {
          const fillPercent = Math.min(100, Math.round(((ev.registeredCount || 0) / (ev.maxCapacity || 20)) * 100));
          const isRemainingLow = (ev.remainingSlots !== undefined ? ev.remainingSlots : (ev.maxCapacity - ev.registeredCount)) <= 5;

          return React.createElement(
            "div",
            {
              key: ev._id,
              className: "bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
            },
            React.createElement(
              "div",
              null,
              // Banner Poster Image
              React.createElement(
                "div",
                { className: "h-40 w-full relative overflow-hidden bg-slate-900" },
                React.createElement("img", {
                  src: ev.poster || "https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=600&q=80",
                  alt: ev.name,
                  className: "w-full h-full object-cover"
                }),
                React.createElement(
                  "div",
                  { className: "absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-sm" },
                  ev.category
                ),
                React.createElement(
                  "div",
                  {
                    className: `absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      ev.status === "Open" ? "bg-emerald-500 text-white" :
                      ev.status === "Upcoming" ? "bg-amber-500 text-white" : "bg-slate-700 text-white"
                    }`
                  },
                  ev.status
                )
              ),

              // Card Content
              React.createElement(
                "div",
                { className: "p-5" },
                React.createElement("h4", { className: "text-base font-bold text-slate-900 mb-1" }, ev.name),
                React.createElement(
                  "div",
                  { className: "flex items-center gap-3 text-xs text-slate-500 mb-3" },
                  React.createElement("span", { className: "flex items-center gap-1" },
                    React.createElement(Icon, { name: "calendar", className: "text-[11px]" }),
                    ev.date
                  ),
                  React.createElement("span", null, "•"),
                  React.createElement("span", { className: "truncate" }, `📍 ${ev.venue}`)
                ),

                // Registration Stats & Warning
                React.createElement(
                  "div",
                  { className: "flex items-center justify-between text-xs font-semibold mb-2" },
                  React.createElement("span", { className: "text-slate-700" }, `${ev.registeredCount || 0}/${ev.maxCapacity || 20} Registered`),
                  isRemainingLow && React.createElement(
                    "span",
                    { className: "text-rose-600 font-bold text-[11px] bg-rose-50 px-2 py-0.5 rounded-full flex items-center gap-1" },
                    React.createElement(Icon, { name: "alert-triangle", className: "text-[10px]" }),
                    `Remaining Slots: ${ev.remainingSlots !== undefined ? ev.remainingSlots : (ev.maxCapacity - ev.registeredCount)}`
                  )
                ),

                // Gold Progress Bar
                React.createElement(
                  "div",
                  { className: "w-full bg-slate-100 rounded-full h-1.5 overflow-hidden" },
                  React.createElement("div", {
                    className: "progress-bar-gold h-full",
                    style: { width: `${fillPercent}%` }
                  })
                )
              )
            ),

            // Bottom Actions with Inline Delete Confirmation Popover
            React.createElement(
              "div",
              { className: "p-4 px-5 border-t border-slate-50 flex items-center justify-between relative bg-slate-50/30" },
              React.createElement("span", { className: "text-xs font-semibold text-slate-500" }, `${ev.type || "Individual"} entry`),
              React.createElement(
                "div",
                { className: "flex items-center gap-1.5" },
                // View button
                React.createElement(
                  "button",
                  {
                    onClick: () => alert(`Event: ${ev.name}\nRules: ${ev.rules || "Standard fest rules"}\nCoordinator: ${ev.coordinatorName} (${ev.coordinatorContact})`),
                    title: "View Details",
                    className: "w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 flex items-center justify-center transition"
                  },
                  React.createElement(Icon, { name: "eye", className: "text-xs" })
                ),
                // Edit button
                React.createElement(
                  "button",
                  {
                    onClick: () => handleOpenEditDrawer(ev),
                    title: "Edit Event",
                    className: "w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-purple-600 hover:border-purple-300 flex items-center justify-center transition"
                  },
                  React.createElement(Icon, { name: "edit", className: "text-xs" })
                ),
                // Delete button
                React.createElement(
                  "button",
                  {
                    onClick: () => setDeleteConfirmEvent(ev),
                    title: "Delete Event",
                    className: "w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-300 flex items-center justify-center transition"
                  },
                  React.createElement(Icon, { name: "trash", className: "text-xs" })
                )
              ),

              // Inline Delete Confirmation Dialog matching Image 4
              deleteConfirmEvent && deleteConfirmEvent._id === ev._id && React.createElement(
                "div",
                { className: "absolute right-4 bottom-14 z-30 bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 w-64 text-left animate-in fade-in" },
                React.createElement("p", { className: "text-xs font-bold text-slate-800 mb-2" }, "Are you sure you want to delete this event?"),
                React.createElement(
                  "div",
                  { className: "flex items-center justify-end gap-2 text-xs font-bold" },
                  React.createElement(
                    "button",
                    {
                      onClick: () => setDeleteConfirmEvent(null),
                      className: "px-2.5 py-1 rounded-lg text-slate-500 hover:bg-slate-100"
                    },
                    "Cancel"
                  ),
                  React.createElement(
                    "button",
                    {
                      onClick: () => handleDeleteConfirm(ev._id),
                      className: "px-2.5 py-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                    },
                    "Confirm Delete"
                  )
                )
              )
            )
          );
        })
      )
    ),

    // Quick Inline Table Preview matching Bottom of Image 4
    React.createElement(
      "div",
      { className: "bg-white p-6 rounded-3xl border border-slate-100 shadow-sm" },
      React.createElement("h3", { className: "text-sm font-bold text-slate-900 mb-4" }, "Quick inline table preview"),
      React.createElement(
        "div",
        { className: "table-scroll-container" },
        React.createElement(
          "table",
          { className: "w-full text-left border-collapse" },
          React.createElement(
            "thead",
            null,
            React.createElement(
              "tr",
              { className: "border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase" },
              React.createElement("th", { className: "pb-3" }, "Event Name"),
              React.createElement("th", { className: "pb-3" }, "Category"),
              React.createElement("th", { className: "pb-3" }, "Schedule"),
              React.createElement("th", { className: "pb-3" }, "Participants/Teams Limit"),
              React.createElement("th", { className: "pb-3" }, "Registered"),
              React.createElement("th", { className: "pb-3" }, "Status")
            )
          ),
          React.createElement(
            "tbody",
            { className: "divide-y divide-slate-50 text-xs" },
            events.map(ev => React.createElement(
              "tr",
              { key: `row-${ev._id}`, className: "hover:bg-slate-50/70 transition" },
              React.createElement("td", { className: "py-3 font-bold text-slate-900" }, ev.name),
              React.createElement("td", { className: "py-3" },
                React.createElement("span", { className: "px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700" }, ev.category)
              ),
              React.createElement("td", { className: "py-3 text-slate-600 font-mono text-[11px]" }, ev.schedule || `${ev.date}, ${ev.startTime}`),
              React.createElement("td", { className: "py-3 text-slate-700 font-mono" }, `${ev.maxTeamSize || 1}/${ev.maxCapacity || 20}`),
              React.createElement("td", { className: "py-3 text-slate-700 font-mono" }, `${ev.registeredCount || 0}/${ev.maxCapacity || 20}`),
              React.createElement(
                "td",
                { className: "py-3" },
                React.createElement(
                  "span",
                  {
                    className: `px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      ev.status === "Open" ? "bg-emerald-100 text-emerald-700" :
                      ev.status === "Upcoming" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"
                    }`
                  },
                  ev.status
                )
              )
            ))
          )
        )
      )
    ),

    // Slide-over Drawer: "Create New Event" / "Edit Event" matching Image 4 Right Side
    showDrawer && React.createElement(CreateOrEditEventDrawer, {
      eventToEdit: editingEvent,
      onClose: () => setShowDrawer(false),
      onEventSaved: () => {
        setShowDrawer(false);
        fetchEvents();
        triggerToast(editingEvent ? "Event updated successfully!" : "New event created!", "success");
      },
      triggerToast
    })
  );
}

// =============================================================
// CREATE / EDIT EVENT DRAWER (MATCHING IMAGE 4 RIGHT PANEL)
// =============================================================
function CreateOrEditEventDrawer({ eventToEdit, onClose, onEventSaved, triggerToast }) {
  const [formData, setFormData] = useState({
    name: eventToEdit?.name || "Hip-Hop Dance Competition",
    category: eventToEdit?.category || "Cultural",
    description: eventToEdit?.description || "High-octane street style battle including popping, locking, breaking and synchronized choreography.",
    rules: eventToEdit?.rules || "Crew size up to 5 dancers. Routine must be 4 to 6 minutes. Clean music mandatory.",
    date: eventToEdit?.date || "2026-10-18",
    startTime: eventToEdit?.startTime || "18:00",
    endTime: eventToEdit?.endTime || "20:30",
    venue: eventToEdit?.venue || "Main Arena",
    type: eventToEdit?.type || "Team",
    maxTeamSize: eventToEdit?.maxTeamSize || 5,
    maxCapacity: eventToEdit?.maxCapacity || 20,
    registrationDeadline: eventToEdit?.registrationDeadline || "2026-10-12",
    poster: eventToEdit?.poster || "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80",
    coordinatorName: eventToEdit?.coordinatorName || "Rohan Verma",
    coordinatorContact: eventToEdit?.coordinatorContact || "+91 98765 11223",
    status: eventToEdit?.status || "Open"
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (isDraft = false) => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        status: isDraft ? "Draft" : formData.status
      };

      if (eventToEdit) {
        await MelangeAPI.updateEvent(eventToEdit._id, payload);
      } else {
        await MelangeAPI.createEvent(payload);
      }
      onEventSaved();
    } catch (err) {
      triggerToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return React.createElement(
    "div",
    { className: "fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end" },
    React.createElement(
      "div",
      { className: "w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300" },

      // Drawer Header
      React.createElement(
        "div",
        { className: "p-6 border-b border-slate-100 flex items-center justify-between" },
        React.createElement("h3", { className: "text-lg font-bold text-slate-900" }, eventToEdit ? "Edit Event" : "Create New Event"),
        React.createElement("button", { onClick: onClose, className: "text-slate-400 hover:text-slate-600" }, React.createElement(Icon, { name: "close" }))
      ),

      // Drawer Form Body (Scrollable)
      React.createElement(
        "div",
        { className: "flex-1 overflow-y-auto p-6 space-y-5" },

        // Event Name & Category
        React.createElement(
          "div",
          { className: "grid grid-cols-1 sm:grid-cols-2 gap-3" },
          React.createElement("div", null,
            React.createElement("label", { className: "block text-xs font-bold text-slate-700 mb-1" }, "Event Name"),
            React.createElement("input", {
              type: "text",
              value: formData.name,
              onChange: (e) => setFormData({ ...formData, name: e.target.value }),
              required: true,
              placeholder: "e.g. Hip-Hop Dance Competition",
              className: "w-full px-3 py-2 border rounded-xl text-xs"
            })
          ),
          React.createElement("div", null,
            React.createElement("label", { className: "block text-xs font-bold text-slate-700 mb-1" }, "Event Category"),
            React.createElement(
              "select",
              {
                value: formData.category,
                onChange: (e) => setFormData({ ...formData, category: e.target.value }),
                className: "w-full px-3 py-2 border rounded-xl text-xs bg-white"
              },
              React.createElement("option", { value: "Cultural" }, "Cultural"),
              React.createElement("option", { value: "Music" }, "Music"),
              React.createElement("option", { value: "Fine Arts" }, "Fine Arts"),
              React.createElement("option", { value: "Literary" }, "Literary")
            )
          )
        ),

        // Details: Description & Rules
        React.createElement("div", null,
          React.createElement("label", { className: "block text-xs font-bold text-slate-700 mb-1" }, "Event Description"),
          React.createElement("textarea", {
            value: formData.description,
            onChange: (e) => setFormData({ ...formData, description: e.target.value }),
            rows: 2,
            placeholder: "Event Description",
            className: "w-full px-3 py-2 border rounded-xl text-xs"
          })
        ),
        React.createElement("div", null,
          React.createElement("label", { className: "block text-xs font-bold text-slate-700 mb-1" }, "Rules & Guidelines"),
          React.createElement("textarea", {
            value: formData.rules,
            onChange: (e) => setFormData({ ...formData, rules: e.target.value }),
            rows: 2,
            placeholder: "Rules & Guidelines",
            className: "w-full px-3 py-2 border rounded-xl text-xs"
          })
        ),

        // Schedule & Venue
        React.createElement(
          "div",
          null,
          React.createElement("h4", { className: "text-xs font-extrabold text-slate-800 uppercase mb-2" }, "Schedule & Venue"),
          React.createElement(
            "div",
            { className: "grid grid-cols-3 gap-2 mb-2" },
            React.createElement("div", null,
              React.createElement("label", { className: "block text-[10px] font-semibold text-slate-500 mb-0.5" }, "Date"),
              React.createElement("input", {
                type: "date",
                value: formData.date,
                onChange: (e) => setFormData({ ...formData, date: e.target.value }),
                className: "w-full px-2 py-1.5 border rounded-lg text-xs"
              })
            ),
            React.createElement("div", null,
              React.createElement("label", { className: "block text-[10px] font-semibold text-slate-500 mb-0.5" }, "Start Time"),
              React.createElement("input", {
                type: "time",
                value: formData.startTime,
                onChange: (e) => setFormData({ ...formData, startTime: e.target.value }),
                className: "w-full px-2 py-1.5 border rounded-lg text-xs"
              })
            ),
            React.createElement("div", null,
              React.createElement("label", { className: "block text-[10px] font-semibold text-slate-500 mb-0.5" }, "End Time"),
              React.createElement("input", {
                type: "time",
                value: formData.endTime,
                onChange: (e) => setFormData({ ...formData, endTime: e.target.value }),
                className: "w-full px-2 py-1.5 border rounded-lg text-xs"
              })
            )
          ),
          React.createElement(
            "div",
            null,
            React.createElement("label", { className: "block text-[10px] font-semibold text-slate-500 mb-0.5" }, "Venue"),
            React.createElement(
              "select",
              {
                value: formData.venue,
                onChange: (e) => setFormData({ ...formData, venue: e.target.value }),
                className: "w-full px-3 py-2 border rounded-xl text-xs bg-white"
              },
              React.createElement("option", { value: "Main Arena" }, "Main Arena"),
              React.createElement("option", { value: "Main Auditorium" }, "Main Auditorium"),
              React.createElement("option", { value: "Open Ground" }, "Open Ground"),
              React.createElement("option", { value: "Chanakya Senate Hall" }, "Chanakya Senate Hall")
            )
          )
        ),

        // Participation & Limits (Type toggle Individual / Team)
        React.createElement(
          "div",
          null,
          React.createElement("h4", { className: "text-xs font-extrabold text-slate-800 uppercase mb-2" }, "Participation & Limits"),
          React.createElement(
            "div",
            { className: "flex items-center gap-2 mb-3" },
            React.createElement("span", { className: "text-xs font-bold text-slate-700" }, "Type:"),
            React.createElement(
              "button",
              {
                type: "button",
                onClick: () => setFormData({ ...formData, type: "Individual", maxTeamSize: 1 }),
                className: `px-3 py-1 rounded-lg text-xs font-bold transition ${
                  formData.type === "Individual" ? "bg-purple-700 text-white" : "bg-slate-100 text-slate-600"
                }`
              },
              "Individual"
            ),
            React.createElement(
              "button",
              {
                type: "button",
                onClick: () => setFormData({ ...formData, type: "Team", maxTeamSize: 5 }),
                className: `px-3 py-1 rounded-lg text-xs font-bold transition ${
                  formData.type === "Team" ? "bg-purple-700 text-white" : "bg-slate-100 text-slate-600"
                }`
              },
              "Team"
            )
          ),
          React.createElement(
            "div",
            { className: "grid grid-cols-3 gap-2" },
            formData.type === "Team" && React.createElement("div", null,
              React.createElement("label", { className: "block text-[10px] font-semibold text-slate-500 mb-0.5" }, "Max Team Size"),
              React.createElement("input", {
                type: "number",
                value: formData.maxTeamSize,
                onChange: (e) => setFormData({ ...formData, maxTeamSize: e.target.value }),
                className: "w-full px-2 py-1.5 border rounded-lg text-xs"
              })
            ),
            React.createElement("div", null,
              React.createElement("label", { className: "block text-[10px] font-semibold text-slate-500 mb-0.5" }, "Max Capacity"),
              React.createElement("input", {
                type: "number",
                value: formData.maxCapacity,
                onChange: (e) => setFormData({ ...formData, maxCapacity: e.target.value }),
                className: "w-full px-2 py-1.5 border rounded-lg text-xs"
              })
            ),
            React.createElement("div", null,
              React.createElement("label", { className: "block text-[10px] font-semibold text-slate-500 mb-0.5" }, "Registration Deadline"),
              React.createElement("input", {
                type: "date",
                value: formData.registrationDeadline,
                onChange: (e) => setFormData({ ...formData, registrationDeadline: e.target.value }),
                className: "w-full px-2 py-1.5 border rounded-lg text-xs"
              })
            )
          )
        ),

        // Upload Box: Drag and drop Event Poster
        React.createElement(
          "div",
          null,
          React.createElement("h4", { className: "text-xs font-extrabold text-slate-800 uppercase mb-2" }, "Upload Box"),
          React.createElement(
            "label",
            { className: "dropzone-box rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer text-center" },
            React.createElement(Icon, { name: "upload", className: "text-slate-400 text-lg mb-1" }),
            React.createElement("span", { className: "text-xs font-bold text-slate-700" }, "Upload Event Poster"),
            React.createElement("span", { className: "text-[10px] text-slate-400" }, "Drag-and-drop or tap to select image"),
            React.createElement("input", {
              type: "file",
              accept: "image/*",
              className: "hidden",
              onChange: (e) => {
                const f = e.target.files[0];
                if (f) triggerToast(`Poster selected: ${f.name}`, "info");
              }
            })
          )
        ),

        // Contacts: Coordinator Name & Coordinator Contact
        React.createElement(
          "div",
          null,
          React.createElement("h4", { className: "text-xs font-extrabold text-slate-800 uppercase mb-2" }, "Contacts"),
          React.createElement(
            "div",
            { className: "grid grid-cols-2 gap-2" },
            React.createElement("input", {
              type: "text",
              value: formData.coordinatorName,
              onChange: (e) => setFormData({ ...formData, coordinatorName: e.target.value }),
              placeholder: "Coordinator Name",
              className: "px-3 py-2 border rounded-xl text-xs"
            }),
            React.createElement("input", {
              type: "tel",
              value: formData.coordinatorContact,
              onChange: (e) => setFormData({ ...formData, coordinatorContact: e.target.value }),
              placeholder: "Coordinator Contact",
              className: "px-3 py-2 border rounded-xl text-xs"
            })
          )
        )
      ),

      // Drawer Footer Action Buttons matching Image 4
      React.createElement(
        "div",
        { className: "p-4 px-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50" },
        React.createElement(
          "button",
          {
            type: "button",
            onClick: onClose,
            className: "px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
          },
          "Cancel"
        ),
        React.createElement(
          "button",
          {
            type: "button",
            onClick: () => handleSubmit(true),
            className: "px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold"
          },
          "Save Draft"
        ),
        React.createElement(
          "button",
          {
            type: "button",
            disabled: saving,
            onClick: () => handleSubmit(false),
            className: "px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-md shadow-purple-700/20"
          },
          saving ? "Saving..." : (eventToEdit ? "Update Event" : "Create Event")
        )
      )
    )
  );
}

// =============================================================
// ADDITIONAL SUB-VIEWS
// =============================================================

function CollegesManagementView({ triggerToast }) {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    MelangeAPI.getColleges().then(res => {
      if (res.success) setColleges(res.colleges);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return React.createElement(
    "div",
    { className: "space-y-4" },
    React.createElement("h2", { className: "text-xl font-bold text-slate-900" }, "Participating Colleges Roster"),
    React.createElement(
      "div",
      { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" },
      colleges.map(c => React.createElement(
        "div",
        { key: c._id, className: "bg-white p-5 rounded-2xl border border-slate-100 shadow-sm" },
        React.createElement("div", { className: "flex justify-between items-start mb-2" },
          React.createElement("h3", { className: "text-sm font-bold text-slate-900" }, c.name),
          React.createElement("span", { className: "px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 font-mono" }, c.code)
        ),
        React.createElement("p", { className: "text-xs text-slate-600 mb-1" }, `GS: ${c.gsName}`),
        React.createElement("p", { className: "text-[11px] text-slate-400 font-mono" }, c.email),
        React.createElement("div", { className: "mt-4 pt-3 border-t border-slate-50 flex justify-between text-xs" },
          React.createElement("span", { className: "text-slate-500" }, "Participants:"),
          React.createElement("span", { className: "font-bold text-slate-900 font-mono" }, c.totalParticipants)
        )
      ))
    )
  );
}

// =============================================================
// MODULE 5: REGISTRATION MANAGEMENT VIEW (MATCHING IMAGE 5)
// =============================================================
function RegistrationManagementView({ currentUser, currentCollege, triggerToast }) {
  const isGS = currentUser.role === "college_gs";

  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState({
    total: { count: "1,240", label: "Across all colleges" },
    pending: { count: "184", label: "Action required" },
    approved: { count: "982", label: "Confirmed entries" },
    rejected: { count: "74", label: "Issues found" }
  });
  const [loading, setLoading] = useState(true);

  // Active Selected Registration for Right-Hand Side Details Panel
  const [selectedReg, setSelectedReg] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCollege, setSelectedCollege] = useState("All");
  const [selectedEvent, setSelectedEvent] = useState("All");
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All"); // 'All', 'Pending', 'Approved', 'Rejected'

  // Pagination & Checkboxes for Bulk Operations
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmDeleteReg, setConfirmDeleteReg] = useState(null);

  // Available metadata
  const [colleges, setColleges] = useState([]);
  const [events, setEvents] = useState([]);

  const fetchRegistrations = async () => {
    try {
      const [regRes, statsRes, colRes, evRes] = await Promise.all([
        MelangeAPI.getRegistrations({
          search: searchTerm,
          collegeId: isGS ? currentCollege?.code || currentUser.collegeId : selectedCollege,
          eventId: selectedEvent,
          department: selectedDepartment,
          year: selectedYear,
          status: selectedStatus,
          page: currentPage,
          limit: 10
        }),
        MelangeAPI.getRegistrationStats(),
        MelangeAPI.getColleges(),
        MelangeAPI.getEvents()
      ]);

      if (regRes.success) {
        setRegistrations(regRes.registrations);
        if (!selectedReg && regRes.registrations.length > 0) {
          setSelectedReg(regRes.registrations[0]);
        }
      }
      if (statsRes.success) setStats(statsRes.stats);
      if (colRes.success) setColleges(colRes.colleges);
      if (evRes.success) setEvents(evRes.events);
    } catch (e) {
      triggerToast("Failed to load registrations.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [searchTerm, selectedCollege, selectedEvent, selectedDepartment, selectedYear, selectedStatus, currentPage]);

  // Bulk Operations
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(registrations.map(r => r._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) {
      triggerToast("Please select registrations to approve.", "warning");
      return;
    }
    try {
      const res = await MelangeAPI.bulkUpdateRegistrationStatus(selectedIds, "Approved");
      if (res.success) {
        triggerToast(`Bulk approval successful: ${res.updatedCount} registrations approved!`, "success");
        setSelectedIds([]);
        fetchRegistrations();
      }
    } catch (e) {
      triggerToast(e.message, "error");
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await MelangeAPI.updateRegistrationStatus(id, newStatus);
      if (res.success) {
        triggerToast(`Registration status set to ${newStatus}.`, "success");
        fetchRegistrations();
        if (selectedReg && (selectedReg._id === id || selectedReg.regId === id)) {
          setSelectedReg({ ...selectedReg, status: newStatus });
        }
      }
    } catch (e) {
      triggerToast(e.message, "error");
    }
  };

  const handleDeleteRegistration = async (id) => {
    try {
      const res = await MelangeAPI.deleteRegistration(id);
      if (res.success) {
        triggerToast("Registration deleted successfully.", "info");
        setConfirmDeleteReg(null);
        fetchRegistrations();
        if (selectedReg && selectedReg._id === id) {
          setSelectedReg(null);
        }
      }
    } catch (e) {
      triggerToast(e.message, "error");
    }
  };

  return React.createElement(
    "div",
    { className: "space-y-6" },

    // Top Header & Action Buttons matching Image 5
    React.createElement(
      "div",
      { className: "flex flex-col lg:flex-row lg:items-center justify-between gap-4" },
      React.createElement(
        "div",
        null,
        React.createElement("h2", { className: "text-2xl font-extrabold text-slate-900" }, "Registration Management"),
        React.createElement("p", { className: "text-xs text-slate-500 font-medium mt-0.5" }, "Monitor, verify, and manage all participant registrations received from different colleges")
      ),
      React.createElement(
        "div",
        { className: "flex flex-wrap items-center gap-2" },
        // Search bar
        React.createElement(
          "div",
          { className: "relative min-w-[200px]" },
          React.createElement(
            "span",
            { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" },
            React.createElement(Icon, { name: "search" })
          ),
          React.createElement("input", {
            type: "text",
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            placeholder: "Search registrations...",
            className: "w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none"
          })
        ),
        // + Approve Selected
        React.createElement(
          "button",
          {
            onClick: handleBulkApprove,
            className: "py-2 px-3.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
          },
          React.createElement(Icon, { name: "plus", className: "text-xs" }),
          React.createElement("span", null, "Approve Selected")
        ),
        // Export Excel
        React.createElement(
          "button",
          {
            onClick: () => MelangeAPI.downloadExcelReport().then(() => triggerToast("Excel downloaded!", "success")),
            className: "py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-sm"
          },
          React.createElement(Icon, { name: "download", className: "text-slate-400" }),
          React.createElement("span", null, "Export Excel")
        ),
        // Export PDF
        React.createElement(
          "button",
          {
            onClick: () => window.print(),
            className: "py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-sm"
          },
          React.createElement(Icon, { name: "fileText", className: "text-slate-400" }),
          React.createElement("span", null, "Export PDF")
        ),
        // Print List
        React.createElement(
          "button",
          {
            onClick: () => window.print(),
            className: "py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-sm"
          },
          React.createElement(Icon, { name: "gear", className: "text-slate-400" }),
          React.createElement("span", null, "Print List")
        )
      )
    ),

    // 4 Stat Overview Metric Cards matching Image 5
    React.createElement(
      "div",
      { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" },

      // Card 1: Total Registrations
      React.createElement(
        "div",
        { className: "bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between" },
        React.createElement(
          "div",
          null,
          React.createElement("p", { className: "text-xs font-semibold text-slate-500 mb-1" }, "Total Registrations"),
          React.createElement("h3", { className: "text-3xl font-extrabold text-slate-900 font-mono tracking-tight" }, stats.total?.count || "1,240"),
          React.createElement("span", { className: "text-[11px] text-slate-400 mt-1 block" }, stats.total?.label || "Across all colleges")
        ),
        React.createElement(
          "div",
          { className: "w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center text-base" },
          React.createElement(Icon, { name: "users" })
        )
      ),

      // Card 2: Pending Verification
      React.createElement(
        "div",
        { className: "bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between" },
        React.createElement(
          "div",
          null,
          React.createElement("p", { className: "text-xs font-semibold text-slate-500 mb-1" }, "Pending Verification"),
          React.createElement("h3", { className: "text-3xl font-extrabold text-slate-900 font-mono tracking-tight" }, stats.pending?.count || "184"),
          React.createElement("span", { className: "text-[11px] text-amber-600 font-semibold mt-1 flex items-center gap-1" },
            React.createElement(Icon, { name: "alert-triangle", className: "text-[10px]" }),
            "Action required"
          )
        ),
        React.createElement(
          "div",
          { className: "w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-base" },
          React.createElement(Icon, { name: "alert-triangle" })
        )
      ),

      // Card 3: Approved Participants
      React.createElement(
        "div",
        { className: "bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between" },
        React.createElement(
          "div",
          null,
          React.createElement("p", { className: "text-xs font-semibold text-slate-500 mb-1" }, "Approved Participants"),
          React.createElement("h3", { className: "text-3xl font-extrabold text-slate-900 font-mono tracking-tight" }, stats.approved?.count || "982"),
          React.createElement("span", { className: "text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1" },
            React.createElement(Icon, { name: "check-circle", className: "text-[10px]" }),
            "Confirmed entries"
          )
        ),
        React.createElement(
          "div",
          { className: "w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-base" },
          React.createElement(Icon, { name: "check-circle" })
        )
      ),

      // Card 4: Rejected Entries
      React.createElement(
        "div",
        { className: "bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between" },
        React.createElement(
          "div",
          null,
          React.createElement("p", { className: "text-xs font-semibold text-slate-500 mb-1" }, "Rejected Entries"),
          React.createElement("h3", { className: "text-3xl font-extrabold text-slate-900 font-mono tracking-tight" }, stats.rejected?.count || "74"),
          React.createElement("span", { className: "text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1" },
            React.createElement(Icon, { name: "close", className: "text-[10px]" }),
            "Issues found"
          )
        ),
        React.createElement(
          "div",
          { className: "w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-base" },
          React.createElement(Icon, { name: "close" })
        )
      )
    ),

    // Filter Bar matching Image 5
    React.createElement(
      "div",
      { className: "bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-3" },
      React.createElement(
        "div",
        { className: "flex flex-wrap items-center gap-3" },
        // College filter (Admin only, disabled/locked if GS)
        React.createElement(
          "select",
          {
            value: isGS ? currentCollege?.code : selectedCollege,
            disabled: isGS,
            onChange: (e) => setSelectedCollege(e.target.value),
            className: "px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-700"
          },
          !isGS && React.createElement("option", { value: "All" }, "Select College ∨"),
          colleges.map(c => React.createElement("option", { key: c._id, value: c._id }, c.name))
        ),
        // Event filter
        React.createElement(
          "select",
          {
            value: selectedEvent,
            onChange: (e) => setSelectedEvent(e.target.value),
            className: "px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-700"
          },
          React.createElement("option", { value: "All" }, "Select Event ∨"),
          events.map(ev => React.createElement("option", { key: ev._id, value: ev.name }, ev.name))
        ),
        // Department filter
        React.createElement(
          "select",
          {
            value: selectedDepartment,
            onChange: (e) => setSelectedDepartment(e.target.value),
            className: "px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-700"
          },
          React.createElement("option", { value: "All" }, "Select Department ∨"),
          React.createElement("option", { value: "CSE" }, "CSE / CS"),
          React.createElement("option", { value: "IT" }, "IT"),
          React.createElement("option", { value: "Mechanical" }, "Mechanical"),
          React.createElement("option", { value: "Civil" }, "Civil")
        ),
        // Year filter
        React.createElement(
          "select",
          {
            value: selectedYear,
            onChange: (e) => setSelectedYear(e.target.value),
            className: "px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-700"
          },
          React.createElement("option", { value: "All" }, "Select Year ∨"),
          React.createElement("option", { value: "1st" }, "1st Yr"),
          React.createElement("option", { value: "2nd" }, "2nd Yr"),
          React.createElement("option", { value: "3rd" }, "3rd Yr"),
          React.createElement("option", { value: "4th" }, "4th Yr")
        )
      ),

      // Registration Status Pills Toggle matching Image 5
      React.createElement(
        "div",
        { className: "flex items-center gap-1 text-xs font-semibold" },
        React.createElement("span", { className: "text-slate-500 mr-2 text-[11px]" }, "Registration Status:"),
        ["All", "Pending", "Approved", "Rejected"].map(st => React.createElement(
          "button",
          {
            key: st,
            onClick: () => setSelectedStatus(st),
            className: `px-3 py-1 rounded-lg transition ${
              selectedStatus === st
                ? "bg-purple-700 text-white font-bold shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`
          },
          st
        ))
      )
    ),

    // Main Content Grid (Left Table 8 cols + Right Participant Details 4 cols)
    React.createElement(
      "div",
      { className: "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" },

      // Left Table (8 cols)
      React.createElement(
        "div",
        { className: "lg:col-span-8 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm" },
        React.createElement("h3", { className: "text-sm font-bold text-slate-900 mb-4" }, "Recent Registrations"),

        React.createElement(
          "div",
          { className: "table-scroll-container" },
          React.createElement(
            "table",
            { className: "w-full text-left border-collapse" },
            React.createElement(
              "thead",
              null,
              React.createElement(
                "tr",
                { className: "border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase" },
                React.createElement("th", { className: "pb-3 w-8" },
                  React.createElement("input", {
                    type: "checkbox",
                    onChange: handleSelectAll,
                    checked: selectedIds.length > 0 && selectedIds.length === registrations.length,
                    className: "w-3.5 h-3.5 rounded border-slate-300 text-purple-600"
                  })
                ),
                React.createElement("th", { className: "pb-3" }, "Registration ID"),
                React.createElement("th", { className: "pb-3" }, "Student Name"),
                React.createElement("th", { className: "pb-3" }, "College Name"),
                React.createElement("th", { className: "pb-3" }, "Department & Year"),
                React.createElement("th", { className: "pb-3" }, "Event Name"),
                React.createElement("th", { className: "pb-3" }, "Contact"),
                React.createElement("th", { className: "pb-3" }, "Status"),
                React.createElement("th", { className: "pb-3 text-right" }, "Actions")
              )
            ),
            React.createElement(
              "tbody",
              { className: "divide-y divide-slate-50 text-xs" },
              registrations.length === 0 ? React.createElement(
                "tr",
                null,
                React.createElement("td", { colSpan: 9, className: "py-8 text-center text-slate-400" }, "No registrations found matching the filters.")
              ) :
              registrations.map(reg => {
                const isSelected = selectedReg?._id === reg._id;
                const isChecked = selectedIds.includes(reg._id);

                return React.createElement(
                  "tr",
                  {
                    key: reg._id,
                    onClick: () => setSelectedReg(reg),
                    className: `hover:bg-slate-50/70 transition cursor-pointer ${isSelected ? "bg-purple-50/50" : ""}`
                  },
                  React.createElement("td", { className: "py-3", onClick: (e) => e.stopPropagation() },
                    React.createElement("input", {
                      type: "checkbox",
                      checked: isChecked,
                      onChange: () => handleSelectRow(reg._id),
                      className: "w-3.5 h-3.5 rounded border-slate-300 text-purple-600"
                    })
                  ),
                  React.createElement("td", { className: "py-3 font-mono font-bold text-slate-700 text-[11px]" }, reg.regId),
                  React.createElement("td", { className: "py-3 font-bold text-slate-900" }, reg.studentName),
                  React.createElement("td", { className: "py-3 text-slate-600 truncate max-w-[120px]" }, reg.collegeName),
                  React.createElement("td", { className: "py-3 text-slate-500 font-mono text-[11px]" }, `${reg.department} / ${reg.year}`),
                  React.createElement("td", { className: "py-3 font-semibold text-purple-900 truncate max-w-[130px]" }, reg.eventName),
                  React.createElement("td", { className: "py-3 text-slate-500 font-mono text-[11px]" }, reg.contact),
                  React.createElement(
                    "td",
                    { className: "py-3" },
                    React.createElement(
                      "span",
                      {
                        className: `px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          reg.status === "Approved" ? "bg-emerald-100 text-emerald-700" :
                          reg.status === "Pending" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                        }`
                      },
                      reg.status
                    )
                  ),
                  React.createElement(
                    "td",
                    { className: "py-3 text-right space-x-2 text-slate-400", onClick: (e) => e.stopPropagation() },
                    // View eye
                    React.createElement("button", { onClick: () => setSelectedReg(reg), title: "View Details", className: "hover:text-purple-600" }, React.createElement(Icon, { name: "eye" })),
                    // Edit pencil
                    React.createElement("button", { onClick: () => { setSelectedReg(reg); setShowEditModal(true); }, title: "Edit", className: "hover:text-blue-600" }, React.createElement(Icon, { name: "edit" })),
                    // Approve check
                    React.createElement("button", { onClick: () => handleStatusChange(reg._id, "Approved"), title: "Approve", className: "hover:text-emerald-600" }, React.createElement(Icon, { name: "check-circle", className: "text-emerald-600" })),
                    // Reject / delete trash
                    React.createElement("button", { onClick: () => setConfirmDeleteReg(reg), title: "Delete / Reject", className: "hover:text-rose-600" }, React.createElement(Icon, { name: "trash", className: "text-rose-500" }))
                  )
                );
              })
            )
          )
        ),

        // Pagination Controls matching Image 5
        React.createElement(
          "div",
          { className: "flex items-center justify-between pt-4 mt-2 border-t border-slate-100 text-xs text-slate-500" },
          React.createElement("span", null, "Showing 1-10 of 1,240"),
          React.createElement(
            "div",
            { className: "flex items-center gap-1 font-bold" },
            React.createElement("button", { onClick: () => setCurrentPage(Math.max(1, currentPage - 1)), className: "w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50" }, "<"),
            React.createElement("button", { className: "w-7 h-7 rounded-lg bg-purple-700 text-white flex items-center justify-center" }, "1"),
            React.createElement("button", { className: "w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50" }, "2"),
            React.createElement("button", { className: "w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50" }, "3"),
            React.createElement("button", { onClick: () => setCurrentPage(currentPage + 1), className: "w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50" }, ">")
          )
        )
      ),

      // Right Side Panel: "Participant Details" matching Image 5 (4 cols)
      React.createElement(
        "div",
        { className: "lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5" },
        React.createElement("h3", { className: "text-base font-extrabold text-slate-900" }, "Participant Details"),

        selectedReg ? React.createElement(
          "div",
          { className: "space-y-5" },

          // Top Action Buttons matching Image 5
          React.createElement(
            "div",
            { className: "space-y-2" },
            React.createElement(
              "button",
              {
                onClick: () => handleStatusChange(selectedReg._id, "Approved"),
                className: "w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition"
              },
              "Approve Registration"
            ),
            React.createElement(
              "div",
              { className: "grid grid-cols-2 gap-2" },
              React.createElement(
                "button",
                {
                  onClick: () => handleStatusChange(selectedReg._id, "Rejected"),
                  className: "py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs transition"
                },
                "Reject Registration"
              ),
              React.createElement(
                "button",
                {
                  onClick: () => setShowEditModal(true),
                  className: "py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition"
                },
                "Edit Details"
              )
            )
          ),

          // Section 1: Personal Details
          React.createElement(
            "div",
            { className: "pt-2 border-t border-slate-100 space-y-2 text-xs" },
            React.createElement("h4", { className: "text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2" }, "Personal Details"),
            React.createElement("div", { className: "flex justify-between" },
              React.createElement("span", { className: "text-slate-400" }, "Full Name (optional e.g.)"),
              React.createElement("span", { className: "font-bold text-slate-800" }, selectedReg.studentName)
            ),
            React.createElement("div", { className: "flex justify-between" },
              React.createElement("span", { className: "text-slate-400" }, "Gender"),
              React.createElement("span", { className: "font-semibold text-slate-700" }, selectedReg.gender || "Male")
            ),
            React.createElement("div", { className: "flex justify-between" },
              React.createElement("span", { className: "text-slate-400" }, "Contact"),
              React.createElement("span", { className: "font-mono font-semibold text-slate-700 text-[11px]" }, selectedReg.contact)
            ),
            React.createElement("div", { className: "flex justify-between" },
              React.createElement("span", { className: "text-slate-400" }, "Email"),
              React.createElement("span", { className: "font-mono font-semibold text-slate-700 text-[11px]" }, selectedReg.email)
            )
          ),

          // Section 2: Academic Details
          React.createElement(
            "div",
            { className: "pt-2 border-t border-slate-100 space-y-2 text-xs" },
            React.createElement("h4", { className: "text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2" }, "Academic Details"),
            React.createElement("div", { className: "flex justify-between" },
              React.createElement("span", { className: "text-slate-400" }, "College"),
              React.createElement("span", { className: "font-bold text-slate-800" }, selectedReg.collegeName)
            ),
            React.createElement("div", { className: "flex justify-between" },
              React.createElement("span", { className: "text-slate-400" }, "Department"),
              React.createElement("span", { className: "font-semibold text-slate-700" }, selectedReg.department)
            ),
            React.createElement("div", { className: "flex justify-between" },
              React.createElement("span", { className: "text-slate-400" }, "Year"),
              React.createElement("span", { className: "font-semibold text-slate-700" }, selectedReg.year)
            )
          ),

          // Section 3: Event Details
          React.createElement(
            "div",
            { className: "pt-2 border-t border-slate-100 space-y-2 text-xs" },
            React.createElement("h4", { className: "text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2" }, "Event Details"),
            React.createElement("div", { className: "flex justify-between" },
              React.createElement("span", { className: "text-slate-400" }, "Event"),
              React.createElement("span", { className: "font-bold text-purple-900" }, selectedReg.eventName)
            ),
            React.createElement("div", { className: "flex justify-between" },
              React.createElement("span", { className: "text-slate-400" }, "Team Name (Optional)"),
              React.createElement("span", { className: "font-semibold text-slate-700" }, `"${selectedReg.teamName || 'Solo Entry'}"`)
            ),
            React.createElement("div", { className: "flex justify-between" },
              React.createElement("span", { className: "text-slate-400" }, "Registration Date"),
              React.createElement("span", { className: "font-semibold text-slate-700" }, selectedReg.registeredDate || "Oct 12, 2026")
            ),
            React.createElement("div", { className: "flex justify-between items-center" },
              React.createElement("span", { className: "text-slate-400" }, "Status"),
              React.createElement(
                "span",
                {
                  className: `px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedReg.status === "Approved" ? "bg-emerald-100 text-emerald-700" :
                    selectedReg.status === "Pending" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                  }`
                },
                selectedReg.status === "Pending" ? "Pending Verification" : selectedReg.status
              )
            ),
            // Verification Image Card matching Image 5
            React.createElement(
              "div",
              { className: "mt-3 pt-2" },
              React.createElement("span", { className: "text-slate-400 block mb-1.5" }, "Verification image"),
              React.createElement(
                "div",
                { className: "p-2 rounded-2xl border border-slate-200 bg-slate-50 flex items-center gap-3" },
                React.createElement("img", {
                  src: selectedReg.idCardUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
                  alt: "ID Card",
                  className: "w-10 h-10 rounded-xl object-cover border border-slate-200"
                }),
                React.createElement(
                  "div",
                  null,
                  React.createElement("span", { className: "block text-xs font-bold text-slate-800" }, "Uploaded ID Card"),
                  React.createElement("span", { className: "block text-[10px] text-emerald-600 font-semibold" }, "✓ Verified format")
                )
              )
            )
          )
        ) : React.createElement(
          "div",
          { className: "py-12 text-center text-slate-400 text-xs" },
          "Click on any registration row to view full participant dossier."
        )
      )
    ),

    // Modal: Edit Registration
    showEditModal && selectedReg && React.createElement(EditRegistrationModal, {
      registration: selectedReg,
      onClose: () => setShowEditModal(false),
      onSaved: (updated) => {
        setSelectedReg(updated);
        setShowEditModal(false);
        fetchRegistrations();
        triggerToast("Registration updated successfully!", "success");
      },
      triggerToast
    }),

    // Modal: Confirm Delete
    confirmDeleteReg && React.createElement(
      "div",
      { className: "fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" },
      React.createElement(
        "div",
        { className: "bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-slate-100 text-center" },
        React.createElement("div", { className: "w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center text-xl mb-3" }, React.createElement(Icon, { name: "trash" })),
        React.createElement("h3", { className: "text-base font-bold text-slate-900 mb-1" }, "Confirm Deletion"),
        React.createElement("p", { className: "text-xs text-slate-500 mb-5" }, `Are you sure you want to permanently remove registration ${confirmDeleteReg.regId} for ${confirmDeleteReg.studentName}?`),
        React.createElement(
          "div",
          { className: "flex justify-center gap-3 text-xs font-bold" },
          React.createElement("button", { onClick: () => setConfirmDeleteReg(null), className: "px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100" }, "Cancel"),
          React.createElement("button", { onClick: () => handleDeleteRegistration(confirmDeleteReg._id), className: "px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700" }, "Delete Record")
        )
      )
    )
  );
}

// Modal: Edit Registration
function EditRegistrationModal({ registration, onClose, onSaved, triggerToast }) {
  const [formData, setFormData] = useState({
    studentName: registration.studentName || "",
    gender: registration.gender || "Male",
    department: registration.department || "CSE",
    year: registration.year || "3rd Yr",
    contact: registration.contact || "",
    email: registration.email || "",
    teamName: registration.teamName || ""
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await MelangeAPI.updateRegistration(registration._id, formData);
      if (res.success) {
        onSaved(res.registration);
      }
    } catch (err) {
      triggerToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return React.createElement(
    "div",
    { className: "fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" },
    React.createElement(
      "div",
      { className: "bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-100" },
      React.createElement(
        "div",
        { className: "flex items-center justify-between pb-4 border-b border-slate-100 mb-4" },
        React.createElement("h3", { className: "text-lg font-bold text-slate-900" }, `Edit Registration - ${registration.regId}`),
        React.createElement("button", { onClick: onClose, className: "text-slate-400 hover:text-slate-600" }, React.createElement(Icon, { name: "close" }))
      ),
      React.createElement(
        "form",
        { onSubmit: handleSubmit, className: "space-y-3.5 text-xs" },
        React.createElement("div", null,
          React.createElement("label", { className: "block font-bold text-slate-700 mb-1" }, "Student Full Name"),
          React.createElement("input", {
            type: "text",
            value: formData.studentName,
            onChange: (e) => setFormData({ ...formData, studentName: e.target.value }),
            required: true,
            className: "w-full px-3 py-2 border rounded-xl"
          })
        ),
        React.createElement("div", { className: "grid grid-cols-2 gap-3" },
          React.createElement("div", null,
            React.createElement("label", { className: "block font-bold text-slate-700 mb-1" }, "Department"),
            React.createElement("input", {
              type: "text",
              value: formData.department,
              onChange: (e) => setFormData({ ...formData, department: e.target.value }),
              required: true,
              className: "w-full px-3 py-2 border rounded-xl"
            })
          ),
          React.createElement("div", null,
            React.createElement("label", { className: "block font-bold text-slate-700 mb-1" }, "Academic Year"),
            React.createElement("input", {
              type: "text",
              value: formData.year,
              onChange: (e) => setFormData({ ...formData, year: e.target.value }),
              required: true,
              className: "w-full px-3 py-2 border rounded-xl"
            })
          )
        ),
        React.createElement("div", { className: "grid grid-cols-2 gap-3" },
          React.createElement("div", null,
            React.createElement("label", { className: "block font-bold text-slate-700 mb-1" }, "Contact Number"),
            React.createElement("input", {
              type: "tel",
              value: formData.contact,
              onChange: (e) => setFormData({ ...formData, contact: e.target.value }),
              required: true,
              className: "w-full px-3 py-2 border rounded-xl font-mono text-[11px]"
            })
          ),
          React.createElement("div", null,
            React.createElement("label", { className: "block font-bold text-slate-700 mb-1" }, "Email Address"),
            React.createElement("input", {
              type: "email",
              value: formData.email,
              onChange: (e) => setFormData({ ...formData, email: e.target.value }),
              required: true,
              className: "w-full px-3 py-2 border rounded-xl font-mono text-[11px]"
            })
          )
        ),
        React.createElement("div", null,
          React.createElement("label", { className: "block font-bold text-slate-700 mb-1" }, "Team Name (Optional)"),
          React.createElement("input", {
            type: "text",
            value: formData.teamName,
            onChange: (e) => setFormData({ ...formData, teamName: e.target.value }),
            className: "w-full px-3 py-2 border rounded-xl"
          })
        ),
        React.createElement(
          "div",
          { className: "flex justify-end gap-3 pt-3" },
          React.createElement("button", { type: "button", onClick: onClose, className: "px-4 py-2 text-slate-600 rounded-xl hover:bg-slate-100" }, "Cancel"),
          React.createElement("button", { type: "submit", disabled: saving, className: "px-5 py-2 font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl" }, saving ? "Saving..." : "Save Changes")
        )
      )
    )
  );
}

// =============================================================
// MODULE 6: REPORT MANAGEMENT VIEW (MATCHING IMAGE 6)
// =============================================================
function ReportManagementView({ currentUser, currentCollege, triggerToast }) {
  const isGS = currentUser.role === "college_gs";

  // Toggle in header matching Image 6
  const [isAdminPreviewMode, setIsAdminPreviewMode] = useState(!isGS);

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Active Report State
  const [activeReportType, setActiveReportType] = useState("college-wise");
  const [reportRecords, setReportRecords] = useState([]);
  const [totalReportRecords, setTotalReportRecords] = useState(0);
  const [showSuccessBadge, setShowSuccessBadge] = useState(true);

  // Advanced Filters
  const [filters, setFilters] = useState({
    collegeId: isGS ? currentCollege?.code : "All",
    eventId: "All",
    department: "All",
    year: "All",
    status: "All",
    dateRange: ""
  });

  const [colleges, setColleges] = useState([]);
  const [events, setEvents] = useState([]);

  const loadData = async () => {
    try {
      const [anRes, repRes, colRes, evRes] = await Promise.all([
        MelangeAPI.getReportAnalytics(),
        MelangeAPI.generateReport(activeReportType, filters),
        MelangeAPI.getColleges(),
        MelangeAPI.getEvents()
      ]);

      if (anRes.success) setAnalytics(anRes);
      if (repRes.success) {
        setReportRecords(repRes.records);
        setTotalReportRecords(repRes.totalRecords);
      }
      if (colRes.success) setColleges(colRes.colleges);
      if (evRes.success) setEvents(evRes.events);
    } catch (e) {
      triggerToast("Failed to load reports.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeReportType]);

  const handleGenerateReport = async (type) => {
    setActiveReportType(type);
    setLoading(true);
    try {
      const res = await MelangeAPI.generateReport(type, filters);
      if (res.success) {
        setReportRecords(res.records);
        setTotalReportRecords(res.totalRecords);
        setShowSuccessBadge(true);
        triggerToast(`${res.title} generated successfully!`, "success");
      }
    } catch (e) {
      triggerToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = async () => {
    setLoading(true);
    try {
      const res = await MelangeAPI.generateReport(activeReportType, filters);
      if (res.success) {
        setReportRecords(res.records);
        setTotalReportRecords(res.totalRecords);
        setShowSuccessBadge(true);
        triggerToast("Filters applied to report preview.", "info");
      }
    } catch (e) {
      triggerToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return React.createElement(
    "div",
    { className: "space-y-6" },

    // Top Header matching Image 6
    React.createElement(
      "div",
      { className: "flex flex-col lg:flex-row lg:items-center justify-between gap-4" },
      React.createElement(
        "div",
        null,
        React.createElement(
          "div",
          { className: "flex items-center gap-2.5" },
          React.createElement("h2", { className: "text-2xl font-extrabold text-slate-900" }, "Reports & Analytics"),
          React.createElement(
            "span",
            { className: "px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 flex items-center gap-1 border border-blue-200" },
            React.createElement(Icon, { name: "lock", className: "text-[10px]" }),
            isAdminPreviewMode ? "Admin Access" : "College GS View"
          )
        ),
        // Subtitle Toggle Switch matching Image 6
        React.createElement(
          "div",
          { className: "flex items-center gap-2 mt-1.5" },
          React.createElement(
            "label",
            { className: "relative inline-flex items-center cursor-pointer" },
            React.createElement("input", {
              type: "checkbox",
              checked: isAdminPreviewMode,
              onChange: (e) => setIsAdminPreviewMode(e.target.checked),
              className: "sr-only peer"
            }),
            React.createElement("div", { className: "w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-600" })
          ),
          React.createElement("span", { className: "text-xs text-slate-500 font-medium" }, "Only College GS preview if needed, but primarily Admin View")
        )
      ),

      React.createElement(
        "div",
        { className: "flex items-center gap-3" },
        React.createElement(
          "span",
          { className: "px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-sm" },
          isAdminPreviewMode ? "View: Admin Mode" : "View: College GS Mode"
        )
      )
    ),

    // 4 Metric Overview Cards matching Image 6
    React.createElement(
      "div",
      { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" },

      // Card 1: Total Registered Colleges
      React.createElement(
        "div",
        { className: "card-tint-purple p-5 rounded-2xl stat-card-hover shadow-sm flex items-start justify-between" },
        React.createElement(
          "div",
          null,
          React.createElement("p", { className: "text-xs font-semibold text-slate-500 mb-1" }, "Total Registered Colleges"),
          React.createElement("h3", { className: "text-3xl font-extrabold text-slate-900 font-mono tracking-tight" }, "42"),
          React.createElement("span", { className: "inline-block text-[11px] font-bold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-md mt-2" }, "All active")
        ),
        React.createElement(
          "div",
          { className: "w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-lg" },
          React.createElement(Icon, { name: "building" })
        )
      ),

      // Card 2: Total Participants
      React.createElement(
        "div",
        { className: "card-tint-blue p-5 rounded-2xl stat-card-hover shadow-sm flex items-start justify-between" },
        React.createElement(
          "div",
          null,
          React.createElement("p", { className: "text-xs font-semibold text-slate-500 mb-1" }, "Total Participants"),
          React.createElement("h3", { className: "text-3xl font-extrabold text-slate-900 font-mono tracking-tight" }, "1,240"),
          React.createElement("span", { className: "inline-block text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md mt-2" }, "Across all events")
        ),
        React.createElement(
          "div",
          { className: "w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-lg" },
          React.createElement(Icon, { name: "users" })
        )
      ),

      // Card 3: Total Events
      React.createElement(
        "div",
        { className: "card-tint-gold p-5 rounded-2xl stat-card-hover shadow-sm flex items-start justify-between" },
        React.createElement(
          "div",
          null,
          React.createElement("p", { className: "text-xs font-semibold text-slate-500 mb-1" }, "Total Events"),
          React.createElement("h3", { className: "text-3xl font-extrabold text-slate-900 font-mono tracking-tight" }, "28"),
          React.createElement("span", { className: "inline-block text-[11px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md mt-2" }, "Cultural & sports")
        ),
        React.createElement(
          "div",
          { className: "w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-lg" },
          React.createElement(Icon, { name: "calendar" })
        )
      ),

      // Card 4: Completed Registrations
      React.createElement(
        "div",
        { className: "card-tint-green p-5 rounded-2xl stat-card-hover shadow-sm flex items-start justify-between" },
        React.createElement(
          "div",
          null,
          React.createElement("p", { className: "text-xs font-semibold text-slate-500 mb-1" }, "Completed Registrations"),
          React.createElement("h3", { className: "text-3xl font-extrabold text-slate-900 font-mono tracking-tight" }, "1,110"),
          React.createElement("span", { className: "inline-block text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md mt-2" }, "Verifications done")
        ),
        React.createElement(
          "div",
          { className: "w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg" },
          React.createElement(Icon, { name: "check-circle" })
        )
      )
    ),

    // Middle 3-Column Layout matching Image 6: Quick Generators (4) + Advanced Filters (4) + Analytics (4)
    React.createElement(
      "div",
      { className: "grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch" },

      // Block 1: 4 Quick Report Generator Cards (4 cols)
      React.createElement(
        "div",
        { className: "lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-4" },

        // Card 1: College-wise Report
        React.createElement(
          "div",
          { className: "bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between" },
          React.createElement("div", null,
            React.createElement("h4", { className: "text-xs font-bold text-slate-900 mb-1" }, "College-wise Report"),
            React.createElement("p", { className: "text-[11px] text-slate-500 leading-snug" }, "View participant details based on colleges")
          ),
          React.createElement(
            "button",
            {
              onClick: () => handleGenerateReport("college-wise"),
              className: `mt-4 w-full py-2 rounded-xl text-xs font-bold transition border ${
                activeReportType === "college-wise" ? "bg-purple-700 text-white border-purple-700 shadow-sm" : "border-slate-200 text-slate-700 hover:bg-slate-50"
              }`
            },
            "Generate Report"
          )
        ),

        // Card 2: Event-wise Report
        React.createElement(
          "div",
          { className: "bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between" },
          React.createElement("div", null,
            React.createElement("h4", { className: "text-xs font-bold text-slate-900 mb-1" }, "Event-wise Report"),
            React.createElement("p", { className: "text-[11px] text-slate-500 leading-snug" }, "Analyze registrations for each event")
          ),
          React.createElement(
            "button",
            {
              onClick: () => handleGenerateReport("event-wise"),
              className: `mt-4 w-full py-2 rounded-xl text-xs font-bold transition border ${
                activeReportType === "event-wise" ? "bg-purple-700 text-white border-purple-700 shadow-sm" : "border-slate-200 text-slate-700 hover:bg-slate-50"
              }`
            },
            "Generate Report"
          )
        ),

        // Card 3: Participant Report
        React.createElement(
          "div",
          { className: "bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between" },
          React.createElement("div", null,
            React.createElement("h4", { className: "text-xs font-bold text-slate-900 mb-1" }, "Participant Report"),
            React.createElement("p", { className: "text-[11px] text-slate-500 leading-snug" }, "Complete list of registered participants")
          ),
          React.createElement(
            "button",
            {
              onClick: () => handleGenerateReport("participant"),
              className: `mt-4 w-full py-2 rounded-xl text-xs font-bold transition border ${
                activeReportType === "participant" ? "bg-purple-700 text-white border-purple-700 shadow-sm" : "border-slate-200 text-slate-700 hover:bg-slate-50"
              }`
            },
            "Generate Report"
          )
        ),

        // Card 4: Attendance Report
        React.createElement(
          "div",
          { className: "bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between" },
          React.createElement("div", null,
            React.createElement("h4", { className: "text-xs font-bold text-slate-900 mb-1" }, "Attendance Report"),
            React.createElement("p", { className: "text-[11px] text-slate-500 leading-snug" }, "Track event day attendance")
          ),
          React.createElement(
            "button",
            {
              onClick: () => handleGenerateReport("attendance"),
              className: `mt-4 w-full py-2 rounded-xl text-xs font-bold transition border ${
                activeReportType === "attendance" ? "bg-purple-700 text-white border-purple-700 shadow-sm" : "border-slate-200 text-slate-700 hover:bg-slate-50"
              }`
            },
            "Generate Report"
          )
        )
      ),

      // Block 2: Advanced Filters (4 cols)
      React.createElement(
        "div",
        { className: "lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between" },
        React.createElement(
          "div",
          { className: "space-y-2.5 text-xs" },
          React.createElement("h4", { className: "text-xs font-extrabold text-slate-900 mb-3 uppercase" }, "Advanced Filters"),
          React.createElement("select", {
            value: filters.collegeId,
            disabled: !isAdminPreviewMode && isGS,
            onChange: (e) => setFilters({ ...filters, collegeId: e.target.value }),
            className: "w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white"
          },
            React.createElement("option", { value: "All" }, "Select College ∨"),
            colleges.map(c => React.createElement("option", { key: c._id, value: c._id }, c.name))
          ),
          React.createElement("select", {
            value: filters.eventId,
            onChange: (e) => setFilters({ ...filters, eventId: e.target.value }),
            className: "w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white"
          },
            React.createElement("option", { value: "All" }, "Select Event ∨"),
            events.map(ev => React.createElement("option", { key: ev._id, value: ev.name }, ev.name))
          ),
          React.createElement("select", {
            value: filters.department,
            onChange: (e) => setFilters({ ...filters, department: e.target.value }),
            className: "w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white"
          },
            React.createElement("option", { value: "All" }, "Select Department ∨"),
            React.createElement("option", { value: "CSE" }, "Computer Science (CSE)"),
            React.createElement("option", { value: "IT" }, "Information Technology (IT)"),
            React.createElement("option", { value: "Mechanical" }, "Mechanical Engineering")
          ),
          React.createElement("select", {
            value: filters.year,
            onChange: (e) => setFilters({ ...filters, year: e.target.value }),
            className: "w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white"
          },
            React.createElement("option", { value: "All" }, "Select Year ∨"),
            React.createElement("option", { value: "1st" }, "1st Yr"),
            React.createElement("option", { value: "2nd" }, "2nd Yr"),
            React.createElement("option", { value: "3rd" }, "3rd Yr")
          ),
          React.createElement("select", {
            value: filters.status,
            onChange: (e) => setFilters({ ...filters, status: e.target.value }),
            className: "w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white"
          },
            React.createElement("option", { value: "All" }, "Registration Status ∨"),
            React.createElement("option", { value: "Approved" }, "Approved"),
            React.createElement("option", { value: "Pending" }, "Pending"),
            React.createElement("option", { value: "Rejected" }, "Rejected")
          ),
          React.createElement("input", {
            type: "text",
            placeholder: "Registration Date Range 📅",
            value: filters.dateRange,
            onChange: (e) => setFilters({ ...filters, dateRange: e.target.value }),
            className: "w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white text-xs"
          })
        ),
        React.createElement(
          "button",
          {
            onClick: handleApplyFilters,
            className: "mt-4 w-full py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-sm transition"
          },
          "Apply Filters"
        )
      ),

      // Block 3: Analytics with Doughnut & Multi-bar Charts (4 cols)
      React.createElement(
        "div",
        { className: "lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between" },
        React.createElement("h4", { className: "text-xs font-extrabold text-slate-900 mb-2 uppercase" }, "Analytics"),
        React.createElement("h5", { className: "text-xs font-bold text-slate-700 mb-2" }, "College Participation"),

        // Charts Container
        React.createElement(
          "div",
          { className: "flex items-center justify-between gap-4 py-1" },
          // Doughnut Ring Chart
          React.createElement(CollegeDoughnutChart, null),
          // Multi-color Bar + Trend Curve
          React.createElement(RegistrationTrendsChart, null)
        ),

        // Legend matching Image 6
        React.createElement(
          "div",
          { className: "flex items-center justify-between pt-3 border-t border-slate-100 text-[10px] text-slate-500 font-semibold" },
          React.createElement("span", { className: "flex items-center gap-1.5" },
            React.createElement("span", { className: "w-2.5 h-2.5 rounded-sm bg-purple-700 inline-block" }),
            "College Participation"
          ),
          React.createElement("span", { className: "flex items-center gap-1.5" },
            React.createElement("span", { className: "w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" }),
            "Registration Trends"
          )
        )
      )
    ),

    // Bottom Section: "Report Preview" matching Image 6
    React.createElement(
      "div",
      { className: "bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 print-container" },
      // Header & Download Buttons matching Image 6
      React.createElement(
        "div",
        { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print" },
        React.createElement("h3", { className: "text-sm font-bold text-slate-900" }, "Report Preview"),
        React.createElement(
          "div",
          { className: "flex items-center gap-2" },
          // Download Excel (Green)
          React.createElement(
            "button",
            {
              onClick: () => MelangeAPI.downloadExcelReport().then(() => triggerToast("Excel spreadsheet downloaded!", "success")),
              className: "px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
            },
            React.createElement(Icon, { name: "download", className: "text-xs" }),
            React.createElement("span", null, "Download Excel")
          ),
          // Download PDF (Red)
          React.createElement(
            "button",
            {
              onClick: () => window.print(),
              className: "px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
            },
            React.createElement(Icon, { name: "fileText", className: "text-xs" }),
            React.createElement("span", null, "Download PDF")
          ),
          // Print Report (Outline)
          React.createElement(
            "button",
            {
              onClick: () => window.print(),
              className: "px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
            },
            React.createElement(Icon, { name: "gear", className: "text-slate-400 text-xs" }),
            React.createElement("span", null, "Print Report")
          )
        )
      ),

      // Green Success Banner pill matching Image 6
      showSuccessBadge && React.createElement(
        "div",
        { className: "px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between no-print" },
        React.createElement("span", { className: "flex items-center gap-1.5" },
          React.createElement(Icon, { name: "check", className: "text-emerald-600" }),
          `Report generated successfully ✓ (${totalReportRecords || reportRecords.length} records ready for audit)`
        ),
        React.createElement("button", { onClick: () => setShowSuccessBadge(false), className: "text-emerald-500 hover:text-emerald-700" }, React.createElement(Icon, { name: "close", className: "text-xs" }))
      ),

      // Report Table matching Image 6
      React.createElement(
        "div",
        { className: "table-scroll-container" },
        React.createElement(
          "table",
          { className: "w-full text-left border-collapse report-table" },
          React.createElement(
            "thead",
            null,
            React.createElement(
              "tr",
              { className: "border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase" },
              React.createElement("th", { className: "pb-3" }, "Registration ID"),
              React.createElement("th", { className: "pb-3" }, "Student Name"),
              React.createElement("th", { className: "pb-3" }, "College Name"),
              React.createElement("th", { className: "pb-3" }, "Event Name"),
              React.createElement("th", { className: "pb-3" }, "Department"),
              React.createElement("th", { className: "pb-3" }, "Year"),
              React.createElement("th", { className: "pb-3" }, "Contact Number"),
              React.createElement("th", { className: "pb-3" }, "Status")
            )
          ),
          React.createElement(
            "tbody",
            { className: "divide-y divide-slate-50 text-xs" },
            reportRecords.length === 0 ? React.createElement(
              "tr",
              null,
              React.createElement("td", { colSpan: 8, className: "py-6 text-center text-slate-400" }, "No matching records found in this report scope.")
            ) :
            reportRecords.map(rec => React.createElement(
              "tr",
              { key: rec._id, className: "hover:bg-slate-50/70 transition" },
              React.createElement("td", { className: "py-3 font-mono font-bold text-slate-800 text-[11px]" }, rec.regId),
              React.createElement("td", { className: "py-3 font-bold text-slate-900" }, rec.studentName),
              React.createElement("td", { className: "py-3 text-slate-600" }, rec.collegeName),
              React.createElement("td", { className: "py-3 font-semibold text-purple-900" }, rec.eventName),
              React.createElement("td", { className: "py-3 text-slate-500 font-mono text-[11px]" }, rec.department),
              React.createElement("td", { className: "py-3 text-slate-500 font-mono text-[11px]" }, rec.year),
              React.createElement("td", { className: "py-3 text-slate-600 font-mono text-[11px]" }, rec.contact),
              React.createElement(
                "td",
                { className: "py-3" },
                React.createElement(
                  "span",
                  { className: "px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700" },
                  rec.status || "Active"
                )
              )
            ))
          )
        )
      )
    )
  );
}

// Interactive SVG Doughnut Chart matching Image 6
function CollegeDoughnutChart() {
  const size = 90;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Percentages: 35% (purple), 25% (amber), 22% (blue), 18% (rose)
  const segments = [
    { percent: 0.35, color: "#7c3aed" },
    { percent: 0.25, color: "#f59e0b" },
    { percent: 0.22, color: "#06b6d4" },
    { percent: 0.18, color: "#ec4899" }
  ];

  let cumulativePercent = 0;

  return React.createElement(
    "svg",
    { width: size, height: size, viewBox: `0 0 ${size} ${size}`, className: "flex-shrink-0" },
    segments.map((seg, i) => {
      const strokeDasharray = `${seg.percent * circumference} ${circumference}`;
      const strokeDashoffset = -cumulativePercent * circumference;
      cumulativePercent += seg.percent;

      return React.createElement("circle", {
        key: i,
        cx: size / 2,
        cy: size / 2,
        r: radius,
        fill: "transparent",
        stroke: seg.color,
        strokeWidth: strokeWidth,
        strokeDasharray: strokeDasharray,
        strokeDashoffset: strokeDashoffset,
        className: "donut-segment"
      });
    }),
    React.createElement("circle", {
      cx: size / 2,
      cy: size / 2,
      r: radius - strokeWidth / 2,
      fill: "#ffffff"
    }),
    React.createElement(
      "text",
      {
        x: "50%",
        y: "53%",
        textAnchor: "middle",
        dominantBaseline: "middle",
        fill: "#1e1b4b",
        fontSize: "11px",
        fontWeight: "bold",
        fontFamily: "Plus Jakarta Sans"
      },
      "42 Inst."
    )
  );
}

// Interactive SVG Multi-color Bar + Trend Spline Chart matching Image 6
function RegistrationTrendsChart() {
  const width = 160;
  const height = 90;

  const data = [
    { month: "Jan", count: 70, color: "#7c3aed" },
    { month: "Feb", count: 45, color: "#3b82f6" },
    { month: "Mar", count: 100, color: "#d97706" },
    { month: "Apr", count: 65, color: "#06b6d4" },
    { month: "May", count: 20, color: "#f59e0b" }
  ];

  const maxVal = 120;
  const points = data.map((d, i) => {
    const x = 16 + i * ((width - 32) / (data.length - 1));
    const y = height - (d.count / maxVal) * (height - 25) - 15;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  return React.createElement(
    "svg",
    { viewBox: `0 0 ${width} ${height}`, className: "w-full max-w-[170px] h-24" },
    // Bars
    points.map((p, i) => React.createElement("rect", {
      key: i,
      x: p.x - 5,
      y: p.y,
      width: 10,
      height: height - 15 - p.y,
      fill: p.color,
      rx: 2
    })),
    // Spline curve
    React.createElement("path", {
      d: pathD,
      fill: "none",
      stroke: "#f59e0b",
      strokeWidth: 2,
      strokeLinecap: "round"
    }),
    // Points
    points.map((p, i) => React.createElement("circle", {
      key: `dot-${i}`,
      cx: p.x,
      cy: p.y,
      r: 2.5,
      fill: "#ffffff",
      stroke: "#f59e0b",
      strokeWidth: 1.5
    })),
    // Month labels
    points.map((p, i) => React.createElement(
      "text",
      {
        key: `lbl-${i}`,
        x: p.x,
        y: height - 2,
        textAnchor: "middle",
        fill: "#94a3b8",
        fontSize: "8px",
        fontFamily: "Plus Jakarta Sans"
      },
      p.month
    ))
  );
}


function AnnouncementsView({ announcements = [], triggerToast }) {
  return React.createElement(
    "div",
    { className: "space-y-4" },
    React.createElement("h2", { className: "text-xl font-bold text-slate-900" }, "Festival Announcements & Bulletins"),
    React.createElement(
      "div",
      { className: "space-y-3" },
      announcements.map(ann => React.createElement(
        "div",
        { key: ann._id, className: "bg-white p-5 rounded-2xl border border-slate-100 shadow-sm" },
        React.createElement("div", { className: "flex justify-between items-center mb-1" },
          React.createElement("h3", { className: "text-sm font-bold text-slate-900" }, ann.title),
          React.createElement("span", { className: "text-[10px] text-slate-400 font-mono" }, ann.date)
        ),
        React.createElement("p", { className: "text-xs text-slate-600 leading-relaxed" }, ann.content),
        React.createElement("span", { className: "inline-block text-[10px] text-purple-700 font-bold mt-2" }, `📢 Issued by ${ann.author}`)
      ))
    )
  );
}

function SettingsView({ currentUser, onOpenChangePassword }) {
  return React.createElement(
    "div",
    { className: "bg-white p-6 rounded-3xl border border-slate-100 shadow-sm max-w-xl space-y-5" },
    React.createElement("h2", { className: "text-lg font-bold text-slate-900" }, "Account & Security Settings"),
    React.createElement(
      "div",
      { className: "p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between" },
      React.createElement(
        "div",
        null,
        React.createElement("h4", { className: "text-xs font-bold text-slate-800" }, "Change Portal Password"),
        React.createElement("p", { className: "text-[11px] text-slate-500" }, "Update your security credentials for portal access")
      ),
      React.createElement(
        "button",
        {
          onClick: onOpenChangePassword,
          className: "px-4 py-2 rounded-xl bg-purple-700 text-white font-bold text-xs hover:bg-purple-800 transition"
        },
        "Change Password"
      )
    ),
    React.createElement(
      "div",
      { className: "p-4 rounded-2xl bg-slate-50 border border-slate-200/60" },
      React.createElement("h4", { className: "text-xs font-bold text-slate-800 mb-2" }, "Session Information"),
      React.createElement("p", { className: "text-xs text-slate-600" }, `Role: ${currentUser.role}`),
      React.createElement("p", { className: "text-xs text-slate-600" }, `Last Login: ${new Date(currentUser.lastLogin || Date.now()).toLocaleString()}`),
      React.createElement("p", { className: "text-xs text-slate-600" }, `Session Security: HMAC-SHA256 Signed JWT`)
    )
  );
}

function CollegeProfileView({ currentCollege, setCurrentCollege, triggerToast }) {
  return React.createElement(CollegeGSDashboardView, {
    currentUser: { role: "college_gs", name: currentCollege?.gsName },
    currentCollege,
    setCurrentCollege,
    setCurrentView: () => {},
    triggerToast
  });
}

function AddParticipantStandaloneView({ currentCollege, setCurrentView, triggerToast }) {
  return React.createElement(CollegeGSDashboardView, {
    currentUser: { role: "college_gs", name: currentCollege?.gsName },
    currentCollege,
    setCurrentCollege: () => {},
    setCurrentView,
    triggerToast
  });
}

function ParticipantListStandaloneView({ currentCollege, triggerToast }) {
  return React.createElement(CollegeGSDashboardView, {
    currentUser: { role: "college_gs", name: currentCollege?.gsName },
    currentCollege,
    setCurrentCollege: () => {},
    setCurrentView: () => {},
    triggerToast
  });
}

function GSEventRegistrationsView({ currentCollege, triggerToast }) {
  return React.createElement(CollegeGSDashboardView, {
    currentUser: { role: "college_gs", name: currentCollege?.gsName },
    currentCollege,
    setCurrentCollege: () => {},
    setCurrentView: () => {},
    triggerToast
  });
}

// Mount React Root
const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(React.createElement(MelangeApp));
}
