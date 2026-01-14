import { MEDIA_UPLOAD_CONSTANTS } from "../constants/media-upload-constants"

interface HiddenFileInputsProps {
  docInputRef: React.RefObject<HTMLInputElement | null>
  imageInputRef: React.RefObject<HTMLInputElement | null>
  videoInputRef: React.RefObject<HTMLInputElement | null>
  audioInputRef: React.RefObject<HTMLInputElement | null>
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

/**
 * Hidden file input elements for different media types
 */
export function HiddenFileInputs({
  docInputRef,
  imageInputRef,
  videoInputRef,
  audioInputRef,
  onFileChange,
}: HiddenFileInputsProps) {
  return (
    <>
      <input
        type="file"
        ref={docInputRef}
        className="hidden"
        multiple
        accept={MEDIA_UPLOAD_CONSTANTS.FILE_ACCEPT.DOCUMENT}
        onChange={onFileChange}
      />
      <input
        type="file"
        ref={imageInputRef}
        className="hidden"
        multiple
        accept={MEDIA_UPLOAD_CONSTANTS.FILE_ACCEPT.IMAGE}
        onChange={onFileChange}
      />
      <input
        type="file"
        ref={videoInputRef}
        className="hidden"
        multiple
        accept={MEDIA_UPLOAD_CONSTANTS.FILE_ACCEPT.VIDEO}
        onChange={onFileChange}
      />
      <input
        type="file"
        ref={audioInputRef}
        className="hidden"
        multiple
        accept={MEDIA_UPLOAD_CONSTANTS.FILE_ACCEPT.AUDIO}
        onChange={onFileChange}
      />
    </>
  )
}

