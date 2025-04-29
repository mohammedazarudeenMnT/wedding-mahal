import { Lato } from "next/font/google";
import "./globals.css";
import ClientProviders from "../Components/providers/ClientProviders";

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata = {
  title: "Your App Name",
  description: "Your app description for SEO purposes",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${lato.className} template-color-1`}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
