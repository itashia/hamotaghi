import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App";
import { DirectionProvider } from "@/components/ui/direction";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="hamotaghi-theme"
    >
      <DirectionProvider dir="rtl">
        <TooltipProvider>
          <App />
          <Toaster dir="rtl" position="top-center" />
        </TooltipProvider>
      </DirectionProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
