import { cliState } from "../state/state";

const Header = () => {
	const setModalView = cliState((state) => state.setModalView);
	const credLocked = cliState((state) => state.credLocked);

	return (
		<header
			style={{
				width: "100%",
				display: "flex",
				alignItems: "flex-start",
				justifyContent: "space-between",
				marginBottom: "32px",
				paddingBottom: "20px",
				borderBottom: "1px solid #f1f5f9",
			}}
		>
			<div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
				<h1
					style={{
						margin: 0,
						color: "#1a365d",
						fontSize: "28px",
						fontWeight: "700",
						lineHeight: "1.2",
						letterSpacing: "-0.5px",
					}}
				>
					Remote Console
				</h1>
				<p
					style={{
						margin: 0,
						color: "#64748b",
						fontSize: "14px",
						fontWeight: "400",
					}}
				>
					SSH and Manage your AnyLog Nodes
				</p>
			</div>
			<div
				style={{
					display: "flex",
					alignItems: "flex-end",
					gap: "12px",
				}}
			>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "4px",
						alignItems: "center",
					}}
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "4px",
							fontSize: "11px",
							fontWeight: "600",
							color: credLocked ? "#92400e" : "#065f46",
						}}
					>
						<span style={{ fontSize: "12px" }}>{credLocked ? "🔒" : "🔓"}</span>
						<span>{credLocked ? "Locked" : "Unlocked"}</span>
					</div>

					<button
						style={{
							backgroundColor: "#fff",
							color: "#475569",
							padding: "8px 14px",
							border: "1px solid #e2e8f0",
							borderRadius: "6px",
							cursor: "pointer",
							fontSize: "13px",
							fontWeight: "500",
							transition: "all 0.2s ease",
							whiteSpace: "nowrap",
						}}
						onClick={() => setModalView("VAULT")}
					>
						Manage Credentials
					</button>
				</div>

				<button
					style={{
						backgroundColor: "#000",
						color: "white",
						padding: "8px 16px",
						border: "none",
						borderRadius: "6px",
						cursor: "pointer",
						fontSize: "13px",
						fontWeight: "600",
						transition: "all 0.2s ease",
						whiteSpace: "nowrap",
					}}
					onClick={() => setModalView("CUSTOM_CONNECTION")}
				>
					+ Add Connection
				</button>
			</div>
		</header>
	);
};

export default Header;
