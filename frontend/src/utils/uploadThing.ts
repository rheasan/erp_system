import { generateComponents } from "@uploadthing/react";
 
import type { TERPFileRouter } from "../server/uploadThing";
 
export const { UploadButton, UploadDropzone, Uploader } =
  generateComponents<TERPFileRouter>();