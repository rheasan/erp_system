import Image from "next/image";
import TopNavigation from "../components/TopNavigation";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import AddProcess from "@/components/AddProcess";
import AddTicket from "@/components/AddTicket";
import GenerateTimetable from "@/components/GenerateTimetable";
import { useEffect, useState } from "react";
import DashBoard from "@/components/DashBoard/DashBoard";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
enum current_component {
	AddTicket,
	AddProcess,
	GenerateTimetable,
	Home,
	DashBoard
}

export default function Home() {
	const [currentState, setCurrentState] = useState(current_component.Home);
	const {isSignedIn, isLoaded, user} = useUser();
	const router = useRouter();


	if(isLoaded && !isSignedIn){
		router.push("/");
	}

	useEffect(() => {
		if(isLoaded && isSignedIn) {
			fetch("/api/check_user?username=" + user.username)
			.then((res) => {
				if(res.status === 500){
					router.push("/");
				}
				else {
					return res.json();
				}
			})
			.then((res) => {
				if(!res){
					return Promise.reject("Cannot reach servers");
				}
				if(res.msg == false){
					console.log(res);
					router.push("/");
					toast.error("User not verified. Contact admins for more info");
				}
			})
			.catch((e) => {
				toast.error("Something went wrong: " + e);
				console.log(e);
			});
		}
	}, [isLoaded, isSignedIn]);
	return (
		<main className="flex h-screen flex-col w-full m-0">
			<TopNavigation />
			<div className="h-4/5 flex flex-row grow w-full">
				<Sidebar change_state={setCurrentState} states={current_component} />
				<div className="w-4/5">
					{currentState == current_component.Home && (
						<div className="h-full w-full bg-gray-800 text-white flex justify-center items-center">
							<p className="text-4xl">ERP System</p>
						</div>
					)}
					{currentState == current_component.AddProcess && <AddProcess />}
					{currentState == current_component.AddTicket && <AddTicket />}
					{currentState == current_component.GenerateTimetable && <GenerateTimetable />}
					{currentState == current_component.DashBoard && <DashBoard />}
				</div>
			</div>
			<Footer />
		</main>
	);
}