import { useUser } from "@clerk/nextjs";
import React from "react";
import {useState} from "react";
import toast from "react-hot-toast";

// FIXME: dont use 2 vars to define event
const event_types = ["approve", "file_upload"];
const enum event {"initiate", "complete", "approve", "file_upload"};

//FIXME: event should have a concrete type. no overlap between event and string (???)
type job = {
	event: event | string,
	args: Array<string>,
	next: Array<number>,
	required: Array<number>,
	current_index?: number,
}
type process = {
	pid: string,
	pname: string,
	desc: string,
	steps: Array<job>,
	roles: readonly ["any"]
}
const Step = (props: {job_: job}) => {
	const {job_} = props;
	const [current_type, set_current_type] = useState<event | null>(event.approve);
	const handle_type_change = (e: React.ChangeEvent<HTMLSelectElement>) => {
		switch(e.target.value) {
			case "approve" : {
				set_current_type(event.approve)
				break;
			}
			case "file_upload" : {
				set_current_type(event.file_upload);
				break;
			}
		}
	}
	return (
		<div className="flex flex-col border-2 border-black p-4 w-1/2">
			<div className="flex flex-row items-center gap-4">
				<label htmlFor={job_.current_index+"_event"}>Event {job_.current_index} :- Type =</label>
				<select name={job_.current_index+"_event"} id={job_.current_index+"_event"} className="bg-gray-900 text-white h-12 w-fit rounded p-2" onChange={handle_type_change}>
					{
						event_types.map((e,i) => {
							return <option value={e} key={i}>{e}</option>
						})
					}
				</select>
			</div>
				{
					current_type === event.approve && <ApproveStep step_number={job_.current_index!} />
				}
				{
					current_type === event.file_upload && <UploadStep step_number={job_.current_index!} />
				}
		</div>
	);
}
const InitiateStep = () => {
	const [checked, setChecked] = useState(false);
	const handleCheck = (e : React.SyntheticEvent<HTMLInputElement>) => {
		if(e.currentTarget.checked) {
			setChecked(true);
		}
		else {
			setChecked(false);
		}
	}
	return (
		<div className="w-1/2 border-black border-2 p-4">
			<h1>Initiate Process</h1>
			<label htmlFor="">Allow additional file upload by creator: </label>
			<input type="checkbox" name="initiate-args" onChange={handleCheck}/>	
			{
				checked && 
				<div>
					<label htmlFor="">Prompt for additional data.</label>
					<input type="text" name="initiate-data-prompt"/>
				</div>
			}
		</div>	
	)
}
const CompleteStep = (props: {last_index: number}) => {

	return (
		<div className="border-black border-2 p-4 w-1/2">
			<h1>Complete Process. index = {props.last_index}</h1>
			<input type="hidden" name="complete"/>
		</div>
	)
}

const ApproveStep = (props: {step_number: number}) => {

	return (
		<div className="text-xl flex flex-col">
			<h1 className="text-2xl">Request approval from user</h1>
			<div className="grid grid-cols-3 w-full">
				<input type="hidden" name={props.step_number + "_event"} defaultValue="approve"/>
				<label htmlFor={props.step_number + "_arg0"} className="col-span-1">Username for approval</label>
				<input type="text" name={props.step_number + "_arg0"} id={props.step_number + "_arg0"} className="col-span-2"/>
				<label htmlFor={props.step_number + "_next"}>Next step</label>
				<input type="text" name={props.step_number + "_next"} id={props.step_number + "_next"} className="col-span-2"/>
				<label htmlFor={props.step_number + "_arg0"}>Required steps</label>
				<input type="text" name={props.step_number + "_required"} id={props.step_number + "_required"} className="col-span-2"/>
			</div>
		</div>
	)
}

const UploadStep = (props: {step_number: number}) => {

	return (
		<div className="w-fit">
			<h1 className="text-2xl">Upload file</h1>
			<div className="grid grid-cols-3">
				<input type="hidden" name={props.step_number + "_event"} defaultValue="upload"/>
				<label htmlFor={props.step_number + "arg0"}>Username for upload request</label>
				<input type="text" name={props.step_number + "_arg0"} id={props.step_number + "arg0"} className="col-span-2"/>
				<label htmlFor={props.step_number + "arg1"}>Enter description of file</label>
				<input type="text" name={props.step_number + "_arg1"} id={props.step_number + "arg1"} className="col-span-2"/>
				<label htmlFor={props.step_number + "_next"}>Next step</label>
				<input type="text" name={props.step_number + "_next"} id={props.step_number + "_next"} className="col-span-2"/>
				<label htmlFor={props.step_number + "_arg0"}>Required steps</label>
				<input type="text" name={props.step_number + "_required"} id={props.step_number + "_required"} className="col-span-2"/>
			</div>
		</div>
	)
}

