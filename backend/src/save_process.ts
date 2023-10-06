import type { new_process } from "./types";
export default async function save_process(process : new_process) {
    console.log("process saved");

    return {success : true, error: null};
}