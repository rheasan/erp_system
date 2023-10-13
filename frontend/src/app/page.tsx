"use client";
import Image from "next/image";
import TopNavigation from "../components/TopNavigation";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import AddProcess from "@/components/AddProcess";
import AddTicket from "@/components/AddTicket";
import GenerateTimetable from "@/components/GenerateTimetable";
import { useState } from "react";
enum current_component {
	AddTicket,
	AddProcess,
	GenerateTimetable,
	Home,
}

export default function Home() {
	const [currentState, setCurrentState] = useState(current_component.Home);

	return (
		<main className="flex min-h-screen flex-col h-full w-full m-0">
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
					{currentState == current_component.GenerateTimetable && (
						<GenerateTimetable />
					)}
				</div>
			</div>
			<Footer />
		</main>
	);
}
