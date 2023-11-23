import { createNextPageApiHandler } from "uploadthing/next-legacy";
 
import { ERPFileRouter } from "../../server/uploadThing"
 
const handler = createNextPageApiHandler({
  router: ERPFileRouter,
});
 
export default handler;