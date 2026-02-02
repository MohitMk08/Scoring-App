import React from "react";

const getMapUrl = (location) => {
    if (!location) return null;

    const encoded = encodeURIComponent(location);
    return `https://maps.googleapis.com/maps/api/staticmap?center=${encoded}&zoom=14&size=600x300&markers=color:red|${encoded}`;
};

const UpcomingTournamentView = ({ tournament, teams }) => {
    if (!tournament) return null;

    const mapUrl = getMapUrl(tournament.location);

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
                Tournament Information
            </h2>

            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
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

                <div>
                    <p className="text-xs text-gray-500">Participating Teams</p>
                    <p className="font-medium">{teams.length} Teams</p>
                </div>

                {tournament.location && (
                    <div>
                        <p className="text-xs text-gray-500">Venue</p>
                        <p className="font-medium">{tournament.location}</p>
                    </div>
                )}
            </div>

            {/* 🗺 MAP PREVIEW */}
            {mapUrl && (
                <div className="rounded-xl overflow-hidden border">
                    <img
                        src={mapUrl}
                        alt="Tournament Location Map"
                        className="w-full h-48 object-cover"
                    />
                </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-700 font-medium">
                    ⏳ This tournament has not started yet.
                </p>
            </div>
        </div>
    );
};

export default UpcomingTournamentView;
