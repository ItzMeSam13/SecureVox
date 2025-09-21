"use client";
import { Loader2 } from "lucide-react";
import React from "react";

export default function ReportList({ reports, isLoading }) {
	if (isLoading) {
		return (
			<div className='flex items-center justify-center h-full min-h-[150px]'>
				<Loader2 className='w-6 h-6 animate-spin text-gray-400' />
			</div>
		);
	}

	if (!reports || reports.length === 0) {
		return (
			<div className='text-center text-gray-400 py-8'>
				<p>No reports found.</p>
			</div>
		);
	}

	return (
		<div className='w-full'>
			<div className='grid grid-cols-2 md:grid-cols-[1fr_2fr_auto] items-center bg-white/20 px-3 py-2 rounded-t-lg font-semibold text-sm gap-4'>
				<p>Report ID</p>
				<p>Suspect ID</p>
				<p>Report URL</p>
			</div>
			<div className='rounded-b-lg border border-t-0 border-white/20'>
				{reports.map((report) => (
					<div
						key={report.id}
						className='grid grid-cols-2 md:grid-cols-[1fr_2fr_auto] items-center bg-white/5 border-b border-white/10 px-3 py-2 font-light text-sm gap-4'>
						<p className='truncate'>{report.id}</p>
						<p className='truncate'>{report.suspectId}</p>
						<a
							href={report.reportPdfUrl}
							target='_blank'
							rel='noopener noreferrer'
							className='text-blue-400 hover:underline'>
							View
						</a>
					</div>
				))}
			</div>
		</div>
	);
}
