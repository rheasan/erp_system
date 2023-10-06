import React from "react";
// import logo from '../logo.png';
const TopNavigation = () => {
	return (
		<div className="top-navigation bg-blue-500">
			{/* Your navigation content goes here */}
			<ul>
				<li>Home</li>
				<li>About</li>
				<li>Contact</li>
				{/* <div className="logo">
					<img src={logo} alt="My Logo" />
				</div> */}
			</ul>
		</div>
	);
};

export default TopNavigation;
