import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ImageCropDialog } from "./ImageCropDialog";

interface FileUploadProps {
  bucket: string;
  path: string;
  onUploadComplete: (url: string) => void;
  currentUrl?: string;
  onRemove?: () => void;
  accept?: string;
  maxSizeMB?: number;
  enableCrop?: boolean;
  cropAspectRatio?: number;
}

export function FileUpload({
  bucket,
  path,
  onUploadComplete,
  currentUrl,
  onRemove,
  accept = "image/*,.pdf,.doc,.docx",
  maxSizeMB = 20,
  enableCrop = false,
  cropAspectRatio = 1,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [fileType, setFileType] = useState<string>("");
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tempPreview, setTempPreview] = useState<string>("");
  const { toast } = useToast();

  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };

  const isPDF = (url: string) => {
    return /\.pdf$/i.test(url);
  };

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

    // If crop is enabled and file is an image, show crop dialog
    if (enableCrop && file.type.startsWith("image/")) {
      setSelectedFile(file);
      const tempUrl = URL.createObjectURL(file);
      setTempPreview(tempUrl);
      setCropDialogOpen(true);
      return;
    }

    // Otherwise upload directly
    await uploadFile(file);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setCropDialogOpen(false);
    
    // Create a file from the cropped blob
    const croppedFile = new File([croppedBlob], selectedFile?.name || "cropped.png", {
      type: "image/png"
    });
    
    await uploadFile(croppedFile);
    
    // Clean up temp preview
    if (tempPreview) {
      URL.revokeObjectURL(tempPreview);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);

    try {
      let fileToUpload: File | Blob = file;
      let fileExtension = file.name.split(".").pop() || "file";

      // Converter para WebP se for imagem
      if (file.type.startsWith("image/")) {
        try {
          const webpBlob = await convertToWebP(file);
          fileToUpload = webpBlob;
          fileExtension = "webp";
        } catch (error) {
          console.error("Error converting to WebP, using original:", error);
          // Se falhar, usa o arquivo original
        }
      }

      // Generate unique filename
      const fileName = `${path}/${Date.now()}.${fileExtension}`;

      // Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(fileName, fileToUpload, {
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
    <>
      <ImageCropDialog
        open={cropDialogOpen}
        imageUrl={tempPreview}
        onClose={() => {
          setCropDialogOpen(false);
          if (tempPreview) URL.revokeObjectURL(tempPreview);
        }}
        onCropComplete={handleCropComplete}
        aspectRatio={cropAspectRatio}
      />
      
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
    </>
  );
}
