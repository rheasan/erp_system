"use client";
import {
	FormEvent,
} from "react";

type new_ticket = {
	user_id: string;
	process_id: string;
	is_public: string;
};

const AddTicket = () => {
	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const data = Array.from(new FormData(form));
		// first 3 fields of the formdata will be name, desc, id
		let parsed_data: new_ticket = {
			user_id: data[0][1] as string,
			process_id: data[1][1] as string,
			is_public: (data[2][0] == "true_value").toString(),
		};

		console.log(data);
		console.log(parsed_data);
	};

	return (
		<div className="p-4 bg-gray-800 text-white">
			<form onSubmit={handleSubmit}>
				<label htmlFor="user_id">User ID</label>
				<input type="text" name="user_id" />
				<br />
				<label htmlFor="process_id">Process ID</label>
				<input type="text" name="process_id" />
				<br />
				<fieldset>
					<legend>Public? :</legend>
					<div>
						<input type="radio" name="true_value" id="is_public" />
						<label htmlFor="true_value">Yes</label>
					</div>
					<div>
						<input type="radio" name="false_value" id="is_public" />
						<label htmlFor="false_value">No</label>
					</div>
				</fieldset>
				<button type="submit">Submit</button>
			</form>
		</div>
	);
};
export default AddTicket;
