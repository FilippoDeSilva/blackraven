import React, { useRef } from "react";
import { Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { formatFileSize } from "@/lib/client-utils";
import { FilePreviewItem } from "./FilePreviewItem";

interface FileUploadProps {
  files: File[];
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  message: string;
  setMessage: (msg: string) => void;
  isLaunched: boolean;
}

export function FileUpload({
  files,
  onFileSelect,
  onRemoveFile,
  message,
  setMessage,
  isLaunched,
}: FileUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <Card className="overflow-hidden dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-white">
          <Upload className="h-5 w-5 text-rose-500" />
          File Upload
        </CardTitle>
        <CardDescription className="dark:text-gray-400">
          Select files to share securely with time-based access
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="border-2 border-dashed rounded-lg p-4 sm:p-6 lg:p-8 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors dark:border-gray-600"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            onChange={onFileSelect}
          />
          <div className="mx-auto flex flex-col items-center justify-center">
            <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400 dark:text-gray-500 mb-2 sm:mb-4" />
            <h3 className="text-sm sm:text-base lg:text-lg font-medium mb-1 dark:text-gray-200">
              Drag files here or click to browse
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Support for images, videos, audio, documents, and archives
            </p>
          </div>
        </div>
        {files.length > 0 && (
          <div className="mt-4 sm:mt-6 max-w-full overflow-x-auto">
            <h4 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 dark:text-gray-300">
              Selected Files ({files.length})
            </h4>
            <div className="space-y-2 max-h-48 sm:max-h-60 overflow-y-auto pr-2 min-w-[280px] sm:min-w-[320px]">
              {files.map((file, index) => (
                <FilePreviewItem
                  key={index}
                  file={file}
                  onRemove={() => onRemoveFile(index)}
                />
              ))}
            </div>
          </div>
        )}
        <div className="mt-6">
          <Label htmlFor="message" className="dark:text-gray-300">
            Additional Message (Optional)
          </Label>
          <Textarea
            id="message"
            placeholder="Add a message to accompany your files..."
            className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white w-full max-w-full"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isLaunched}
          />
        </div>
      </CardContent>
    </Card>
  );
} 