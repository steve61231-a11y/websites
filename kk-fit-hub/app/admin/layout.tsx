import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · KK Fit Hub admin" },
  robots: { index: false, follow: false, nocache: true },
};

/** The admin is light only, with no smooth scrolling or decorative motion (PRD 15). */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="light" data-admin className="min-h-svh bg-canvas text-text">
      {children}
    </div>
  );
}
