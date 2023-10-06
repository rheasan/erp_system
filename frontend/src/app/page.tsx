"use client";
import Image from "next/image";
import TopNavigation from "../Components/TopNavigation";
import Sidebar from "../Components/Sidebar";
import Footer from "../Components/Footer";
import AddProcess from "@/Components/AddProcess";
import AddTicket from "@/Components/AddTicket";
import { useState } from "react";
enum current_component {
	AddTicket,
	AddProcess,
	Home,
}
export default function Home() {
	const [currentState, setCurrentState] = useState(current_component.Home);

	return (
		<main className="flex min-h-screen flex-col h-full w-full">
			<TopNavigation />
			<div className="h-4/5 flex flex-row grow">
				<Sidebar change_state={setCurrentState} states={current_component} />
				<div className="h-4/5">
					{currentState == current_component.Home && <p>homepage</p>}
					{currentState == current_component.AddProcess && <AddProcess />}
					{currentState == current_component.AddTicket && <AddTicket />}
				</div>
			</div>
			<Footer />
		</main>
	);
}
