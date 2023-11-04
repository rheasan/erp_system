import { useEffect, useState } from "react";
import AddRole from "./AddRole";
import { useUser } from "@clerk/nextjs";
import ApproveNewUsers from "./ApproveNewUsers";
import TicketSearch from "../TicketSearch";

const AdminDashBoard = () => {
	return (
		<div className="h-full w-full flex flex-col bg-gray-800 p-4">
			<AddRole />
			<ApproveNewUsers />
			<TicketSearch />
		</div>
	)
}

export default AdminDashBoard;