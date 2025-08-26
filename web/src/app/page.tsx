import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import StartOnlineButton from "./StartOnlineButton";
import JoinByCode from "./JoinByCode";

export default function Home() {
	return (
		<div className="min-h-screen p-6 sm:p-10">
			<div className="max-w-4xl mx-auto">
				<Card>
					<CardHeader>
						<CardTitle>Chess</CardTitle>
						<CardDescription>Play locally or, online with friends.</CardDescription>
					</CardHeader>
					<CardContent>
						<section className="grid grid-cols-1 gap-4">
							<Link href="/local" className="rounded-lg border border-gray-200 dark:border-gray-800 p-5 hover:bg-gray-50 dark:hover:bg-white/5 transition">
								<div className="flex items-center justify-between">
									<div className="flex flex-col">
										<h2 className="text-xl font-medium">Local game</h2>
										<p className="text-sm text-slate-600 dark:text-slate-400">Two players on one device.</p>
									</div>
									<span className="text-sm">Start →</span>
								</div>
							</Link>

							<div className="rounded-lg border border-gray-200 dark:border-gray-800 p-5">
								<div className="flex items-center justify-between gap-3 flex-wrap">
									<div className="flex flex-col">
										<h2 className="text-xl font-medium">Online game</h2>
										<p className="text-sm text-slate-600 dark:text-slate-400">Create a game and share the link, or join by code.</p>
									</div>
									<StartOnlineButton />
								</div>
								<div className="mt-3">
									<JoinByCode />
								</div>
							</div>
						</section>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
