import React from "react";
import Image from "next/image";
import Link from "next/link";
import logo from "../assets/logo.jpg";
import { SignOutButton, useUser } from "@clerk/nextjs";
const TopNavigation = () => {
	const {isSignedIn, isLoaded, user} = useUser();

	return (
		<div className="top-navigation bg-blue-500 flex flex-row h-12 justify-between items-center gap-4">
			<div className="flex flex-row gap-4 items-center">
				<Image src={logo} alt="iitp-logo" width={48} height={48}/>
				<Link href="/" className="text-xl">ERP System</Link>
			</div>
			{
				isLoaded && (
					<div>
						{
							!isSignedIn && (
								<div className="flex flex-row gap-4 items-center mx-4">
									<button><Link href="/signup">Signup</Link></button>
									<button><Link href="/signin">SignIn</Link></button>
								</div>
							)
						}
						{
							isSignedIn && (
								<div className="flex flex-row items-center gap-2">
									<p>Logged in as {user?.username}</p>
									<SignOutButton />
								</div>
							)
						}
					</div>
				)
			}
		</div>
	);
};

export default TopNavigation;
