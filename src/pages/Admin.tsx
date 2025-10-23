import { useState } from "react";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Settings } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { VisualCustomization } from "@/components/admin/VisualCustomization";
import { SecretariasManagement } from "@/components/admin/SecretariasManagement";
import { UsersRolesManagement } from "@/components/admin/UsersRolesManagement";
import { ContentManagement } from "@/components/admin/ContentManagement";
import { Statistics } from "@/components/admin/Statistics";

const AdminContent = () => {
  const [activeTab, setActiveTab] = useState("visual");

  const renderContent = () => {
    switch (activeTab) {
      case "visual":
        return <VisualCustomization />;
      case "secretarias":
        return <SecretariasManagement />;
      case "users":
        return <UsersRolesManagement />;
      case "content":
        return <ContentManagement />;
      case "stats":
        return <Statistics />;
      default:
        return <VisualCustomization />;
    }
  };

  return (
    <Layout>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
          
          <div className="flex-1">
            <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
              <div className="flex h-full items-center gap-4 px-6">
                <SidebarTrigger />
                <div className="flex items-center gap-3">
                  <Settings className="h-6 w-6 text-primary" />
                  <h1 className="text-2xl font-bold">Painel de Administração</h1>
                </div>
              </div>
            </header>

            <main className="p-6 bg-gradient-to-br from-background to-secondary/10 min-h-[calc(100vh-4rem)]">
              {renderContent()}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </Layout>
  );
};

const Admin = () => {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminContent />
    </ProtectedRoute>
  );
};

export default Admin;
