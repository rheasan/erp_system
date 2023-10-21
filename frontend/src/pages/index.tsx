import Link from "next/link";
import TopNavigation from "@/components/TopNavigation";
import Footer from "@/components/Footer";

export default function Home() {
	return (
		<div className="h-screen w-full flex-col flex m-0">
			<TopNavigation />
			<div className="w-full grow h-full bg-gray-800 items-center flex flex-col justify-center gap-8">
				<h1 className="text-5xl">ERP System</h1>
				<Link href="./home" className="text-3xl">Continue to DashBoard</Link>
			</div>
			<Footer />
		</div>
	)
}
