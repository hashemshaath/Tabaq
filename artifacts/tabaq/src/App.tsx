import React from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { LocalizationProvider } from "@/context/LocalizationContext";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

import { HomePage } from "@/pages/HomePage";
import { DiscoveryPage } from "@/pages/DiscoveryPage";
import { RestaurantDetailPage } from "@/pages/RestaurantDetailPage";
import { DishDetailPage } from "@/pages/DishDetailPage";
import { DishesPage } from "@/pages/DishesPage";
import { SearchPage } from "@/pages/SearchPage";
import { OffersPage } from "@/pages/OffersPage";
import { LeaderboardPage } from "@/pages/LeaderboardPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { BookingsPage } from "@/pages/BookingsPage";
import { VouchersPage } from "@/pages/VouchersPage";
import { SignInPage } from "@/pages/SignInPage";
import { CollectionsPage } from "@/pages/CollectionsPage";
import { BusinessConsolePage } from "@/pages/BusinessConsolePage";
import { PartnerLandingPage } from "@/pages/PartnerLandingPage";
import { AdminPanelPage } from "@/pages/AdminPanelPage";
import { UserDashboardPage } from "@/pages/UserDashboardPage";
import { ReferralPage } from "@/pages/ReferralPage";
import { ProviderRegistrationPage } from "@/pages/ProviderRegistrationPage";
import FeedPage from "@/pages/FeedPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/signin" component={SignInPage} />
      <Route>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            <Switch>
              <Route path="/" component={HomePage} />
              <Route path="/search" component={SearchPage} />
              <Route path="/restaurants" component={DiscoveryPage} />
              <Route path="/restaurants/:id" component={RestaurantDetailPage} />
              <Route path="/dishes" component={DishesPage} />
              <Route path="/dishes/:id" component={DishDetailPage} />
              <Route path="/offers" component={OffersPage} />
              <Route path="/leaderboard" component={LeaderboardPage} />
              <Route path="/profile" component={ProfilePage} />
              <Route path="/bookings" component={BookingsPage} />
              <Route path="/vouchers" component={VouchersPage} />
              <Route path="/feed" component={FeedPage} />
              <Route path="/collections/:id" component={CollectionsPage} />
              <Route path="/collections" component={CollectionsPage} />
              <Route path="/console" component={BusinessConsolePage} />
              <Route path="/dashboard" component={UserDashboardPage} />
              <Route path="/partners" component={PartnerLandingPage} />
              <Route path="/partners/register" component={ProviderRegistrationPage} />
              <Route path="/referral" component={ReferralPage} />
              <Route path="/admin" component={AdminPanelPage} />
              <Route component={NotFound} />
            </Switch>
          </main>
          <Footer />
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LocalizationProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
      </LocalizationProvider>
    </QueryClientProvider>
  );
}

export default App;
