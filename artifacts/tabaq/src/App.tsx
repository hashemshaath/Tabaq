import React from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";

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
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
