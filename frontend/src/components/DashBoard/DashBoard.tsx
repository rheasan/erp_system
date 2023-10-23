import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import AdminDashBoard from "./Admin/AdminDashBoard";
import UserDashBoard from "./User/UserDashBoard";
import toast from "react-hot-toast";

const DashBoard = () => {
	const [loaded, setLoaded] = useState(false);
	const [isAdmin, setIsAdmin] = useState(false);
	const {isLoaded, user} = useUser();
	useEffect(() => {
		if(isLoaded){
			fetch("/api/is_admin?username=" + user?.username)
			.then((res) => {
				if(res.status === 500) {
					return Promise.reject("Failed to check status. Try again later");
				}
				else {
					return res.json();
				}
			})
			.then((json) => {
				if(!json) {
					return Promise.reject("Cannot reach servers");
				}
				if(json.msg){
					setIsAdmin(true);
				}
			})
			.then(() => {
				setLoaded(true);
			})
			.catch((e) => {
				toast.error("Something went wrong: " + e);
			});
		}
	},[isLoaded, user]);

	if(!loaded) {
		return (
			<div className="h-full w-full flex flex-col justify-center items-center">
				<h1 className="text-3xl">Loading...</h1>
			</div>
		)
	}
	return (
		<div className="h-full w-full">
			{
				isAdmin && <AdminDashBoard />
			}
			{
				!isAdmin && <UserDashBoard />
			}
		</div>
	)
}

export default DashBoard;