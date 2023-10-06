import React from "react";
import Link from "next/link";
const Sidebar = (props: any) => {
	const { change_state, states } = props;
	return (
		<div className="sidebar bg-white text-black">
			{/* Your sidebar content goes here */}
			<ul>
				<li>
					<button onClick={() => change_state(states.Home)}>DashBoard</button>
				</li>
				<li>
					<button onClick={() => change_state(states.Home)}>Profile</button>
				</li>
				<li>
					<button onClick={() => change_state(states.Home)}>Settings</button>
				</li>
				<li>
					<button
						onClick={() => {
							change_state(states.AddProcess);
						}}
					>
						Add Process
					</button>
				</li>
				<li>
					<button
						onClick={() => {
							change_state(states.AddTicket);
						}}
					>
						Create Ticket
					</button>
				</li>
			</ul>
		</div>
	);
};

export default Sidebar;
