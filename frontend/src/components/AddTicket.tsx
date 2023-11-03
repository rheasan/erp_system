import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import toast from "react-hot-toast";

const AddTicket = () => {
	const [processList, setProcessList] = useState<Array<string>>([]);
	const [selectedProcess, setSelectedProcess] = useState<string>("");
	const [processData, setProcessData] = useState<Array<React.JSX.Element>>([]);
	const {user} = useUser()
	const fetchAllProcesses = () => {
		fetch('/api/get_all_processes')
			.then((response) => response.json())
			.then((resJson) => {
				setProcessList(resJson.msg);
			});
	}
	const fetchProcessData = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		let form = e.target as HTMLFormElement;
		let formdata = Array.from(new FormData(form));
		console.log(formdata);
		setSelectedProcess(formdata[0][1] as string);
		// TODO: fetch process data
		setProcessData([]);
	}
	const createTicket = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const formData = Array.from(new FormData(form));
		console.log(formData);
		const data = {
			process_id: selectedProcess,
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
			setSelectedProcess("");
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
				<div>{processList.length != 0 && processList.join(", ")}</div>
			</div>
			<div>
				<form onSubmit={fetchProcessData} className="flex flex-col items-start">
					<div className="flex flex-row gap-4 items-center">
						<label htmlFor="process_id">Select a Process</label>
						<select id="process_id" className="bg-gray-900 text-white h-12 w-fit rounded p-2" name="process_id">
							{processList.map((process,i) => (
								<option key={i} value={process}>{process}</option>
							))}
						</select>
					</div>
					<button type="submit">Fetch process data</button>
				</form>
				<div className="border-b-2 border-white"></div>
				{ selectedProcess !== "" &&
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
