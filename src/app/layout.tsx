import "./globals.css";
import type { Metadata } from "next";
import Script from 'next/script';

export const metadata: Metadata = {
  title: "Gay 2 Z - LGBTQ+ Services Directory",
  description: "Find LGBTQ+ friendly services in your area",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bubblegum+Sans&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <div id="map-container" style={{ height: '400px', width: '100%', position: 'absolute', visibility: 'hidden', zIndex: -1 }}></div>
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=AIzaSyCZd9yt641Msj2cT3esD1NHeH0WuBMBhMQ&libraries=places,geometry&loading=async`}
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  );
}
