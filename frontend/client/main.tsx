import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import { debugUserProfilesTable, debugSignupFlow, debugBackendProfileCreation, debugBackendProfileFetch } from "@/lib/debug-db";
import "@/styles/globals.css";

// Add debug functions to window for console access
if (typeof window !== 'undefined') {
  (window as any).debugUserProfilesTable = debugUserProfilesTable;
  (window as any).debugSignupFlow = debugSignupFlow;
  (window as any).debugBackendProfileCreation = debugBackendProfileCreation;
  (window as any).debugBackendProfileFetch = debugBackendProfileFetch;
  console.log('🔧 Debug functions available:');
  console.log('  - debugUserProfilesTable() - Test table access');
  console.log('  - debugSignupFlow(email, password, name) - Test signup flow');
  console.log('  - debugBackendProfileCreation(userId, name) - Test backend creation');
  console.log('  - debugBackendProfileFetch(userId) - Test backend fetch');
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);

