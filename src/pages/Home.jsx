import DashboardLayout from "../layout/DashboardLayout";

const Home = () => {
    return (

        <div className="p-4">
            <DashboardLayout>
                <h1 className="text-xl font-semibold">VolleyScorer Dashboard</h1>
                <p className="text-sm text-gray-500 mt-2">
                    Select a section from sidebar to continue
                </p>
            </DashboardLayout>
        </div>
    );
};

export default Home;
