import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface MultiFileUploadProps {
  bucket: string;
  path: string;
  onUploadComplete: (urls: string[]) => void;
  accept?: string;
  maxSizeMB?: number;
}

// Função para converter imagem para WebP
const convertToWebP = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert image'));
            }
          },
          'image/webp',
          0.85 // Qualidade 85%
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export function MultiFileUpload({
  bucket,
  path,
  onUploadComplete,
  accept = "image/*",
  maxSizeMB = 20,
}: MultiFileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const { toast } = useToast();

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const uploadedUrls: string[] = [];
    setUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Processando ${i + 1} de ${files.length}...`);

        // Validate file size
        const fileSizeMB = file.size / 1024 / 1024;
        if (fileSizeMB > maxSizeMB) {
          toast({
            title: "Erro",
            description: `${file.name} excede o tamanho máximo de ${maxSizeMB}MB`,
            variant: "destructive",
          });
          continue;
        }

        // Converter para WebP se for imagem
        let fileToUpload: File | Blob = file;
        let fileExtension = "webp";
        
        if (file.type.startsWith("image/")) {
          try {
            const webpBlob = await convertToWebP(file);
            fileToUpload = webpBlob;
          } catch (error) {
            console.error("Error converting to WebP:", error);
            // Se falhar a conversão, usa o arquivo original
            fileExtension = file.name.split(".").pop() || "jpg";
            fileToUpload = file;
          }
        } else {
          fileExtension = file.name.split(".").pop() || "file";
        }

        // Generate unique filename
        const fileName = `${path}/${Date.now()}_${i}.${fileExtension}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, fileToUpload, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast({
            title: "Erro",
            description: `Erro ao enviar ${file.name}`,
            variant: "destructive",
          });
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);

        uploadedUrls.push(urlData.publicUrl);
      }

      if (uploadedUrls.length > 0) {
        onUploadComplete(uploadedUrls);
        toast({
          title: "Sucesso",
          description: `${uploadedUrls.length} ${uploadedUrls.length === 1 ? 'arquivo enviado' : 'arquivos enviados'} com sucesso`,
        });
      }
    } catch (error: any) {
      console.error("Error uploading files:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar arquivos",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress("");
      // Reset input
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
              <p className="text-sm text-muted-foreground">{uploadProgress}</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold">Clique para enviar múltiplas fotos</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Imagens serão convertidas automaticamente para WebP
              </p>
            </>
          )}
        </div>
        <input
          type="file"
          className="hidden"
          accept={accept}
          multiple
          onChange={handleFilesChange}
          disabled={uploading}
        />
      </label>
    </div>
  );
}
