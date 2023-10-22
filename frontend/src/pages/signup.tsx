import Footer from "@/components/Footer";
import TopNavigation from "@/components/TopNavigation";
import { SignUp } from "@clerk/nextjs";

const SignUpPage = () => {

	return (
		<div className="flex h-screen flex-col w-full m-0">
			<TopNavigation />
			<div className="grow bg-gray-800 flex flex-col items-center justify-center">
				<SignUp />
			</div>
			<Footer />
		</div>
	)
}

export default SignUpPage;