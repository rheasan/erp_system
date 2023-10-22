import Link from "next/link";
import TopNavigation from "@/components/TopNavigation";
import Footer from "@/components/Footer";
import { useAuth } from "@clerk/nextjs";

export default function Home() {
	const {isSignedIn, isLoaded} = useAuth();
	return (
		<div className="h-screen w-full flex-col flex m-0">
			<TopNavigation />
			<div className="w-full grow h-full bg-gray-800 items-center flex flex-col justify-center gap-8">
				<h1 className="text-5xl">ERP System</h1>
				{
					isLoaded && isSignedIn && 
					<Link href="./home" className="text-3xl">Continue to DashBoard</Link>
				}
				{
					isLoaded && !isSignedIn && (
						<div>
							<div className="flex flex-row gap-4 items-center mx-4 text-3xl underline">
								<button><Link href="/signup">Signup</Link></button>
								<button><Link href="/signin">SignIn</Link></button>
							</div>
						</div>
					)
				}
			</div>
			<Footer />
		</div>
	)
}
