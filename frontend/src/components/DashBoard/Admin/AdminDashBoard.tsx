import { useEffect, useState } from "react";
import AddRole from "./AddRole";
import { useUser } from "@clerk/nextjs";
import ApproveNewUsers from "./ApproveNewUsers";

const AdminDashBoard = () => {
	return (
		<div className="h-full w-full flex flex-col bg-gray-800 p-4">
			<AddRole />
			<ApproveNewUsers />
		</div>
	)
}

export default AdminDashBoard;