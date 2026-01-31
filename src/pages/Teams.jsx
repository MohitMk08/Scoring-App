import DashboardLayout from "../layout/DashboardLayout";
import TeamForm from "../components/TeamForm";

function Teams() {
    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto">
                <TeamForm />
            </div>
        </DashboardLayout>
    );
}

export default Teams;
