import React from "react";
import Image from "next/image";
import Link from "next/link";
import logo from "../assets/logo.jpg";
// import logo from '../logo.png';
const TopNavigation = () => {
	return (
		<div className="top-navigation bg-blue-500 flex flex-row h-12 justify-between items-center gap-4">
			<div className="flex flex-row gap-4 items-center">
				<Image src={logo} alt="iitp-logo" width={48} height={48}/>
				<Link href="/" className="text-xl">ERP System</Link>
			</div>
			<button className="text-red p-2">Login</button>
		</div>
	);
};

export default TopNavigation;
