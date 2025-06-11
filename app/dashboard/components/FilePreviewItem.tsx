import React, { useMemo, useEffect } from "react";
import { FileText, FileSpreadsheet, Image, Archive, File as FileIcon, Video, Trash2, Music } from "lucide-react";
import { formatFileSize } from "@/lib/client-utils";
import { Button } from "@/components/ui/button";

interface FilePreviewItemProps {
  file: File;
  onRemove: () => void;
}

export function FilePreviewItem({ file, onRemove }: FilePreviewItemProps) {
  // File type icons mapping
  const fileTypeIcons: Record<string, React.ReactNode> = {
    pdf: <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-gray-300" />,
    doc: <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-gray-300" />,
    xls: <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-gray-300" />,
    img: <Image className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-gray-300" />,
    zip: <Archive className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-gray-300" />,
    video: <Video className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-gray-300" />,
    audio: <Music className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-gray-300" />,
    default: <FileIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-gray-300" />,
  };

  // Function to get file icon based on file type
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase() || "";

    if (["pdf"].includes(extension)) {
      return fileTypeIcons.pdf;
    } else if (["doc", "docx", "txt"].includes(extension)) {
      return fileTypeIcons.doc;
    } else if (["xls", "xlsx", "csv"].includes(extension)) {
      return fileTypeIcons.xls;
    } else if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension)) {
      return fileTypeIcons.img;
    } else if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) {
      return fileTypeIcons.zip;
    } else if (["mp4", "webm", "ogg"].includes(extension)) {
      return fileTypeIcons.video;
    } else if (["mp3", "wav", "aac", "flac"].includes(extension)) {
      return fileTypeIcons.audio;
    }
    return fileTypeIcons.default;
  };

  const fileType = file.type.split('/')[0];
  const objectUrl = useMemo(() => URL.createObjectURL(file), [file]);

  // Clean up the object URL when component unmounts or file changes
  useEffect(() => {
    return () => URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  let previewElement;
  if (fileType === 'image') {
    previewElement = <img src={objectUrl} alt={file.name} className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded" />;
  } else if (fileType === 'video') {
    previewElement = (
      <video controls src={objectUrl} className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded">
        Your browser does not support the video tag.
      </video>
    );
  } else if (fileType === 'audio') {
    previewElement = (
      <audio controls src={objectUrl} className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded">
        Your browser does not support the audio tag.
      </audio>
    );
  } else {
    previewElement = (
      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
        {getFileIcon(file.name)}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
        {previewElement}
        <div className="overflow-hidden">
          <p className="text-sm font-medium truncate dark:text-gray-200">{file.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatFileSize(file.size)}
          </p>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={onRemove}>
        <Trash2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <span className="sr-only">Remove file</span>
      </Button>
    </div>
  );
} 