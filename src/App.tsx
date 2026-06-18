import { useEffect, useState, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { FeedFiltersProvider } from "@/hooks/useFeedFilters";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import CalendarView from "./pages/CalendarView";
import AddEvent from "./pages/AddEvent";
import EventDetail from "./pages/EventDetail";
import Profile from "./pages/Profile";
import Discover from "./pages/Discover";
import TimeCapsule from "./pages/TimeCapsule";
import CapsuleDetail from "./pages/CapsuleDetail";
import Onboarding from "./pages/Onboarding";
import Welcome from "./pages/Welcome";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import OrgDashboard from "./pages/organizer/Dashboard";
import OrgEventDetail from "./pages/organizer/EventDetail";
import OrgCity from "./pages/organizer/City";
import OrgPulse from "./pages/organizer/Pulse";
import OrgPastEventDetail from "./pages/organizer/PastEventDetail";
import NotFound from "./pages/NotFound";
import UsernameRedirect from "./pages/UsernameRedirect";
import CoachMarks from "@/components/CoachMarks";
import ScrollToTop from "@/components/ScrollToTop";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!user) { setChecking(false); return; }
    setChecking(true);
    (async () => {
      const { data, error } = await supabase
        .from("user_preferences" as any)
        .select("onboarded")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      // Treat missing profile row OR onboarded !== true as "needs onboarding".
      // This prevents freshly-confirmed users from slipping past onboarding
      // due to a race between handle_new_user trigger and this check.
      const onboarded = !error && (data as any)?.onboarded === true;
      setNeedsOnboarding(!onboarded);
      setChecking(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/welcome" replace />;
  if (needsOnboarding && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
};

const AuthRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

// Gates /auth: a brand-new visitor must go through /welcome first
// (type selection → intro → login). Welcome sets the flag before
// navigating to /auth, so returning users / sign-outs land on /welcome
// the first time and only see Auth after the intro.
const AuthGate = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  let seen = false;
  try { seen = sessionStorage.getItem("iamin.welcome_seen") === "1"; } catch { /* ignore */ }
  if (!seen) return <Navigate to="/welcome" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AuthProvider>
          <FeedFiltersProvider>
          <ScrollToTop />
          <Routes>
            <Route path="/welcome" element={<AuthRoute><Welcome /></AuthRoute>} />
            <Route path="/auth" element={<AuthGate><Auth /></AuthGate>} />

            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><CalendarView /></ProtectedRoute>} />
            <Route path="/add-event" element={<ProtectedRoute><AddEvent /></ProtectedRoute>} />
            <Route path="/event/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/u/:username" element={<ProtectedRoute><UsernameRedirect /></ProtectedRoute>} />
            <Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
            <Route path="/time-capsule" element={<ProtectedRoute><TimeCapsule /></ProtectedRoute>} />
            <Route path="/time-capsule/:eventId" element={<ProtectedRoute><CapsuleDetail /></ProtectedRoute>} />
            <Route path="/organizer" element={<ProtectedRoute><OrgDashboard /></ProtectedRoute>} />
            <Route path="/organizer/event/:id" element={<ProtectedRoute><OrgEventDetail /></ProtectedRoute>} />
            <Route path="/organizer/city" element={<ProtectedRoute><OrgCity /></ProtectedRoute>} />
            <Route path="/organizer/pulse" element={<ProtectedRoute><OrgPulse /></ProtectedRoute>} />
            <Route path="/organizer/pulse/:id" element={<ProtectedRoute><OrgPastEventDetail /></ProtectedRoute>} />
            <Route path="/organizer/tools" element={<ProtectedRoute><OrganizerDashboard /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          {/* CoachMarks removed — onboarding intro now covers this */}
          </FeedFiltersProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
