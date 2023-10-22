import Footer from "@/components/Footer";
import TopNavigation from "@/components/TopNavigation";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { useEffect } from "react";
import toast from "react-hot-toast";

const Register = () => {
	const {isLoaded, isSignedIn, user} = useUser();
	const router = useRouter();
	if(isLoaded && !isSignedIn) {
		router.push("/");
	}

	useEffect(() => {
		if(isLoaded) {
			fetch("/api/register_new_user", {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					username: user?.username
				})
			})
			.then((res) => {
				if(res.status === 200){
					toast.success("Registration successful. Wait for approval");
				}
				else if(res.status === 500){
					toast.error("Registration failed. Contact admins");
				}
				else{
					return Promise.reject("Something went wrong.");
				}
				return "ok";
			})
			.then(() => {
				router.push("/");
			})
			.catch((e) => {
				toast.error(e);
			});
		}
	}, [isLoaded]);

	return (
		<div className="flex h-screen flex-col w-full m-0">
			<TopNavigation />
			<div className="grow bg-gray-800 flex flex-col items-center justify-center">
				<h1 className="text-3xl">Redirecting...</h1>
			</div>
			<Footer />
		</div>
	)
}

export default Register;