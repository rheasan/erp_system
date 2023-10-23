import { useEffect, useState } from "react";
import AddRole from "./AddRole";
import { useUser } from "@clerk/nextjs";

const AdminDashBoard = () => {
	return (
		<div className="h-full w-full flex flex-col bg-gray-800 p-4">
			<AddRole />
		</div>
	)
}

export default AdminDashBoard;