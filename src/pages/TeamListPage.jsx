import TeamList from "../components/TeamList";
import DashboardLayout from "../layout/DashboardLayout";

export default function TeamListPage() {
    return (
        <DashboardLayout>
            <div className="px-3 py-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Page Header */}
                <div className="mb-4">
                    <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
                        Teams
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        View and manage all registered teams
                    </p>
                </div>

                {/* Team List */}
                <TeamList />
            </div>
        </DashboardLayout>
    );
}
