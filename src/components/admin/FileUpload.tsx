import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  bucket: string;
  path: string;
  onUploadComplete: (url: string) => void;
  currentUrl?: string;
  onRemove?: () => void;
  accept?: string;
  maxSizeMB?: number;
}

export function FileUpload({
  bucket,
  path,
  onUploadComplete,
  currentUrl,
  onRemove,
  accept = "image/*,.pdf,.doc,.docx",
  maxSizeMB = 20,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [fileType, setFileType] = useState<string>("");
  const { toast } = useToast();

  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };

  const isPDF = (url: string) => {
    return /\.pdf$/i.test(url);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    const fileSizeMB = file.size / 1024 / 1024;
    if (fileSizeMB > maxSizeMB) {
      toast({
        title: "Erro",
        description: `O arquivo deve ter no máximo ${maxSizeMB}MB`,
        variant: "destructive",
      });
      return;
    }

    setFileType(file.type);

    setUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${path}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      setPreview(urlData.publicUrl);
      onUploadComplete(urlData.publicUrl);

      toast({
        title: "Sucesso",
        description: "Arquivo enviado com sucesso",
      });
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar arquivo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!currentUrl || !onRemove) return;

    try {
      // Extract file path from URL
      const urlParts = currentUrl.split(`${bucket}/`);
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from(bucket).remove([filePath]);
      }

      setPreview(null);
      onRemove();

      toast({
        title: "Sucesso",
        description: "Arquivo removido com sucesso",
      });
    } catch (error: any) {
      console.error("Error removing file:", error);
      toast({
        title: "Erro",
        description: "Erro ao remover arquivo",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative">
          {isImage(preview) ? (
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-contain rounded-lg border border-border bg-muted"
            />
          ) : (
            <div className="w-full h-48 flex flex-col items-center justify-center rounded-lg border border-border bg-muted">
              <FileText className="h-16 w-16 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {isPDF(preview) ? "Arquivo PDF" : "Documento"} enviado
              </p>
              <a
                href={preview}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline mt-2"
              >
                Visualizar arquivo
              </a>
            </div>
          )}
          {onRemove && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {uploading ? (
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            ) : (
              <Upload className="h-10 w-10 text-muted-foreground mb-2" />
            )}
            <p className="mb-2 text-sm text-muted-foreground">
              <span className="font-semibold">Clique para enviar</span> ou arraste
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, WEBP, PDF, DOC, DOCX (máx. {maxSizeMB}MB)
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      )}
    </div>
  );
}
