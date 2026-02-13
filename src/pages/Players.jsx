import PlayerForm from "../components/PlayerForm";
import PlayerSearch from "../components/PlayerSearch";
import PlayerList from "../components/PlayerList";

export default function Players() {
    return (
        <div className="space-y-6 max-w-7xl mx-auto sm:px-2 lg:px-8 overflow-x-hidden">

            {/* Form + Search */}
            <div className="flex flex-col md:flex-row md:gap-6 gap-6">

                {/* VERY IMPORTANT: min-w-0 added */}
                <div className="flex-1 min-w-0">
                    <PlayerForm />
                </div>

                {/* VERY IMPORTANT: min-w-0 added */}
                <div className="flex-1 min-w-0">
                    <PlayerSearch />
                </div>

            </div>

            {/* Player List */}
            <div className="w-full overflow-x-auto">
                <PlayerList />
            </div>

        </div>
    );
}
