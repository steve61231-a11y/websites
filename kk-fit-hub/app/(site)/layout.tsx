import { whatsappMessages } from "@/content/whatsapp";
import { ActionBar } from "@/components/site/ActionBar";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { WhatsAppFab } from "@/components/site/WhatsAppFab";
import { UtmCapture } from "@/components/forms/UtmCapture";
import { RevealObserver } from "@/motion/RevealObserver";
import { getBuildYear } from "@/lib/data/build";
import { getActivities, getSettings } from "@/lib/data/public";
import { whatsappHref } from "@/lib/phone";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [settings, activities, year] = await Promise.all([getSettings(), getActivities(), getBuildYear()]);
  const wa = whatsappHref(settings.whatsappE164, whatsappMessages.general);

  return (
    <>
      <a
        href="#main"
        className="fixed top-2 left-2 z-[60] -translate-y-20 rounded-full bg-green-600 px-5 py-3 font-semibold text-white focus:translate-y-0"
      >
        Skip to content
      </a>
      <Header phones={settings.phones} whatsappHref={wa} counties={settings.counties} />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer activities={activities} settings={settings} whatsappHref={wa} year={year} />
      <ActionBar whatsappHref={wa} />
      <WhatsAppFab whatsappHref={wa} />
      <RevealObserver />
      <UtmCapture />
    </>
  );
}
