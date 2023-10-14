import React, { SetStateAction, useEffect, useState } from 'react'

type Job = {
	name: string;
	commands: string[];
};
const JobComponent = (props: {index: number, selectedJobs: Job[], setSelectedJobs: React.Dispatch<SetStateAction<Job[]>>}) => {
    const {index : i, selectedJobs : selectedJobs, setSelectedJobs : setSelectedJobs} = props;
    // const i = props.i;
    // const job=props.job;
    // const jobs = props.jobs;
    // const setJobs = props.setJobs;
    const [job, setJob] = useState<Job>({name: "", commands: []});
    useEffect(() => {
        console.log("from useeffect");
        console.log(job);
    }, [job])
    const commandList = ["Director", "Adean", "HOD", "Admin"]
    return (
        <div
            key={i}
            className="flex flex-col gap-0.5 border-black border-2 m-1 p-2"
        >
            <div>
                <div className="flex flex-row justify-around">
                    Job {i}
                </div>
                <label htmlFor={`job${i}`}>name</label>
                <input type="text" name={`job${i}`} onChange={(e)=>{
                    const newJob = structuredClone(job);
                    newJob.name = e.target.value;
                    console.log(newJob);
                    setJob(newJob);
                }} />
                <div className='flex flex-col flex-wrap py-2'>
                    {job && job.commands?.map((command, i2) => {
                        return (
                            <div key={`${i}_${i2}`} className='mx-1 flex flex-row justify-between'>
                                <div>
                                    {command}
                                </div>
                                <button onClick={()=>{
                                    if (job.commands.length > 0) {
                                        const new_jobs = structuredClone(job);
                                        new_jobs.commands.splice(i2,1);
                                        setJob(new_jobs);
                                    }
                                }}>
                                    -
                                </button>
                            </div>
                        );
                    })}
                </div>
                <select
                    id="Permissions"
                    className="text-black w-full"
                    onChange={(e) => {
                        const new_jobs=structuredClone(job);
                        new_jobs.commands.push(e.target.value);
                        setJob(new_jobs);
                        console.log(job);
                    }}
                >
                    {commandList.map((command,i)=>{
                        return (
                            <option key={i}>
                                {command}
                            </option>
                        );
                    })}
                </select>
            </div>
            <button className="text-green-500 border-solid border-2 border-green-500 hover:text-white hover:bg-green-500" onClick={
                ()=>{
                    const newJobs=[...selectedJobs];
                    newJobs.push(job);
                    setSelectedJobs(newJobs);
                }
            }>
                Add
            </button>
        </div>
    );
}

export default JobComponent;