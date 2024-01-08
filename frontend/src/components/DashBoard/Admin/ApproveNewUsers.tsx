import { SetStateAction, SyntheticEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";

type NewUser = {
	username: string,
	email: string,
	roles: string
}
type UserCardProps = {
	new_user: NewUser,
	state: Array<NewUser> | null,
	change_state: React.Dispatch<SetStateAction<Array<NewUser> | null>>
}
const UserCard = (props: UserCardProps) => {
	const {username, email, roles} = props.new_user;
	const {state, change_state} = props;
	const handleNewUserApproved = () => {
		fetch("/api/new_user/approve_user", {
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({username}),
			method: 'POST'
		})
		.then((res) => {
			if(res.status === 201){
				toast.success(`User ${username} was approved`);
			}
			else if(res.status === 409){
				return Promise.reject("Unknown role requested. Add the role first before approving user.");
			}
			else {
				return Promise.reject("Failed to approve user");
			}
			const new_state = state?.filter(e=>e.username!=username);
			change_state(new_state!);
		})
		.catch((e) => {
			toast.error(e);
		});
	}
	return (
		<div className="flex flex-col w-1/2 border-2 border-white rounded-sm p-4 gap-2">
			<p>Username: {username}</p>
			<p>Email: {email}</p>
			<p>Requested roles: {roles}</p>
			<button onClick={handleNewUserApproved} className="border-2 border-black w-fit p-2">Approve</button>
		</div>
	)
}

const ApproveNewUsers = () => {
	const [newUsers, setNewUsers] = useState<Array<NewUser> | null>(null);
	useEffect(() => {
		fetch("/api/new_user")
		.then((res) => {
			if(res.status === 200){
				return res.json();
			}
			else{
				return Promise.reject("Failed to fetch new users. Try again later");
			}
		})
		.then((json) => {
			setNewUsers(json.new_users);
		})
		.catch((e) => {
			toast.error(e);
		});
	}, []);
	return (
		<div className="border-b-2 border-white">
			<h1 className="text-2xl">Approve new users</h1>
			<div className="flex flex-col gap-2 p-4">
				{
					!newUsers && (
						<div className="w-auto flex justify-center items-center text-xl">
							<p>Loading...</p>
						</div>
					)
				}
				{
					newUsers && newUsers.length == 0 && (
						<div className="w-auto flex text-xl">
							<p>No new users :)</p>
						</div>
					)
				}
				{
					newUsers && newUsers?.map((e, i) => {
						return (
							<UserCard key={i} new_user={e} state={newUsers} change_state={setNewUsers}/>
						)
					})
				}
			</div>
		</div>
	)
}

export default ApproveNewUsers;