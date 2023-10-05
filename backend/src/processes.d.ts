import z from "zod";

export const job = z.object({
    name: z.string(),
    commands: z.array(z.string())
})
type Job = z.infer<typeof job>;

const process_ids = ["MD_0001"] as const;
const pids = z.enum(process_ids);

export const z_new_process = z.object({
    name: z.string(),
    desc: z.optional(z.string()),
    id: z.string(),
    jobs: z.array(job)
});

export const z_process = z.object({
    name: z.string(),
    desc: z.optional(z.string()),
    id: pids,
    jobs: z.array(job)
});
type process = z.infer<typeof z_process>;
type new_process = z.infer<typeof z_new_process>;


