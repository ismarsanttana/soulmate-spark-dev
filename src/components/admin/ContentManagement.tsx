import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewsManagement } from "./content/NewsManagement";
import { EventsManagement } from "./content/EventsManagement";

export function ContentManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gerenciamento de Conteúdo</h2>
        <p className="text-muted-foreground">Gerencie notícias e eventos do portal</p>
      </div>

      <Tabs defaultValue="news" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="news">Notícias</TabsTrigger>
          <TabsTrigger value="events">Eventos</TabsTrigger>
        </TabsList>
        <TabsContent value="news">
          <NewsManagement />
        </TabsContent>
        <TabsContent value="events">
          <EventsManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
