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
import { EditProfilePage } from "@/pages/EditProfilePage";
import { BlogPage } from "@/pages/BlogPage";
import { BlogDetailPage } from "@/pages/BlogDetailPage";

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
              <Route path="/providers/register" component={ProviderRegisterPage} />
              <Route path="/console/experiences" component={ExperiencesConsolePage} />
              <Route path="/referral" component={ReferralPage} />
              <Route path="/notifications" component={NotificationsPage} />
              <Route path="/admin" component={AdminPanelPage} />
              <Route path="/settings" component={SettingsPage} />
              <Route path="/checkout" component={CheckoutPage} />
              <Route path="/orders/:id" component={OrderTrackingPage} />
              <Route path="/orders" component={OrdersPage} />
              <Route path="/gold" component={TabaqGoldPage} />
              <Route path="/user/:username" component={PublicProfilePage} />
              <Route path="/chefs/:id" component={ChefDetailPage} />
              <Route path="/chefs" component={ChefsPage} />
              <Route path="/michelin/:id" component={MichelinDetailPage} />
              <Route path="/michelin" component={MichelinPage} />
              <Route path="/experiences" component={ExperiencesPage} />
              <Route path="/experiences/:id" component={ExperienceDetailPage} />
              <Route path="/edit-profile" component={EditProfilePage} />
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
