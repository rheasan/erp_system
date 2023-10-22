import Footer from "@/components/Footer";
import TopNavigation from "@/components/TopNavigation";
import { SignIn } from "@clerk/nextjs";

const SignInPage = () => {
	return (
		<div className="flex h-screen flex-col w-full m-0">
			<TopNavigation />
			<div className="grow bg-gray-800 flex flex-col items-center justify-center">
				<SignIn />
			</div>
			<Footer />
		</div>
	)
}

export default SignInPage;