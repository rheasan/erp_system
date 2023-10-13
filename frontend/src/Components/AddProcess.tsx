"use client";
import { FormEvent, useState } from "react";

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
	const addCommandToJob = () => {};

	return (
		<div className="flex flex-row h-[510px]">
			<div className="p-4 bg-gray-800 text-white w-1/2 overflow-y-scroll overscroll-none">
				<form onSubmit={handleSubmit}>
					<label htmlFor="name">name</label>
					<input type="text" name="name" />
					<br />
					<label htmlFor="desc">desc</label>
					<input type="text" name="desc" />
					<br />
					<label htmlFor="id">id</label>
					<input type="text" name="id" />
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
										<button
											onClick={() => {
												const new_jobs = [...selectedJobs];
												new_jobs[i].commands.push("");
												setSelectedJobs(new_jobs);
											}}
										>
											Add Process
										</button>
										<button
											onClick={() => {
												if (selectedJobs[i].commands.length > 0) {
													const new_jobs = [...selectedJobs];
													new_jobs[i].commands.pop();
													setSelectedJobs(new_jobs);
												}
											}}
										>
											Remove Process
										</button>
									</div>
									<label htmlFor={`job${i}`}>name</label>
									<input type="text" name={`job${i}`} />
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
			<div className="p-4 bg-gray-800 text-white overflow-y-scroll overscroll-none w-1/2">
				<div className="flex flex-row justify-around">
					<p>Jobs</p>
					<div
						onClick={() => {
							setJobs([...jobs, { name: "", commands: [""] } as Job]);
						}}
					>
						+
					</div>
					<div
						onClick={() => {
							if (jobs.length > 0) {
								const new_jobs = [...jobs];
								new_jobs.pop();
								setJobs(new_jobs);
							}
						}}
					>
						-
					</div>
				</div>
				<div>
					{jobs.map((e, i) => {
						return (
							<div
								key={i}
								className="flex flex-col gap-0.5 border-black border-2 m-1 p-2"
							>
								<div>
									<div className="flex flex-row justify-around">
										<p>Job {i}</p>
										{/* <button
											onClick={() => {
												const new_jobs = [...jobs];
												new_jobs[i].commands.push("");
												setJobs(new_jobs);
											}}
										>
											+
										</button> */}
										<button
											onClick={() => {
												if (jobs[i].commands.length > 0) {
													const new_jobs = [...jobs];
													new_jobs[i].commands.pop();
													setJobs(new_jobs);
												}
											}}
										>
											-
										</button>
									</div>
									<label htmlFor={`job${i}`}>name</label>
									<input type="text" name={`job${i}`} />
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
												/>
											</div>
										);
									})}
									<select
										id="Permissions"
										className="text-black w-full"
										onChange={(e) => {}}
									>
										<option value="Director">Director</option>
										<option value="Adean">Adean</option>
										<option value="HOD">HOD</option>
										<option value="Admin">Admin</option>
									</select>
								</div>
								<button className="text-green-500 border-solid border-2 border-green-500 hover:text-white hover:bg-green-500">
									Add
								</button>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};
export default AddProcess;
