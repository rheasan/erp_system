import type { NextApiRequest, NextApiResponse } from "next";
 
import { createUploadthing, type FileRouter } from "uploadthing/next-legacy";
 
const f = createUploadthing();

 
export const ERPFileRouter = {
  initialDataUploader: f({ pdf: { maxFileSize: "4MB" } })
    .onUploadComplete(async ({ file }) => {
      return {fileUrl: file.url};
    }),
} satisfies FileRouter;
 
export type TERPFileRouter = typeof ERPFileRouter;