import type { TERPFileRouter } from "@/server/uploadThing";
import { ERPFileRouter } from "@/server/uploadThing";
import { useUser } from "@clerk/nextjs";
import { UploadButton } from "@/utils/uploadThing";
import { useState, useRef } from "react";
import toast from "react-hot-toast";

type process_data = {
	process_id: string,
	description: string,
}
type process_input_data = {
	active: boolean,
	description: string,
}
const AddTicket = () => {
	const [processList, setProcessList] = useState<Array<process_data>>([]);
	const [selectedProcess, setSelectedProcess] = useState<process_data>({process_id: "", description: ""});
	const [initFileData, setInitFileData] = useState<{name: string, url: string} | null>(null);
	const [processData, setProcessData] = useState<Array<React.JSX.Element>>([]);
	const submit_ref = useRef<HTMLButtonElement>(null);
	const {user} = useUser();

	const fetchAllProcesses = () => {
		fetch('/api/process/all')
			.then((response) => response.json())
			.then((resJson) => {
				setProcessList(resJson.msg);
			});
	}
	const fetchProcessData = (e: React.FormEvent<HTMLSelectElement>) => {
		e.preventDefault();
		submit_ref.current?.setAttribute("disabled", "false");
		let select_elem = e.target as HTMLSelectElement;
		let process_id = select_elem.value;
		setSelectedProcess(processList.find((e) => e.process_id === process_id) as process_data);
		// TODO: fetch process data
		fetch("/api/process?process_id=" + process_id)
		.then((res) => {
			if(res.status === 200){
				return res.json();
			}
			else {
				return Promise.reject("Failed to query process data");
			}
		})
		.then((data: {result: process_input_data}) => {
			if(data.result.active) {
				// FIXME: this is a hacky way to do this. disabled attr should not have a value
				submit_ref.current?.setAttribute("disabled", "true");
				setProcessData([
					<div key={-1} className="flex flex-row gap-4">
						<label htmlFor="initial_upload">{data.result.description}: </label>
						<UploadButton endpoint="initialDataUploader"
							onClientUploadComplete={(res) => {
								toast.success("File uploaded successfully");
								setInitFileData({name: res[0].name, url: res[0].url});
								submit_ref.current?.removeAttribute("disabled");
							}}
							onUploadError={(err) => {
								setInitFileData(null);
								toast.error(`Error while uploading file: ${err}`);
							}}
						/>
						{initFileData && <p>{initFileData.name}</p>}
					</div>
				]);
			}
			else {
				setProcessData([]);
			}
		})
		.catch((err) => {
			console.log(err);
			toast.error("Error while fetching process data");
		});
	}
	const createTicket = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const formData = Array.from(new FormData(form));
		// FIXME: weird is_public check
		const data = {
			process_id: selectedProcess.process_id,
			is_public: (formData[0] && formData[0][0] === "is_public" && formData[0][1] === "on") ?? false,
			owner_name: user?.username,
			filename: initFileData?.name,
			file_url: initFileData?.url,
		}
		fetch('/api/ticket', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		})
		.then((response) => {
			if(response.status === 201){
				toast.success("Ticket created successfully. Check dashboard");
			}
			else {
				return Promise.reject(response);
			}
		})
		.then(() => {
			setSelectedProcess({process_id: "", description: ""});
		})
		.catch((err) => {
			console.log(err);
			toast.error("Error while creating ticket");
		});
	}
	return (
		<div className="p-4 bg-gray-800 text-white h-full w-full overflow-y-scroll">
			<div className="border-b-2 border-white text-2xl">
				<p>Available processes: <button onClick={fetchAllProcesses} className="h-2 w-2">&#x27F3;</button></p>
				<div>{processList.length != 0 && processList.map(e=>e.process_id).join(", ")}</div>
			</div>
			<div className="py-4">
				<div className="flex flex-row gap-4 items-center">
					<label htmlFor="process_id">Select a Process</label>
					<select id="process_id" className="bg-gray-900 text-white h-12 w-fit rounded p-2" name="process_id" onChange={fetchProcessData}>
						{processList.map((process,i) => (
							<option key={i} value={process.process_id}>{process.process_id}</option>
						))}
					</select>
				</div>
				<div className="text-xl">
					<p>Selected process: {selectedProcess.process_id}</p>
					<p>Description: {selectedProcess.description}</p>
				</div>
				<div className="border-b-2 border-white"></div>
				{ selectedProcess.process_id !== "" &&
					<form onSubmit={createTicket} className="flex flex-col items-start">
						<div className="flex flex-row gap-4 items-center">
							<label htmlFor="is_public">Is public?</label>
							<input type="checkbox" id="is_public" name="is_public"/>
						</div>
						{selectedProcess && processData.length > 0 && processData?.map((e,i) => {
							return e;
						})}
						
						<button type="submit" ref={submit_ref}>Create ticket</button>
					</form>
				}
			</div>
		</div>
	);
};
export default AddTicket;
