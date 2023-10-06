import z from "zod";

export const job = z.object({
    name: z.string(),
    commands: z.array(z.string())
})

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
