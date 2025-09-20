import { User } from "lucide-react";

const InmateListItem = ({ inmate, index, totalItems, onClick }) => {
	return (
		<div
			style={{
				padding: "25px 30px",
				borderBottom:
					index < totalItems - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
				display: "grid",
				gridTemplateColumns: "150px 1fr 200px",
				gap: "20px",
				alignItems: "center",
				transition: "all 0.25s ease",
				cursor: "pointer",
			}}
			onMouseEnter={(e) => {
				e.currentTarget.style.background = "rgba(255,255,255,0.04)";
			}}
			onMouseLeave={(e) => {
				e.currentTarget.style.background = "transparent";
			}}
			onClick={() => onClick?.(inmate)}>
			{/* Inmate ID */}
			<div
				style={{
					color: "#C9D6E2",
					fontSize: "14px",
					fontFamily: "monospace",
					fontWeight: "600",
				}}>
				{inmate.inmateId}
			</div>

			{/* Name with Avatar */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "12px",
				}}>
				<div
					style={{
						width: "40px",
						height: "40px",
						borderRadius: "50%",
						background: "linear-gradient(135deg, #1D4ED8, #3B82F6)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}>
					<User size={20} color='white' />
				</div>
				<div>
					<div
						style={{
							color: "#FFFFFF",
							fontWeight: "600",
							fontSize: "16px",
						}}>
						{inmate.name}
					</div>
				</div>
			</div>

			{/* Date Added */}
			<div
				style={{
					color: "#C9D6E2",
					fontSize: "14px",
				}}>
				{new Date(inmate.dateAdded).toLocaleDateString()}
			</div>
		</div>
	);
};

export default InmateListItem;
