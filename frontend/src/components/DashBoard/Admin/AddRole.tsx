import { FormEvent } from "react";
import toast from "react-hot-toast";

const AddRole = () => {

	const handleAddRole = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const form = e.target as HTMLFormElement;	
		const data = Array.from(new FormData(form));
		const body = JSON.stringify({
			role_ : data[0][1]
		});

		fetch("/api/roles", {
			method: 'POST',
			headers: {
				'Content-Type' : 'application/json'
			},
			body
		})
		.then((res) => {
			if(res.status === 201){
				toast.success("Role successfully added");
			}
			else if(res.status === 200) {
				toast.error("Role already exists");
			}
			else{
				toast.error("Something went wrong");
			}
		})
		.catch((e) => {
			toast.error("Something went wrong: " + e);
		})

	}
	return (
		<div className="border-b-2 border-white">
			<h1 className="text-2xl">Add Role</h1>
			<form onSubmit={handleAddRole}>
				<div>
					<label htmlFor="role_">Role Name: </label>
					<input type="text" name="role_"/>
				</div>
				<button type="submit" className="text-base border-black border-2 p-4 m-2">Add role</button>
			</form>
		</div>
	)
}

export default AddRole;