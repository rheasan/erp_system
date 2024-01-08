import Footer from "@/components/Footer";
import TopNavigation from "@/components/TopNavigation";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";

const Register = () => {
	const {isLoaded, isSignedIn, user} = useUser();
	const router = useRouter();
	const [roles, setRoles] = useState([""]);
	if(isLoaded && !isSignedIn) {
		router.push("/");
	}

	// fetch all roles
	useEffect(() => {
		if(roles.length === 1 && roles[0] === ""){
			fetch("/api/roles")
			.then((res) => {
				if(res.status === 500) {
					toast.error("Registration failed. Contact admins");
				}
				else{
					return res.json();
				}
			})
			.then((res) => {
				if(!res) {
					toast.error("Something went wrong");
				}
				else {
					console.log(res.roles);
					setRoles(res.roles);
				}
			});
		}
	},[]);

	const handleRegistration = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const form = e.currentTarget as HTMLFormElement;
		const formdata = Array.from(new FormData(form));
		let roles = formdata[0][1].toString().trim();
		let email = formdata[1][1].toString().trim();
		// TODO: email should be optional

		if(roles === "" || email === "") {
			toast.error("Please fill out all fields properly");
			return;
		}

		if(email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}/g) === null){
			toast.error("Enter valid email");
			return;
		}

		const data = JSON.stringify({
			username: user?.username!,
			roles,
			email
		});
		fetch("/api/new_user", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: data
		})
		.then((res) => {
			if(res.status === 200){
				router.push("/");
				toast.success("Registration successful. Wait for approval");
			}
			else if(res.status === 409) {
				router.push("/");
				toast.error("You have already registered. Edit your account info from DashBoard");
			}
			else if(res.status === 500){
				toast.error("Registration failed. Contact admins");
			}
			else{
				return Promise.reject("Something went wrong. Try again");
			}
		})
		.catch((e) => {
			toast.error(e);
		});
	}

	return (
		<div className="flex h-screen flex-col w-full m-0">
			<TopNavigation />
			<div className="grow bg-gray-800 flex flex-col items-center justify-center">
				{
					!isLoaded && <h1>Loading...</h1>
				}
				{
					isLoaded && (
						<div>
							<h1 className="text-3xl">Complete your registration</h1>
							<form className="flex flex-col items-stretch" onSubmit={handleRegistration}>
								<div>
									<label htmlFor="username">Username: </label>
									<input type="text" name="username" disabled defaultValue={user?.username!} />
								</div>
								<div>
									<label htmlFor="roles">Request roles:</label>
									<input type="text" name="roles" required />
								</div>
								<p>Available roles: {roles.join(",")}</p>
								<div>
									<label htmlFor="email">Email: </label>
									<input type="text" name="email" required />
								</div>
								<button type="submit">Submit</button>
							</form>
						</div>
					)
				}
			</div>
			<Footer />
		</div>
	)
}

export default Register;