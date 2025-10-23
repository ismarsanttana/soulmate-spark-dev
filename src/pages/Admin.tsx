import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Settings } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { VisualCustomization } from "@/components/admin/VisualCustomization";
import { SecretariasManagement } from "@/components/admin/SecretariasManagement";
import { UsersRolesManagement } from "@/components/admin/UsersRolesManagement";
import { UserRelationshipsManagement } from "@/components/admin/UserRelationshipsManagement";
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
      case "relationships":
        return <UserRelationshipsManagement />;
      case "content":
        return <ContentManagement />;
      case "stats":
        return <Statistics />;
      default:
        return <VisualCustomization />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="flex h-full items-center gap-4 px-6">
              <SidebarTrigger className="-ml-2" />
              <div className="flex items-center gap-3">
                <Settings className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Painel de Administração</h1>
              </div>
            </div>
          </header>

          <main className="flex-1 p-8 bg-gradient-to-br from-background to-secondary/5 overflow-auto">
            <div className="max-w-7xl mx-auto">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
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
