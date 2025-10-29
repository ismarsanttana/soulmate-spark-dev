import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Camera, RotateCcw, CheckCircle, AlertCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface FacialPhoto {
  angle: string;
  angleLabel: string;
  blob: Blob | null;
  preview: string | null;
}

interface TeacherFacialCaptureProps {
  teacherId: string;
}

export function TeacherFacialCapture({ teacherId }: TeacherFacialCaptureProps) {
  const queryClient = useQueryClient();
  const [consent, setConsent] = useState(false);
  const [photos, setPhotos] = useState<FacialPhoto[]>([
    { angle: "frontal", angleLabel: "Frontal", blob: null, preview: null },
    { angle: "left_45", angleLabel: "Perfil Esquerdo (45°)", blob: null, preview: null },
    { angle: "right_45", angleLabel: "Perfil Direito (45°)", blob: null, preview: null },
    { angle: "up", angleLabel: "Olhando para Cima", blob: null, preview: null },
    { angle: "down", angleLabel: "Olhando para Baixo", blob: null, preview: null },
  ]);
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [activeAngleIndex, setActiveAngleIndex] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Fetch existing photos
  const { data: existingPhotos } = useQuery({
    queryKey: ["teacher-facial-photos", teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teachers")
        .select("facial_photos, autorizacao_reconhecimento_facial")
        .eq("user_id", teacherId)
        .single();

      if (error) throw error;
      
      if ((data as any)?.autorizacao_reconhecimento_facial) {
        setConsent(true);
      }
      
      return (data as any)?.facial_photos || [];
    },
  });

  // Save photos mutation
  const savePhotosMutation = useMutation({
    mutationFn: async (photosData: any[]) => {
      // Upload photos to storage
      const uploadedUrls = await Promise.all(
        photosData.map(async (photo) => {
          if (!photo.blob) return null;

          const fileName = `${teacherId}_${photo.angle}_${Date.now()}.jpg`;
          const { data, error } = await supabase.storage
            .from("facial-photos")
            .upload(fileName, photo.blob, {
              contentType: "image/jpeg",
              upsert: true,
            });

          if (error) throw error;

          const { data: urlData } = supabase.storage
            .from("facial-photos")
            .getPublicUrl(data.path);

          return {
            angle: photo.angle,
            url: urlData.publicUrl,
            captured_at: new Date().toISOString(),
          };
        })
      );

      const validUrls = uploadedUrls.filter(url => url !== null);

      // Update teacher record
      const { error: updateError } = await supabase
        .from("teachers")
        .update({
          facial_photos: validUrls as any,
          autorizacao_reconhecimento_facial: consent,
        } as any)
        .eq("user_id", teacherId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-facial-photos"] });
      toast.success("Fotos salvas com sucesso!");
      setPhotos([
        { angle: "frontal", angleLabel: "Frontal", blob: null, preview: null },
        { angle: "left_45", angleLabel: "Perfil Esquerdo (45°)", blob: null, preview: null },
        { angle: "right_45", angleLabel: "Perfil Direito (45°)", blob: null, preview: null },
        { angle: "up", angleLabel: "Olhando para Cima", blob: null, preview: null },
        { angle: "down", angleLabel: "Olhando para Baixo", blob: null, preview: null },
      ]);
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar fotos: " + error.message);
    },
  });

  const startCamera = useCallback(async (angleIndex: number) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCapturing(true);
        setActiveAngleIndex(angleIndex);
      }
    } catch (error) {
      console.error("Erro ao acessar câmera:", error);
      toast.error("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
    setActiveAngleIndex(null);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || activeAngleIndex === null) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const preview = URL.createObjectURL(blob);
        setPhotos(prev => {
          const newPhotos = [...prev];
          newPhotos[activeAngleIndex] = {
            ...newPhotos[activeAngleIndex],
            blob,
            preview
          };
          return newPhotos;
        });
        stopCamera();
        toast.success("Foto capturada!");
      }
    }, "image/jpeg", 0.95);
  }, [activeAngleIndex, stopCamera]);

  const retakePhoto = useCallback((index: number) => {
    setPhotos(prev => {
      const newPhotos = [...prev];
      if (newPhotos[index].preview) {
        URL.revokeObjectURL(newPhotos[index].preview!);
      }
      newPhotos[index] = {
        ...newPhotos[index],
        blob: null,
        preview: null
      };
      return newPhotos;
    });
  }, []);

  const handleSavePhotos = () => {
    if (!consent) {
      toast.error("É necessário autorizar o reconhecimento facial");
      return;
    }

    const capturedPhotos = photos.filter(p => p.blob !== null);
    if (capturedPhotos.length === 0) {
      toast.error("Capture pelo menos uma foto");
      return;
    }

    savePhotosMutation.mutate(capturedPhotos);
  };

  const allPhotosCaptured = photos.every(p => p.blob !== null);

  return (
    <div className="space-y-6">
      {/* Consent */}
      <div className="flex items-start space-x-2 p-4 border rounded-lg bg-muted/50">
        <Checkbox
          id="consent"
          checked={consent}
          onCheckedChange={(checked) => setConsent(checked as boolean)}
        />
        <div className="grid gap-1.5 leading-none">
          <Label
            htmlFor="consent"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Autorização de Reconhecimento Facial
          </Label>
          <p className="text-sm text-muted-foreground">
            Autorizo a coleta e uso das minhas fotos para reconhecimento facial no sistema.
          </p>
        </div>
      </div>

      {/* Existing photos */}
      {existingPhotos && existingPhotos.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Fotos Existentes</h4>
          <div className="grid grid-cols-3 gap-4">
            {existingPhotos.map((photo: any, index: number) => (
              <div key={index} className="border rounded-lg overflow-hidden">
                <img 
                  src={photo.url} 
                  alt={photo.angle}
                  className="w-full h-32 object-cover"
                />
                <p className="text-xs text-center p-2">{photo.angle}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Camera View */}
      {isCapturing && (
        <div className="space-y-4">
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex gap-2 justify-center">
            <Button onClick={capturePhoto}>
              <Camera className="h-4 w-4 mr-2" />
              Capturar
            </Button>
            <Button variant="outline" onClick={stopCamera}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Photos Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((photo, index) => (
          <div key={photo.angle} className="space-y-2">
            <div className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center overflow-hidden relative bg-muted/50">
              {photo.preview ? (
                <>
                  <img 
                    src={photo.preview} 
                    alt={photo.angleLabel}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                </>
              ) : (
                <Camera className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-center">{photo.angleLabel}</p>
              {photo.preview ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => retakePhoto(index)}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Refazer
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => startCamera(index)}
                  disabled={isCapturing || !consent}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Capturar
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <Button
          onClick={handleSavePhotos}
          disabled={!consent || savePhotosMutation.isPending || photos.filter(p => p.blob).length === 0}
        >
          {savePhotosMutation.isPending ? "Salvando..." : "Salvar Fotos"}
        </Button>
      </div>

      {allPhotosCaptured && (
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <CheckCircle className="h-5 w-5" />
          <span className="text-sm font-medium">Todas as fotos foram capturadas!</span>
        </div>
      )}
    </div>
  );
}
