import {new_process} from "./processes";

export default async function save_process(new_process : new_process) {
    console.log("process saved");

    return {success : true, error: null};
}