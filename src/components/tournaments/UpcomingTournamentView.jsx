import React from "react";

const UpcomingTournamentView = ({ tournament, teams }) => {
    if (!tournament) return null;

    return (
        <div className="space-y-4">
            {/* Section Title */}
            <h2 className="text-lg font-semibold text-gray-800">
                Tournament Information
            </h2>

            {/* Info Card */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                {/* Dates */}
                <div>
                    <p className="text-xs text-gray-500">Start Date</p>
                    <p className="font-medium">
                        {tournament.startDate?.toDate().toLocaleString()}
                    </p>
                </div>

                <div>
                    <p className="text-xs text-gray-500">End Date</p>
                    <p className="font-medium">
                        {tournament.endDate?.toDate().toLocaleString()}
                    </p>
                </div>

                {/* Teams */}
                <div>
                    <p className="text-xs text-gray-500">Participating Teams</p>
                    <p className="font-medium">
                        {teams.length || 0} Teams
                    </p>
                </div>
            </div>

            {/* Rules / Description */}
            <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-2 text-gray-700">
                    Rules / Description
                </h3>

                <p className="text-sm text-gray-600 whitespace-pre-line">
                    {tournament.rules ||
                        "No rules or description provided for this tournament."}
                </p>
            </div>

            {/* Status Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-700 font-medium">
                    ⏳ This tournament has not started yet.
                </p>
                <p className="text-xs text-blue-600 mt-1">
                    Matches will appear here once the tournament begins.
                </p>
            </div>
        </div>
    );
};

export default UpcomingTournamentView;
