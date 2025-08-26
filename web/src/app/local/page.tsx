import HotseatChess from "../HotseatChess";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function LocalGamePage() {
	return (
		<div className="min-h-screen p-6 sm:p-10">
			<div className="max-w-7xl mx-auto">
				<Card>
					<CardHeader>
						<div className="mb-2">
							<Link href="/" className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm">
								<span>←</span>
								<span>Back</span>
							</Link>
						</div>
						<CardTitle>Local game</CardTitle>
						<CardDescription>Two players take turns on one device.</CardDescription>
					</CardHeader>
					<CardContent>
						<HotseatChess />
					</CardContent>
				</Card>
			</div>
		</div>
	);
} 