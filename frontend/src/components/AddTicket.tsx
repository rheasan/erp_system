import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import toast from "react-hot-toast";

type process_data = {
	process_id: string,
	description: string,
}
const AddTicket = () => {
	const [processList, setProcessList] = useState<Array<process_data>>([]);
	const [selectedProcess, setSelectedProcess] = useState<process_data>({process_id: "", description: ""});
	const [processData, setProcessData] = useState<Array<React.JSX.Element>>([]);
	const {user} = useUser();

	const fetchAllProcesses = () => {
		fetch('/api/get_all_processes')
			.then((response) => response.json())
			.then((resJson) => {
				setProcessList(resJson.msg);
			});
	}
	const fetchProcessData = (e: React.FormEvent<HTMLSelectElement>) => {
		e.preventDefault();
		let select_elem = e.target as HTMLSelectElement;
		let process_id = select_elem.value;
		setSelectedProcess(processList.find((e) => e.process_id === process_id) as process_data);
		// TODO: fetch process data
		setProcessData([]);
	}
	const createTicket = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const formData = Array.from(new FormData(form));
		const data = {
			process_id: selectedProcess.process_id,
			is_public: formData[0][1] === "on",
			username: user?.username
		}
		fetch('/api/create_ticket', {
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
		<div className="p-4 bg-gray-800 text-white h-full w-full">
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
						{/* FIXME: probably wont work because server cant return React.JSX.Element */}
						<div className="flex flex-row gap-4 items-center">
							<label htmlFor="is_public">Is public?</label>
							<input type="radio" id="is_public" name="is_public"/>
						</div>
						{selectedProcess && processData.length > 0 && processData?.map((e,i) => {
							return e;
						})}
						
						<button type="submit">Create ticket</button>
					</form>
				}
			</div>
		</div>
	);
};
export default AddTicket;
