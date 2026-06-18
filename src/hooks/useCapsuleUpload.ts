import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { compressImage } from "@/lib/imageCompress";

/** Shared bulk-upload + delete logic for time-capsule photos. */
export const useCapsuleUpload = (
  eventId: string | undefined,
  invalidateKeys: (string | undefined)[][] = [["time-capsule-events"]],
) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);

  const invalidate = () => {
    invalidateKeys.forEach((k) => qc.invalidateQueries({ queryKey: k as any }));
    if (eventId) qc.invalidateQueries({ queryKey: ["capsule-detail", eventId] });
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files || !user || !eventId) return;
    setUploading(true);
    try {
      for (const rawFile of Array.from(files)) {
        const file = rawFile.type.startsWith("image/") ? await compressImage(rawFile) : rawFile;
        const ext = (file.name.split(".").pop() || "bin").toLowerCase();
        const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("time-capsule")
          .upload(filePath, file, { contentType: file.type || undefined });
        if (uploadError) throw uploadError;
        await supabase.from("time_capsule_photos").insert({
          event_id: eventId,
          user_id: user.id,
          image_url: filePath,
        });
      }
      invalidate();
      toast({ title: t("capsule_actions.uploaded") });
    } catch (err: any) {
      toast({
        title: t("capsule_actions.could_not_clear"),
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (photoId: string): Promise<boolean> => {
    const { error } = await supabase.from("time_capsule_photos").delete().eq("id", photoId);
    if (error) {
      toast({
        title: t("capsule_actions.could_not_clear"),
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
    invalidate();
    toast({ title: t("capsule_actions.photo_deleted") });
    return true;
  };

  return { uploading, uploadFiles, deletePhoto };
};
