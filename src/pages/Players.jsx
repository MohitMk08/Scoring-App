import DashboardLayout from "../layout/DashboardLayout";
import PlayerForm from "../components/PlayerForm";
import PlayerSearch from "../components/PlayerSearch";
import PlayerList from "../components/PlayerList";

export default function Players() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <PlayerForm />
                    <PlayerSearch />
                </div>
                <PlayerList />
            </div>
        </DashboardLayout>
    );
}
