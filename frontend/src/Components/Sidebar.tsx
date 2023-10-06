import React from "react";
import Link from "next/link";
const Sidebar = (props: any) => {
	const { change_state, states } = props;
	return (
		<div className="sidebar bg-gray-900 text-white w-1/5 border-r-2 border-black, flex flex-col items-center text-2xl">
			<div>
				<button onClick={() => change_state(states.Home)}>DashBoard</button>
			</div>
			<div>
				<button onClick={() => change_state(states.Home)}>Profile</button>
			</div>
			<div>
				<button onClick={() => change_state(states.Home)}>Settings</button>
			</div>
			<div>
				<button
					onClick={() => {
						change_state(states.AddProcess);
					}}
				>
					Add Process
				</button>
			</div>
			<div>
				<button
					onClick={() => {
						change_state(states.AddTicket);
					}}
				>
					Create Ticket
				</button>
			</div>
		</div>
	);
};

export default Sidebar;
