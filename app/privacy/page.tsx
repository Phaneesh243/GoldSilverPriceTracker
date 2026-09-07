import type { Metadata } from "next";
import InfoPage from "../_components/InfoPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How GoldSilverPrices handles local preferences, cookies, and browser push notification subscriptions.",
  alternates: { canonical: "/privacy" },
};

export default function Page() {
  return (
    <InfoPage title="Privacy Policy" description="How GoldSilverPrices handles website usage information and push notification preferences.">
      <h2>Website usage</h2>
      <p>GoldSilverPrices stores basic local preferences in your browser, such as theme choice, consent state and notification preference state, to keep the site usable across visits.</p>
      <h2>Push notifications</h2>
      <p>If you allow browser notifications, we store your push subscription details in our notification system so we can send two fixed editions on regular Indian trading days, including provider-backed stocks, metals, crypto and currency information. Email requires a verified account and a separate opt-in. Disable all editions or individual delivery channels from the notification bell; every email includes an unsubscribe link.</p>
      <h2>What we store</h2>
      <p>The stored record includes your browser push endpoint, cryptographic push keys, selected city and preferred gold purity. We do not use push subscriptions for unrelated marketing.</p>
      <h2>How to opt out</h2>
      <p>You can turn notifications off at any time using the notification bell in the site header or through your browser notification settings.</p>
    </InfoPage>
  );
}
