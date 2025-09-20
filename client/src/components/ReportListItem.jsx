export default function ReportListItem({ report }) {
	return (
		<div className='grid grid-cols-[1fr_1.5fr_auto] items-center p-3 border-t border-white/20 gap-4'>
			<p className='font-mono text-sm text-gray-200 truncate'>{report.id}</p>
			<p className='text-sm text-gray-300'>{report.createdAt}</p>
			<button className='bg-blue-600 text-white text-xs font-semibold px-4 py-1 rounded-full hover:bg-blue-700 transition-colors'>
				View
			</button>
		</div>
	);
}
