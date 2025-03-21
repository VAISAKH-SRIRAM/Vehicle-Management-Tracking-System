import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { VehicleProvider } from "@/contexts/VehicleContext";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import LiveTracking from "@/pages/LiveTracking";
import VehiclesPage from "@/pages/VehiclesPage";
import GeofencesPage from "@/pages/GeofencesPage";
import ReportsPage from "@/pages/ReportsPage";
import AlertsPage from "@/pages/AlertsPage";
import SettingsPage from "@/pages/SettingsPage";
import HelpPage from "@/pages/HelpPage";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={Dashboard} />
      <Route path="/live-tracking" component={LiveTracking} />
      <Route path="/vehicles" component={VehiclesPage} />
      <Route path="/geofences" component={GeofencesPage} />
      <Route path="/reports" component={ReportsPage} />
      <Route path="/alerts" component={AlertsPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/help" component={HelpPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <VehicleProvider>
          <Router />
          <Toaster />
        </VehicleProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
