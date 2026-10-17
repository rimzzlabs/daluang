import { languagesSettingSchema } from "@daluang/notes/languages-setting";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@daluang/ui/components/alert";
import { Button } from "@daluang/ui/components/button";
import { Spinner } from "@daluang/ui/components/spinner";
import { A, O, pipe, R, S } from "@mobily/ts-belt";
import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { match } from "ts-pattern";
import {
	openPage,
	SAVE_ERROR_MESSAGES,
	type SaveSettingsError,
	saveSettings,
} from "../client";
import type { LanguagesChoice } from "../languages-choice";
import type { CmsSettings } from "../settings";
import { parseSiteDraft, type SiteDraft, type SiteErrors } from "../site-draft";
import { LanguagesField } from "./languages-field";
import { OnboardingProgress } from "./onboarding-progress";
import { SettingsSummary } from "./settings-summary";
import { focusSiteError, SiteFields } from "./site-fields";

const STEPS = ["site", "languages", "ready"] as const;

type Step = (typeof STEPS)[number];

const STEP_TITLES: Record<Step, string> = {
	site: "Your site",
	languages: "Your languages",
	ready: "Ready",
};

type SaveState =
	| { status: "idle" }
	| { status: "saving" }
	| { status: "failed"; error: SaveSettingsError };

export interface OnboardingProps {
	/** The name of the writer, from GitHub. The first step greets the writer by it. */
	writerName: string;
	site: SiteDraft;
	languages: LanguagesChoice;
}

/** The first word of a name, for a greeting. */
export function firstName(name: string): string {
	return pipe(name, S.trim, S.split(" "), A.head, O.getWithDefault(""));
}

interface StepFrameProps {
	title: string;
	description: string;
	/** True after the writer moves to this step. The heading then takes the focus. */
	focus: boolean;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
	children: ReactNode;
	actions: ReactNode;
}

function StepFrame(props: StepFrameProps) {
	const heading = useRef<HTMLHeadingElement>(null);
	// Focus is a state of the browser. A screen reader then reads the new step.
	useEffect(() => {
		if (props.focus) heading.current?.focus();
	}, [props.focus]);
	return (
		<form className="flex flex-col gap-8" noValidate onSubmit={props.onSubmit}>
			<div className="flex flex-col gap-2">
				<h1
					ref={heading}
					tabIndex={-1}
					className="font-serif text-2xl font-semibold tracking-tight outline-none"
				>
					{props.title}
				</h1>
				<p className="text-sm text-pretty text-muted-foreground">
					{props.description}
				</p>
			</div>
			{props.children}
			<div className="flex items-center justify-between gap-3">
				{props.actions}
			</div>
		</form>
	);
}

/**
 * The questions of the first sign-in: the site, then the languages. The last step shows
 * the answers and saves them. Then the notes open.
 */
export function Onboarding(props: OnboardingProps) {
	const [step, setStep] = useState<{ name: Step; moved: boolean }>({
		name: "site",
		moved: false,
	});
	const [site, setSite] = useState(props.site);
	const [siteErrors, setSiteErrors] = useState<SiteErrors>({});
	const [languages, setLanguages] = useState(props.languages);
	const [save, setSave] = useState<SaveState>({ status: "idle" });
	const parsedSite = parseSiteDraft(site);
	const parsedLanguages = languagesSettingSchema.safeParse(languages);
	const index = STEPS.indexOf(step.name);

	function moveTo(name: Step) {
		setStep({ name, moved: true });
	}

	function back() {
		moveTo(STEPS[index - 1] ?? "site");
	}

	function submitSite(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = event.currentTarget;
		R.match(
			parsedSite,
			() => {
				setSiteErrors({});
				moveTo("languages");
			},
			(errors) => {
				setSiteErrors(errors);
				focusSiteError({ form, errors });
			},
		);
	}

	function submitLanguages(event: FormEvent) {
		event.preventDefault();
		if (parsedLanguages.success) moveTo("ready");
	}

	async function submitReady(event: FormEvent) {
		event.preventDefault();
		if (R.isError(parsedSite) || !parsedLanguages.success) return;
		setSave({ status: "saving" });
		const saved = await saveSettings({
			site: R.getExn(parsedSite),
			languages: parsedLanguages.data,
		});
		R.match(
			saved,
			() => openPage("/"),
			(error) => setSave({ status: "failed", error }),
		);
	}

	const backButton = (
		<Button type="button" variant="ghost" onClick={back}>
			<ArrowLeftIcon data-icon="inline-start" />
			Back
		</Button>
	);

	const continueButton = (
		<Button type="submit">
			Continue
			<ArrowRightIcon data-icon="inline-end" />
		</Button>
	);

	return (
		<div className="flex flex-col gap-10">
			<OnboardingProgress
				steps={A.map(STEPS, (name) => STEP_TITLES[name])}
				current={index}
			/>
			{match(step.name)
				.with("site", () => (
					<StepFrame
						key="site"
						title={welcomeTitle(props.writerName)}
						description="Tell Daluang about the site that shows your posts. You can change each answer later in Settings."
						focus={step.moved}
						onSubmit={submitSite}
						actions={<span className="ml-auto">{continueButton}</span>}
					>
						<SiteFields
							value={site}
							errors={siteErrors}
							onChange={(next) => {
								setSite(next);
								setSiteErrors({});
							}}
						/>
					</StepFrame>
				))
				.with("languages", () => (
					<StepFrame
						key="languages"
						title="Which languages do you write in?"
						description="Each post has one language. A post can have a translation in each other language on this list."
						focus={step.moved}
						onSubmit={submitLanguages}
						actions={
							<>
								{backButton}
								{continueButton}
							</>
						}
					>
						<LanguagesField value={languages} onChange={setLanguages} />
					</StepFrame>
				))
				.with("ready", () => (
					<StepFrame
						key="ready"
						title="Daluang is ready"
						description="Check your answers. You can change them later in Settings."
						focus={step.moved}
						onSubmit={submitReady}
						actions={
							<>
								{backButton}
								<Button type="submit" disabled={save.status === "saving"}>
									{save.status === "saving" ? (
										<Spinner data-icon="inline-start" />
									) : null}
									Start writing
								</Button>
							</>
						}
					>
						{readySummary({
							site: parsedSite,
							languages: parsedLanguages.data,
						})}
						{save.status === "failed" ? (
							<Alert variant="destructive">
								<AlertTitle>Daluang could not save your answers</AlertTitle>
								<AlertDescription>
									{SAVE_ERROR_MESSAGES[save.error]}
								</AlertDescription>
							</Alert>
						) : null}
					</StepFrame>
				))
				.exhaustive()}
		</div>
	);
}

function welcomeTitle(writerName: string): string {
	const name = firstName(writerName);
	if (S.isEmpty(name)) return "Welcome to Daluang";
	return `Welcome, ${name}`;
}

interface ReadyAnswers {
	site: R.Result<CmsSettings["site"], SiteErrors>;
	languages: CmsSettings["languages"] | undefined;
}

function readySummary(answers: ReadyAnswers): ReactNode {
	if (R.isError(answers.site) || answers.languages === undefined) return null;
	return (
		<SettingsSummary
			settings={{ site: R.getExn(answers.site), languages: answers.languages }}
		/>
	);
}
