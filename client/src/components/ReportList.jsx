"use client";
import { useState, useEffect } from "react";
import ReportListItem from "./ReportListItem";
import { Loader2 } from "lucide-react";

export default function ReportList() {
	const [reports, setReports] = useState([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// Simulate a data fetch
		const fetchReports = async () => {
			// In a real app, you would make an API call here
			const fetchedData = []; // This simulates fetching no reports

			// Simulate a network delay
			await new Promise((resolve) => setTimeout(resolve, 1000));

			setReports(fetchedData);
			setIsLoading(false);
		};

		fetchReports();
	}, []);

	if (isLoading) {
		return (
			<div className='flex items-center justify-center h-full min-h-[150px]'>
				<Loader2 className='w-6 h-6 animate-spin text-gray-400' />
			</div>
		);
	}

	return (
		<div className='w-full'>
			<div className='grid grid-cols-[1fr_1.5fr_auto] items-center bg-white/20 px-3 py-2 rounded-t-lg font-semibold text-sm gap-4'>
				<p>Report ID</p>
				<p>Created At</p>
				<div></div>
			</div>
			<div className='rounded-b-lg border border-t-0 border-white/20'>
				{reports.length > 0 ? (
					reports.map((report) => (
						<ReportListItem key={report.id} report={report} />
					))
				) : (
					<p className='p-4 text-center text-gray-400'>No reports found.</p>
				)}
			</div>
		</div>
	);
}
