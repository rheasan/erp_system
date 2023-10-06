import {job, z_new_process, z_process} from "./processes"
import z from "zod";

type Job = z.infer<typeof job>;
type process = z.infer<typeof z_process>;
type new_process = z.infer<typeof z_new_process>;