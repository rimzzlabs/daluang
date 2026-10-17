import { ConfirmDialog } from "@daluang/ui/components/confirm-dialog";
import { R } from "@mobily/ts-belt";
import { useState } from "react";
import type { ApiToken } from "../api-token";
import { revokeApiToken, TOKENS_ERROR_MESSAGES } from "../client";

export interface RevokeTokenDialogProps {
	/** The token to revoke. The dialog keeps it while it closes. */
	token: ApiToken | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onRevoked: (id: string) => void;
}

type RevokeState =
	| { status: "idle" }
	| { status: "revoking" }
	| { status: "failed"; message: string };

/** The confirmation before a revoke. A site that uses the token loses its access. */
export function RevokeTokenDialog(props: RevokeTokenDialogProps) {
	const [state, setState] = useState<RevokeState>({ status: "idle" });
	const name = props.token?.name ?? "the token";

	async function revoke() {
		const { token } = props;
		if (token === null) return;
		setState({ status: "revoking" });
		const result = await revokeApiToken(token.id);
		R.match(
			result,
			() => {
				setState({ status: "idle" });
				props.onRevoked(token.id);
				props.onOpenChange(false);
			},
			(error) =>
				setState({ status: "failed", message: TOKENS_ERROR_MESSAGES[error] }),
		);
	}

	return (
		<ConfirmDialog
			open={props.open}
			onOpenChange={(open) => {
				props.onOpenChange(open);
				if (!open) setState({ status: "idle" });
			}}
			title={`Revoke ${name}?`}
			description="A site that uses this token can no longer read the notes. You cannot undo a revoke: make a new token for the site."
			confirmLabel="Revoke the token"
			destructive
			pending={state.status === "revoking"}
			error={state.status === "failed" ? state.message : null}
			onConfirm={revoke}
		/>
	);
}
