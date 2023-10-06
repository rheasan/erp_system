import type { new_process, process } from "./types";
import z from "zod";
import fsPromise from "node:fs/promises";
import { z_new_process, z_process } from "./processes";
export default async function save_process(process : new_process) {
    const process_data_path = "./test_data/processes.json";
    const data = await fsPromise.readFile(process_data_path).then((res) => {
        return JSON.parse(String(res));
    });
    const parsed_processes = z.array(z_new_process).parse(data);
    
    for(let saved_process of parsed_processes){
        if(saved_process.id === process.id){
            return {success: false, error: "id already exists"};
        }
    }

    parsed_processes.push(process);
    const new_data = JSON.stringify(parsed_processes);
    await fsPromise.writeFile(process_data_path, new_data).then((res) => {
        console.log("process was accepted");
        console.log(process);
    })
    return {success : true, error: null};
}