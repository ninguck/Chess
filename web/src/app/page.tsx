import Link from "next/link";

export default function Home() {
	return (
		<div className="min-h-screen p-6 sm:p-10">
			<div className="max-w-4xl mx-auto flex flex-col gap-6">
				<header>
					<h1 className="text-3xl font-semibold tracking-tight">Chess</h1>
					<p className="text-slate-600 dark:text-slate-300">Play locally or, soon, online with friends.</p>
				</header>

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

					<div className="rounded-lg border border-gray-200 dark:border-gray-800 p-5 opacity-60">
						<div className="flex items-center justify-between">
							<div className="flex flex-col">
								<h2 className="text-xl font-medium">Online game</h2>
								<p className="text-sm text-slate-600 dark:text-slate-400">Coming soon: create or join via link.</p>
							</div>
							<span className="text-sm">Soon</span>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}
