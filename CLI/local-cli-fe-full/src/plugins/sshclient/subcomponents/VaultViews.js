import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import { Vault } from "../storage/vault";
import { cliState } from "../state/state";
import { loadSecretsFromVault } from "../storage/stateStorage";
import {
	FormContainer,
	FormHeader,
	FormGrid,
	FormField,
	FormButton,
} from "./ConnectionFormView";

const VaultView = ({ onClose }) => {
	const [dbInstance, setDbInstance] = useState(null);
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");

	React.useEffect(() => {
		const existingDb = Vault.getDb();
		if (existingDb && !cliState.getState().credLocked) {
			setDbInstance(existingDb);
		}
	}, []);

	const onUnlock = async () => {
		try {
			const db = await Vault.unlock(password);
			setDbInstance(db);
			setError("");
			await loadSecretsFromVault(db);
		} catch (err) {
			setError("Invalid password.");
		}
	};

	const onReset = async () => {
		const confirmed = window.confirm(
			"Are you sure? This will delete all encrypted data. This cannot be undone.",
		);
		if (confirmed) {
			await Vault.reset();
			setDbInstance(null);
			setPassword("");
			setError("");
			cliState.getState().clearSecretsCache();
			cliState.getState().setCredLocked(true);
		}
	};

	const onLock = () => {
		Vault.lock();
		setDbInstance(null);
		setPassword("");
		cliState.getState().clearSecretsCache();
		cliState.getState().setCredLocked(true);
	};

	const handleClose = () => {
		setPassword("");
		if (onClose) onClose();
	};

	if (!dbInstance) {
		return (
			<div
				style={{
					padding: "24px",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					fontFamily: "system-ui, sans-serif",
				}}
			>
				<div style={{ fontSize: "48px", marginBottom: "16px" }}>🔒</div>
				<h2 style={{ margin: 0, fontSize: "22px", fontWeight: "600" }}>
					Vault Locked
				</h2>
				<div style={{ width: "100%", maxWidth: "320px", marginTop: "24px" }}>
					<input
						type="password"
						placeholder="Master Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						style={{
							width: "100%",
							padding: "12px",
							borderRadius: "8px",
							border: error ? "1px solid #ef4444" : "1px solid #e2e8f0",
							outline: "none",
						}}
						onKeyDown={(e) => e.key === "Enter" && onUnlock()}
					/>
					{error && (
						<p
							style={{
								color: "#ef4444",
								fontSize: "12px",
								textAlign: "center",
								marginTop: "8px",
							}}
						>
							{error}
						</p>
					)}
					<button
						onClick={onUnlock}
						style={{
							width: "100%",
							backgroundColor: "#000",
							color: "#fff",
							padding: "12px",
							borderRadius: "8px",
							fontWeight: "600",
							marginTop: "12px",
							cursor: "pointer",
							border: "none",
						}}
					>
						Unlock Vault
					</button>
					<button
						onClick={onReset}
						style={{
							width: "100%",
							backgroundColor: "transparent",
							color: "#ef4444",
							padding: "10px",
							borderRadius: "8px",
							marginTop: "12px",
							cursor: "pointer",
							border: "1px solid #fecaca",
							fontSize: "13px",
						}}
					>
						Reset Vault
					</button>
				</div>
			</div>
		);
	}

	return (
		<div style={{ padding: "24px", fontFamily: "system-ui, sans-serif" }}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: "20px",
					borderBottom: "1px solid #f1f5f9",
					paddingBottom: "16px",
				}}
			>
				<h2 style={{ margin: 0 }}>Credential Manager</h2>
				<div style={{ display: "flex", gap: "8px" }}>
					<button
						onClick={onLock}
						style={{
							backgroundColor: "#fef3c7",
							border: "1px solid #fbbf24",
							color: "#92400e",
							padding: "8px 12px",
							borderRadius: "6px",
							cursor: "pointer",
							fontWeight: "500",
						}}
					>
						🔒 Lock Manager
					</button>
					{onClose && (
						<button
							onClick={handleClose}
							style={{
								backgroundColor: "#dce3eb",
								border: "none",
								padding: "8px 12px",
								borderRadius: "6px",
								cursor: "pointer",
								color: "black",
							}}
						>
							Close
						</button>
					)}
				</div>
			</div>
			<VaultContent db={dbInstance} />
		</div>
	);
};

