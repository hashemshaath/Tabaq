import React from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { LocalizationProvider } from "@/context/LocalizationContext";
import { CityProvider } from "@/context/CityContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { CartProvider } from "@/context/CartContext";
import { AnalyticsInjector } from "@/components/AnalyticsInjector";

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
import { ProviderRegisterPage } from "@/pages/ProviderRegisterPage";
import { ExperiencesConsolePage } from "@/pages/ExperiencesConsolePage";
import { SettingsPage } from "@/pages/SettingsPage";
import { MichelinPage } from "@/pages/MichelinPage";
import { MichelinDetailPage } from "@/pages/MichelinDetailPage";
import { CheckoutPage } from "@/pages/CheckoutPage";
import { OrdersPage } from "@/pages/OrdersPage";
import { OrderTrackingPage } from "@/pages/OrderTrackingPage";
import { TabaqGoldPage } from "@/pages/TabaqGoldPage";
import FeedPage from "@/pages/FeedPage";
import NotificationsPage from "@/pages/NotificationsPage";
import NotFound from "@/pages/not-found";
import { TermsPage, PrivacyPage, AboutPage, FAQPage, ContactPage } from "@/pages/StaticPage";
import { ExperiencesPage } from "@/pages/ExperiencesPage";
import { ExperienceDetailPage } from "@/pages/ExperienceDetailPage";
import { GiftRedeemPage } from "@/pages/GiftRedeemPage";
import { JoinPage } from "@/pages/JoinPage";
import { ChefsPage } from "@/pages/ChefsPage";
import { ChefDetailPage } from "@/pages/ChefDetailPage";
import { PublicProfilePage } from "@/pages/PublicProfilePage";
import { AccountPage } from "@/pages/AccountPage";
import { BlogPage } from "@/pages/BlogPage";
import { BlogDetailPage } from "@/pages/BlogDetailPage";
import { CateringPage } from "@/pages/CateringPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";

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
      <Route path="/join" component={JoinPage} />
      <Route>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            <Switch>
              <Route path="/" component={HomePage} />
              <Route path="/search" component={SearchPage} />
              <Route path="/restaurants" component={DiscoveryPage} />
              <Route path="/discover" component={DiscoveryPage} />
              <Route path="/restaurants/:id" component={RestaurantDetailPage} />
              <Route path="/dishes" component={DishesPage} />
              <Route path="/dishes/:id" component={DishDetailPage} />
              <Route path="/offers" component={OffersPage} />
              <Route path="/leaderboard" component={LeaderboardPage} />
              <Route path="/profile">
                <ProtectedRoute><ProfilePage /></ProtectedRoute>
              </Route>
              <Route path="/bookings">
                <ProtectedRoute><BookingsPage /></ProtectedRoute>
              </Route>
              <Route path="/vouchers">
                <ProtectedRoute><VouchersPage /></ProtectedRoute>
              </Route>
              <Route path="/feed">
                <ProtectedRoute><FeedPage /></ProtectedRoute>
              </Route>
              <Route path="/collections/:id" component={CollectionsPage} />
              <Route path="/collections" component={CollectionsPage} />
              <Route path="/console">
                <ProtectedRoute requireOwner><BusinessConsolePage /></ProtectedRoute>
              </Route>
              <Route path="/dashboard">
                <ProtectedRoute><UserDashboardPage /></ProtectedRoute>
              </Route>
              <Route path="/partners" component={PartnerLandingPage} />
              <Route path="/partners/register" component={ProviderRegistrationPage} />
              <Route path="/providers/register" component={ProviderRegisterPage} />
              <Route path="/console/experiences">
                <ProtectedRoute requireOwner><ExperiencesConsolePage /></ProtectedRoute>
              </Route>
              <Route path="/referral">
                <ProtectedRoute><ReferralPage /></ProtectedRoute>
              </Route>
              <Route path="/notifications">
                <ProtectedRoute><NotificationsPage /></ProtectedRoute>
              </Route>
              <Route path="/admin">
                <ProtectedRoute requireAdmin><AdminPanelPage /></ProtectedRoute>
              </Route>
              <Route path="/settings">
                <ProtectedRoute requireAdmin><SettingsPage /></ProtectedRoute>
              </Route>
              <Route path="/checkout">
                <ProtectedRoute><CheckoutPage /></ProtectedRoute>
              </Route>
              <Route path="/orders/:id">
                <ProtectedRoute><OrderTrackingPage /></ProtectedRoute>
              </Route>
              <Route path="/orders">
                <ProtectedRoute><OrdersPage /></ProtectedRoute>
              </Route>
              <Route path="/gold" component={TabaqGoldPage} />
              <Route path="/user/:username" component={PublicProfilePage} />
              <Route path="/chefs/:id" component={ChefDetailPage} />
              <Route path="/chefs" component={ChefsPage} />
              <Route path="/michelin/:id" component={MichelinDetailPage} />
              <Route path="/michelin" component={MichelinPage} />
              <Route path="/experiences" component={ExperiencesPage} />
              <Route path="/experiences/:id" component={ExperienceDetailPage} />
              <Route path="/account">
                <ProtectedRoute><AccountPage /></ProtectedRoute>
              </Route>
              <Route path="/edit-profile">
                <ProtectedRoute><AccountPage /></ProtectedRoute>
              </Route>
              <Route path="/account-settings">
                <ProtectedRoute><AccountPage /></ProtectedRoute>
              </Route>
              <Route path="/catering" component={CateringPage} />
              <Route path="/blog/:slug" component={BlogDetailPage} />
              <Route path="/blog" component={BlogPage} />
              <Route path="/gift-redeem/:code" component={GiftRedeemPage} />
              <Route path="/terms" component={TermsPage} />
              <Route path="/privacy" component={PrivacyPage} />
              <Route path="/about" component={AboutPage} />
              <Route path="/faq" component={FAQPage} />
              <Route path="/contact" component={ContactPage} />
              {/* Unified /:username catch-all — must be last before NotFound */}
              <Route path="/:username" component={PublicProfilePage} />
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
        <SettingsProvider>
          <CartProvider>
            <CityProvider>
              <AuthProvider>
                <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                  <AnalyticsInjector />
                  <Router />
                </WouterRouter>
              </AuthProvider>
            </CityProvider>
          </CartProvider>
        </SettingsProvider>
      </LocalizationProvider>
    </QueryClientProvider>
  );
}

export default App;