const AddProcess = () => {
	const [processJobs, setProcessJobs] = useState<Array<job>>([]);
	const {user} = useUser();
	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const formdata = Array.from(new FormData(form));
		let process: process = {
			pid: formdata[0][1] as string,
			pname: formdata[1][1] as string,
			desc: formdata[2][1] as string,
			steps: [{event: "initiate", args: [], next: [1], required: []}],
			roles: ["any"],
		};
		let index = 3;
		// add initiate step
		while(formdata[index][0].startsWith("initiate")) {
			process.steps[0].args.push(formdata[index][1] as string);
			index++;
		}
		for(; index < formdata.length; index++){
			// the event arguments will be prefixed with the step_index
			let current_step_index = Number(formdata[index][0].split("_")[0]);
			process.steps[current_step_index] = {
				event: event.approve,
				args: [],
				next: [],
				required: [],
			};
			while(String(formdata[index]).startsWith(current_step_index.toString())) {
				let [key, value] = [formdata[index][0].split("_")[1], formdata[index][1] as string];
				if(key.startsWith("event")) {
					process.steps[current_step_index].event = value;
				}
				else if(key.startsWith("arg")) {
					process.steps[current_step_index].args.push(value);
				}
				else if(key.startsWith("next")) {
					process.steps[current_step_index].next = value.split(",").map((e) => Number(e));
				}
				else if(key.startsWith("required")) {
					process.steps[current_step_index].required = value.split(",").map((e) => Number(e));
				}
				index++;
			}
		}
		// add complete step
		process.steps.push({
			event: "complete",
			args: [],
			next: [],
			required: [],
			current_index: process.steps.length,
		})
		let req_body = {
			process: process,
			username: user?.username!
		}
		fetch("/api/create_process", {
			method: "POST",
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(req_body),
		})
		.then((res) => {
			if(res.status === 200) {
				toast.success("Process added successfully");
				return true;
			}
			else{
				return Promise.reject("Error creating process");
			}
		})
		.then(() => {
			setProcessJobs([]);
			form.reset();
		})
		.catch((e) => {
			toast.error(e);
		});
	}
	return (
		<div className="bg-gray-800 p-4 text-white h-full w-full overflow-y-scroll">
			<h1 className="text-2xl">Add Process</h1>
			<div className="border border-white my-2"></div>
			<form onSubmit={handleSubmit} className="flex flex-col gap-4">
				<div>
					<label htmlFor="pid">Process ID: </label>
					<input type="text" id="pid" name="pid" required/>
				</div>
				<div>
					<label htmlFor="pname">Process name: </label>
					<input type="text" id="pname" name="pname" required/>
				</div>
				<div>
					<label htmlFor="desc">Description: </label>
					<input type="" id="desc" name="desc" required/>
				</div>
				<div className="border border-white my-2"></div>
				<div className="text-xl">
					<div className="flex flex-row gap-4 items-center">
						<h1>Steps:</h1>
						<button className="border border-white rounded p-2" onClick={(e) => {
							e.preventDefault();
							setProcessJobs((lastJobs) => ([...lastJobs, {
								event: event.approve,
								args: [],
								next: [],
								required: [],
								// 0 th step will be initiate
								current_index: lastJobs.length + 1,
							} as job]));
						}}>Add</button>
						<button className="border border-white rounded p-2" onClick={(e) => {
							e.preventDefault();
							setProcessJobs((lastJob) => (lastJob.slice(0, lastJob.length - 1)));
						}}>Remove last</button>
					</div>
					<div className="flex flex-col gap-4 my-4">
						<InitiateStep />
						{
							processJobs?.map((job, index) => {
								return <Step job_={job} key={index}/>;
							})
						}
						<CompleteStep last_index={processJobs.length + 1}/>
					</div>
				</div>
				<button type="submit" className="bg-green-400 p-4 rounded mx-auto text-black">Submit process</button>
			</form>
		</div>
	);
}


export default AddProcess;