const VaultContent = ({ db }) => {
	const [form, setForm] = useState({
		hostname: "",
		username: "",
		type: "PASSWORD",
		ref: "",
		credential: "",
	});
	const secrets = useLiveQuery(() => db.secrets.toArray()) || [];

	const secretsByHost = secrets.reduce((acc, secret) => {
		const host = secret.content.hostname;
		if (!acc[host]) acc[host] = [];
		acc[host].push(secret);
		return acc;
	}, {});

	const handleChange = (e) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleFileChange = (e) => {
		const file = e.target.files[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (event) =>
			setForm({ ...form, ref: file.name, credential: event.target.result });
		reader.readAsText(file);
	};

	const handleSave = async () => {
		if (!form.hostname || !form.credential) {
			return alert("Please fill required fields (hostname and credential)");
		}
		await Vault.saveSecret({
			hostname: form.hostname,
			username: form.username || "root",
			type: form.type,
			ref: form.ref,
			credential: form.credential,
		});
		await loadSecretsFromVault(db);
		setForm({
			hostname: "",
			username: "",
			type: "PASSWORD",
			ref: "",
			credential: "",
		});
	};

	const handleDelete = async (id) => {
		if (window.confirm("Delete this credential?")) {
			await db.secrets.delete(id);
			await loadSecretsFromVault(db);
		}
	};

	return (
		<div style={{ width: "100%" }}>
			<FormContainer
				style={{
					padding: "16px",
					marginBottom: "30px",
					backgroundColor: "#f8fafc",
					borderRadius: "12px",
					border: "1px solid #e2e8f0",
				}}
			>
				<FormHeader
					title="Add Credential"
					description="Store encrypted credentials for your hosts"
				/>

				<FormGrid>
					<FormField
						label="Hostname"
						name="hostname"
						placeholder="server.example.com"
						value={form.hostname}
						onChange={handleChange}
						required
					/>
					<FormField
						label="Username"
						name="username"
						placeholder="root"
						value={form.username}
						onChange={handleChange}
					/>
					<FormField
						label="Credential Type"
						name="type"
						value={form.type}
						onChange={(e) =>
							setForm({
								...form,
								type: e.target.value,
								credential: "",
								ref: "",
							})
						}
						options={[
							{ value: "PASSWORD", label: "Password" },
							{ value: "KEY", label: "SSH Key" },
						]}
					/>
					{form.type === "PASSWORD" ? (
						<FormField
							label="Password"
							name="credential"
							type="password"
							placeholder="Enter password"
							value={form.credential}
							onChange={handleChange}
							required
						/>
					) : (
						<FormField
							label="SSH Key File"
							name="keyfile"
							type="file"
							onFileChange={handleFileChange}
							accept=""
							required
						/>
					)}
					<FormButton
						onClick={handleSave}
						style={{
							width: "100%",
							backgroundColor: "#000",
							color: "#fff",
							padding: "12px",
							borderRadius: "8px",
							fontWeight: "600",
							cursor: "pointer",
							border: "none",
						}}
					>
						Add Credential
					</FormButton>
				</FormGrid>
			</FormContainer>

			{/* LIST SECTION */}
			<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
				{Object.entries(secretsByHost).map(([hostname, hostSecrets]) => (
					<div
						key={hostname}
						style={{
							padding: "16px",
							backgroundColor: "#fff",
							border: "1px solid #e2e8f0",
							borderRadius: "8px",
							boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
						}}
					>
						<div
							style={{
								fontWeight: "700",
								fontSize: "18px",
								marginBottom: "12px",
								color: "#1e293b",
							}}
						>
							{hostname}
						</div>
						{hostSecrets.map((secret) => (
							<div
								key={secret.id}
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									padding: "12px",
									backgroundColor: "#f8fafc",
									borderRadius: "6px",
									marginBottom: "8px",
								}}
							>
								<div style={{ flex: 1 }}>
									<div
										style={{
											display: "flex",
											gap: "8px",
											alignItems: "center",
											marginBottom: "4px",
										}}
									>
										<span
											style={{
												display: "inline-block",
												padding: "4px 8px",
												borderRadius: "4px",
												fontSize: "11px",
												fontWeight: "700",
												backgroundColor:
													secret.content.type === "KEY" ? "#dbeafe" : "#fef3c7",
												color:
													secret.content.type === "KEY" ? "#1e40af" : "#92400e",
											}}
										>
											{secret.content.type === "PASSWORD"
												? "PASSWORD"
												: secret.content.ref}
										</span>
										{secret.content.username && (
											<span style={{ fontSize: "12px", color: "#64748b" }}>
												User: {secret.content.username}
											</span>
										)}
									</div>
								</div>
								<div
									style={{ display: "flex", alignItems: "center", gap: "12px" }}
								>
									<span style={{ fontSize: "11px", color: "#94a3b8" }}>
										{new Date(secret.date).toLocaleString()}
									</span>
									<button
										onClick={() => handleDelete(secret.id)}
										style={{
											border: "none",
											background: "none",
											fontSize: "12px",
											fontWeight: "600",
											cursor: "pointer",
											padding: "4px 8px",
											color: "#ef4444",
										}}
									>
										Delete
									</button>
								</div>
							</div>
						))}
					</div>
				))}
			</div>
		</div>
	);
};

export default VaultView;
