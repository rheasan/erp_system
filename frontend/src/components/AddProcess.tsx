"use client";
import { FormEvent, useState } from "react";
import JobComponent from "./JobComponent";

type Job = {
	name: string;
	commands: string[];
};
type Process = {
	name: string;
	desc: string;
	id: string;
	jobs: Job[];
};
const AddProcess = () => {
	const [jobs, setJobs] = useState<Job[]>([{ name: "", commands: [""] }]);
	const [jobCount, setJobCount] = useState(1);
	const [selectedJobs, setSelectedJobs] = useState<Job[]>([]);
	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const data = Array.from(new FormData(form));
		// first 3 fields of the formdata will be name, desc, id
		let parsed_data: Process = {
			name: data[0][1].toString(),
			desc: data[1][1].toString(),
			id: data[2][1].toString(),
			jobs: [],
		};
		for (let i = 3; i < data.length; i++) {
			let current_job: Job = {
				name: data[i][1].toString(),
				commands: [],
			};
			i++;
			while (i < data.length && data[i][0].startsWith(current_job.name)) {
				current_job.commands.push(data[i][1].toString());
				i++;
			}
			parsed_data.jobs.push(current_job);
			i--;
		}
		console.log(data);
		console.log(parsed_data);
	};

	return (
		<div className="flex flex-row max-h-full h-full w-full">
			<div className="p-4 bg-gray-800 text-white w-1/2 overflow-y-auto max-h-full">
				<form onSubmit={handleSubmit}>
					<div className="grid grid-rows-2">
						<label htmlFor="name">name</label>
						<input type="text" name="name" />
						<label htmlFor="desc">desc</label>
						<input type="text" name="desc" />
						<label htmlFor="id">id</label>
						<input type="text" name="id" />
					</div>
					<br />
					<div className="flex flex-row justify-around">
						<p>Jobs</p>
						<div
							onClick={() => {
								if (selectedJobs.length > 0) {
									const new_jobs = [...selectedJobs];
									new_jobs.pop();
									setSelectedJobs(new_jobs);
								}
							}}
						>
							-
						</div>
					</div>
					<div>
						{selectedJobs.map((e, i) => {
							return (
								<div
									key={i}
									className="flex flex-col gap-0.5 border-black border-2 m-1 p-2"
								>
									<div className="flex flex-row justify-around">
										<p>Job {i}</p>
									</div>
									<label htmlFor={`job${i}`}>name</label>
									<input type="text" name={`job${i}`} defaultValue={e.name} disabled/>
									{e.commands.map((command, i2) => {
										return (
											<div key={`${i}_${i2}`}>
												<label htmlFor={`job${i}_command${i2}`}>
													Command {i2}
												</label>
												<input
													type="text"
													name={`job${i}_command${i2}`}
													defaultValue={command}
													disabled
												/>
											</div>
										);
									})}
								</div>
							);
						})}
					</div>
					<button type="submit">Submit</button>
				</form>
			</div>
			<div className="p-4 bg-gray-800 text-white w-1/2 ">
				<div className="flex flex-row justify-around border-black border-2">
					<p>Jobs</p>
					<div
						onClick={() => {
							const l=jobCount;
							setJobCount(l+1);
						}}
					>
						+
					</div>
					<div
						onClick={() => {
							if (jobCount > 0) {
								const l=jobCount;
								setJobCount(l-1);
							}
						}}
					>
						-
					</div>
				</div>
				<div className="max-h-full overflow-y-auto">
					{Array(jobCount).fill(0).map((_, i) => {
						return (<JobComponent key={i} index={i} selectedJobs={selectedJobs} setSelectedJobs={setSelectedJobs}/>);
					})}
				</div>
			</div>
		</div>
	);
};
export default AddProcess;
